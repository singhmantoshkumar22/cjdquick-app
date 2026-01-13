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
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const brandId = user.brand.id;

    // Build where clause
    const where: Record<string, unknown> = {
      brandId,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search } },
        { subject: { contains: search } },
        { awbNumber: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.brandSupportTicket.count({ where });

    // Get tickets with pagination
    const tickets = await prisma.brandSupportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        awbNumber: true,
        orderId: true,
        resolution: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform data for frontend
    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      awbNumber: t.awbNumber,
      orderId: t.orderId,
      resolution: t.resolution,
      resolvedAt: t.resolvedAt?.toISOString() || null,
      lastReplyAt: t.updatedAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        tickets: formattedTickets,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Support error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, priority, description, orderId, awbNumber } = body;

    if (!subject || !category || !description) {
      return NextResponse.json(
        { success: false, error: "Subject, category, and description are required" },
        { status: 400 }
      );
    }

    // Generate ticket number
    const count = await prisma.brandSupportTicket.count();
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const ticket = await prisma.brandSupportTicket.create({
      data: {
        ticketNumber,
        brandId: user.brand.id,
        subject,
        category,
        priority: priority || "MEDIUM",
        description,
        status: "OPEN",
        orderId: orderId || null,
        awbNumber: awbNumber || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ success: false, error: "Failed to create ticket" }, { status: 500 });
  }
}
