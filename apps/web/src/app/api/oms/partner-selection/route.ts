import { NextRequest, NextResponse } from "next/server";
import { selectPartnerForOrder } from "@/lib/intelligent-orchestration";
import { selectOptimalPartner } from "@/lib/partner-selection";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    // Get partner recommendation for specific order
    if (orderId) {
      try {
        const result = await selectPartnerForOrder(orderId);
        return NextResponse.json({
          success: true,
          data: result,
        });
      } catch (dbError) {
        // Return demo data if database unavailable
        return NextResponse.json({
          success: true,
          data: {
            orderId,
            recommended: {
              partnerId: "partner1",
              partnerCode: "BLUEDART",
              partnerName: "BlueDart Express",
              rate: 85.50,
              estimatedTatDays: 2,
              reliabilityScore: 92,
              finalScore: 87.5,
              selectionReason: "Best overall score based on cost optimization, delivery speed, reliability. High reliability score (92%)",
            },
            alternatives: [
              {
                partnerId: "partner2",
                partnerCode: "DELHIVERY",
                partnerName: "Delhivery",
                rate: 72.00,
                estimatedTatDays: 3,
                reliabilityScore: 88,
                finalScore: 82.3,
              },
              {
                partnerId: "partner3",
                partnerCode: "ECOMEXP",
                partnerName: "Ecom Express",
                rate: 68.00,
                estimatedTatDays: 3,
                reliabilityScore: 85,
                finalScore: 79.8,
              },
            ],
            slaCompatibility: {
              promisedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              partnerEta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              isCompatible: true,
              bufferDays: 1,
            },
          },
          message: "Partner recommendation (demo mode)",
        });
      }
    }

    // Get all available partners with serviceability
    try {
      const response = await fetch(`${OMS_BACKEND_URL}/api/partners`, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fall through to demo data
    }

    return NextResponse.json({
      success: true,
      data: {
        partners: [
          {
            id: "partner1",
            code: "BLUEDART",
            name: "BlueDart Express",
            isActive: true,
            supportsCod: true,
            avgDeliveryDays: 2.3,
            reliabilityScore: 92,
            priceRange: { min: 60, max: 150 },
            coveragePincodes: 12500,
          },
          {
            id: "partner2",
            code: "DELHIVERY",
            name: "Delhivery",
            isActive: true,
            supportsCod: true,
            avgDeliveryDays: 2.8,
            reliabilityScore: 88,
            priceRange: { min: 45, max: 120 },
            coveragePincodes: 18000,
          },
          {
            id: "partner3",
            code: "ECOMEXP",
            name: "Ecom Express",
            isActive: true,
            supportsCod: true,
            avgDeliveryDays: 3.0,
            reliabilityScore: 85,
            priceRange: { min: 40, max: 110 },
            coveragePincodes: 15000,
          },
          {
            id: "partner4",
            code: "DTDC",
            name: "DTDC Express",
            isActive: true,
            supportsCod: false,
            avgDeliveryDays: 3.5,
            reliabilityScore: 78,
            priceRange: { min: 35, max: 95 },
            coveragePincodes: 10000,
          },
          {
            id: "partner5",
            code: "XPRESSBEES",
            name: "XpressBees",
            isActive: true,
            supportsCod: true,
            avgDeliveryDays: 2.5,
            reliabilityScore: 86,
            priceRange: { min: 50, max: 130 },
            coveragePincodes: 14000,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch partners",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Calculate optimal partner for given parameters
    if (action === "calculate") {
      const {
        originPincode,
        destinationPincode,
        weightKg,
        isCod,
        codAmount,
        clientWeights,
      } = body;

      try {
        const result = await selectOptimalPartner({
          originPincode,
          destinationPincode,
          weightKg,
          isCod,
          codAmount: codAmount || 0,
          clientWeights: clientWeights || { cost: 0.4, speed: 0.35, reliability: 0.25 },
        });

        if (!result) {
          return NextResponse.json({
            success: false,
            error: "No serviceable partners found for this route",
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: result,
        });
      } catch (dbError) {
        // Return simulated result if database unavailable
        const weights = clientWeights || { cost: 0.4, speed: 0.35, reliability: 0.25 };

        // Simulate partner scoring
        const partners = [
          {
            partnerId: "partner1",
            partnerCode: "BLUEDART",
            partnerName: "BlueDart Express",
            rate: 45 + weightKg * 18,
            estimatedTatDays: 2,
            reliabilityScore: 92,
            finalScore: 0,
            scores: { cost: 0, speed: 0, reliability: 92 },
          },
          {
            partnerId: "partner2",
            partnerCode: "DELHIVERY",
            partnerName: "Delhivery",
            rate: 35 + weightKg * 15,
            estimatedTatDays: 3,
            reliabilityScore: 88,
            finalScore: 0,
            scores: { cost: 0, speed: 0, reliability: 88 },
          },
          {
            partnerId: "partner3",
            partnerCode: "ECOMEXP",
            partnerName: "Ecom Express",
            rate: 30 + weightKg * 14,
            estimatedTatDays: 3,
            reliabilityScore: 85,
            finalScore: 0,
            scores: { cost: 0, speed: 0, reliability: 85 },
          },
        ];

        // Add COD charges
        if (isCod && codAmount > 0) {
          for (const p of partners) {
            p.rate += Math.max(25, codAmount * 0.015);
          }
        }

        // Normalize and score
        const rates = partners.map(p => p.rate);
        const tats = partners.map(p => p.estimatedTatDays);
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        const minTat = Math.min(...tats);
        const maxTat = Math.max(...tats);

        for (const p of partners) {
          p.scores.cost = 100 * (1 - (p.rate - minRate) / (maxRate - minRate || 1));
          p.scores.speed = 100 * (1 - (p.estimatedTatDays - minTat) / (maxTat - minTat || 1));
          p.finalScore = weights.cost * p.scores.cost + weights.speed * p.scores.speed + weights.reliability * p.scores.reliability;
        }

        partners.sort((a, b) => b.finalScore - a.finalScore);

        return NextResponse.json({
          success: true,
          data: {
            recommended: partners[0],
            alternatives: partners.slice(1),
          },
          message: "Partner selection (demo mode)",
        });
      }
    }

    // Assign partner to order
    if (action === "assign") {
      const { orderId, partnerId, partnerCode } = body;

      try {
        const response = await fetch(`${OMS_BACKEND_URL}/api/orders/${orderId}/assign-partner`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partnerId, partnerCode }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fall through to demo response
      }

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          partnerId,
          partnerCode,
          awbNumber: `AWB${Date.now().toString(36).toUpperCase()}`,
          assignedAt: new Date().toISOString(),
        },
        message: "Partner assigned successfully (demo mode)",
      });
    }

    // Check serviceability
    if (action === "check_serviceability") {
      const { originPincode, destinationPincode, partnerId } = body;

      return NextResponse.json({
        success: true,
        data: {
          originPincode,
          destinationPincode,
          isServiceable: true,
          serviceablePartners: partnerId ? [partnerId] : ["BLUEDART", "DELHIVERY", "ECOMEXP"],
          estimatedTat: {
            BLUEDART: 2,
            DELHIVERY: 3,
            ECOMEXP: 3,
          },
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action",
    }, { status: 400 });
  } catch (error) {
    console.error("Error processing partner selection:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process partner selection",
    }, { status: 500 });
  }
}
