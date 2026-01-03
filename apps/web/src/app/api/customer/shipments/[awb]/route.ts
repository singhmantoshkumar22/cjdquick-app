import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

async function verifyCustomerAuth(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const session = await prisma.customerSession.findUnique({
    where: { token },
    include: { client: true },
  });

  if (!session || !session.isActive || new Date() > session.expiresAt) {
    return null;
  }

  return session.client;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ awb: string }> }
) {
  try {
    const { awb } = await params;
    const client = await verifyCustomerAuth(request);

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find shipment by AWB number
    const shipment = await prisma.shipment.findFirst({
      where: {
        awbNumber: awb,
        clientId: client.id,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Get scans for the shipment
    const scans = await prisma.shipmentScan.findMany({
      where: { shipmentId: shipment.id },
      orderBy: { scanTime: "desc" },
    });

    // Get hub info for scans
    const hubIds = [...new Set(scans.map((s) => s.hubId).filter(Boolean))] as string[];
    const hubs = hubIds.length > 0
      ? await prisma.hub.findMany({
          where: { id: { in: hubIds } },
          select: { id: true, name: true, city: true },
        })
      : [];
    const hubMap = new Map(hubs.map((h) => [h.id, h]));

    // Calculate SLA status
    const now = new Date();
    const expectedDate = shipment.expectedDeliveryDate
      ? new Date(shipment.expectedDeliveryDate)
      : null;

    let slaStatus: "on_track" | "at_risk" | "delayed" | "delivered" = "on_track";
    let daysRemaining: number | null = null;

    if (shipment.status === "DELIVERED") {
      slaStatus = "delivered";
      // Check if it was delivered on time
      if (expectedDate) {
        const deliveryScan = scans.find(
          (s) => s.scanType === "DELIVERED" || s.scanType === "POD_CAPTURED"
        );
        if (deliveryScan && new Date(deliveryScan.scanTime) > expectedDate) {
          slaStatus = "delayed";
        }
      }
    } else if (expectedDate) {
      daysRemaining = Math.ceil(
        (expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysRemaining < 0) {
        slaStatus = "delayed";
      } else if (daysRemaining <= 1) {
        slaStatus = "at_risk";
      }
    }

    // Format timeline
    const timeline = scans.map((scan) => {
      const hub = scan.hubId ? hubMap.get(scan.hubId) : null;
      return {
        type: scan.scanType,
        time: scan.scanTime,
        location: hub ? `${hub.name}, ${hub.city}` : scan.location || "In Transit",
        remarks: scan.remarks,
      };
    });

    // Get current location
    const latestScan = scans[0];
    const latestHub = latestScan?.hubId ? hubMap.get(latestScan.hubId) : null;
    const currentLocation = latestHub
      ? `${latestHub.name}, ${latestHub.city}`
      : "Processing";

    return NextResponse.json({
      success: true,
      data: {
        awbNumber: shipment.awbNumber,
        status: shipment.status,
        origin: {
          city: shipment.shipperCity,
          state: shipment.shipperState,
          pincode: shipment.shipperPincode,
          address: shipment.shipperAddress,
          name: shipment.shipperName,
          phone: shipment.shipperPhone,
        },
        destination: {
          city: shipment.consigneeCity,
          state: shipment.consigneeState,
          pincode: shipment.consigneePincode,
          address: shipment.consigneeAddress,
          name: shipment.consigneeName,
          phone: shipment.consigneePhone,
        },
        package: {
          weight: shipment.actualWeightKg,
          description: shipment.contentDescription,
          pieces: shipment.pieces,
          isCod: shipment.paymentMode === "COD",
          codAmount: shipment.codAmount,
        },
        dates: {
          booked: shipment.createdAt,
          expectedDelivery: shipment.expectedDeliveryDate,
          actualDelivery: shipment.actualDeliveryDate,
        },
        sla: {
          status: slaStatus,
          daysRemaining,
          expectedDate: shipment.expectedDeliveryDate,
        },
        currentLocation,
        timeline,
      },
    });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking data" },
      { status: 500 }
    );
  }
}
