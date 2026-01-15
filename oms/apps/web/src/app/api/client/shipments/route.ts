import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/client/shipments - Get shipments for client
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get client's company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { Company: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ shipments: [], total: 0 });
    }

    // Build where clause
    const where: Record<string, unknown> = {
      Order: { Location: { companyId: user.companyId } },
    };

    if (search) {
      where.OR = [
        { awbNo: { contains: search, mode: "insensitive" } },
        { Order: { orderNo: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          Order: {
            select: {
              id: true,
              orderNo: true,
              shippingAddress: true,
              Location: { select: { name: true } },
            },
          },
          Transporter: {
            select: { name: true, trackingUrlTemplate: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.delivery.count({ where }),
    ]);

    // Get status counts
    const statusCounts = await prisma.delivery.groupBy({
      by: ["status"],
      where: { Order: { Location: { companyId: user.companyId } } },
      _count: { _all: true },
    });

    const statusCountMap = statusCounts.reduce(
      (acc, item) => {
        const key = item.status.toLowerCase().replace("_", "_");
        acc[key] = item._count._all;
        return acc;
      },
      {} as Record<string, number>
    );

    // Map status to frontend format
    const statusMapping: Record<string, string> = {
      PENDING: "pending",
      PACKED: "pending",
      MANIFESTED: "pending",
      SHIPPED: "in_transit",
      IN_TRANSIT: "in_transit",
      OUT_FOR_DELIVERY: "out_for_delivery",
      DELIVERED: "delivered",
      RTO_INITIATED: "exception",
      RTO_IN_TRANSIT: "exception",
      RTO_DELIVERED: "exception",
      CANCELLED: "exception",
    };

    return NextResponse.json({
      shipments: deliveries.map((d) => {
        const shippingAddr = d.Order.shippingAddress as Record<string, string> | null;
        return {
          id: d.id,
          awb: d.awbNo || "Pending",
          orderNumber: d.Order.orderNo,
          transporter: d.Transporter?.name || "Not Assigned",
          status: statusMapping[d.status] || "pending",
          origin: d.Order.Location?.name || "N/A",
          destination: shippingAddr?.city || "N/A",
          estimatedDelivery: d.shipDate ? new Date(d.shipDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : "TBD",
          actualDelivery: d.deliveryDate?.toISOString().split("T")[0],
          weight: Number(d.weight || 0),
          createdAt: d.createdAt.toISOString().split("T")[0],
          trackingUrl: d.Transporter?.trackingUrlTemplate?.replace("{awb}", d.awbNo || ""),
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts: {
        all: total,
        pending: (statusCountMap.pending || 0) + (statusCountMap.packed || 0) + (statusCountMap.manifested || 0),
        in_transit: (statusCountMap.in_transit || 0) + (statusCountMap.shipped || 0),
        out_for_delivery: statusCountMap.out_for_delivery || 0,
        delivered: statusCountMap.delivered || 0,
        exception: (statusCountMap.rto_initiated || 0) + (statusCountMap.rto_in_transit || 0) + (statusCountMap.rto_delivered || 0) + (statusCountMap.cancelled || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}
