import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/virtual-inventory/[id] - Get virtual inventory detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const virtualInventory = await prisma.virtualInventory.findUnique({
      where: { id },
      include: {
        sku: {
          select: { id: true, code: true, name: true },
        },
        location: {
          select: { id: true, code: true, name: true },
        },
        holds: true,
      },
    });

    if (!virtualInventory) {
      return NextResponse.json(
        { error: "Virtual inventory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(virtualInventory);
  } catch (error) {
    console.error("Error fetching virtual inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch virtual inventory" },
      { status: 500 }
    );
  }
}

// PATCH /api/virtual-inventory/[id] - Update virtual inventory
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.virtualInventory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Virtual inventory not found" },
        { status: 404 }
      );
    }

    const { quantity, validFrom, validTo, notes, isActive } = body;

    const updated = await prisma.virtualInventory.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
        ...(validTo !== undefined && { validTo: validTo ? new Date(validTo) : null }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        sku: {
          select: { id: true, code: true, name: true },
        },
        location: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating virtual inventory:", error);
    return NextResponse.json(
      { error: "Failed to update virtual inventory" },
      { status: 500 }
    );
  }
}

// DELETE /api/virtual-inventory/[id] - Delete virtual inventory
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.virtualInventory.findUnique({
      where: { id },
      include: { holds: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Virtual inventory not found" },
        { status: 404 }
      );
    }

    // Check if there are active holds
    if (existing.holds && existing.holds.length > 0) {
      const activeHolds = existing.holds.filter(
        (h) => h.status === "ACTIVE" || h.status === "PENDING"
      );
      if (activeHolds.length > 0) {
        return NextResponse.json(
          { error: "Cannot delete virtual inventory with active holds" },
          { status: 400 }
        );
      }
    }

    // Delete holds first
    await prisma.virtualInventoryHold.deleteMany({
      where: { virtualInventoryId: id },
    });

    // Delete virtual inventory
    await prisma.virtualInventory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting virtual inventory:", error);
    return NextResponse.json(
      { error: "Failed to delete virtual inventory" },
      { status: 500 }
    );
  }
}
