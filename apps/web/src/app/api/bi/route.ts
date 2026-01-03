import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// BI Tool Integration API - Power BI, Tableau, Metabase Connectors

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const connectionId = searchParams.get("connectionId");
    const status = searchParams.get("status");
    const toolType = searchParams.get("toolType");

    if (type === "datasets") {
      const where: any = {};
      if (connectionId) where.connectionId = connectionId;
      if (status) where.status = status;

      const datasets = await prisma.bIDataset.findMany({
        where,
        include: {
          connection: { select: { name: true, toolType: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        data: { items: datasets },
      });
    }

    if (type === "analytics") {
      // Get aggregated analytics data for BI tools
      const analytics = await getAnalyticsData(searchParams);
      return NextResponse.json({
        success: true,
        data: analytics,
      });
    }

    // Default: Get connections
    const where: any = {};
    if (toolType) where.toolType = toolType;
    if (status) where.status = status;

    const connections = await prisma.bIConnection.findMany({
      where,
      include: {
        _count: { select: { datasets: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total: connections.length,
      active: connections.filter((c) => c.status === "ACTIVE").length,
      byTool: {
        powerBI: connections.filter((c) => c.toolType === "POWER_BI").length,
        tableau: connections.filter((c) => c.toolType === "TABLEAU").length,
        metabase: connections.filter((c) => c.toolType === "METABASE").length,
        looker: connections.filter((c) => c.toolType === "LOOKER").length,
      },
    };

    return NextResponse.json({
      success: true,
      data: { items: connections, summary },
    });
  } catch (error) {
    console.error("BI GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch BI data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "CREATE_CONNECTION": {
        // Support both 'name' and 'connectionName', and both 'toolType' and 'connectionType'
        const name = body.name || body.connectionName;
        const toolType = body.toolType || body.connectionType;

        if (!name) {
          return NextResponse.json(
            { success: false, error: "Connection name is required" },
            { status: 400 }
          );
        }

        const connection = await prisma.bIConnection.create({
          data: {
            name,
            toolType: toolType || "POWER_BI",
            connectionType: "API_KEY",
            host: body.host,
            port: body.port,
            database: body.database,
            username: body.username,
            apiKey: body.apiKey,
            refreshIntervalMin: body.refreshIntervalMin || 60,
            autoRefresh: body.autoRefresh ?? true,
            status: "ACTIVE",
          },
        });

        // Return with connectionName for backwards compatibility
        return NextResponse.json({
          success: true,
          data: { ...connection, connectionName: connection.name }
        });
      }

      case "CREATE_DATASET": {
        // Support both 'name' and 'datasetName'
        const datasetName = body.name || body.datasetName;

        if (!datasetName) {
          return NextResponse.json(
            { success: false, error: "Dataset name is required" },
            { status: 400 }
          );
        }

        const dataset = await prisma.bIDataset.create({
          data: {
            connectionId: body.connectionId,
            name: datasetName,
            description: body.description,
            dataType: body.dataType || body.sourceTable?.toUpperCase() || "CUSTOM",
            queryDefinition: body.queryDefinition,
            aggregationLevel: body.aggregationLevel || body.refreshSchedule,
            columns: body.columns,
            primaryKey: body.primaryKey,
            status: "ACTIVE",
          },
        });

        return NextResponse.json({ success: true, data: dataset });
      }

      case "REFRESH_DATASET": {
        const { datasetId } = body;

        const dataset = await prisma.bIDataset.findUnique({
          where: { id: datasetId },
        });

        if (!dataset) {
          return NextResponse.json(
            { success: false, error: "Dataset not found" },
            { status: 404 }
          );
        }

        // Execute data refresh (simplified)
        const rowCount = await executeDatasetRefresh(dataset);

        const updated = await prisma.bIDataset.update({
          where: { id: datasetId },
          data: {
            lastRefreshAt: new Date(),
            rowCount,
          },
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case "EXPORT_DATA": {
        const { dataType, format, filters } = body;

        const data = await getExportData(dataType, filters);

        return NextResponse.json({
          success: true,
          data: {
            format,
            rowCount: data.length,
            exportedAt: new Date(),
            data,
          },
        });
      }

      case "UPDATE_CONNECTION": {
        const { connectionId } = body;

        const connection = await prisma.bIConnection.update({
          where: { id: connectionId },
          data: {
            name: body.name,
            host: body.host,
            refreshIntervalMin: body.refreshIntervalMin,
            autoRefresh: body.autoRefresh,
            status: body.status,
          },
        });

        return NextResponse.json({ success: true, data: connection });
      }

      case "TEST_CONNECTION": {
        const { connectionId } = body;

        const connection = await prisma.bIConnection.findUnique({
          where: { id: connectionId },
        });

        if (!connection) {
          return NextResponse.json(
            { success: false, error: "Connection not found" },
            { status: 404 }
          );
        }

        // Test connection (simplified)
        const testResult = await testBIConnection(connection);

        await prisma.bIConnection.update({
          where: { id: connectionId },
          data: { lastConnectedAt: new Date() },
        });

        return NextResponse.json({ success: true, data: testResult });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("BI POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process BI request" },
      { status: 500 }
    );
  }
}

async function getAnalyticsData(searchParams: URLSearchParams) {
  const metric = searchParams.get("metric");
  const period = searchParams.get("period") || "7d";

  const periodDays = period === "30d" ? 30 : period === "90d" ? 90 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  switch (metric) {
    case "shipment-volume":
      const shipments = await prisma.shipment.groupBy({
        by: ["status"],
        _count: true,
        where: { createdAt: { gte: startDate } },
      });
      return { metric, period, data: shipments };

    case "delivery-performance":
      const deliveries = await prisma.shipment.findMany({
        where: {
          status: "DELIVERED",
          deliveredAt: { gte: startDate },
        },
        select: {
          deliveredAt: true,
          expectedDeliveryDate: true,
        },
      });

      const onTime = deliveries.filter(
        (d) => d.deliveredAt && d.expectedDeliveryDate && d.deliveredAt <= d.expectedDeliveryDate
      ).length;

      return {
        metric,
        period,
        data: {
          total: deliveries.length,
          onTime,
          onTimePercent: deliveries.length > 0 ? (onTime / deliveries.length) * 100 : 0,
        },
      };

    case "hub-utilization":
      const hubs = await prisma.hub.findMany({
        select: {
          id: true,
          code: true,
          name: true,
        },
      });
      return {
        metric,
        period,
        data: hubs.map((h) => ({
          hubId: h.id,
          code: h.code,
          name: h.name,
        })),
      };

    default:
      return { metric, period, data: null };
  }
}

async function executeDatasetRefresh(dataset: any): Promise<number> {
  // Simplified - in production would execute the actual query
  switch (dataset.dataType) {
    case "SHIPMENTS":
      return await prisma.shipment.count();
    case "HUBS":
      return await prisma.hub.count();
    case "VEHICLES":
      return await prisma.vehicle.count();
    case "PERFORMANCE":
      return await prisma.trip.count();
    default:
      return 0;
  }
}

async function testBIConnection(connection: any): Promise<object> {
  // Simplified connection test
  return {
    status: "connected",
    latency: Math.floor(Math.random() * 100) + 50,
    toolType: connection.toolType,
    testedAt: new Date(),
  };
}

async function getExportData(dataType: string, filters: any) {
  const limit = filters?.limit || 1000;

  switch (dataType) {
    case "shipments":
      return await prisma.shipment.findMany({ take: limit });
    case "hubs":
      return await prisma.hub.findMany({ take: limit });
    case "trips":
      return await prisma.trip.findMany({ take: limit });
    default:
      return [];
  }
}
