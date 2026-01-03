import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Quick serviceability check for pincode(s)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode");
    const pincodes = searchParams.get("pincodes"); // Comma-separated for bulk
    const originPincode = searchParams.get("origin"); // For TAT calculation

    // Single pincode check
    if (pincode) {
      if (!/^\d{6}$/.test(pincode)) {
        return NextResponse.json(
          { success: false, error: "Invalid pincode format" },
          { status: 400 }
        );
      }

      const result = await checkPincode(pincode, originPincode || undefined);
      return NextResponse.json({ success: true, data: result });
    }

    // Bulk pincode check
    if (pincodes) {
      const pincodeList = pincodes.split(",").map((p) => p.trim());

      // Validate all pincodes
      const invalid = pincodeList.filter((p) => !/^\d{6}$/.test(p));
      if (invalid.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid pincodes: ${invalid.join(", ")}` },
          { status: 400 }
        );
      }

      const results = await Promise.all(
        pincodeList.map((p) => checkPincode(p, originPincode || undefined))
      );

      const summary = {
        total: results.length,
        serviceable: results.filter((r) => r.isServiceable).length,
        notServiceable: results.filter((r) => !r.isServiceable).length,
        codAvailable: results.filter((r) => r.codAvailable).length,
      };

      return NextResponse.json({
        success: true,
        data: {
          results,
          summary,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Pincode or pincodes required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Serviceability Check Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check serviceability" },
      { status: 500 }
    );
  }
}

// POST - Check serviceability with weight/dimensions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      originPincode,
      destinationPincode,
      weight, // in kg
      length, // in cm
      breadth, // in cm
      height, // in cm
      paymentMode, // PREPAID or COD
      declaredValue,
    } = body;

    if (!originPincode || !destinationPincode) {
      return NextResponse.json(
        { success: false, error: "Origin and destination pincodes required" },
        { status: 400 }
      );
    }

    // Check both pincodes
    const [originCheck, destCheck] = await Promise.all([
      checkPincode(originPincode),
      checkPincode(destinationPincode, originPincode),
    ]);

    if (!originCheck.isServiceable) {
      return NextResponse.json({
        success: true,
        data: {
          isServiceable: false,
          reason: "Origin pincode not serviceable",
          originCheck,
          destCheck,
        },
      });
    }

    if (!destCheck.isServiceable) {
      return NextResponse.json({
        success: true,
        data: {
          isServiceable: false,
          reason: "Destination pincode not serviceable",
          originCheck,
          destCheck,
        },
      });
    }

    // Check COD availability
    if (paymentMode === "COD" && !destCheck.codAvailable) {
      return NextResponse.json({
        success: true,
        data: {
          isServiceable: true,
          codAvailable: false,
          reason: "COD not available for this pincode",
          originCheck,
          destCheck,
        },
      });
    }

    // Calculate volumetric weight if dimensions provided
    let chargeableWeight = weight || 0.5;
    if (length && breadth && height) {
      const volumetricWeight = (length * breadth * height) / 5000; // Industry standard
      chargeableWeight = Math.max(weight || 0.5, volumetricWeight);
    }

    // Check weight limits
    const maxWeight = 30; // kg
    if (chargeableWeight > maxWeight) {
      return NextResponse.json({
        success: true,
        data: {
          isServiceable: false,
          reason: `Weight exceeds maximum limit of ${maxWeight} kg`,
          chargeableWeight,
        },
      });
    }

    // Check value limits for COD
    const maxCodValue = 50000;
    if (paymentMode === "COD" && declaredValue > maxCodValue) {
      return NextResponse.json({
        success: true,
        data: {
          isServiceable: true,
          codAvailable: false,
          reason: `COD not available for value above ₹${maxCodValue}`,
          suggestedMode: "PREPAID",
        },
      });
    }

    // Calculate zone
    const zone = getZone(originPincode, destinationPincode);

    return NextResponse.json({
      success: true,
      data: {
        isServiceable: true,
        codAvailable: destCheck.codAvailable,
        originCheck,
        destCheck,
        zone,
        chargeableWeight: Math.round(chargeableWeight * 100) / 100,
        estimatedDeliveryDays: destCheck.deliveryDays,
      },
    });
  } catch (error) {
    console.error("Serviceability Check Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check serviceability" },
      { status: 500 }
    );
  }
}

// Helper: Check single pincode
async function checkPincode(pincode: string, originPincode?: string) {
  // Check in database
  const hubMapping = await prisma.hubPincodeMapping.findFirst({
    where: { pincode },
    include: {
      hub: {
        select: {
          id: true,
          code: true,
          name: true,
          city: true,
        },
      },
    },
  });

  if (!hubMapping) {
    return {
      pincode,
      isServiceable: false,
      codAvailable: false,
      prepaidAvailable: false,
      deliveryDays: null,
      zone: null,
      hub: null,
    };
  }

  // Calculate delivery days based on zone
  let zone: string | null = null;
  let deliveryDays = 3; // Default

  if (originPincode) {
    zone = getZone(originPincode, pincode);
    deliveryDays = getDeliveryDays(zone);
  }

  return {
    pincode,
    isServiceable: true,
    codAvailable: true, // Default to true for all serviceable pincodes
    prepaidAvailable: true, // Default to true for all serviceable pincodes
    deliveryDays,
    zone,
    hub: hubMapping.hub
      ? {
          code: hubMapping.hub.code,
          name: hubMapping.hub.name,
          city: hubMapping.hub.city,
        }
      : null,
  };
}

// Helper: Get zone based on pincodes
function getZone(originPincode: string, destPincode: string): string {
  const originZone = originPincode.charAt(0);
  const destZone = destPincode.charAt(0);

  // Same first digit = Regional
  if (originZone === destZone) {
    const originArea = originPincode.substring(0, 3);
    const destArea = destPincode.substring(0, 3);

    // Same first 3 digits = Local
    if (originArea === destArea) {
      return "LOCAL";
    }
    return "REGIONAL";
  }

  // Metro zones
  const metros = ["1", "2", "4", "5", "6"]; // Delhi, Mumbai, Chennai, etc.
  if (metros.includes(destZone)) {
    return "METRO";
  }

  // Rest of India
  return "ROI";
}

// Helper: Get delivery days by zone
function getDeliveryDays(zone: string): number {
  const zoneDays: Record<string, number> = {
    LOCAL: 1,
    REGIONAL: 2,
    METRO: 3,
    ROI: 4,
  };
  return zoneDays[zone] || 5;
}
