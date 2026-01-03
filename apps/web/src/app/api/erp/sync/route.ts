import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List sync jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("integrationId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const entityType = searchParams.get("entityType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (integrationId) where.integrationId = integrationId;
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;

    // Filter by client through integration relation
    if (clientId) {
      where.integration = { clientId };
    }

    const [jobs, total] = await Promise.all([
      prisma.eRPSyncJob.findMany({
        where,
        include: {
          integration: {
            select: {
              id: true,
              erpType: true,
              erpName: true,
              clientId: true,
            },
          },
          _count: {
            select: {
              syncLogs: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.eRPSyncJob.count({ where }),
    ]);

    // Get progress percentage for in-progress jobs
    const jobsWithProgress = jobs.map((job) => ({
      ...job,
      progressPercent:
        job.totalRecords > 0
          ? Math.round((job.processedRecords / job.totalRecords) * 100)
          : 0,
    }));

    const stats = {
      pending: jobs.filter((j) => j.status === "PENDING").length,
      inProgress: jobs.filter((j) => j.status === "IN_PROGRESS").length,
      completed: jobs.filter((j) => j.status === "COMPLETED").length,
      failed: jobs.filter((j) => j.status === "FAILED").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        items: jobsWithProgress,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Get Sync Jobs Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sync jobs" },
      { status: 500 }
    );
  }
}

// POST - Create and trigger sync job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      integrationId,
      jobType,
      entityType,
      direction,
      dateFrom,
      dateTo,
      entityIds,
      triggeredByUserId,
    } = body;

    if (!integrationId || !entityType) {
      return NextResponse.json(
        { success: false, error: "Integration ID and entity type are required" },
        { status: 400 }
      );
    }

    // Check integration exists and is active
    const integration = await prisma.eRPIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      return NextResponse.json(
        { success: false, error: "Integration not found" },
        { status: 404 }
      );
    }

    if (!integration.isActive) {
      return NextResponse.json(
        { success: false, error: "Integration is not active" },
        { status: 400 }
      );
    }

    // Generate job number
    const jobNumber = `SYNC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create sync job
    const job = await prisma.eRPSyncJob.create({
      data: {
        integrationId,
        jobNumber,
        jobType: jobType || "INCREMENTAL",
        entityType,
        direction: direction || "OUTBOUND",
        dateFrom: dateFrom ? new Date(dateFrom) : null,
        dateTo: dateTo ? new Date(dateTo) : null,
        entityIds: entityIds ? JSON.stringify(entityIds) : null,
        triggeredBy: "MANUAL",
        triggeredByUserId,
        status: "PENDING",
      },
    });

    // Start the sync job asynchronously
    startSyncJob(job.id, integration);

    return NextResponse.json({
      success: true,
      data: job,
      message: "Sync job created and queued",
    });
  } catch (error) {
    console.error("Create Sync Job Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create sync job" },
      { status: 500 }
    );
  }
}

// PATCH - Update sync job status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      );
    }

    if (action === "CANCEL") {
      const job = await prisma.eRPSyncJob.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({
        success: true,
        data: job,
        message: "Sync job cancelled",
      });
    }

    if (action === "RETRY") {
      const originalJob = await prisma.eRPSyncJob.findUnique({
        where: { id },
        include: { integration: true },
      });

      if (!originalJob) {
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }

      // Create new retry job
      const jobNumber = `SYNC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const retryJob = await prisma.eRPSyncJob.create({
        data: {
          integrationId: originalJob.integrationId,
          jobNumber,
          jobType: "RETRY",
          entityType: originalJob.entityType,
          direction: originalJob.direction,
          dateFrom: originalJob.dateFrom,
          dateTo: originalJob.dateTo,
          entityIds: originalJob.entityIds,
          triggeredBy: "RETRY",
          status: "PENDING",
        },
      });

      // Start the retry job
      startSyncJob(retryJob.id, originalJob.integration);

      return NextResponse.json({
        success: true,
        data: retryJob,
        message: "Retry job created",
      });
    }

    const job = await prisma.eRPSyncJob.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: job,
      message: "Sync job updated",
    });
  } catch (error) {
    console.error("Update Sync Job Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update sync job" },
      { status: 500 }
    );
  }
}

// Async function to process sync job
async function startSyncJob(jobId: string, integration: any) {
  try {
    // Mark job as in progress
    const job = await prisma.eRPSyncJob.update({
      where: { id: jobId },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    // Get entities to sync based on entity type
    let entities: any[] = [];
    let totalRecords = 0;

    switch (job.entityType) {
      case "SHIPMENT":
        const shipmentWhere: any = {};
        if (job.dateFrom) shipmentWhere.createdAt = { gte: job.dateFrom };
        if (job.dateTo)
          shipmentWhere.createdAt = { ...shipmentWhere.createdAt, lte: job.dateTo };
        if (job.entityIds) {
          const ids = JSON.parse(job.entityIds);
          shipmentWhere.id = { in: ids };
        }

        entities = await prisma.shipment.findMany({
          where: shipmentWhere,
          take: 1000, // Limit batch size
        });
        totalRecords = entities.length;
        break;

      case "ORDER":
        const orderWhere: any = {};
        if (job.dateFrom) orderWhere.createdAt = { gte: job.dateFrom };
        if (job.dateTo) orderWhere.createdAt = { ...orderWhere.createdAt, lte: job.dateTo };

        entities = await prisma.order.findMany({
          where: orderWhere,
          take: 1000,
        });
        totalRecords = entities.length;
        break;

      case "INVOICE":
        const invoiceWhere: any = {};
        if (job.dateFrom) invoiceWhere.createdAt = { gte: job.dateFrom };

        entities = await prisma.invoice.findMany({
          where: invoiceWhere,
          take: 1000,
        });
        totalRecords = entities.length;
        break;

      default:
        break;
    }

    // Update total records
    await prisma.eRPSyncJob.update({
      where: { id: jobId },
      data: { totalRecords },
    });

    // Process each entity
    let successRecords = 0;
    let failedRecords = 0;
    let processedRecords = 0;

    for (const entity of entities) {
      try {
        // Create sync log
        const log = await prisma.eRPSyncLog.create({
          data: {
            syncJobId: jobId,
            entityType: job.entityType,
            entityId: entity.id,
            entityRef: entity.awbNumber || entity.orderNumber || entity.invoiceNumber,
            direction: job.direction,
            status: "PROCESSING",
            startedAt: new Date(),
          },
        });

        // Sync to ERP based on type
        const syncResult = await syncToERP(integration, job.entityType, entity, job.direction);

        // Update log
        await prisma.eRPSyncLog.update({
          where: { id: log.id },
          data: {
            status: syncResult.success ? "SUCCESS" : "FAILED",
            erpEntityId: syncResult.erpEntityId,
            erpDocumentNumber: syncResult.erpDocumentNumber,
            responsePayload: JSON.stringify(syncResult.response),
            errorCode: syncResult.errorCode,
            errorMessage: syncResult.errorMessage,
            completedAt: new Date(),
            durationMs: Date.now() - log.startedAt!.getTime(),
          },
        });

        if (syncResult.success) {
          successRecords++;

          // Create/update entity link
          await prisma.eRPEntityLink.upsert({
            where: {
              clientId_erpType_entityType_cjdEntityId: {
                clientId: integration.clientId,
                erpType: integration.erpType,
                entityType: job.entityType,
                cjdEntityId: entity.id,
              },
            },
            create: {
              clientId: integration.clientId,
              erpType: integration.erpType,
              entityType: job.entityType,
              cjdEntityId: entity.id,
              erpEntityId: syncResult.erpEntityId || "",
              erpDocumentNumber: syncResult.erpDocumentNumber,
              lastSyncedAt: new Date(),
              lastSyncStatus: "SUCCESS",
            },
            update: {
              erpEntityId: syncResult.erpEntityId || undefined,
              erpDocumentNumber: syncResult.erpDocumentNumber,
              lastSyncedAt: new Date(),
              lastSyncStatus: "SUCCESS",
              syncVersion: { increment: 1 },
            },
          });
        } else {
          failedRecords++;
        }

        processedRecords++;

        // Update job progress periodically
        if (processedRecords % 10 === 0) {
          await prisma.eRPSyncJob.update({
            where: { id: jobId },
            data: { processedRecords, successRecords, failedRecords },
          });
        }
      } catch (error: any) {
        failedRecords++;
        processedRecords++;
        console.error(`Sync error for entity ${entity.id}:`, error);
      }
    }

    // Complete job
    await prisma.eRPSyncJob.update({
      where: { id: jobId },
      data: {
        status: failedRecords > 0 ? (successRecords > 0 ? "PARTIAL" : "FAILED") : "COMPLETED",
        processedRecords,
        successRecords,
        failedRecords,
        completedAt: new Date(),
      },
    });

    // Update integration last sync
    await prisma.eRPIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: failedRecords > 0 ? (successRecords > 0 ? "PARTIAL" : "FAILED") : "SUCCESS",
      },
    });
  } catch (error: any) {
    console.error("Sync job error:", error);

    await prisma.eRPSyncJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: error.message,
        completedAt: new Date(),
      },
    });
  }
}

// Sync entity to ERP
async function syncToERP(
  integration: any,
  entityType: string,
  entity: any,
  direction: string
): Promise<{
  success: boolean;
  erpEntityId?: string;
  erpDocumentNumber?: string;
  response?: any;
  errorCode?: string;
  errorMessage?: string;
}> {
  try {
    switch (integration.erpType) {
      case "SAP":
        return await syncToSAP(integration, entityType, entity, direction);
      case "TALLY":
        return await syncToTally(integration, entityType, entity, direction);
      case "ZOHO_BOOKS":
      case "ZOHO_INVENTORY":
        return await syncToZoho(integration, entityType, entity, direction);
      default:
        return { success: false, errorMessage: "Unsupported ERP type" };
    }
  } catch (error: any) {
    return { success: false, errorMessage: error.message };
  }
}

// SAP Sync
async function syncToSAP(
  integration: any,
  entityType: string,
  entity: any,
  direction: string
): Promise<any> {
  // SAP B1 Service Layer integration
  // This is a simplified example - actual implementation would be more complex

  const sapPayload = transformToSAPFormat(entityType, entity);

  const endpoint =
    entityType === "ORDER"
      ? "/b1s/v1/Orders"
      : entityType === "INVOICE"
        ? "/b1s/v1/Invoices"
        : "/b1s/v1/DeliveryNotes";

  try {
    const response = await fetch(`${integration.apiBaseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `B1SESSION=${integration.accessToken}`,
      },
      body: JSON.stringify(sapPayload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        erpEntityId: data.DocEntry?.toString(),
        erpDocumentNumber: data.DocNum?.toString(),
        response: data,
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        errorCode: error.error?.code,
        errorMessage: error.error?.message?.value,
      };
    }
  } catch (error: any) {
    return { success: false, errorMessage: error.message };
  }
}

// Tally Sync
async function syncToTally(
  integration: any,
  entityType: string,
  entity: any,
  direction: string
): Promise<any> {
  // Tally Prime XML integration
  const tallyXml = transformToTallyXML(entityType, entity);

  try {
    const response = await fetch(
      `http://${integration.tallyHost}:${integration.tallyPort}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: tallyXml,
      }
    );

    const responseText = await response.text();

    // Parse Tally response
    if (responseText.includes("<CREATED>1</CREATED>")) {
      const voucherNoMatch = responseText.match(/<VOUCHERNUMBER>(.*?)<\/VOUCHERNUMBER>/);
      return {
        success: true,
        erpDocumentNumber: voucherNoMatch?.[1],
        response: responseText,
      };
    } else {
      const errorMatch = responseText.match(/<LINEERROR>(.*?)<\/LINEERROR>/);
      return {
        success: false,
        errorMessage: errorMatch?.[1] || "Unknown Tally error",
      };
    }
  } catch (error: any) {
    return { success: false, errorMessage: error.message };
  }
}

// Zoho Sync
async function syncToZoho(
  integration: any,
  entityType: string,
  entity: any,
  direction: string
): Promise<any> {
  const zohoPayload = transformToZohoFormat(entityType, entity);

  const baseUrl =
    integration.erpType === "ZOHO_BOOKS"
      ? "https://books.zoho.in"
      : "https://inventory.zoho.in";

  const endpoint =
    entityType === "ORDER"
      ? "/api/v3/salesorders"
      : entityType === "INVOICE"
        ? "/api/v3/invoices"
        : "/api/v3/packages";

  try {
    const response = await fetch(
      `${baseUrl}${endpoint}?organization_id=${integration.zohoOrganizationId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${integration.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(zohoPayload),
      }
    );

    const data = await response.json();

    if (data.code === 0) {
      const entityData = data.salesorder || data.invoice || data.package;
      return {
        success: true,
        erpEntityId: entityData?.salesorder_id || entityData?.invoice_id || entityData?.package_id,
        erpDocumentNumber: entityData?.salesorder_number || entityData?.invoice_number || entityData?.package_number,
        response: data,
      };
    } else {
      return {
        success: false,
        errorCode: data.code?.toString(),
        errorMessage: data.message,
      };
    }
  } catch (error: any) {
    return { success: false, errorMessage: error.message };
  }
}

// Transform functions
function transformToSAPFormat(entityType: string, entity: any): any {
  // SAP B1 format transformation
  if (entityType === "SHIPMENT") {
    return {
      CardCode: entity.clientId,
      DocDate: new Date().toISOString().split("T")[0],
      Comments: `AWB: ${entity.awbNumber}`,
      DocumentLines: [
        {
          ItemCode: entity.awbNumber,
          Quantity: entity.quantity || 1,
          UnitPrice: entity.freightCharges || 0,
        },
      ],
    };
  }
  return entity;
}

function transformToTallyXML(entityType: string, entity: any): string {
  // Tally Prime XML format
  if (entityType === "SHIPMENT") {
    return `
      <ENVELOPE>
        <HEADER>
          <TALLYREQUEST>Import Data</TALLYREQUEST>
        </HEADER>
        <BODY>
          <IMPORTDATA>
            <REQUESTDESC>
              <REPORTNAME>Vouchers</REPORTNAME>
            </REQUESTDESC>
            <REQUESTDATA>
              <TALLYMESSAGE>
                <VOUCHER>
                  <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                  <DATE>${new Date().toISOString().split("T")[0].replace(/-/g, "")}</DATE>
                  <NARRATION>AWB: ${entity.awbNumber}</NARRATION>
                  <LEDGERENTRIES.LIST>
                    <LEDGERNAME>Freight Income</LEDGERNAME>
                    <AMOUNT>-${entity.freightCharges || 0}</AMOUNT>
                  </LEDGERENTRIES.LIST>
                </VOUCHER>
              </TALLYMESSAGE>
            </REQUESTDATA>
          </IMPORTDATA>
        </BODY>
      </ENVELOPE>
    `;
  }
  return "";
}

function transformToZohoFormat(entityType: string, entity: any): any {
  // Zoho Books/Inventory format
  if (entityType === "SHIPMENT") {
    return {
      customer_id: entity.clientId,
      date: new Date().toISOString().split("T")[0],
      reference_number: entity.awbNumber,
      line_items: [
        {
          name: `Shipment - ${entity.awbNumber}`,
          quantity: entity.quantity || 1,
          rate: entity.freightCharges || 0,
        },
      ],
    };
  }
  return entity;
}
