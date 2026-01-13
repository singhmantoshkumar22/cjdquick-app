import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List warehouse zones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");

    if (!warehouseId) {
      return NextResponse.json(
        { success: false, error: "Warehouse ID is required" },
        { status: 400 }
      );
    }

    const where: any = { warehouseId };

    if (type) where.type = type;
    if (isActive !== null) where.isActive = isActive === "true";

    const zones = await prisma.warehouseZone.findMany({
      where,
      include: {
        bins: {
          select: {
            id: true,
            code: true,
            status: true,
            type: true,
          },
        },
        packStations: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
        _count: {
          select: {
            bins: true,
            packStations: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    // Calculate zone utilization
    const zonesWithStats = zones.map((zone) => {
      const totalBins = zone.bins.length;
      const occupiedBins = zone.bins.filter(
        (b) => b.status === "PARTIAL" || b.status === "FULL"
      ).length;
      const utilizationPercent = totalBins > 0 ? (occupiedBins / totalBins) * 100 : 0;

      return {
        ...zone,
        stats: {
          totalBins,
          occupiedBins,
          emptyBins: zone.bins.filter((b) => b.status === "EMPTY").length,
          utilizationPercent: Math.round(utilizationPercent * 10) / 10,
          activePackStations: zone.packStations.filter((p) => p.status === "AVAILABLE").length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: zonesWithStats,
    });
  } catch (error) {
    console.error("Get Zones Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch warehouse zones" },
      { status: 500 }
    );
  }
}

// POST - Create new warehouse zone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      warehouseId,
      code,
      name,
      type,
      isTemperatureControlled,
      minTempC,
      maxTempC,
      requiresSpecialAccess,
      accessLevel,
      lengthM,
      widthM,
      heightM,
      areaM2,
      maxBins,
      maxWeightKg,
    } = body;

    if (!warehouseId || !code || !name || !type) {
      return NextResponse.json(
        { success: false, error: "Warehouse ID, code, name, and type are required" },
        { status: 400 }
      );
    }

    // Valid zone types
    const validTypes = [
      "RECEIVING",
      "STORAGE",
      "PICKING",
      "PACKING",
      "SHIPPING",
      "RETURNS",
      "QUARANTINE",
      "COLD_STORAGE",
      "HAZMAT",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid zone type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Check for duplicate code (using legacy warehouseId or new locationId)
    const existing = await prisma.warehouseZone.findFirst({
      where: {
        OR: [
          { warehouseId, code },
          { locationId: warehouseId, code },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Zone code already exists in this warehouse" },
        { status: 409 }
      );
    }

    const zone = await prisma.warehouseZone.create({
      data: {
        warehouseId,
        code,
        name,
        type,
        isTemperatureControlled: isTemperatureControlled || false,
        minTempC,
        maxTempC,
        requiresSpecialAccess: requiresSpecialAccess || false,
        accessLevel,
        lengthM,
        widthM,
        heightM,
        areaM2,
        maxBins: maxBins || 100,
        maxWeightKg,
      },
    });

    return NextResponse.json({
      success: true,
      data: zone,
      message: "Warehouse zone created successfully",
    });
  } catch (error) {
    console.error("Create Zone Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create warehouse zone" },
      { status: 500 }
    );
  }
}

// PATCH - Update warehouse zone
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Zone ID is required" },
        { status: 400 }
      );
    }

    const zone = await prisma.warehouseZone.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: zone,
      message: "Zone updated successfully",
    });
  } catch (error) {
    console.error("Update Zone Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update zone" },
      { status: 500 }
    );
  }
}
