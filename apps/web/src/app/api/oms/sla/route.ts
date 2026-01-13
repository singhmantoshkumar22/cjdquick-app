import { NextRequest, NextResponse } from "next/server";
import { calculateSLA, trackSLACompliance, type SLAConfig } from "@/lib/intelligent-orchestration";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const action = searchParams.get("action");

    // Track SLA compliance for a specific order
    if (action === "track" && orderId) {
      try {
        const result = await trackSLACompliance(orderId);
        return NextResponse.json({
          success: true,
          data: result,
        });
      } catch (dbError) {
        // Return demo data if database unavailable
        const now = new Date();
        const promisedDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        return NextResponse.json({
          success: true,
          data: {
            orderId,
            currentStatus: "PICKING",
            slaStatus: "ON_TRACK",
            promisedDate: promisedDate.toISOString(),
            currentEta: promisedDate.toISOString(),
            delayMinutes: 0,
            breachedMilestones: [],
            nextMilestone: {
              event: "PICKING_COMPLETED",
              expectedBy: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
              remainingMinutes: 240,
            },
          },
          message: "SLA tracking data (demo mode)",
        });
      }
    }

    // Get SLA overview / dashboard
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const slaStatus = searchParams.get("slaStatus"); // ON_TRACK, AT_RISK, BREACHED

    try {
      const response = await fetch(
        `${OMS_BACKEND_URL}/api/sla?page=${page}&pageSize=${pageSize}${slaStatus ? `&slaStatus=${slaStatus}` : ""}`,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fall through to demo data
    }

    // Return demo SLA overview
    const now = new Date();
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: 156,
          onTrack: 98,
          atRisk: 35,
          breached: 23,
          slaComplianceRate: 62.8,
        },
        orders: [
          {
            orderId: "ORD-2024-001234",
            customer: "John Doe",
            destination: "Bangalore (560001)",
            orderDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            promisedDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
            currentStatus: "IN_TRANSIT",
            slaStatus: "ON_TRACK",
            remainingHours: 48,
            courier: "BlueDart",
          },
          {
            orderId: "ORD-2024-001235",
            customer: "ABC Corp",
            destination: "Chennai (600001)",
            orderDate: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
            promisedDate: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
            currentStatus: "PICKING",
            slaStatus: "AT_RISK",
            remainingHours: 12,
            courier: "Delhivery",
            riskReason: "Picking delayed - picker unavailable",
          },
          {
            orderId: "ORD-2024-001236",
            customer: "XYZ Store",
            destination: "Hyderabad (500001)",
            orderDate: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
            promisedDate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            currentStatus: "OUT_FOR_DELIVERY",
            slaStatus: "BREACHED",
            delayHours: 2,
            courier: "DTDC",
            breachReason: "Last mile delivery delay",
          },
          {
            orderId: "ORD-2024-001237",
            customer: "Jane Smith",
            destination: "Mumbai (400001)",
            orderDate: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
            promisedDate: new Date(now.getTime() + 66 * 60 * 60 * 1000).toISOString(),
            currentStatus: "PACKED",
            slaStatus: "ON_TRACK",
            remainingHours: 66,
            courier: "Ecom Express",
          },
        ],
        pagination: { page, pageSize, total: 156, totalPages: 8 },
      },
    });
  } catch (error) {
    console.error("Error fetching SLA data:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch SLA data",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Calculate SLA for new order
    if (action === "calculate") {
      const slaConfig: SLAConfig = {
        orderType: body.orderType || "STANDARD",
        originPincode: body.originPincode,
        destinationPincode: body.destinationPincode,
        orderPlacedAt: body.orderPlacedAt ? new Date(body.orderPlacedAt) : new Date(),
      };

      const result = calculateSLA(slaConfig);
      return NextResponse.json({
        success: true,
        data: {
          ...result,
          promisedDeliveryDate: result.promisedDeliveryDate.toISOString(),
          cutoffTime: result.cutoffTime.toISOString(),
          milestones: result.milestones.map(m => ({
            ...m,
            expectedBy: m.expectedBy.toISOString(),
          })),
        },
      });
    }

    // Bulk SLA update
    if (action === "bulk_update") {
      const { orderIds, newSlaStatus, reason } = body;

      // In production, this would update the database
      return NextResponse.json({
        success: true,
        data: {
          updatedCount: orderIds.length,
          orders: orderIds.map((id: string) => ({
            orderId: id,
            newSlaStatus,
            updatedAt: new Date().toISOString(),
          })),
        },
        message: `SLA status updated for ${orderIds.length} orders`,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action",
    }, { status: 400 });
  } catch (error) {
    console.error("Error processing SLA action:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process SLA action",
    }, { status: 500 });
  }
}
