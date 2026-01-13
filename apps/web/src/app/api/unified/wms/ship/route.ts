import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { markReadyToShip } from "@/lib/unified-wms-service";
import { prisma } from "@cjdquick/database";

// POST: Mark order as ready to ship
export async function POST(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    const order = await markReadyToShip(orderId);

    return NextResponse.json({
      success: true,
      data: order,
      message: `Order ${order?.orderNumber} is ready to ship`,
    });
  } catch (error: any) {
    console.error("Ready to ship error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark ready to ship" },
      { status: 400 }
    );
  }
}

// PUT: Bulk mark orders as ready to ship
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "orderIds array is required" },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const orderId of orderIds.slice(0, 100)) {
      try {
        const order = await markReadyToShip(orderId);
        results.push(order);
      } catch (err: any) {
        errors.push({ orderId, error: err.message });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        processed: results.length + errors.length,
        successful: results.length,
        failed: errors.length,
        orders: results.map((o) => ({ id: o.id, orderNumber: o.orderNumber })),
        errors,
      },
    });
  } catch (error: any) {
    console.error("Bulk ready to ship error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Bulk operation failed" },
      { status: 500 }
    );
  }
}

// GET: List orders ready to ship
export async function GET(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const transporterId = searchParams.get("transporterId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where: any = {
      status: "READY_TO_SHIP",
    };

    if (locationId) where.locationId = locationId;
    if (transporterId) where.transporterId = transporterId;

    const [items, total] = await Promise.all([
      prisma.unifiedOrder.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          shippingCity: true,
          shippingState: true,
          shippingPincode: true,
          awbNumber: true,
          paymentMode: true,
          codAmount: true,
          totalWeight: true,
          chargeableWeight: true,
          packageCount: true,
          transporter: {
            select: { code: true, name: true },
          },
          brand: {
            select: { code: true, name: true },
          },
          location: {
            select: { code: true, name: true },
          },
          createdAt: true,
        },
      }),
      prisma.unifiedOrder.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("List ready to ship error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
