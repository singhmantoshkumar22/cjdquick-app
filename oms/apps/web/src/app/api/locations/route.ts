import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/locations - List all locations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || session.user.companyId;

    const locations = await prisma.location.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            zones: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN and ADMIN can create locations
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      name,
      type,
      address,
      contactPerson,
      contactPhone,
      contactEmail,
      gst,
      settings,
      companyId,
    } = body;

    const targetCompanyId = companyId || session.user.companyId;

    if (!targetCompanyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if location code already exists for this company
    const existingLocation = await prisma.location.findFirst({
      where: {
        companyId: targetCompanyId,
        code,
      },
    });

    if (existingLocation) {
      return NextResponse.json(
        { error: "Location with this code already exists in the company" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        code,
        name,
        type,
        address,
        contactPerson,
        contactPhone,
        contactEmail,
        gst,
        settings,
        companyId: targetCompanyId,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
