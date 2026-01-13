import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import {
  createManifest,
  closeManifest,
  handoverManifest,
  listManifests,
  getManifestDetails,
} from "@/lib/unified-tms-service";

// GET: List manifests or get single manifest
export async function GET(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const manifestId = searchParams.get("id");

    // Get single manifest details
    if (manifestId) {
      const manifest = await getManifestDetails(manifestId);
      if (!manifest) {
        return NextResponse.json(
          { success: false, error: "Manifest not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: manifest });
    }

    // List manifests
    const locationId = searchParams.get("locationId") || undefined;
    const transporterId = searchParams.get("transporterId") || undefined;
    const status = searchParams.get("status") || undefined;
    const fromDate = searchParams.get("fromDate")
      ? new Date(searchParams.get("fromDate")!)
      : undefined;
    const toDate = searchParams.get("toDate")
      ? new Date(searchParams.get("toDate")!)
      : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const manifests = await listManifests({
      locationId,
      transporterId,
      status,
      fromDate,
      toDate,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: manifests,
    });
  } catch (error) {
    console.error("List manifests error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch manifests" },
      { status: 500 }
    );
  }
}

// POST: Create manifest
export async function POST(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      locationId,
      transporterId,
      orderIds,
      manifestType = "FORWARD",
      scheduledPickupAt,
      remarks,
    } = body;

    if (!locationId || !transporterId || !orderIds) {
      return NextResponse.json(
        { success: false, error: "locationId, transporterId, and orderIds are required" },
        { status: 400 }
      );
    }

    const manifest = await createManifest({
      locationId,
      transporterId,
      orderIds,
      manifestType,
      scheduledPickupAt: scheduledPickupAt ? new Date(scheduledPickupAt) : undefined,
      remarks,
    });

    return NextResponse.json({
      success: true,
      data: manifest,
      message: `Manifest ${manifest.manifestNumber} created with ${manifest.orderCount} orders`,
    });
  } catch (error: any) {
    console.error("Create manifest error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create manifest" },
      { status: 400 }
    );
  }
}

// PATCH: Close or handover manifest
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { manifestId, action, vehicleNumber, driverName, handoveredTo, remarks } = body;

    if (!manifestId || !action) {
      return NextResponse.json(
        { success: false, error: "manifestId and action are required" },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case "close":
        result = await closeManifest(manifestId, vehicleNumber, driverName);
        return NextResponse.json({
          success: true,
          data: result,
          message: "Manifest closed",
        });

      case "handover":
        result = await handoverManifest(manifestId, handoveredTo, remarks);
        return NextResponse.json({
          success: true,
          data: result,
          message: "Manifest handed over to transporter",
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: close, handover" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Update manifest error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update manifest" },
      { status: 400 }
    );
  }
}
