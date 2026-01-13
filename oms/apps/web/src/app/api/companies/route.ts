import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/companies - List all companies
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SUPER_ADMIN can see all companies, others see only their company
    const where =
      session.user.role === "SUPER_ADMIN"
        ? undefined
        : { id: session.user.companyId || undefined };

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            locations: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can create companies
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, legalName, gst, pan, cin, settings } = body;

    // Check if company code already exists
    const existingCompany = await prisma.company.findUnique({
      where: { code },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Company with this code already exists" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        code,
        name,
        legalName,
        gst,
        pan,
        cin,
        settings,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
