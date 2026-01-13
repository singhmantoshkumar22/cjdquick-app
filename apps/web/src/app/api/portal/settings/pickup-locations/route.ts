import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { prisma } from "@cjdquick/database";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const locations = await prisma.brandPickupLocation.findMany({
      where: { brandId: user.brandId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        address: loc.addressLine1,
        addressLine2: loc.addressLine2,
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
        contactName: loc.contactName,
        contactPhone: loc.contactPhone,
        isDefault: loc.isDefault,
      })),
    });
  } catch (error) {
    console.error("Pickup locations fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, city, state, pincode, contactName, contactPhone } = body;

    // Check if this is the first location
    const existingCount = await prisma.brandPickupLocation.count({
      where: { brandId: user.brandId },
    });

    const location = await prisma.brandPickupLocation.create({
      data: {
        brandId: user.brandId,
        name,
        addressLine1: address,
        city,
        state,
        pincode,
        contactName,
        contactPhone,
        isDefault: existingCount === 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: location.id,
        name: location.name,
        message: "Location added successfully",
      },
    });
  } catch (error) {
    console.error("Location create error:", error);
    return NextResponse.json({ success: false, error: "Failed to create location" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, address, city, state, pincode, contactName, contactPhone, setDefault } = body;

    // Verify location belongs to brand
    const existing = await prisma.brandPickupLocation.findFirst({
      where: { id, brandId: user.brandId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults first
    if (setDefault) {
      await prisma.brandPickupLocation.updateMany({
        where: { brandId: user.brandId, isDefault: true },
        data: { isDefault: false },
      });
    }

    await prisma.brandPickupLocation.update({
      where: { id },
      data: {
        name,
        addressLine1: address,
        city,
        state,
        pincode,
        contactName,
        contactPhone,
        isDefault: setDefault || existing.isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Location updated successfully" },
    });
  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update location" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Location ID required" }, { status: 400 });
    }

    // Verify location belongs to brand
    const existing = await prisma.brandPickupLocation.findFirst({
      where: { id, brandId: user.brandId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 });
    }

    await prisma.brandPickupLocation.delete({ where: { id } });

    // If deleted was default, set another as default
    if (existing.isDefault) {
      const another = await prisma.brandPickupLocation.findFirst({
        where: { brandId: user.brandId },
      });
      if (another) {
        await prisma.brandPickupLocation.update({
          where: { id: another.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { message: "Location deleted successfully" },
    });
  } catch (error) {
    console.error("Location delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete location" }, { status: 500 });
  }
}
