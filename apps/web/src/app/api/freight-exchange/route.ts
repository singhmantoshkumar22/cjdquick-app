import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Freight Exchange Platform - Partner Bidding Marketplace

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const carrierId = searchParams.get("carrierId");

    if (type === "bids") {
      const requestId = searchParams.get("requestId");
      const where: any = {};
      if (requestId) where.requestId = requestId;
      if (carrierId) where.carrierId = carrierId;
      if (status) where.status = status;

      const bids = await prisma.freightBid.findMany({
        where,
        include: {
          request: {
            select: {
              requestNumber: true,
              originCity: true,
              destinationCity: true,
              shipmentType: true,
              totalWeightKg: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({
        success: true,
        data: { items: bids },
      });
    }

    if (type === "carriers") {
      const carriers = await prisma.carrierProfile.findMany({
        orderBy: { overallRating: "desc" },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        data: { items: carriers },
      });
    }

    // Default: Get freight requests
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const requests = await prisma.freightRequest.findMany({
      where,
      include: {
        bids: {
          select: {
            id: true,
            carrierId: true,
            carrierName: true,
            totalAmount: true,
            status: true,
            isLowestBid: true,
          },
        },
        _count: { select: { bids: true, invitedCarriers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calculate summary
    const summary = {
      total: requests.length,
      open: requests.filter((r) => r.status === "OPEN" || r.status === "BIDDING").length,
      awarded: requests.filter((r) => r.status === "AWARDED").length,
      completed: requests.filter((r) => r.status === "COMPLETED").length,
    };

    return NextResponse.json({
      success: true,
      data: { items: requests, summary },
    });
  } catch (error) {
    console.error("Freight Exchange GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch freight exchange data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "CREATE_REQUEST": {
        const requestNumber = `FRQ${Date.now()}`;

        const freightRequest = await prisma.freightRequest.create({
          data: {
            requestNumber,
            clientId: body.clientId,
            originPincode: body.originPincode,
            originCity: body.originCity,
            originState: body.originState,
            destinationPincode: body.destinationPincode,
            destinationCity: body.destinationCity,
            destinationState: body.destinationState,
            shipmentType: body.shipmentType,
            vehicleType: body.vehicleType,
            totalWeightKg: body.totalWeightKg,
            totalVolumeCBM: body.totalVolumeCBM,
            packageCount: body.packageCount,
            contentDescription: body.contentDescription,
            specialInstructions: body.specialInstructions,
            requiresColdChain: body.requiresColdChain || false,
            requiresODA: body.requiresODA || false,
            requiresFragile: body.requiresFragile || false,
            requiresHazmat: body.requiresHazmat || false,
            requiresInsurance: body.requiresInsurance || false,
            insuranceValue: body.insuranceValue,
            pickupDate: new Date(body.pickupDate),
            pickupTimeSlot: body.pickupTimeSlot,
            expectedDeliveryDate: new Date(body.expectedDeliveryDate),
            baseBudget: body.baseBudget,
            reservePrice: body.reservePrice,
            pricingModel: body.pricingModel || "PER_KG",
            biddingStartTime: new Date(body.biddingStartTime || Date.now()),
            biddingEndTime: new Date(body.biddingEndTime),
            autoAward: body.autoAward || false,
            minBids: body.minBids || 1,
            visibleToAll: body.visibleToAll !== false,
            status: "OPEN",
          },
        });

        return NextResponse.json({ success: true, data: freightRequest });
      }

      case "SUBMIT_BID": {
        const { requestId, carrierId, carrierName } = body;

        // Verify request is open for bidding
        const freightRequest = await prisma.freightRequest.findUnique({
          where: { id: requestId },
        });

        if (!freightRequest || !["OPEN", "BIDDING"].includes(freightRequest.status)) {
          return NextResponse.json(
            { success: false, error: "Request is not open for bidding" },
            { status: 400 }
          );
        }

        // Check bidding deadline
        if (new Date() > freightRequest.biddingEndTime) {
          return NextResponse.json(
            { success: false, error: "Bidding period has ended" },
            { status: 400 }
          );
        }

        const totalAmount =
          body.bidAmount +
          (body.fuelSurcharge || 0) +
          (body.odaCharges || 0) +
          (body.handlingCharges || 0) +
          (body.insuranceCharges || 0);

        const bid = await prisma.freightBid.create({
          data: {
            requestId,
            carrierId,
            carrierName,
            bidAmount: body.bidAmount,
            bidPerKg: body.bidPerKg,
            fuelSurcharge: body.fuelSurcharge,
            odaCharges: body.odaCharges,
            handlingCharges: body.handlingCharges,
            insuranceCharges: body.insuranceCharges,
            totalAmount,
            estimatedPickupTime: new Date(body.estimatedPickupTime),
            estimatedDeliveryTime: new Date(body.estimatedDeliveryTime),
            vehicleType: body.vehicleType,
            vehicleRegNo: body.vehicleRegNo,
            driverName: body.driverName,
            driverPhone: body.driverPhone,
            paymentTerms: body.paymentTerms,
            validUntil: new Date(body.validUntil || Date.now() + 7 * 24 * 60 * 60 * 1000),
            remarks: body.remarks,
            status: "SUBMITTED",
          },
        });

        // Update request status to BIDDING if first bid
        if (freightRequest.status === "OPEN") {
          await prisma.freightRequest.update({
            where: { id: requestId },
            data: { status: "BIDDING" },
          });
        }

        // Update bid rankings
        await updateBidRankings(requestId);

        // Update carrier profile stats
        await prisma.carrierProfile.upsert({
          where: { partnerId: carrierId },
          update: {
            totalBidsSubmitted: { increment: 1 },
          },
          create: {
            partnerId: carrierId,
            totalBidsSubmitted: 1,
          },
        });

        return NextResponse.json({ success: true, data: bid });
      }

      case "AWARD_BID": {
        const { requestId, bidId } = body;

        // Update the bid status
        await prisma.freightBid.update({
          where: { id: bidId },
          data: { status: "ACCEPTED" },
        });

        // Reject other bids
        await prisma.freightBid.updateMany({
          where: { requestId, id: { not: bidId } },
          data: { status: "REJECTED", rejectedAt: new Date() },
        });

        // Update request
        const updated = await prisma.freightRequest.update({
          where: { id: requestId },
          data: {
            status: "AWARDED",
            awardedBidId: bidId,
            awardedAt: new Date(),
          },
        });

        // Update carrier win stats
        const winningBid = await prisma.freightBid.findUnique({
          where: { id: bidId },
        });

        if (winningBid) {
          await prisma.carrierProfile.update({
            where: { partnerId: winningBid.carrierId },
            data: {
              totalBidsWon: { increment: 1 },
            },
          });
        }

        return NextResponse.json({ success: true, data: updated });
      }

      case "INVITE_CARRIERS": {
        const { requestId, carriers } = body;

        // Create invites one by one to handle duplicates gracefully
        let createdCount = 0;
        for (const c of carriers) {
          try {
            await prisma.freightRequestInvite.create({
              data: {
                requestId,
                carrierId: c.carrierId,
                carrierName: c.carrierName,
                carrierEmail: c.carrierEmail,
                carrierPhone: c.carrierPhone,
              },
            });
            createdCount++;
          } catch (e: any) {
            // Skip duplicates
            if (!e.code?.includes("P2002")) throw e;
          }
        }

        return NextResponse.json({ success: true, data: { count: createdCount } });
      }

      case "WITHDRAW_BID": {
        const { bidId } = body;

        const bid = await prisma.freightBid.update({
          where: { id: bidId },
          data: { status: "WITHDRAWN" },
        });

        // Update rankings
        await updateBidRankings(bid.requestId);

        return NextResponse.json({ success: true, data: bid });
      }

      case "CANCEL_REQUEST": {
        const { requestId, reason } = body;

        const updated = await prisma.freightRequest.update({
          where: { id: requestId },
          data: { status: "CANCELLED" },
        });

        // Notify bidders their bids are cancelled
        await prisma.freightBid.updateMany({
          where: { requestId, status: "SUBMITTED" },
          data: { status: "REJECTED", rejectionReason: reason || "Request cancelled" },
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case "COMPLETE_REQUEST": {
        const { requestId } = body;

        const updated = await prisma.freightRequest.update({
          where: { id: requestId },
          data: { status: "COMPLETED" },
        });

        // Update carrier completion stats
        const awardedBid = await prisma.freightBid.findFirst({
          where: { requestId, status: "ACCEPTED" },
        });

        if (awardedBid) {
          await prisma.carrierProfile.update({
            where: { partnerId: awardedBid.carrierId },
            data: {
              totalShipmentsCompleted: { increment: 1 },
            },
          });
        }

        return NextResponse.json({ success: true, data: updated });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Freight Exchange POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

async function updateBidRankings(requestId: string) {
  const bids = await prisma.freightBid.findMany({
    where: { requestId, status: { in: ["SUBMITTED", "SHORTLISTED"] } },
    orderBy: { totalAmount: "asc" },
  });

  for (let i = 0; i < bids.length; i++) {
    await prisma.freightBid.update({
      where: { id: bids[i].id },
      data: {
        rankPosition: i + 1,
        isLowestBid: i === 0,
      },
    });
  }
}
