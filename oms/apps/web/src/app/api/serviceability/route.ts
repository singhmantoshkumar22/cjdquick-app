import { NextRequest, NextResponse } from "next/server";
import {
  checkPincodeServiceability,
  checkRouteServiceability,
} from "@/lib/intelligent-orchestration";

/**
 * Serviceability API - OMS Backend
 *
 * Provides pincode and route serviceability checks for:
 * - Single pincode validation
 * - Route serviceability (origin → destination)
 * - Bulk pincode checks
 */

// GET /api/serviceability - Check serviceability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode");
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const paymentMode = (searchParams.get("paymentMode") || "PREPAID") as "PREPAID" | "COD";

    // Single pincode check
    if (pincode && !origin && !destination) {
      const result = await checkPincodeServiceability(pincode);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Route serviceability check
    if (origin && destination) {
      const result = await checkRouteServiceability(origin, destination, paymentMode);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Provide 'pincode' for single check or 'origin' and 'destination' for route check",
    }, { status: 400 });
  } catch (error) {
    console.error("Serviceability check error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to check serviceability",
    }, { status: 500 });
  }
}

// POST /api/serviceability - Bulk and advanced checks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Bulk pincode check
    if (action === "bulk_check") {
      const { pincodes } = body;

      if (!pincodes || !Array.isArray(pincodes)) {
        return NextResponse.json({
          success: false,
          error: "pincodes array is required",
        }, { status: 400 });
      }

      const limitedPincodes = pincodes.slice(0, 100);
      const results = await Promise.all(
        limitedPincodes.map(p => checkPincodeServiceability(p))
      );

      const summary = {
        total: results.length,
        serviceable: results.filter(r => r.isServiceable).length,
        notServiceable: results.filter(r => !r.isServiceable).length,
        codAvailable: results.filter(r => r.codAvailable).length,
      };

      return NextResponse.json({
        success: true,
        data: { results, summary },
      });
    }

    // Order validation
    if (action === "validate_order") {
      const {
        originPincode,
        destinationPincode,
        paymentMode = "PREPAID",
        weight = 0.5,
        declaredValue,
      } = body;

      if (!originPincode || !destinationPincode) {
        return NextResponse.json({
          success: false,
          error: "Origin and destination pincodes required",
        }, { status: 400 });
      }

      const route = await checkRouteServiceability(originPincode, destinationPincode, paymentMode);

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!route.isServiceable) {
        errors.push("Route not serviceable");
      }

      if (weight > 30) {
        errors.push(`Weight ${weight}kg exceeds maximum 30kg`);
      }

      if (paymentMode === "COD" && declaredValue > 50000) {
        errors.push(`COD amount ₹${declaredValue} exceeds ₹50,000 limit`);
      }

      if (route.transporters.length === 1) {
        warnings.push("Only one transporter available");
      }

      return NextResponse.json({
        success: errors.length === 0,
        data: {
          isValid: errors.length === 0,
          route,
          errors,
          warnings,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action",
    }, { status: 400 });
  } catch (error) {
    console.error("Serviceability POST error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process request",
    }, { status: 500 });
  }
}
