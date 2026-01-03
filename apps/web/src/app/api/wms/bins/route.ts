import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List storage bins
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");
    const warehouseId = searchParams.get("warehouseId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const aisle = searchParams.get("aisle");
    const isEmpty = searchParams.get("isEmpty");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};

    if (zoneId) where.zoneId = zoneId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (aisle) where.aisle = aisle;
    if (isEmpty === "true") where.status = "EMPTY";

    // Filter by warehouse through zone relation
    if (warehouseId) {
      where.zone = { warehouseId };
    }

    const [bins, total] = await Promise.all([
      prisma.storageBin.findMany({
        where,
        include: {
          zone: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
          inventoryBatches: {
            where: { status: "AVAILABLE" },
            select: {
              id: true,
              quantity: true,
              availableQty: true,
              batchNumber: true,
              item: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              inventoryBatches: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { aisle: "asc" },
          { rack: "asc" },
          { level: "asc" },
          { position: "asc" },
        ],
      }),
      prisma.storageBin.count({ where }),
    ]);

    // Calculate bin utilization
    const binsWithStats = bins.map((bin) => {
      const totalQty = bin.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0);
      const utilizationPercent =
        bin.maxWeightKg && bin.maxWeightKg > 0
          ? (bin.currentWeightKg / bin.maxWeightKg) * 100
          : null;

      return {
        ...bin,
        currentQuantity: totalQty,
        utilizationPercent: utilizationPercent
          ? Math.round(utilizationPercent * 10) / 10
          : null,
        skuCount: new Set(bin.inventoryBatches.map((b) => b.item.sku)).size,
      };
    });

    // Get summary stats
    const stats = {
      totalBins: total,
      emptyBins: bins.filter((b) => b.status === "EMPTY").length,
      partialBins: bins.filter((b) => b.status === "PARTIAL").length,
      fullBins: bins.filter((b) => b.status === "FULL").length,
      blockedBins: bins.filter((b) => b.status === "BLOCKED").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        items: binsWithStats,
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
    console.error("Get Bins Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch storage bins" },
      { status: 500 }
    );
  }
}

// POST - Create storage bin(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support bulk creation
    const { zoneId, bins: binsData, ...singleBin } = body;

    if (!zoneId) {
      return NextResponse.json(
        { success: false, error: "Zone ID is required" },
        { status: 400 }
      );
    }

    // Check zone exists
    const zone = await prisma.warehouseZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      return NextResponse.json(
        { success: false, error: "Zone not found" },
        { status: 404 }
      );
    }

    // Bulk creation
    if (binsData && Array.isArray(binsData)) {
      const createdBins = await prisma.$transaction(
        binsData.map((bin: any) =>
          prisma.storageBin.create({
            data: {
              zoneId,
              code: bin.code,
              barcode: bin.barcode || `BIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: bin.type || "STANDARD",
              aisle: bin.aisle,
              rack: bin.rack,
              level: bin.level,
              position: bin.position,
              lengthCm: bin.lengthCm,
              widthCm: bin.widthCm,
              heightCm: bin.heightCm,
              maxWeightKg: bin.maxWeightKg,
              pickPriority: bin.pickPriority || 100,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        data: createdBins,
        message: `${createdBins.length} bins created successfully`,
      });
    }

    // Single bin creation
    const { code, barcode, type, aisle, rack, level, position, ...dimensions } = singleBin;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Bin code is required" },
        { status: 400 }
      );
    }

    const bin = await prisma.storageBin.create({
      data: {
        zoneId,
        code,
        barcode: barcode || `BIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: type || "STANDARD",
        aisle,
        rack,
        level,
        position,
        ...dimensions,
      },
    });

    return NextResponse.json({
      success: true,
      data: bin,
      message: "Storage bin created successfully",
    });
  } catch (error: any) {
    console.error("Create Bin Error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Bin code or barcode already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create storage bin" },
      { status: 500 }
    );
  }
}

// PATCH - Update bin status or properties
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Bin ID is required" },
        { status: 400 }
      );
    }

    // Validate status
    if (status) {
      const validStatuses = ["EMPTY", "PARTIAL", "FULL", "RESERVED", "BLOCKED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const bin = await prisma.storageBin.update({
      where: { id },
      data: { status, ...updateData },
    });

    return NextResponse.json({
      success: true,
      data: bin,
      message: "Bin updated successfully",
    });
  } catch (error) {
    console.error("Update Bin Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bin" },
      { status: 500 }
    );
  }
}

// Generate bin layout for a zone
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      zoneId,
      aisles,
      racksPerAisle,
      levelsPerRack,
      positionsPerLevel,
      binType,
      dimensions,
    } = body;

    if (!zoneId || !aisles || !racksPerAisle || !levelsPerRack) {
      return NextResponse.json(
        { success: false, error: "Zone ID and layout parameters are required" },
        { status: 400 }
      );
    }

    const zone = await prisma.warehouseZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      return NextResponse.json(
        { success: false, error: "Zone not found" },
        { status: 404 }
      );
    }

    const binsToCreate: any[] = [];
    const posPerLevel = positionsPerLevel || 1;

    for (let a = 1; a <= aisles; a++) {
      for (let r = 1; r <= racksPerAisle; r++) {
        for (let l = 1; l <= levelsPerRack; l++) {
          for (let p = 1; p <= posPerLevel; p++) {
            const aisleCode = String(a).padStart(2, "0");
            const rackCode = String(r).padStart(2, "0");
            const levelCode = String(l).padStart(2, "0");
            const posCode = String(p).padStart(2, "0");

            const code = `${zone.code}-${aisleCode}-${rackCode}-${levelCode}-${posCode}`;
            const barcode = `BIN${zone.code}${aisleCode}${rackCode}${levelCode}${posCode}`;

            binsToCreate.push({
              zoneId,
              code,
              barcode,
              type: binType || "STANDARD",
              aisle: aisleCode,
              rack: rackCode,
              level: levelCode,
              position: posCode,
              lengthCm: dimensions?.lengthCm,
              widthCm: dimensions?.widthCm,
              heightCm: dimensions?.heightCm,
              maxWeightKg: dimensions?.maxWeightKg,
            });
          }
        }
      }
    }

    // Filter out any bins with codes that already exist
    const existingBins = await prisma.storageBin.findMany({
      where: { zoneId },
      select: { code: true },
    });
    const existingCodes = new Set(existingBins.map((b) => b.code));
    const newBins = binsToCreate.filter((b: any) => !existingCodes.has(b.code));

    if (newBins.length === 0) {
      return NextResponse.json({
        success: true,
        data: { created: 0 },
        message: "All bins already exist",
      });
    }

    const created = await prisma.storageBin.createMany({
      data: newBins,
    });

    return NextResponse.json({
      success: true,
      data: {
        created: created.count,
        layout: {
          aisles,
          racksPerAisle,
          levelsPerRack,
          positionsPerLevel: posPerLevel,
          totalBins: binsToCreate.length,
        },
      },
      message: `Generated ${created.count} bins for zone ${zone.code}`,
    });
  } catch (error) {
    console.error("Generate Bins Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate bin layout" },
      { status: 500 }
    );
  }
}
