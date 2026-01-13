import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { listClaims, fileClaim, getClaimsDashboardStats } from "@/lib/unified-finance-service";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status") || undefined;
    const claimType = searchParams.get("claimType") || undefined;

    // Get claims for this brand
    const result = await listClaims({
      brandId: user.brandId,
      status,
      claimType,
      page,
      pageSize,
    });

    // Get stats for the summary cards
    const stats = await getClaimsDashboardStats(user.brandId);

    // Transform to expected format
    const claims = result.items.map((item) => ({
      id: item.id,
      claimNumber: item.claimNumber,
      type: item.claimType,
      orderNumber: item.orderNumber,
      awbNumber: item.awbNumber,
      amount: item.claimAmount,
      approvedAmount: item.approvedAmount,
      status: item.status,
      reason: item.reason,
      description: item.description,
      createdAt: item.filedAt.toISOString(),
      reviewedAt: item.reviewedAt?.toISOString() || null,
      settledAt: item.settledAt?.toISOString() || null,
      rejectionReason: item.rejectionReason,
    }));

    return NextResponse.json({
      success: true,
      data: {
        claims,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages,
        stats: {
          underReview: stats.underReview.count,
          approved30d: stats.approved.amount,
          rejected: stats.rejected.count,
        },
      },
    });
  } catch (error) {
    console.error("Claims error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch claims" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderNumber,
      awbNumber,
      orderId,
      claimType,
      reason,
      description,
      declaredValue,
      claimAmount,
      photos,
      documents,
    } = body;

    // Validate required fields
    if (!orderNumber || !awbNumber || !claimType || !reason || !declaredValue || !claimAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate claim type
    const validTypes = ["LOST", "DAMAGED", "SHORT_DELIVERY", "WRONG_DELIVERY"];
    if (!validTypes.includes(claimType)) {
      return NextResponse.json(
        { success: false, error: "Invalid claim type" },
        { status: 400 }
      );
    }

    const claim = await fileClaim({
      brandId: user.brandId,
      orderId,
      orderNumber,
      awbNumber,
      claimType,
      reason,
      description,
      declaredValue,
      claimAmount,
      photos,
      documents,
      filedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: claim.id,
        claimNumber: claim.claimNumber,
        status: claim.status,
        message: "Claim filed successfully",
      },
    });
  } catch (error: any) {
    console.error("File claim error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to file claim" },
      { status: 500 }
    );
  }
}
