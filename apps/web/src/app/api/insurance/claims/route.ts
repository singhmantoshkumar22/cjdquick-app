import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List insurance claims
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get("policyId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const claimType = searchParams.get("claimType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (policyId) where.policyId = policyId;
    if (status) where.status = status;
    if (claimType) where.claimType = claimType;
    if (clientId) {
      where.policy = { clientId };
    }

    const [claims, total] = await Promise.all([
      prisma.insuranceClaim.findMany({
        where,
        include: {
          policy: {
            select: {
              id: true,
              policyNumber: true,
              insurerName: true,
              policyType: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.insuranceClaim.count({ where }),
    ]);

    // Get summary stats
    const stats = {
      filed: claims.filter((c) => c.status === "FILED").length,
      underReview: claims.filter((c) => c.status === "UNDER_REVIEW").length,
      approved: claims.filter((c) => c.status === "APPROVED").length,
      rejected: claims.filter((c) => c.status === "REJECTED").length,
      settled: claims.filter((c) => c.status === "SETTLED").length,
      totalClaimAmount: claims.reduce((sum, c) => sum + c.claimAmount, 0),
      totalSettledAmount: claims.reduce(
        (sum, c) => sum + (c.settledAmount || 0),
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        items: claims,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Get Claims Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

// POST - File new insurance claim
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      policyId,
      shipmentId,
      claimType,
      claimReason,
      description,
      claimAmount,
      declaredValue,
      incidentDate,
      incidentLocation,
      photos,
      documents,
      policeReportNumber,
      policeReportUrl,
      claimantName,
      claimantPhone,
      claimantEmail,
      filedBy,
    } = body;

    if (
      !policyId ||
      !shipmentId ||
      !claimType ||
      !claimReason ||
      !claimAmount ||
      !claimantName ||
      !claimantPhone
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Policy ID, shipment ID, claim type, reason, amount, and claimant details are required",
        },
        { status: 400 }
      );
    }

    // Check policy exists and is active
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      return NextResponse.json(
        { success: false, error: "Insurance policy not found" },
        { status: 404 }
      );
    }

    if (!policy.isActive) {
      return NextResponse.json(
        { success: false, error: "Insurance policy is not active" },
        { status: 400 }
      );
    }

    // Check claim amount against coverage
    if (claimAmount > policy.maxCoveragePerShipment) {
      return NextResponse.json(
        {
          success: false,
          error: `Claim amount exceeds maximum coverage of ${policy.maxCoveragePerShipment}`,
        },
        { status: 400 }
      );
    }

    // Generate claim number
    const claimNumber = `CLM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const claim = await prisma.insuranceClaim.create({
      data: {
        policyId,
        shipmentId,
        claimNumber,
        claimType,
        claimReason,
        description: description || claimReason,
        claimAmount,
        declaredValue: declaredValue || claimAmount,
        incidentDate: new Date(incidentDate || Date.now()),
        incidentLocation,
        photos: photos ? JSON.stringify(photos) : null,
        documents: documents ? JSON.stringify(documents) : null,
        policeReportNumber,
        policeReportUrl,
        claimantName,
        claimantPhone,
        claimantEmail,
        filedBy: filedBy || claimantName,
        status: "FILED",
      },
      include: {
        policy: true,
      },
    });

    // Update shipment insurance status if exists
    await prisma.shipmentInsurance.updateMany({
      where: { shipmentId },
      data: { status: "CLAIM_FILED" },
    });

    return NextResponse.json({
      success: true,
      data: claim,
      message: `Claim ${claimNumber} filed successfully`,
    });
  } catch (error) {
    console.error("File Claim Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to file claim" },
      { status: 500 }
    );
  }
}

// PATCH - Update claim status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Claim ID is required" },
        { status: 400 }
      );
    }

    const claim = await prisma.insuranceClaim.findUnique({
      where: { id },
      include: { policy: true },
    });

    if (!claim) {
      return NextResponse.json(
        { success: false, error: "Claim not found" },
        { status: 404 }
      );
    }

    if (action === "REVIEW") {
      const updated = await prisma.insuranceClaim.update({
        where: { id },
        data: {
          status: "UNDER_REVIEW",
          reviewedBy: updateData.reviewedBy,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Claim is now under review",
      });
    }

    if (action === "REQUEST_INFO") {
      const updated = await prisma.insuranceClaim.update({
        where: { id },
        data: {
          status: "ADDITIONAL_INFO_REQUIRED",
          notes: updateData.notes,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Additional information requested",
      });
    }

    if (action === "APPROVE") {
      // Calculate approved amount with deductible
      const deductibleAmount = claim.policy.deductibleAmount || 0;
      const deductiblePercent = claim.policy.deductiblePercent || 0;
      const percentDeductible = claim.claimAmount * (deductiblePercent / 100);
      const totalDeductible = Math.max(deductibleAmount, percentDeductible);
      const approvedAmount = Math.max(0, claim.claimAmount - totalDeductible);

      const updated = await prisma.insuranceClaim.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy: updateData.approvedBy,
          approvedAt: new Date(),
          approvedAmount,
          deductibleApplied: totalDeductible,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Claim approved for ${approvedAmount.toFixed(2)}`,
      });
    }

    if (action === "REJECT") {
      const updated = await prisma.insuranceClaim.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: updateData.rejectionReason,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Claim rejected",
      });
    }

    if (action === "SETTLE") {
      const updated = await prisma.insuranceClaim.update({
        where: { id },
        data: {
          status: "SETTLED",
          settledAmount: updateData.settledAmount || claim.approvedAmount,
          settledAt: new Date(),
          paymentRef: updateData.paymentRef,
          paymentMode: updateData.paymentMode,
          paymentDate: new Date(),
        },
      });

      // Update shipment insurance
      await prisma.shipmentInsurance.updateMany({
        where: { shipmentId: claim.shipmentId },
        data: { status: "CLAIM_SETTLED" },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Claim settled",
      });
    }

    // General update
    const updated = await prisma.insuranceClaim.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Claim updated",
    });
  } catch (error) {
    console.error("Update Claim Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update claim" },
      { status: 500 }
    );
  }
}
