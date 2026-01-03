import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List POD captures
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status"); // PENDING, VERIFIED, DISPUTED, REJECTED
    const clientId = searchParams.get("clientId");
    const search = searchParams.get("search"); // AWB search
    const isDisputed = searchParams.get("isDisputed");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const skip = (page - 1) * pageSize;

    // Build filter
    const where: any = {};
    if (status) where.verificationStatus = status;
    if (clientId) where.clientId = clientId;
    if (isDisputed === "true") where.isDisputed = true;
    if (search) where.awbNumber = { contains: search };
    if (fromDate || toDate) {
      where.capturedAt = {};
      if (fromDate) where.capturedAt.gte = new Date(fromDate);
      if (toDate) where.capturedAt.lte = new Date(toDate);
    }

    const [pods, total] = await Promise.all([
      prisma.pODCapture.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { capturedAt: "desc" },
      }),
      prisma.pODCapture.count({ where }),
    ]);

    // Get client names
    const clientIds = [...new Set(pods.map((p) => p.clientId))];
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, companyName: true },
    });
    const clientMap = new Map(clients.map((c) => [c.id, c.companyName]));

    const enrichedPods = pods.map((pod) => ({
      ...pod,
      clientName: clientMap.get(pod.clientId) || "Unknown",
    }));

    return NextResponse.json({
      success: true,
      data: {
        pods: enrichedPods,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("POD List Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch PODs" },
      { status: 500 }
    );
  }
}

// POST - Create POD capture (from mobile/agent)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      shipmentId,
      awbNumber,
      receiverName,
      receiverRelation,
      receiverIdType,
      receiverIdNumber,
      captureMethod,
      otpVerified,
      otpPhone,
      signatureData,
      signatureUrl,
      deliveryPhotoUrl,
      receiverPhotoUrl,
      idProofPhotoUrl,
      deliveryLatitude,
      deliveryLongitude,
      deliveryAddress,
      geoAccuracyMeters,
      deliveredById,
      deliveredByName,
      deliveredByType,
      deliveryNotes,
    } = body;

    // Validate required fields
    if (!shipmentId || !awbNumber || !receiverName || !captureMethod || !deliveredById) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get shipment to find clientId
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { id: true, clientId: true, status: true },
    });

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Check if POD already exists
    const existingPod = await prisma.pODCapture.findUnique({
      where: { shipmentId },
    });

    if (existingPod) {
      return NextResponse.json(
        { success: false, error: "POD already captured for this shipment" },
        { status: 400 }
      );
    }

    // Calculate quality score
    let qualityScore = 0;
    const qualityFlags: string[] = [];

    // Score components
    if (signatureData || signatureUrl) {
      qualityScore += 25;
    } else {
      qualityFlags.push("NO_SIGNATURE");
    }

    if (deliveryPhotoUrl) {
      qualityScore += 25;
    } else {
      qualityFlags.push("NO_PHOTO");
    }

    if (otpVerified) {
      qualityScore += 30;
    } else {
      qualityFlags.push("NO_OTP_VERIFICATION");
    }

    if (deliveryLatitude && deliveryLongitude) {
      qualityScore += 10;
      if (geoAccuracyMeters && geoAccuracyMeters <= 50) {
        qualityScore += 5;
      }
    } else {
      qualityFlags.push("NO_GPS");
    }

    if (receiverIdType && receiverIdNumber) {
      qualityScore += 5;
    }

    const capturedAt = new Date();

    // Create POD record
    const pod = await prisma.pODCapture.create({
      data: {
        shipmentId,
        awbNumber,
        clientId: shipment.clientId,
        receiverName,
        receiverRelation,
        receiverIdType,
        receiverIdNumber,
        captureMethod,
        otpSent: !!otpPhone,
        otpVerified: !!otpVerified,
        otpPhone,
        signatureData,
        signatureUrl,
        deliveryPhotoUrl,
        receiverPhotoUrl,
        idProofPhotoUrl,
        deliveryLatitude,
        deliveryLongitude,
        deliveryAddress,
        geoAccuracyMeters,
        deliveredById,
        deliveredByName,
        deliveredByType: deliveredByType || "DELIVERY_AGENT",
        capturedAt,
        syncedAt: new Date(),
        qualityScore,
        qualityFlags: JSON.stringify(qualityFlags),
        verificationStatus: qualityScore >= 60 ? "VERIFIED" : "PENDING",
        deliveryNotes,
      },
    });

    // Update shipment with POD info
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        podCaptured: true,
        podReceiverName: receiverName,
        podRelation: receiverRelation,
        podSignature: signatureUrl || signatureData?.substring(0, 100),
        podPhoto: deliveryPhotoUrl,
        podLatitude: deliveryLatitude,
        podLongitude: deliveryLongitude,
        status: "DELIVERED",
        deliveredAt: capturedAt,
        actualDeliveryDate: capturedAt,
      },
    });

    // Create audit trail
    await prisma.pODAudit.create({
      data: {
        podCaptureId: pod.id,
        action: "CREATED",
        newStatus: pod.verificationStatus,
        performedById: deliveredById,
        performedByName: deliveredByName,
        details: JSON.stringify({
          captureMethod,
          qualityScore,
          qualityFlags,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { pod },
    });
  } catch (error) {
    console.error("POD Create Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create POD" },
      { status: 500 }
    );
  }
}
