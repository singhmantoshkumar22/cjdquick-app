import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { createPicklist } from "@/lib/unified-wms-service";
import { prisma } from "@cjdquick/database";

// GET: List picklists
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
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;

    const [items, total] = await Promise.all([
      prisma.picklistNew.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: true,
          order: {
            select: {
              orderNumber: true,
              customerName: true,
              status: true,
            },
          },
        },
      }),
      prisma.picklistNew.count({ where }),
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
    console.error("List picklists error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch picklists" },
      { status: 500 }
    );
  }
}

// POST: Create picklist for an order
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
    const { orderId, assignedToId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    const picklist = await createPicklist(orderId, assignedToId);

    return NextResponse.json({
      success: true,
      data: picklist,
      message: `Picklist ${picklist.picklistNumber} created`,
    });
  } catch (error: any) {
    console.error("Create picklist error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create picklist" },
      { status: 400 }
    );
  }
}

// PUT: Bulk create picklists
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
    const { orderIds, assignedToId } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "orderIds array is required" },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const orderId of orderIds.slice(0, 50)) {
      try {
        const picklist = await createPicklist(orderId, assignedToId);
        results.push(picklist);
      } catch (err: any) {
        errors.push({ orderId, error: err.message });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        created: results.length,
        failed: errors.length,
        picklists: results,
        errors,
      },
    });
  } catch (error: any) {
    console.error("Bulk create picklist error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create picklists" },
      { status: 500 }
    );
  }
}
