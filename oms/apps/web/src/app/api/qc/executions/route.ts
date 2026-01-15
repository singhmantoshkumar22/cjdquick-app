import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// Helper to generate QC Execution number
async function generateQCNumber(): Promise<string> {
  const sequence = await prisma.sequence.upsert({
    where: { name: "qc_execution" },
    update: { currentValue: { increment: 1 } },
    create: { name: "qc_execution", prefix: "QC", currentValue: 1, paddingLength: 8 },
  });

  const paddedNumber = String(sequence.currentValue).padStart(sequence.paddingLength, "0");
  return `${sequence.prefix || "QC"}${paddedNumber}`;
}

// GET /api/qc/executions - List QC executions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const locationId = searchParams.get("locationId") || "";
    const skuId = searchParams.get("skuId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.template = { type };
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (skuId) {
      where.skuId = skuId;
    }

    if (search) {
      where.OR = [
        { qcNo: { contains: search, mode: "insensitive" } },
        { referenceNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const [executions, total] = await Promise.all([
      prisma.qCExecution.findMany({
        where,
        include: {
          QCTemplate: {
            select: { id: true, name: true, type: true },
          },
          SKU: {
            select: { id: true, code: true, name: true },
          },
          _count: {
            select: { QCResult: true, QCDefect: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.qCExecution.count({ where }),
    ]);

    // Get status counts
    const statusCounts = await prisma.qCExecution.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const statusCountMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      executions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts: statusCountMap,
    });
  } catch (error) {
    console.error("Error fetching QC executions:", error);
    return NextResponse.json(
      { error: "Failed to fetch QC executions" },
      { status: 500 }
    );
  }
}

// POST /api/qc/executions - Create QC execution
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER", "WAREHOUSE_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      templateId,
      locationId,
      skuId,
      referenceType,
      referenceId,
      referenceNo,
      inspectionQuantity,
      sampleSize,
    } = body;

    if (!templateId || !locationId) {
      return NextResponse.json(
        { error: "Template and location are required" },
        { status: 400 }
      );
    }

    // Validate template exists and is active
    const template = await prisma.qCTemplate.findUnique({
      where: { id: templateId },
      include: {
        QCParameter: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "QC template not found" }, { status: 404 });
    }

    if (!template.isActive) {
      return NextResponse.json({ error: "QC template is inactive" }, { status: 400 });
    }

    // Validate location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const executionNo = await generateQCNumber();

    // Create execution
    const execution = await prisma.qCExecution.create({
      data: {
        executionNo,
        templateId,
        locationId,
        skuId,
        status: "PENDING",
        referenceType: referenceType || "MANUAL",
        referenceId: referenceId || skuId,
        sampleQty: inspectionQuantity || sampleSize || 1,
        performedById: session.user.id,
      },
      include: {
        QCTemplate: {
          include: {
            QCParameter: {
              orderBy: { sequence: "asc" },
            },
          },
        },
        SKU: true,
      },
    });

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    console.error("Error creating QC execution:", error);
    return NextResponse.json(
      { error: "Failed to create QC execution" },
      { status: 500 }
    );
  }
}
