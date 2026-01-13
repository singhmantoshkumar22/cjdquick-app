import { NextRequest, NextResponse } from "next/server";
import {
  checkPincodeServiceability,
  checkRouteServiceability,
  validateOrderServiceability,
} from "@/lib/intelligent-orchestration";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

/**
 * Serviceability API
 *
 * Provides comprehensive pincode and route serviceability checks:
 * - Single pincode serviceability
 * - Route (origin → destination) serviceability
 * - Order validation with weight/COD limits
 * - Last-mile serviceability status
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode");
    const originPincode = searchParams.get("origin");
    const destinationPincode = searchParams.get("destination");
    const paymentMode = (searchParams.get("paymentMode") || "PREPAID") as "PREPAID" | "COD";

    // Single pincode check
    if (pincode && !originPincode && !destinationPincode) {
      const result = await checkPincodeServiceability(pincode);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Route serviceability check
    if (originPincode && destinationPincode) {
      const result = await checkRouteServiceability(originPincode, destinationPincode, paymentMode);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Return API documentation
    return NextResponse.json({
      success: true,
      data: {
        endpoints: {
          singlePincode: {
            method: "GET",
            params: { pincode: "6-digit pincode" },
            example: "/api/oms/serviceability?pincode=560001",
          },
          routeCheck: {
            method: "GET",
            params: {
              origin: "Origin pincode",
              destination: "Destination pincode",
              paymentMode: "PREPAID or COD (optional)",
            },
            example: "/api/oms/serviceability?origin=110001&destination=560001&paymentMode=COD",
          },
          orderValidation: {
            method: "POST",
            body: {
              originPincode: "string",
              destinationPincode: "string",
              paymentMode: "PREPAID | COD",
              weight: "number (kg)",
              declaredValue: "number (optional)",
            },
          },
          bulkCheck: {
            method: "POST",
            body: {
              action: "bulk_check",
              pincodes: ["array of pincodes"],
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Serviceability check error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to check serviceability",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Order validation with serviceability
    if (action === "validate_order" || !action) {
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
          error: "Origin and destination pincodes are required",
        }, { status: 400 });
      }

      const result = await validateOrderServiceability(
        originPincode,
        destinationPincode,
        paymentMode,
        weight,
        declaredValue
      );

      return NextResponse.json({
        success: result.isValid,
        data: result,
      });
    }

    // Bulk pincode check
    if (action === "bulk_check") {
      const { pincodes } = body;

      if (!pincodes || !Array.isArray(pincodes)) {
        return NextResponse.json({
          success: false,
          error: "pincodes array is required",
        }, { status: 400 });
      }

      // Limit bulk check to 100 pincodes
      const limitedPincodes = pincodes.slice(0, 100);

      const results = await Promise.all(
        limitedPincodes.map(pincode => checkPincodeServiceability(pincode))
      );

      const summary = {
        total: results.length,
        serviceable: results.filter(r => r.isServiceable).length,
        notServiceable: results.filter(r => !r.isServiceable).length,
        codAvailable: results.filter(r => r.codAvailable).length,
        lastMileAvailable: results.filter(r => r.lastMileAvailable).length,
      };

      return NextResponse.json({
        success: true,
        data: {
          results,
          summary,
        },
      });
    }

    // Real-time courier API check
    if (action === "realtime_check") {
      const { pincode, courierCode } = body;

      if (!pincode) {
        return NextResponse.json({
          success: false,
          error: "pincode is required",
        }, { status: 400 });
      }

      // In production, this would call the actual courier API
      // For now, proxy to backend or return estimated data
      try {
        const response = await fetch(
          `${OMS_BACKEND_URL}/api/serviceability/realtime?pincode=${pincode}${courierCode ? `&courier=${courierCode}` : ""}`,
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fall through to local check
      }

      // Fallback to local serviceability check
      const localResult = await checkPincodeServiceability(pincode);
      return NextResponse.json({
        success: true,
        data: {
          ...localResult,
          source: "LOCAL_DATABASE",
          note: "Real-time courier API unavailable, using local database",
        },
      });
    }

    // Partner-specific serviceability
    if (action === "partner_serviceability") {
      const { originPincode, destinationPincode, partnerId } = body;

      if (!originPincode || !destinationPincode) {
        return NextResponse.json({
          success: false,
          error: "Origin and destination pincodes are required",
        }, { status: 400 });
      }

      const routeResult = await checkRouteServiceability(originPincode, destinationPincode);

      if (partnerId) {
        const partnerService = routeResult.serviceablePartners.find(
          p => p.partnerId === partnerId || p.partnerCode === partnerId
        );

        return NextResponse.json({
          success: !!partnerService,
          data: {
            partnerId,
            originPincode,
            destinationPincode,
            isServiceable: !!partnerService,
            ...(partnerService || {}),
            allPartners: routeResult.serviceablePartners,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: routeResult,
      });
    }

    // Zone classification
    if (action === "get_zone") {
      const { pincode } = body;

      if (!pincode) {
        return NextResponse.json({
          success: false,
          error: "pincode is required",
        }, { status: 400 });
      }

      const result = await checkPincodeServiceability(pincode);

      return NextResponse.json({
        success: true,
        data: {
          pincode,
          zone: result.zone,
          hub: result.hub,
          tier: result.zone === "METRO" ? 1 : result.zone === "TIER1" ? 2 : result.zone === "TIER2" ? 3 : 4,
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
      error: "Failed to process serviceability request",
    }, { status: 500 });
  }
}
