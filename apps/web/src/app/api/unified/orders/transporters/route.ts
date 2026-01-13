import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { selectTransporter } from "@/lib/unified-order-service";
import { prisma } from "@cjdquick/database";

// GET: List transporters or check serviceability
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
    const destinationPincode = searchParams.get("pincode");
    const originPincode = searchParams.get("originPincode");
    const weight = parseFloat(searchParams.get("weight") || "0.5");
    const paymentMode = searchParams.get("paymentMode") || "PREPAID";
    const codAmount = parseFloat(searchParams.get("codAmount") || "0");

    // If pincode provided, check serviceability
    if (destinationPincode) {
      const result = await selectTransporter({
        originPincode: originPincode || "",
        destinationPincode,
        weightKg: weight,
        isCod: paymentMode === "COD",
        codAmount,
      });

      return NextResponse.json({
        success: true,
        data: {
          serviceable: result.recommended !== null,
          recommended: result.recommended,
          alternatives: result.alternatives,
          params: {
            destinationPincode,
            originPincode,
            weight,
            paymentMode,
            codAmount,
          },
        },
      });
    }

    // List all active transporters
    const transporters = await prisma.transporter.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        apiEnabled: true,
        supportsCod: true,
        logo: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: transporters,
    });
  } catch (error) {
    console.error("List transporters error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transporters" },
      { status: 500 }
    );
  }
}

// POST: Check serviceability for multiple pincodes
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
    const { pincodes, originPincode, weight = 0.5, paymentMode = "PREPAID", codAmount = 0 } = body;

    if (!pincodes || !Array.isArray(pincodes) || pincodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "pincodes array is required" },
        { status: 400 }
      );
    }

    // Limit to 100 pincodes per request
    const limitedPincodes = pincodes.slice(0, 100);

    const results: Record<string, any> = {};

    for (const pincode of limitedPincodes) {
      const result = await selectTransporter({
        originPincode: originPincode || "",
        destinationPincode: pincode,
        weightKg: weight,
        isCod: paymentMode === "COD",
        codAmount,
      });

      results[pincode] = {
        serviceable: result.recommended !== null,
        transporterCount: result.recommended
          ? 1 + result.alternatives.length
          : 0,
        cheapest: result.recommended
          ? {
              code: result.recommended.transporterCode,
              rate: result.recommended.rate,
            }
          : null,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        totalChecked: limitedPincodes.length,
        serviceable: Object.values(results).filter((r: any) => r.serviceable).length,
        notServiceable: Object.values(results).filter((r: any) => !r.serviceable).length,
      },
    });
  } catch (error) {
    console.error("Check serviceability error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check serviceability" },
      { status: 500 }
    );
  }
}
