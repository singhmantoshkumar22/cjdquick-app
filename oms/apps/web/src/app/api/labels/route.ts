import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { generateLabelData, generateZPLLabel } from "@/lib/intelligent-orchestration";

/**
 * Label Generation API - OMS Backend
 *
 * Generates shipping labels in multiple formats:
 * - JSON (for custom rendering)
 * - ZPL (for Zebra thermal printers)
 * - PDF (via transporter integration)
 */

// GET /api/labels - Generate label for order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const format = searchParams.get("format") || "json"; // json, zpl

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: "orderId is required",
      }, { status: 400 });
    }

    const labelData = await generateLabelData(orderId);

    if (format === "zpl") {
      const zpl = generateZPLLabel(labelData);
      return new NextResponse(zpl, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="label-${labelData.awbNo}.zpl"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: labelData,
    });
  } catch (error: any) {
    console.error("Label generation error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to generate label",
    }, { status: 500 });
  }
}

// POST /api/labels - Bulk label generation and printing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Bulk label generation
    if (action === "bulk_generate") {
      const { orderIds, format = "json" } = body;

      if (!orderIds || !Array.isArray(orderIds)) {
        return NextResponse.json({
          success: false,
          error: "orderIds array is required",
        }, { status: 400 });
      }

      const results = [];

      for (const orderId of orderIds) {
        try {
          const labelData = await generateLabelData(orderId);
          results.push({
            orderId,
            success: true,
            data: format === "zpl" ? generateZPLLabel(labelData) : labelData,
          });
        } catch (error: any) {
          results.push({
            orderId,
            success: false,
            error: error.message,
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          results,
          summary: {
            total: orderIds.length,
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
          },
        },
      });
    }

    // Print label (queue for printing)
    if (action === "print") {
      const { orderId, printerId, copies = 1 } = body;

      if (!orderId) {
        return NextResponse.json({
          success: false,
          error: "orderId is required",
        }, { status: 400 });
      }

      // In production, would send to print queue/service
      return NextResponse.json({
        success: true,
        data: {
          orderId,
          printerId: printerId || "DEFAULT",
          copies,
          jobId: `PRINT-${Date.now()}`,
          status: "QUEUED",
          queuedAt: new Date().toISOString(),
        },
        message: `Label queued for printing (${copies} copies)`,
      });
    }

    // Generate custom label
    if (action === "custom") {
      const { labelData } = body;

      if (!labelData) {
        return NextResponse.json({
          success: false,
          error: "labelData is required",
        }, { status: 400 });
      }

      const format = body.format || "json";

      if (format === "zpl") {
        const zpl = generateZPLLabel(labelData);
        return new NextResponse(zpl, {
          headers: {
            "Content-Type": "text/plain",
            "Content-Disposition": "attachment; filename=\"custom-label.zpl\"",
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: labelData,
      });
    }

    // Reprint label
    if (action === "reprint") {
      const { orderId, deliveryId } = body;

      if (!orderId) {
        return NextResponse.json({
          success: false,
          error: "orderId is required",
        }, { status: 400 });
      }

      // Get delivery with AWB
      const delivery = await prisma.delivery.findFirst({
        where: deliveryId
          ? { id: deliveryId }
          : { orderId, status: { not: "CANCELLED" } },
        include: {
          Transporter: true,
          Order: {
            include: { Location: true, OrderItem: true },
          },
        },
      });

      if (!delivery || !delivery.awbNo) {
        return NextResponse.json({
          success: false,
          error: "No delivery/AWB found for this order",
        }, { status: 404 });
      }

      const labelData = await generateLabelData(orderId);

      return NextResponse.json({
        success: true,
        data: {
          ...labelData,
          reprintedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action",
    }, { status: 400 });
  } catch (error: any) {
    console.error("Label POST error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process label request",
    }, { status: 500 });
  }
}
