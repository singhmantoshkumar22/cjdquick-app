import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/reports/scheduled - List scheduled reports
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || undefined;
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (isActive !== null && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const [reports, total] = await Promise.all([
      prisma.scheduledReport.findMany({
        where,
        include: {
          _count: {
            select: { ReportExecution: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.scheduledReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching scheduled reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports/scheduled - Create scheduled report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      companyId,
      name,
      description,
      reportType,
      frequency,
      format = "EXCEL",
      recipients,
      filters,
      time = "09:00",
      dayOfWeek,
      dayOfMonth,
      isActive = true,
    } = body;

    if (!companyId || !name || !reportType || !frequency) {
      return NextResponse.json(
        { error: "Company, name, report type, and frequency are required" },
        { status: 400 }
      );
    }

    // Calculate next run date based on frequency
    const nextRunAt = calculateNextRun(frequency);

    const report = await prisma.scheduledReport.create({
      data: {
        companyId,
        name,
        description,
        reportType,
        frequency,
        format,
        recipients: recipients || [],
        reportConfig: filters || {},
        time,
        dayOfWeek,
        dayOfMonth,
        isActive,
        nextRunAt,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled report" },
      { status: 500 }
    );
  }
}

function calculateNextRun(frequency: string): Date {
  const now = new Date();

  switch (frequency) {
    case "DAILY":
      // Next day at 6 AM
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(6, 0, 0, 0);
      return tomorrow;

    case "WEEKLY":
      // Next Monday at 6 AM
      const nextMonday = new Date(now);
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(6, 0, 0, 0);
      return nextMonday;

    case "MONTHLY":
      // First day of next month at 6 AM
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 6, 0, 0, 0);
      return nextMonth;

    case "QUARTERLY":
      // First day of next quarter at 6 AM
      const quarter = Math.floor(now.getMonth() / 3);
      const nextQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 1, 6, 0, 0, 0);
      if (nextQuarter.getMonth() > 11) {
        nextQuarter.setFullYear(nextQuarter.getFullYear() + 1);
        nextQuarter.setMonth(0);
      }
      return nextQuarter;

    default:
      // Default to tomorrow
      const defaultNext = new Date(now);
      defaultNext.setDate(defaultNext.getDate() + 1);
      defaultNext.setHours(6, 0, 0, 0);
      return defaultNext;
  }
}
