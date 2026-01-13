import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List inventory with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const clientId = searchParams.get("clientId");
    const sku = searchParams.get("sku");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const lowStock = searchParams.get("lowStock") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (warehouseId) where.warehouseId = warehouseId;
    if (clientId) where.clientId = clientId;
    if (sku) where.sku = { contains: sku };
    if (category) where.category = category;
    if (status) where.status = status;

    // Get inventory items
    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        batches: {
          where: { status: "AVAILABLE" },
          include: {
            bin: {
              include: {
                zone: true,
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    // Calculate stock levels
    const inventoryWithStock = items.map((item) => {
      const totalQty = item.batches.reduce((sum, b) => sum + b.quantity, 0);
      const availableQty = item.batches.reduce((sum, b) => sum + b.availableQty, 0);
      const reservedQty = item.batches.reduce((sum, b) => sum + b.reservedQty, 0);

      const isLowStock = totalQty <= item.reorderPoint;
      const isOutOfStock = availableQty === 0;

      return {
        ...item,
        totalQuantity: totalQty,
        availableQuantity: availableQty,
        reservedQuantity: reservedQty,
        isLowStock,
        isOutOfStock,
        locations: item.batches.map((b) => ({
          binCode: b.bin.code,
          zoneName: b.bin.zone.name,
          batchNumber: b.batchNumber,
          quantity: b.quantity,
          expiryDate: b.expiryDate,
        })),
      };
    });

    // Filter low stock if requested
    const filtered = lowStock
      ? inventoryWithStock.filter((i) => i.isLowStock)
      : inventoryWithStock;

    // Get total count
    const total = await prisma.inventoryItem.count({ where });

    // Get summary stats
    const stats = {
      totalItems: total,
      lowStockItems: inventoryWithStock.filter((i) => i.isLowStock).length,
      outOfStockItems: inventoryWithStock.filter((i) => i.isOutOfStock).length,
      totalValue: inventoryWithStock.reduce(
        (sum, i) => sum + (i.costPrice || 0) * i.totalQuantity,
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        items: filtered,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Get Inventory Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST - Add new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      warehouseId,
      sku,
      name,
      description,
      category,
      subcategory,
      brand,
      barcode,
      upc,
      ean,
      lengthCm,
      widthCm,
      heightCm,
      weightGrams,
      unitsPerCase,
      casesPerPallet,
      minStockLevel,
      reorderPoint,
      reorderQty,
      maxStockLevel,
      isFragile,
      isHazardous,
      requiresColdStorage,
      isSerialTracked,
      isBatchTracked,
      pickingMethod,
      costPrice,
      sellingPrice,
      imageUrl,
    } = body;

    if (!clientId || !warehouseId || !sku || !name) {
      return NextResponse.json(
        { success: false, error: "Client ID, warehouse ID, SKU, and name are required" },
        { status: 400 }
      );
    }

    // Check for duplicate SKU (using legacy clientId/warehouseId or new locationId)
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { clientId, warehouseId, sku },
          { locationId: warehouseId, sku },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "SKU already exists in this warehouse" },
        { status: 409 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        clientId,
        warehouseId,
        sku,
        name,
        description,
        category,
        subcategory,
        brand,
        barcode,
        upc,
        ean,
        lengthCm,
        widthCm,
        heightCm,
        weightGrams,
        unitsPerCase: unitsPerCase || 1,
        casesPerPallet: casesPerPallet || 1,
        minStockLevel: minStockLevel || 0,
        reorderPoint: reorderPoint || 0,
        reorderQty: reorderQty || 0,
        maxStockLevel,
        isFragile: isFragile || false,
        isHazardous: isHazardous || false,
        requiresColdStorage: requiresColdStorage || false,
        isSerialTracked: isSerialTracked || false,
        isBatchTracked: isBatchTracked || false,
        pickingMethod: pickingMethod || "PIECE",
        costPrice,
        sellingPrice,
        imageUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: item,
      message: "Inventory item created successfully",
    });
  } catch (error) {
    console.error("Create Inventory Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
