import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

async function getPortalUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  const session = await prisma.brandUserSession.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          brand: true,
        },
      },
    },
  });

  if (!session || !session.isActive || new Date() > session.expiresAt) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const serviceType = searchParams.get("serviceType") || "B2B";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build where clause - filter by brand and order type
    const where: Record<string, unknown> = {
      brandId: user.brand.id,
      orderType: serviceType,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { awbNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.unifiedOrder.count({ where });

    // Get orders with pagination
    const orders = await prisma.unifiedOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        channel: true,
        customerName: true,
        customerPhone: true,
        shippingCity: true,
        shippingState: true,
        shippingPincode: true,
        totalAmount: true,
        paymentMode: true,
        codAmount: true,
        status: true,
        awbNumber: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orders,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Portal orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const serviceType = body.serviceType || "B2B";

    // Generate order number
    const count = await prisma.unifiedOrder.count();
    const orderNumber = `${serviceType}-${Date.now()}-${String(count + 1).padStart(5, "0")}`;

    const order = await prisma.unifiedOrder.create({
      data: {
        orderNumber,
        orderType: serviceType,
        channel: body.channel || "MANUAL",
        brandId: user.brandId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail,
        shippingAddress: JSON.stringify(body.shippingAddress),
        shippingPincode: body.shippingPincode,
        shippingCity: body.shippingCity,
        shippingState: body.shippingState,
        originPincode: body.originPincode || "110001",
        totalWeight: body.totalWeight || 0.5,
        length: body.length,
        width: body.width,
        height: body.height,
        subtotal: body.subtotal,
        taxAmount: body.taxAmount || 0,
        shippingCharges: body.shippingCharges || 0,
        totalAmount: body.totalAmount,
        paymentMode: body.paymentMode || "PREPAID",
        codAmount: body.paymentMode === "COD" ? body.totalAmount : 0,
        status: "CREATED",
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
