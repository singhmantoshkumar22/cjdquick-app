import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getPortalUserFromRequest } from "@/lib/portal-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const brandId = user.brand.id;

    // Build where clause - filter returns by brand through order relation
    const where: Record<string, unknown> = {
      order: { brandId },
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { returnNumber: { contains: search } },
        { order: { orderNumber: { contains: search } } },
        { order: { customerName: { contains: search } } },
      ];
    }

    // Get total count
    const total = await prisma.unifiedReturn.count({ where });

    // Get returns with pagination
    const returns = await prisma.unifiedReturn.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        returnNumber: true,
        type: true,
        status: true,
        reason: true,
        awbNumber: true,
        createdAt: true,
        receivedAt: true,
        processedAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            shippingCity: true,
            shippingState: true,
          },
        },
      },
    });

    // Transform data for frontend
    const orders = returns.map((r) => ({
      id: r.id,
      orderNumber: r.returnNumber,
      originalOrderNumber: r.order.orderNumber,
      type: r.type,
      customerName: r.order.customerName,
      customerPhone: r.order.customerPhone,
      shippingCity: r.order.shippingCity,
      shippingState: r.order.shippingState,
      status: r.status,
      reason: r.reason,
      awbNumber: r.awbNumber,
      createdAt: r.createdAt.toISOString(),
      receivedAt: r.receivedAt?.toISOString() || null,
      processedAt: r.processedAt?.toISOString() || null,
    }));

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
    console.error("Reverse orders error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reverse orders" }, { status: 500 });
  }
}
