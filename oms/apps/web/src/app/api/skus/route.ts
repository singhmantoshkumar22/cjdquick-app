import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/skus - List all SKUs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filter by company for non-SUPER_ADMIN users
    const companyId = session.user.companyId;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Multi-tenant: filter by company
    if (companyId) {
      where.companyId = companyId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { barcodes: { has: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (brand) {
      where.brand = brand;
    }

    const [skus, total] = await Promise.all([
      prisma.sKU.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sKU.count({ where }),
    ]);

    // Get unique categories and brands for filters (within company scope)
    const filterWhere = companyId ? { companyId } : {};

    const [categories, brands] = await Promise.all([
      prisma.sKU.findMany({
        where: { ...filterWhere, category: { not: null } },
        select: { category: true },
        distinct: ["category"],
      }),
      prisma.sKU.findMany({
        where: { ...filterWhere, brand: { not: null } },
        select: { brand: true },
        distinct: ["brand"],
      }),
    ]);

    return NextResponse.json({
      skus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        categories: categories.map((c: { category: string | null }) => c.category).filter(Boolean),
        brands: brands.map((b: { brand: string | null }) => b.brand).filter(Boolean),
      },
    });
  } catch (error) {
    console.error("Error fetching SKUs:", error);
    return NextResponse.json(
      { error: "Failed to fetch SKUs" },
      { status: 500 }
    );
  }
}

// POST /api/skus - Create a new SKU
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN, ADMIN, MANAGER can create SKUs
    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      category,
      brand,
      hsn,
      weight,
      length,
      width,
      height,
      mrp,
      costPrice,
      sellingPrice,
      taxRate,
      isSerialised,
      isBatchTracked,
      barcodes,
      images,
    } = body;

    // Check if SKU code already exists for this company
    const existingSku = await prisma.sKU.findFirst({
      where: {
        companyId,
        code,
      },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: "SKU with this code already exists" },
        { status: 400 }
      );
    }

    const sku = await prisma.sKU.create({
      data: {
        code,
        name,
        description,
        category,
        brand,
        hsn,
        weight: weight ? parseFloat(weight) : null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        mrp: mrp ? parseFloat(mrp) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        taxRate: taxRate ? parseFloat(taxRate) : null,
        isSerialised: isSerialised || false,
        isBatchTracked: isBatchTracked || false,
        barcodes: barcodes || [],
        images: images || [],
        companyId,
      },
    });

    return NextResponse.json(sku, { status: 201 });
  } catch (error) {
    console.error("Error creating SKU:", error);
    return NextResponse.json(
      { error: "Failed to create SKU" },
      { status: 500 }
    );
  }
}
