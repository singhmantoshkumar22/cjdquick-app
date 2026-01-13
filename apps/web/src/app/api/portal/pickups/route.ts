import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const serviceType = searchParams.get("serviceType") || "B2B";

    // Demo pickup data
    const demoPickups = serviceType === "B2B" ? [
      { id: "pk-1", pickupNumber: "PK-B2B-001", locationName: "Warehouse Delhi", address: "Plot 45, Industrial Area", city: "Delhi", scheduledDate: new Date().toISOString(), scheduledSlot: "10:00 AM - 12:00 PM", packageCount: 25, status: "SCHEDULED", createdAt: new Date().toISOString() },
      { id: "pk-2", pickupNumber: "PK-B2B-002", locationName: "Distribution Center", address: "Sector 18, Gurgaon", city: "Gurgaon", scheduledDate: new Date(Date.now() + 86400000).toISOString(), scheduledSlot: "2:00 PM - 4:00 PM", packageCount: 18, status: "REQUESTED", createdAt: new Date().toISOString() },
      { id: "pk-3", pickupNumber: "PK-B2B-003", locationName: "Main Warehouse", address: "MIDC, Andheri", city: "Mumbai", scheduledDate: new Date(Date.now() - 86400000).toISOString(), scheduledSlot: "9:00 AM - 11:00 AM", packageCount: 32, status: "COMPLETED", createdAt: new Date().toISOString() },
    ] : [
      { id: "pk-4", pickupNumber: "PK-B2C-001", locationName: "Store Mumbai", address: "Linking Road, Bandra", city: "Mumbai", scheduledDate: new Date().toISOString(), scheduledSlot: "11:00 AM - 1:00 PM", packageCount: 48, status: "SCHEDULED", createdAt: new Date().toISOString() },
      { id: "pk-5", pickupNumber: "PK-B2C-002", locationName: "Fulfillment Hub", address: "Electronic City", city: "Bangalore", scheduledDate: new Date(Date.now() + 86400000).toISOString(), scheduledSlot: "3:00 PM - 5:00 PM", packageCount: 35, status: "REQUESTED", createdAt: new Date().toISOString() },
      { id: "pk-6", pickupNumber: "PK-B2C-003", locationName: "Warehouse Chennai", address: "Ambattur Industrial Estate", city: "Chennai", scheduledDate: new Date().toISOString(), scheduledSlot: "10:00 AM - 12:00 PM", packageCount: 22, status: "IN_PROGRESS", createdAt: new Date().toISOString() },
      { id: "pk-7", pickupNumber: "PK-B2C-004", locationName: "Store Hyderabad", address: "Hitech City", city: "Hyderabad", scheduledDate: new Date(Date.now() - 86400000).toISOString(), scheduledSlot: "4:00 PM - 6:00 PM", packageCount: 18, status: "COMPLETED", createdAt: new Date().toISOString() },
    ];

    return NextResponse.json({
      success: true,
      data: {
        pickups: demoPickups,
        total: demoPickups.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("Pickups error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch pickups" }, { status: 500 });
  }
}
