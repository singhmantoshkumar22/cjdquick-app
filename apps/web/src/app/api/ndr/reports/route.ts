import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Generate NDR number
function generateNDRNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NDR${dateStr}${random}`;
}

// GET - List NDR reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const failureReason = searchParams.get("failureReason");
    const clientId = searchParams.get("clientId");
    const customerContacted = searchParams.get("customerContacted");
    const isResolved = searchParams.get("isResolved");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length > 1 ? { in: statuses } : status;
    }

    if (priority) {
      const priorities = priority.split(",");
      where.priority = priorities.length > 1 ? { in: priorities } : priority;
    }

    if (failureReason) where.failureReason = failureReason;
    if (clientId) where.clientId = clientId;
    if (customerContacted !== null) {
      where.customerContacted = customerContacted === "true";
    }
    if (isResolved !== null) {
      where.isResolved = isResolved === "true";
    }

    if (dateFrom || dateTo) {
      where.attemptDate = {};
      if (dateFrom) where.attemptDate.gte = new Date(dateFrom);
      if (dateTo) where.attemptDate.lte = new Date(dateTo);
    }

    const [reports, total] = await Promise.all([
      prisma.nDRReport.findMany({
        where,
        include: {
          callLogs: {
            orderBy: { callTime: "desc" },
            take: 3,
          },
          actions: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: [{ priority: "asc" }, { attemptDate: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.nDRReport.count({ where }),
    ]);

    // Get shipment details for reports
    const shipmentIds = reports.map((r) => r.shipmentId);
    const shipments = shipmentIds.length > 0
      ? await prisma.shipment.findMany({
          where: { id: { in: shipmentIds } },
          select: {
            id: true,
            consigneeName: true,
            consigneePhone: true,
            consigneeAddress: true,
            consigneeCity: true,
            consigneePincode: true,
            clientId: true,
            paymentMode: true,
            codAmount: true,
          },
        })
      : [];
    const shipmentMap = new Map(shipments.map((s) => [s.id, s]));

    // Enrich reports with shipment data
    const enrichedReports = reports.map((report) => ({
      ...report,
      shipment: shipmentMap.get(report.shipmentId) || null,
    }));

    // Get stats
    const stats = await prisma.nDRReport.groupBy({
      by: ["status"],
      where: { isResolved: false },
      _count: true,
    });

    const priorityStats = await prisma.nDRReport.groupBy({
      by: ["priority"],
      where: { isResolved: false },
      _count: true,
    });

    const statusCounts = new Map(stats.map((s) => [s.status, s._count]));
    const priorityCounts = new Map(priorityStats.map((p) => [p.priority, p._count]));

    return NextResponse.json({
      success: true,
      data: {
        reports: enrichedReports,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          open: statusCounts.get("OPEN") || 0,
          customerContacted: statusCounts.get("CUSTOMER_CONTACTED") || 0,
          actionTaken: statusCounts.get("ACTION_TAKEN") || 0,
          reattemptScheduled: statusCounts.get("REATTEMPT_SCHEDULED") || 0,
          rtoInitiated: statusCounts.get("RTO_INITIATED") || 0,
          priorityHigh: priorityCounts.get("HIGH") || 0,
          priorityCritical: priorityCounts.get("CRITICAL") || 0,
        },
      },
    });
  } catch (error) {
    console.error("NDR Reports GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch NDR reports" },
      { status: 500 }
    );
  }
}

// POST - Create NDR report (from failed delivery)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      shipmentId,
      awbNumber,
      clientId,
      attemptNumber,
      failureReason,
      failureSubReason,
      failureRemarks,
      attemptedById,
      attemptedByName,
      latitude,
      longitude,
      attemptLocation,
    } = body;

    // Validate required fields
    if (!shipmentId || !awbNumber || !failureReason || !attemptedById || !clientId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get shipment details
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: {
        consigneeName: true,
        consigneePhone: true,
        consigneeAddress: true,
        consigneePincode: true,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Determine priority based on failure reason and attempt number
    let priority = "MEDIUM";
    if (attemptNumber >= 3) {
      priority = "CRITICAL";
    } else if (
      failureReason === "CUSTOMER_REFUSED" ||
      failureReason === "WRONG_ADDRESS" ||
      attemptNumber >= 2
    ) {
      priority = "HIGH";
    }

    // Check for existing open NDR for this shipment
    const existingNDR = await prisma.nDRReport.findFirst({
      where: {
        shipmentId,
        isResolved: false,
      },
    });

    if (existingNDR) {
      // Update existing NDR
      const updatedNDR = await prisma.nDRReport.update({
        where: { id: existingNDR.id },
        data: {
          attemptNumber,
          attemptDate: new Date(),
          failureReason,
          failureSubReason,
          failureRemarks,
          attemptedById,
          attemptedByName,
          attemptLatitude: latitude ? parseFloat(latitude) : null,
          attemptLongitude: longitude ? parseFloat(longitude) : null,
          attemptLocation,
          priority,
        },
      });

      // Create action record
      await prisma.nDRAction.create({
        data: {
          ndrReportId: existingNDR.id,
          actionType: "DELIVERY_ATTEMPT",
          performedById: attemptedById,
          performedByName: attemptedByName || "Driver",
          performedByType: "DRIVER",
          previousStatus: existingNDR.status,
          newStatus: existingNDR.status,
          remarks: `Delivery attempt #${attemptNumber} failed: ${failureReason}`,
          actionTime: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedNDR,
        message: "Existing NDR updated",
      });
    }

    // Create new NDR report
    const ndrReport = await prisma.nDRReport.create({
      data: {
        ndrNumber: generateNDRNumber(),
        shipmentId,
        awbNumber,
        clientId,
        attemptNumber: attemptNumber || 1,
        attemptDate: new Date(),
        attemptedById,
        attemptedByName: attemptedByName || "Driver",
        failureReason,
        failureSubReason,
        failureRemarks,
        attemptLatitude: latitude ? parseFloat(latitude) : null,
        attemptLongitude: longitude ? parseFloat(longitude) : null,
        attemptLocation,
        customerName: shipment.consigneeName,
        customerPhone: shipment.consigneePhone,
        customerAltPhone: null,
        deliveryAddress: shipment.consigneeAddress,
        deliveryPincode: shipment.consigneePincode,
        priority,
        status: "OPEN",
      },
    });

    // Create initial action record
    await prisma.nDRAction.create({
      data: {
        ndrReportId: ndrReport.id,
        actionType: "NDR_CREATED",
        performedById: attemptedById,
        performedByName: attemptedByName || "Driver",
        performedByType: "DRIVER",
        previousStatus: "NONE",
        newStatus: "OPEN",
        remarks: `NDR created for failed delivery: ${failureReason}`,
        actionTime: new Date(),
      },
    });

    // Update shipment status
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: "NDR",
      },
    });

    return NextResponse.json({
      success: true,
      data: ndrReport,
    });
  } catch (error) {
    console.error("NDR Report POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create NDR report" },
      { status: 500 }
    );
  }
}
