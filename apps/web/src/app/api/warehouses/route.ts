import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List warehouses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const isActive = searchParams.get("isActive");

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (isActive !== null) where.isActive = isActive === "true";

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: {
            staff: true,
            orders: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error("Get Warehouses Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}

// POST - Create warehouse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      code,
      name,
      address,
      city,
      state,
      pincode,
      contactName,
      contactPhone,
    } = body;

    if (!clientId || !code || !name) {
      return NextResponse.json(
        { success: false, error: "Client ID, code, and name are required" },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const existing = await prisma.warehouse.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Warehouse code already exists" },
        { status: 409 }
      );
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        clientId,
        code,
        name,
        address: address || "",
        city: city || "",
        state: state || "",
        pincode: pincode || "",
        contactName: contactName || "",
        contactPhone: contactPhone || "",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: warehouse,
      message: "Warehouse created successfully",
    });
  } catch (error) {
    console.error("Create Warehouse Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create warehouse" },
      { status: 500 }
    );
  }
}

// PATCH - Update warehouse
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Warehouse ID is required" },
        { status: 400 }
      );
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: warehouse,
      message: "Warehouse updated successfully",
    });
  } catch (error) {
    console.error("Update Warehouse Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update warehouse" },
      { status: 500 }
    );
  }
}
