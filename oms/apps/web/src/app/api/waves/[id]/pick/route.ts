import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// POST /api/waves/[id]/pick - Record a pick for a wave item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: waveId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { waveItemId, pickedQuantity, orderId } = body;

    if (!waveItemId || pickedQuantity === undefined) {
      return NextResponse.json(
        { error: "Wave item ID and picked quantity are required" },
        { status: 400 }
      );
    }

    // Validate wave exists and is in progress
    const wave = await prisma.wave.findUnique({
      where: { id: waveId },
    });

    if (!wave) {
      return NextResponse.json({ error: "Wave not found" }, { status: 404 });
    }

    if (wave.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Wave must be in progress to record picks" },
        { status: 400 }
      );
    }

    // Validate wave item
    const waveItem = await prisma.waveItem.findFirst({
      where: {
        id: waveItemId,
        waveId,
      },
      include: {
        sku: true,
        bin: true,
      },
    });

    if (!waveItem) {
      return NextResponse.json({ error: "Wave item not found" }, { status: 404 });
    }

    const newPickedQty = waveItem.pickedQuantity + pickedQuantity;

    if (newPickedQty > waveItem.totalQuantity) {
      return NextResponse.json(
        { error: `Cannot pick more than required. Max: ${waveItem.totalQuantity - waveItem.pickedQuantity}` },
        { status: 400 }
      );
    }

    // Update wave item
    const updatedWaveItem = await prisma.waveItem.update({
      where: { id: waveItemId },
      data: {
        pickedQuantity: newPickedQty,
        pickedAt: new Date(),
        pickedBy: session.user.id,
      },
      include: {
        sku: true,
        bin: true,
      },
    });

    // If orderId is provided, create/update distribution
    if (orderId) {
      const waveOrder = await prisma.waveOrder.findFirst({
        where: {
          waveId,
          orderId,
        },
      });

      if (waveOrder) {
        // Check if distribution exists
        const existingDist = await prisma.waveItemDistribution.findFirst({
          where: {
            waveItemId,
            waveOrderId: waveOrder.id,
          },
        });

        if (existingDist) {
          await prisma.waveItemDistribution.update({
            where: { id: existingDist.id },
            data: {
              quantity: existingDist.quantity + pickedQuantity,
            },
          });
        } else {
          await prisma.waveItemDistribution.create({
            data: {
              waveItemId,
              waveOrderId: waveOrder.id,
              quantity: pickedQuantity,
            },
          });
        }
      }
    }

    // Update inventory if bin is specified
    if (waveItem.binId && waveItem.skuId) {
      await prisma.inventory.updateMany({
        where: {
          skuId: waveItem.skuId,
          binId: waveItem.binId,
          locationId: wave.locationId,
        },
        data: {
          quantity: { decrement: pickedQuantity },
        },
      });

      // Create inventory movement
      await prisma.inventoryMovement.create({
        data: {
          skuId: waveItem.skuId,
          locationId: wave.locationId,
          fromBinId: waveItem.binId,
          movementType: "PICK",
          quantity: pickedQuantity,
          reason: `Wave picking: ${wave.waveNo}`,
          referenceType: "WAVE",
          referenceId: waveId,
          createdBy: session.user.id,
        },
      });
    }

    // Update wave picked units count
    await prisma.wave.update({
      where: { id: waveId },
      data: {
        pickedUnits: { increment: pickedQuantity },
      },
    });

    // Check if all items are picked
    const pendingItems = await prisma.waveItem.count({
      where: {
        waveId,
        pickedQuantity: { lt: prisma.waveItem.fields.totalQuantity },
      },
    });

    const allPicked = pendingItems === 0;

    return NextResponse.json({
      waveItem: updatedWaveItem,
      allPicked,
      remainingItems: pendingItems,
    });
  } catch (error) {
    console.error("Error recording pick:", error);
    return NextResponse.json(
      { error: "Failed to record pick" },
      { status: 500 }
    );
  }
}

// GET /api/waves/[id]/pick - Get picking progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: waveId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wave = await prisma.wave.findUnique({
      where: { id: waveId },
      include: {
        location: true,
        waveItems: {
          include: {
            sku: {
              select: { id: true, code: true, name: true, barcode: true },
            },
            bin: {
              select: {
                id: true,
                code: true,
                zone: true,
                aisle: true,
                rack: true,
                shelf: true,
              },
            },
          },
          orderBy: { pickSequence: "asc" },
        },
      },
    });

    if (!wave) {
      return NextResponse.json({ error: "Wave not found" }, { status: 404 });
    }

    // Calculate progress
    const totalItems = wave.waveItems.length;
    const completedItems = wave.waveItems.filter(
      (item) => item.pickedQuantity >= item.totalQuantity
    ).length;
    const totalUnits = wave.waveItems.reduce((sum, item) => sum + item.totalQuantity, 0);
    const pickedUnits = wave.waveItems.reduce((sum, item) => sum + item.pickedQuantity, 0);

    // Get current item (first unpicked or partially picked)
    const currentItem = wave.waveItems.find(
      (item) => item.pickedQuantity < item.totalQuantity
    );

    // Get next items
    const upcomingItems = wave.waveItems
      .filter((item) => item.pickedQuantity < item.totalQuantity && item.id !== currentItem?.id)
      .slice(0, 5);

    return NextResponse.json({
      wave: {
        id: wave.id,
        waveNo: wave.waveNo,
        status: wave.status,
        location: wave.location,
      },
      progress: {
        totalItems,
        completedItems,
        totalUnits,
        pickedUnits,
        percentComplete: totalUnits > 0 ? Math.round((pickedUnits / totalUnits) * 100) : 0,
      },
      currentItem,
      upcomingItems,
      allItems: wave.waveItems,
    });
  } catch (error) {
    console.error("Error fetching pick progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch pick progress" },
      { status: 500 }
    );
  }
}
