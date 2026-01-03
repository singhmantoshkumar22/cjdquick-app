import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List notification logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");
    const shipmentId = searchParams.get("shipmentId");
    const awbNumber = searchParams.get("awbNumber");
    const clientId = searchParams.get("clientId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (shipmentId) where.shipmentId = shipmentId;
    if (awbNumber) where.awbNumber = { contains: awbNumber };
    if (clientId) where.clientId = clientId;

    if (fromDate || toDate) {
      where.sentAt = {};
      if (fromDate) where.sentAt.gte = new Date(fromDate);
      if (toDate) where.sentAt.lte = new Date(toDate);
    }

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sentAt: "desc" },
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Notification Logs Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notification logs" },
      { status: 500 }
    );
  }
}
