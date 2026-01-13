import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/transporters - List transporters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: Record<string, unknown> = {};

    if (activeOnly) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const transporters = await prisma.transporter.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        logo: true,
        apiEnabled: true,
        trackingUrlTemplate: true,
        isActive: true,
        _count: {
          select: {
            deliveries: true,
            awbPool: {
              where: { isUsed: false },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(transporters);
  } catch (error) {
    console.error("Error fetching transporters:", error);
    return NextResponse.json(
      { error: "Failed to fetch transporters" },
      { status: 500 }
    );
  }
}

// POST /api/transporters - Create a new transporter
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create transporters
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, type, logo, apiEnabled, apiConfig, trackingUrlTemplate } = body;

    if (!code || !name || !type) {
      return NextResponse.json(
        { error: "Code, name, and type are required" },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const existing = await prisma.transporter.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Transporter with this code already exists" },
        { status: 400 }
      );
    }

    const transporter = await prisma.transporter.create({
      data: {
        code,
        name,
        type,
        logo,
        apiEnabled: apiEnabled || false,
        apiConfig,
        trackingUrlTemplate,
      },
    });

    return NextResponse.json(transporter, { status: 201 });
  } catch (error) {
    console.error("Error creating transporter:", error);
    return NextResponse.json(
      { error: "Failed to create transporter" },
      { status: 500 }
    );
  }
}
