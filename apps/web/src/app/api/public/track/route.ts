import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Public shipment tracking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get("awb");
    const phone = searchParams.get("phone"); // Optional verification

    if (!awb) {
      return NextResponse.json(
        { success: false, error: "AWB number required" },
        { status: 400 }
      );
    }

    // Find shipment
    const shipment = await prisma.shipment.findUnique({
      where: { awbNumber: awb },
      select: {
        id: true,
        awbNumber: true,
        status: true,
        // Shipper (masked)
        shipperCity: true,
        shipperPincode: true,
        // Consignee (partial)
        consigneeName: true,
        consigneeCity: true,
        consigneePincode: true,
        consigneePhone: true,
        // Shipment details
        pieces: true,
        actualWeightKg: true,
        paymentMode: true,
        codAmount: true,
        // Dates
        createdAt: true,
        expectedDeliveryDate: true,
        actualDeliveryDate: true,
        deliveryAttempts: true,
        // Current location
        currentHubId: true,
        // POD
        podCaptured: true,
        podReceiverName: true,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Optional phone verification
    if (phone) {
      const maskedPhone = shipment.consigneePhone?.slice(-4);
      const providedLast4 = phone.slice(-4);
      if (maskedPhone !== providedLast4) {
        return NextResponse.json(
          { success: false, error: "Phone verification failed" },
          { status: 403 }
        );
      }
    }

    // Get tracking events
    const scans = await prisma.shipmentScan.findMany({
      where: { shipmentId: shipment.id },
      select: {
        id: true,
        scanType: true,
        location: true,
        scanTime: true,
        remarks: true,
      },
      orderBy: { scanTime: "desc" },
      take: 20,
    });

    // Get hub name for current location
    let currentLocation = null;
    if (shipment.currentHubId) {
      const hub = await prisma.hub.findUnique({
        where: { id: shipment.currentHubId },
        select: { name: true, city: true },
      });
      currentLocation = hub ? `${hub.name}, ${hub.city}` : null;
    }

    // Get client name
    const client = await prisma.client.findFirst({
      where: { id: { not: undefined } },
      select: { companyName: true },
    });

    // Format response with privacy in mind
    const trackingInfo = {
      awbNumber: shipment.awbNumber,
      status: shipment.status,
      statusLabel: getStatusLabel(shipment.status),

      // Origin/Destination
      origin: `${shipment.shipperCity || ""} - ${shipment.shipperPincode || ""}`,
      destination: `${shipment.consigneeCity || ""} - ${shipment.consigneePincode || ""}`,
      consigneeName: maskName(shipment.consigneeName),

      // Shipment details
      pieces: shipment.pieces,
      weight: shipment.actualWeightKg,
      paymentMode: shipment.paymentMode,
      codAmount: shipment.paymentMode === "COD" ? shipment.codAmount : null,

      // Dates
      bookedOn: shipment.createdAt,
      expectedDelivery: shipment.expectedDeliveryDate,
      deliveredOn: shipment.actualDeliveryDate,

      // Current status
      currentLocation,
      deliveryAttempts: shipment.deliveryAttempts,

      // POD
      isDelivered: shipment.status === "DELIVERED",
      receivedBy: shipment.podCaptured ? shipment.podReceiverName : null,

      // Tracking history
      events: scans.map((scan) => ({
        event: getScanEventLabel(scan.scanType),
        location: scan.location || "-",
        timestamp: scan.scanTime,
        remarks: scan.remarks,
      })),

      // Actions available
      canReschedule: canReschedule(shipment.status),
      canRaiseComplaint: true,
    };

    return NextResponse.json({
      success: true,
      data: trackingInfo,
    });
  } catch (error) {
    console.error("Public Track Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking info" },
      { status: 500 }
    );
  }
}

function maskName(name: string | null): string {
  if (!name) return "***";
  if (name.length <= 3) return name[0] + "***";
  return name[0] + "***" + name.slice(-1);
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    BOOKED: "Order Placed",
    PICKUP_SCHEDULED: "Pickup Scheduled",
    PICKED_UP: "Picked Up",
    RECEIVED_AT_ORIGIN_HUB: "At Origin Facility",
    IN_TRANSIT: "In Transit",
    ARRIVED_AT_HUB: "At Transit Hub",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    DELIVERY_FAILED: "Delivery Attempted",
    NDR: "Delivery Pending - Action Required",
    RTO_INITIATED: "Returning to Sender",
    RTO_IN_TRANSIT: "Return in Progress",
  };
  return labels[status] || status;
}

function getScanEventLabel(scanType: string): string {
  const labels: Record<string, string> = {
    PICKUP_SCAN: "Picked up from sender",
    INSCAN: "Received at facility",
    OUTSCAN: "Dispatched from facility",
    LOAD_SCAN: "Loaded for transit",
    UNLOAD_SCAN: "Unloaded at facility",
    OUT_FOR_DELIVERY_SCAN: "Out for delivery",
    DELIVERY_SCAN: "Delivery attempted",
    POD_SCAN: "Delivered",
    RTO_SCAN: "Returning to origin",
  };
  return labels[scanType] || scanType;
}

function canReschedule(status: string): boolean {
  return ["DELIVERY_FAILED", "NDR", "OUT_FOR_DELIVERY"].includes(status);
}
