import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Indian Postal API for pincode lookup
const POSTAL_API_URL = "https://api.postalpincode.in/pincode";

// Cache for pincode lookups (in production, use Redis)
const pincodeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface PincodeData {
  pincode: string;
  city: string;
  district: string;
  state: string;
  stateCode: string;
  region: string;
  division: string;
  isServiceable: boolean;
  deliveryDays: number;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  hubCode?: string;
  hubName?: string;
  zone?: string;
}

// GET - Validate pincode and get location details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode");
    const checkServiceability = searchParams.get("checkServiceability") === "true";

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, error: "Valid 6-digit pincode required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = pincodeCache.get(pincode);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      });
    }

    // Fetch from Indian Postal API
    let postalData: any = null;
    try {
      const response = await fetch(`${POSTAL_API_URL}/${pincode}`, {
        headers: { "Accept": "application/json" },
      });
      const data = await response.json();

      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        postalData = {
          city: postOffice.Block || postOffice.Name,
          district: postOffice.District,
          state: postOffice.State,
          region: postOffice.Region,
          division: postOffice.Division,
          country: postOffice.Country,
        };
      }
    } catch (err) {
      console.error("Postal API Error:", err);
      // Continue with database lookup
    }

    // Check serviceability from database
    let serviceability: any = null;
    if (checkServiceability) {
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

      if (hubMapping) {
        serviceability = {
          isServiceable: true,
          hubCode: hubMapping.hub?.code,
          hubName: hubMapping.hub?.name,
          deliveryDays: 3, // Default delivery days
          codAvailable: true, // Default to true for serviceable pincodes
          prepaidAvailable: true, // Default to true for serviceable pincodes
          zone: null, // Will be calculated if origin provided
        };
      } else {
        serviceability = {
          isServiceable: false,
          deliveryDays: null,
          codAvailable: false,
          prepaidAvailable: false,
        };
      }
    }

    // Build response
    const result: PincodeData = {
      pincode,
      city: postalData?.city || "",
      district: postalData?.district || "",
      state: postalData?.state || "",
      stateCode: getStateCode(postalData?.state || ""),
      region: postalData?.region || "",
      division: postalData?.division || "",
      isServiceable: serviceability?.isServiceable ?? true,
      deliveryDays: serviceability?.deliveryDays || 3,
      codAvailable: serviceability?.codAvailable ?? true,
      prepaidAvailable: serviceability?.prepaidAvailable ?? true,
      hubCode: serviceability?.hubCode,
      hubName: serviceability?.hubName,
      zone: serviceability?.zone,
    };

    // Cache the result
    pincodeCache.set(pincode, { data: result, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch (error) {
    console.error("Pincode Validation Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate pincode" },
      { status: 500 }
    );
  }
}

// POST - Validate full address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      phone,
    } = body;

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: any = {};

    // Validate required fields
    if (!addressLine1 || addressLine1.length < 5) {
      errors.push("Address line 1 is too short (minimum 5 characters)");
    }

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      errors.push("Invalid pincode format (must be 6 digits)");
    }

    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""))) {
      errors.push("Invalid phone number (must be 10 digits starting with 6-9)");
    }

    // Validate pincode and get location
    let pincodeData: any = null;
    if (/^\d{6}$/.test(pincode)) {
      try {
        const response = await fetch(`${POSTAL_API_URL}/${pincode}`);
        const data = await response.json();

        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          pincodeData = {
            city: postOffice.Block || postOffice.Name,
            district: postOffice.District,
            state: postOffice.State,
          };

          // Check if city matches
          if (city && city.toLowerCase() !== pincodeData.city.toLowerCase() &&
              city.toLowerCase() !== pincodeData.district.toLowerCase()) {
            warnings.push(`City may not match pincode (expected: ${pincodeData.district})`);
            suggestions.city = pincodeData.district;
          }

          // Check if state matches
          if (state && !pincodeData.state.toLowerCase().includes(state.toLowerCase())) {
            warnings.push(`State doesn't match pincode (expected: ${pincodeData.state})`);
            suggestions.state = pincodeData.state;
          }
        } else {
          errors.push("Pincode not found in database");
        }
      } catch (err) {
        warnings.push("Could not verify pincode online");
      }
    }

    // Check serviceability
    let serviceability: any = null;
    if (/^\d{6}$/.test(pincode)) {
      const hubMapping = await prisma.hubPincodeMapping.findFirst({
        where: { pincode },
      });

      if (!hubMapping) {
        errors.push("This pincode is not serviceable");
        serviceability = { isServiceable: false };
      } else {
        serviceability = {
          isServiceable: true,
          deliveryDays: 3, // Default delivery days
          codAvailable: true, // Default to true for serviceable pincodes
        };
      }
    }

    // Address quality checks
    if (addressLine1) {
      // Check for common issues
      if (/^\d+$/.test(addressLine1)) {
        warnings.push("Address line 1 contains only numbers");
      }
      if (addressLine1.length > 100) {
        warnings.push("Address line 1 is very long, consider splitting");
      }
      if (!/\d/.test(addressLine1)) {
        warnings.push("Consider adding house/flat number for accurate delivery");
      }
    }

    const isValid = errors.length === 0;
    const confidence = calculateConfidence(errors.length, warnings.length);

    return NextResponse.json({
      success: true,
      data: {
        isValid,
        confidence,
        errors,
        warnings,
        suggestions,
        pincodeData,
        serviceability,
        formattedAddress: isValid
          ? formatAddress(addressLine1, addressLine2, city, state, pincode)
          : null,
      },
    });
  } catch (error) {
    console.error("Address Validation Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate address" },
      { status: 500 }
    );
  }
}

// Helper: Get state code
function getStateCode(state: string): string {
  const stateCodes: Record<string, string> = {
    "Andhra Pradesh": "AP",
    "Arunachal Pradesh": "AR",
    "Assam": "AS",
    "Bihar": "BR",
    "Chhattisgarh": "CG",
    "Goa": "GA",
    "Gujarat": "GJ",
    "Haryana": "HR",
    "Himachal Pradesh": "HP",
    "Jharkhand": "JH",
    "Karnataka": "KA",
    "Kerala": "KL",
    "Madhya Pradesh": "MP",
    "Maharashtra": "MH",
    "Manipur": "MN",
    "Meghalaya": "ML",
    "Mizoram": "MZ",
    "Nagaland": "NL",
    "Odisha": "OD",
    "Punjab": "PB",
    "Rajasthan": "RJ",
    "Sikkim": "SK",
    "Tamil Nadu": "TN",
    "Telangana": "TS",
    "Tripura": "TR",
    "Uttar Pradesh": "UP",
    "Uttarakhand": "UK",
    "West Bengal": "WB",
    "Delhi": "DL",
    "Chandigarh": "CH",
  };
  return stateCodes[state] || "";
}

// Helper: Calculate confidence score
function calculateConfidence(errorCount: number, warningCount: number): number {
  let score = 100;
  score -= errorCount * 30;
  score -= warningCount * 10;
  return Math.max(0, Math.min(100, score));
}

// Helper: Format address
function formatAddress(
  line1: string,
  line2: string | null,
  city: string,
  state: string,
  pincode: string
): string {
  const parts = [line1];
  if (line2) parts.push(line2);
  parts.push(`${city}, ${state} - ${pincode}`);
  return parts.join(", ");
}
