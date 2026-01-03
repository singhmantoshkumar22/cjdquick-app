import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Feedback categories
const POSITIVE_CATEGORIES = [
  "FAST_DELIVERY",
  "GOOD_PACKAGING",
  "FRIENDLY_COURIER",
  "EASY_TRACKING",
  "ON_TIME",
  "SAFE_HANDLING",
];

const NEGATIVE_CATEGORIES = [
  "LATE_DELIVERY",
  "DAMAGED_PACKAGE",
  "RUDE_COURIER",
  "POOR_COMMUNICATION",
  "WRONG_ADDRESS",
  "MISSING_ITEMS",
];

// Calculate sentiment based on ratings
function calculateSentiment(overallRating: number, npsScore?: number): string {
  if (overallRating >= 4 || (npsScore && npsScore >= 9)) {
    return "POSITIVE";
  } else if (overallRating <= 2 || (npsScore && npsScore <= 6)) {
    return "NEGATIVE";
  }
  return "NEUTRAL";
}

// Determine if follow-up is needed
function needsFollowUp(overallRating: number, npsScore?: number, feedbackText?: string): boolean {
  // Follow up on negative feedback
  if (overallRating <= 2) return true;
  if (npsScore && npsScore <= 6) return true;
  // Follow up if feedback text mentions issues
  if (feedbackText) {
    const lowerText = feedbackText.toLowerCase();
    const issueKeywords = ["damaged", "broken", "late", "rude", "missing", "complaint", "refund", "problem"];
    if (issueKeywords.some((k) => lowerText.includes(k))) return true;
  }
  return false;
}

// POST - Submit feedback (public API for customers)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      awbNumber,
      overallRating,
      deliverySpeedRating,
      packagingRating,
      courierBehaviorRating,
      npsScore,
      feedbackText,
      categories,
      customerName,
      customerPhone,
      customerEmail,
      source = "TRACKING_PAGE",
    } = body;

    // Validate required fields
    if (!awbNumber || !overallRating) {
      return NextResponse.json(
        { success: false, error: "AWB number and overall rating are required" },
        { status: 400 }
      );
    }

    // Validate ratings
    if (overallRating < 1 || overallRating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (npsScore !== undefined && (npsScore < 0 || npsScore > 10)) {
      return NextResponse.json(
        { success: false, error: "NPS score must be between 0 and 10" },
        { status: 400 }
      );
    }

    // Find shipment
    const shipment = await prisma.shipment.findUnique({
      where: { awbNumber },
      select: {
        id: true,
        awbNumber: true,
        clientId: true,
        status: true,
        consigneeName: true,
        consigneePhone: true,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.deliveryFeedback.findUnique({
      where: { shipmentId: shipment.id },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { success: false, error: "Feedback already submitted for this shipment" },
        { status: 400 }
      );
    }

    // Calculate sentiment
    const sentiment = calculateSentiment(overallRating, npsScore);

    // Determine if follow-up needed
    const requiresFollowUp = needsFollowUp(overallRating, npsScore, feedbackText);

    // Create feedback
    const feedback = await prisma.deliveryFeedback.create({
      data: {
        shipmentId: shipment.id,
        awbNumber: shipment.awbNumber,
        clientId: shipment.clientId,
        customerName: customerName || shipment.consigneeName,
        customerPhone: customerPhone || shipment.consigneePhone,
        customerEmail: customerEmail || null,
        overallRating,
        deliverySpeedRating,
        packagingRating,
        courierBehaviorRating,
        npsScore,
        feedbackText,
        categories: categories ? JSON.stringify(categories) : null,
        sentiment,
        source,
        requiresFollowUp,
        followUpStatus: requiresFollowUp ? "PENDING" : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        feedbackId: feedback.id,
        sentiment,
        requiresFollowUp,
      },
      message: "Thank you for your feedback!",
    });
  } catch (error) {
    console.error("Feedback Submit Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// GET - List feedback with filters (internal API)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId");
    const sentiment = searchParams.get("sentiment");
    const requiresFollowUp = searchParams.get("requiresFollowUp");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const period = searchParams.get("period") || "30"; // days

    // Build where clause
    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (sentiment) where.sentiment = sentiment;
    if (requiresFollowUp === "true") where.requiresFollowUp = true;
    if (minRating) where.overallRating = { gte: parseInt(minRating) };
    if (maxRating) where.overallRating = { ...where.overallRating, lte: parseInt(maxRating) };

    // Period filter
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    where.submittedAt = { gte: startDate };

    // Parallel queries
    const [feedback, total, stats] = await Promise.all([
      // Paginated feedback
      prisma.deliveryFeedback.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),

      // Total count
      prisma.deliveryFeedback.count({ where }),

      // Calculate stats
      prisma.deliveryFeedback.aggregate({
        where: { submittedAt: { gte: startDate } },
        _avg: {
          overallRating: true,
          npsScore: true,
        },
        _count: true,
      }),
    ]);

    // Get NPS breakdown
    const [promoters, passives, detractors] = await Promise.all([
      prisma.deliveryFeedback.count({
        where: { npsScore: { gte: 9 }, submittedAt: { gte: startDate } },
      }),
      prisma.deliveryFeedback.count({
        where: { npsScore: { gte: 7, lt: 9 }, submittedAt: { gte: startDate } },
      }),
      prisma.deliveryFeedback.count({
        where: { npsScore: { lte: 6 }, submittedAt: { gte: startDate } },
      }),
    ]);

    const npsTotal = promoters + passives + detractors;
    const npsValue = npsTotal > 0
      ? Math.round(((promoters - detractors) / npsTotal) * 100)
      : 0;

    // Sentiment breakdown
    const sentimentCounts = await prisma.deliveryFeedback.groupBy({
      by: ["sentiment"],
      where: { submittedAt: { gte: startDate } },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        feedback: feedback.map((f) => ({
          ...f,
          categories: f.categories ? JSON.parse(f.categories) : [],
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          totalFeedback: stats._count,
          averageRating: stats._avg.overallRating?.toFixed(1) || "0.0",
          averageNps: stats._avg.npsScore?.toFixed(1) || "0.0",
          npsScore: npsValue,
          npsBreakdown: { promoters, passives, detractors },
          sentiment: sentimentCounts.reduce(
            (acc, s) => ({ ...acc, [s.sentiment || "UNKNOWN"]: s._count }),
            {}
          ),
        },
      },
    });
  } catch (error) {
    console.error("Feedback List Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
