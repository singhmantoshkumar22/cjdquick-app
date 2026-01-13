import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import {
  startPicking,
  confirmPickedItem,
  completePicking,
} from "@/lib/unified-wms-service";
import { prisma } from "@cjdquick/database";

// GET: Get picklist details for picking
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
    const picklistId = searchParams.get("picklistId");

    if (!picklistId) {
      return NextResponse.json(
        { success: false, error: "picklistId is required" },
        { status: 400 }
      );
    }

    const picklist = await prisma.picklistNew.findUnique({
      where: { id: picklistId },
      include: {
        items: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            status: true,
            items: true,
          },
        },
      },
    });

    if (!picklist) {
      return NextResponse.json(
        { success: false, error: "Picklist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: picklist,
    });
  } catch (error) {
    console.error("Get picklist error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch picklist" },
      { status: 500 }
    );
  }
}

// POST: Start picking or confirm picked items
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
    const { action, picklistId, pickerId, itemId, pickedQty, batchNo, serialNumbers } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "action is required (start, pick, complete)" },
        { status: 400 }
      );
    }

    switch (action) {
      case "start": {
        if (!picklistId || !pickerId) {
          return NextResponse.json(
            { success: false, error: "picklistId and pickerId are required" },
            { status: 400 }
          );
        }

        const picklist = await startPicking(picklistId, pickerId);
        return NextResponse.json({
          success: true,
          data: picklist,
          message: "Picking started",
        });
      }

      case "pick": {
        if (!itemId || pickedQty === undefined) {
          return NextResponse.json(
            { success: false, error: "itemId and pickedQty are required" },
            { status: 400 }
          );
        }

        const item = await confirmPickedItem(itemId, pickedQty, batchNo, serialNumbers);
        return NextResponse.json({
          success: true,
          data: item,
          message: "Item picked",
        });
      }

      case "complete": {
        if (!picklistId) {
          return NextResponse.json(
            { success: false, error: "picklistId is required" },
            { status: 400 }
          );
        }

        const picklist = await completePicking(picklistId);
        return NextResponse.json({
          success: true,
          data: picklist,
          message: "Picking completed",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: start, pick, complete" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Picking error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Picking operation failed" },
      { status: 400 }
    );
  }
}

// PATCH: Batch pick items
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { picklistId, items } = body;

    if (!picklistId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "picklistId and items array are required" },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const item of items) {
      try {
        const result = await confirmPickedItem(
          item.itemId,
          item.pickedQty,
          item.batchNo,
          item.serialNumbers
        );
        results.push(result);
      } catch (err: any) {
        errors.push({ itemId: item.itemId, error: err.message });
      }
    }

    // Check if all items are picked
    const picklist = await prisma.picklistNew.findUnique({
      where: { id: picklistId },
      include: { items: true },
    });

    const allPicked = picklist?.items.every((i) => i.pickedQty >= i.requiredQty);

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        updated: results.length,
        failed: errors.length,
        allPicked,
        results,
        errors,
      },
      message: allPicked ? "All items picked" : `${results.length} items updated`,
    });
  } catch (error: any) {
    console.error("Batch pick error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Batch pick failed" },
      { status: 500 }
    );
  }
}
