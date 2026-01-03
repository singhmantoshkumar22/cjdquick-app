import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List ERP integrations for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const erpType = searchParams.get("erpType");
    const isActive = searchParams.get("isActive");

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (erpType) where.erpType = erpType;
    if (isActive !== null) where.isActive = isActive === "true";

    const integrations = await prisma.eRPIntegration.findMany({
      where,
      include: {
        _count: {
          select: {
            syncJobs: true,
            fieldMappings: true,
            webhooks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get recent sync stats for each integration
    const integrationsWithStats = await Promise.all(
      integrations.map(async (integration) => {
        const recentJobs = await prisma.eRPSyncJob.findMany({
          where: {
            integrationId: integration.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          select: {
            status: true,
            successRecords: true,
            failedRecords: true,
          },
        });

        const stats = {
          jobsLast24h: recentJobs.length,
          successfulSyncs: recentJobs.filter((j) => j.status === "COMPLETED").length,
          failedSyncs: recentJobs.filter((j) => j.status === "FAILED").length,
          totalRecordsSynced: recentJobs.reduce((sum, j) => sum + j.successRecords, 0),
          totalRecordsFailed: recentJobs.reduce((sum, j) => sum + j.failedRecords, 0),
        };

        // Mask sensitive data
        return {
          ...integration,
          apiKey: integration.apiKey ? "***" + integration.apiKey.slice(-4) : null,
          apiSecret: integration.apiSecret ? "***hidden***" : null,
          accessToken: integration.accessToken ? "***hidden***" : null,
          refreshToken: integration.refreshToken ? "***hidden***" : null,
          stats,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: integrationsWithStats,
    });
  } catch (error) {
    console.error("Get ERP Integrations Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ERP integrations" },
      { status: 500 }
    );
  }
}

// POST - Create new ERP integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      erpType,
      erpName,
      erpVersion,
      connectionType,
      apiBaseUrl,
      apiKey,
      apiSecret,
      authType,
      // SAP specific
      sapClientId,
      sapCompanyCode,
      sapPlantCode,
      // Tally specific
      tallyHost,
      tallyPort,
      tallyCompanyName,
      // Zoho specific
      zohoOrganizationId,
      zohoDataCenter,
      // Sync settings
      syncDirection,
      syncFrequency,
      enabledEntities,
      retryAttempts,
      retryDelayMinutes,
      errorNotifyEmail,
    } = body;

    if (!clientId || !erpType || !erpName) {
      return NextResponse.json(
        { success: false, error: "Client ID, ERP type, and name are required" },
        { status: 400 }
      );
    }

    // Valid ERP types
    const validTypes = ["SAP", "TALLY", "ZOHO_BOOKS", "ZOHO_INVENTORY", "QUICKBOOKS", "CUSTOM"];
    if (!validTypes.includes(erpType)) {
      return NextResponse.json(
        { success: false, error: `Invalid ERP type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Check for existing integration
    const existing = await prisma.eRPIntegration.findUnique({
      where: {
        clientId_erpType: {
          clientId,
          erpType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `${erpType} integration already exists for this client` },
        { status: 409 }
      );
    }

    const integration = await prisma.eRPIntegration.create({
      data: {
        clientId,
        erpType,
        erpName,
        erpVersion,
        connectionType: connectionType || "API",
        apiBaseUrl,
        apiKey,
        apiSecret,
        authType,
        sapClientId,
        sapCompanyCode,
        sapPlantCode,
        tallyHost,
        tallyPort,
        tallyCompanyName,
        zohoOrganizationId,
        zohoDataCenter,
        syncDirection: syncDirection || "BIDIRECTIONAL",
        syncFrequency: syncFrequency || "REALTIME",
        enabledEntities: JSON.stringify(enabledEntities || {
          orders: true,
          shipments: true,
          invoices: true,
          inventory: false,
        }),
        retryAttempts: retryAttempts || 3,
        retryDelayMinutes: retryDelayMinutes || 5,
        errorNotifyEmail,
        connectionStatus: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: integration,
      message: `${erpName} integration created successfully`,
    });
  } catch (error) {
    console.error("Create ERP Integration Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ERP integration" },
      { status: 500 }
    );
  }
}

// PATCH - Update ERP integration
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Integration ID is required" },
        { status: 400 }
      );
    }

    // Handle specific actions
    if (action === "TEST_CONNECTION") {
      const integration = await prisma.eRPIntegration.findUnique({
        where: { id },
      });

      if (!integration) {
        return NextResponse.json(
          { success: false, error: "Integration not found" },
          { status: 404 }
        );
      }

      // Test connection based on ERP type
      const testResult = await testERPConnection(integration);

      // Update connection status
      await prisma.eRPIntegration.update({
        where: { id },
        data: {
          connectionStatus: testResult.success ? "CONNECTED" : "ERROR",
        },
      });

      return NextResponse.json({
        success: testResult.success,
        data: testResult,
        message: testResult.success
          ? "Connection successful"
          : testResult.error,
      });
    }

    if (action === "TOGGLE_ACTIVE") {
      const integration = await prisma.eRPIntegration.findUnique({
        where: { id },
      });

      if (!integration) {
        return NextResponse.json(
          { success: false, error: "Integration not found" },
          { status: 404 }
        );
      }

      const updated = await prisma.eRPIntegration.update({
        where: { id },
        data: { isActive: !integration.isActive },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Integration ${updated.isActive ? "activated" : "deactivated"}`,
      });
    }

    // Handle enabledEntities update
    if (updateData.enabledEntities && typeof updateData.enabledEntities === "object") {
      updateData.enabledEntities = JSON.stringify(updateData.enabledEntities);
    }

    const integration = await prisma.eRPIntegration.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: integration,
      message: "Integration updated successfully",
    });
  } catch (error) {
    console.error("Update ERP Integration Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update ERP integration" },
      { status: 500 }
    );
  }
}

// DELETE - Remove ERP integration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Integration ID is required" },
        { status: 400 }
      );
    }

    await prisma.eRPIntegration.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Integration deleted successfully",
    });
  } catch (error) {
    console.error("Delete ERP Integration Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete ERP integration" },
      { status: 500 }
    );
  }
}

// Test ERP connection
async function testERPConnection(integration: any): Promise<{ success: boolean; error?: string }> {
  try {
    switch (integration.erpType) {
      case "SAP":
        // SAP B1 Service Layer test
        if (integration.apiBaseUrl && integration.apiKey) {
          const response = await fetch(`${integration.apiBaseUrl}/b1s/v1/Login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              CompanyDB: integration.sapCompanyCode,
              UserName: integration.apiKey,
              Password: integration.apiSecret,
            }),
          });
          return { success: response.ok };
        }
        break;

      case "TALLY":
        // Tally Prime XML connection test
        if (integration.tallyHost && integration.tallyPort) {
          const testXml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
          const response = await fetch(`http://${integration.tallyHost}:${integration.tallyPort}`, {
            method: "POST",
            headers: { "Content-Type": "application/xml" },
            body: testXml,
          });
          return { success: response.ok };
        }
        break;

      case "ZOHO_BOOKS":
      case "ZOHO_INVENTORY":
        // Zoho API test
        if (integration.accessToken && integration.zohoOrganizationId) {
          const baseUrl = integration.erpType === "ZOHO_BOOKS"
            ? "https://books.zoho.in"
            : "https://inventory.zoho.in";
          const response = await fetch(
            `${baseUrl}/api/v3/organizations/${integration.zohoOrganizationId}`,
            {
              headers: {
                Authorization: `Zoho-oauthtoken ${integration.accessToken}`,
              },
            }
          );
          return { success: response.ok };
        }
        break;

      default:
        return { success: false, error: "Unsupported ERP type for connection test" };
    }

    return { success: false, error: "Missing connection parameters" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
