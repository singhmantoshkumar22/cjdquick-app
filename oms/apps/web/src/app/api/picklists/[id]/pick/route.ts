import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// POST /api/picklists/[id]/pick - Pick an item (scan and confirm)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { itemId, scannedBarcode, quantity, serialNumbers, batchNo } = body;

    // Get picklist
    const picklist = await prisma.picklist.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            sku: true,
            bin: true,
          },
        },
      },
    });

    if (!picklist) {
      return NextResponse.json({ error: "Picklist not found" }, { status: 404 });
    }

    if (picklist.status !== "PROCESSING") {
      return NextResponse.json(
        { error: "Picklist is not in PROCESSING status. Start picking first." },
        { status: 400 }
      );
    }

    // Find the item to pick
    let picklistItem = picklist.items.find((item) => item.id === itemId);

    // If itemId not provided, try to find by scanned barcode
    if (!picklistItem && scannedBarcode) {
      picklistItem = picklist.items.find((item) =>
        item.sku.barcodes.includes(scannedBarcode) ||
        item.sku.code === scannedBarcode
      );
    }

    if (!picklistItem) {
      return NextResponse.json(
        { error: "Item not found in picklist or barcode does not match" },
        { status: 400 }
      );
    }

    // Validate barcode if provided
    if (scannedBarcode) {
      const validBarcode =
        picklistItem.sku.barcodes.includes(scannedBarcode) ||
        picklistItem.sku.code === scannedBarcode;

      if (!validBarcode) {
        return NextResponse.json(
          {
            error: "Scanned barcode does not match the expected SKU",
            expected: picklistItem.sku.code,
            scanned: scannedBarcode,
          },
          { status: 400 }
        );
      }
    }

    // Calculate new picked quantity
    const pickQty = quantity || 1;
    const newPickedQty = picklistItem.pickedQty + pickQty;
    const remainingQty = picklistItem.requiredQty - picklistItem.pickedQty;

    if (pickQty > remainingQty) {
      return NextResponse.json(
        {
          error: `Cannot pick ${pickQty}. Only ${remainingQty} remaining to pick.`,
        },
        { status: 400 }
      );
    }

    // Validate serial numbers if SKU requires it
    if (picklistItem.sku.isSerialised) {
      if (!serialNumbers || serialNumbers.length !== pickQty) {
        return NextResponse.json(
          {
            error: `Serial numbers required. Please provide ${pickQty} serial number(s).`,
          },
          { status: 400 }
        );
      }
    }

    // Update picklist item
    const updatedItem = await prisma.picklistItem.update({
      where: { id: picklistItem.id },
      data: {
        pickedQty: newPickedQty,
        pickedAt: new Date(),
        serialNumbers: serialNumbers
          ? [...picklistItem.serialNumbers, ...serialNumbers]
          : picklistItem.serialNumbers,
        batchNo: batchNo || picklistItem.batchNo,
      },
      include: {
        sku: true,
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    // Update inventory - reduce reserved qty and actual qty
    await prisma.inventory.updateMany({
      where: {
        skuId: picklistItem.skuId,
        binId: picklistItem.binId,
      },
      data: {
        quantity: { decrement: pickQty },
        reservedQty: { decrement: pickQty },
      },
    });

    // Check if all items in picklist are picked
    const updatedPicklist = await prisma.picklist.findUnique({
      where: { id },
      include: { items: true },
    });

    const allPicked = updatedPicklist?.items.every(
      (item) => item.pickedQty >= item.requiredQty
    );

    return NextResponse.json({
      success: true,
      item: updatedItem,
      pickedQty: newPickedQty,
      requiredQty: picklistItem.requiredQty,
      isComplete: newPickedQty >= picklistItem.requiredQty,
      allItemsPicked: allPicked,
      message: `Picked ${pickQty}x ${picklistItem.sku.code}`,
    });
  } catch (error) {
    console.error("Error picking item:", error);
    return NextResponse.json(
      { error: "Failed to pick item" },
      { status: 500 }
    );
  }
}

// DELETE /api/picklists/[id]/pick - Undo a pick
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const quantity = parseInt(searchParams.get("quantity") || "1");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Get picklist item
    const picklistItem = await prisma.picklistItem.findUnique({
      where: { id: itemId },
      include: {
        picklist: true,
        sku: true,
      },
    });

    if (!picklistItem || picklistItem.picklist.id !== id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (picklistItem.picklist.status !== "PROCESSING") {
      return NextResponse.json(
        { error: "Cannot undo pick - picklist is not in PROCESSING status" },
        { status: 400 }
      );
    }

    if (picklistItem.pickedQty < quantity) {
      return NextResponse.json(
        { error: `Cannot undo ${quantity}. Only ${picklistItem.pickedQty} picked.` },
        { status: 400 }
      );
    }

    // Update picklist item
    const updatedItem = await prisma.picklistItem.update({
      where: { id: itemId },
      data: {
        pickedQty: picklistItem.pickedQty - quantity,
        serialNumbers: picklistItem.serialNumbers.slice(0, -quantity),
      },
    });

    // Restore inventory
    await prisma.inventory.updateMany({
      where: {
        skuId: picklistItem.skuId,
        binId: picklistItem.binId,
      },
      data: {
        quantity: { increment: quantity },
        reservedQty: { increment: quantity },
      },
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: `Undid pick of ${quantity}x ${picklistItem.sku.code}`,
    });
  } catch (error) {
    console.error("Error undoing pick:", error);
    return NextResponse.json(
      { error: "Failed to undo pick" },
      { status: 500 }
    );
  }
}
