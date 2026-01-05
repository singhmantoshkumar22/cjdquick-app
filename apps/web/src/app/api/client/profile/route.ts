import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getClientFromRequest } from "@/lib/client-auth";

export async function GET(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientContext.id },
      include: {
        _count: {
          select: {
            orders: true,
            warehouses: true,
            clientUsers: true,
            pickupRequests: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: client.id,
        companyName: client.companyName,
        gstNumber: client.gstNumber,
        billingAddress: client.billingAddress,
        creditLimit: client.creditLimit,
        currentBalance: client.currentBalance,
        paymentTermsDays: client.paymentTermsDays,
        webhookUrl: client.webhookUrl,
        apiKey: client.apiKey ? `${client.apiKey.substring(0, 8)}...` : null,
        createdAt: client.createdAt,
        stats: {
          totalOrders: client._count.orders,
          totalWarehouses: client._count.warehouses,
          totalUsers: client._count.clientUsers,
          totalPickups: client._count.pickupRequests,
        },
      },
    });
  } catch (error) {
    console.error("Client profile error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only OWNER can update profile
    if (clientContext.clientUserRole !== "OWNER") {
      return NextResponse.json(
        { success: false, error: "Only account owner can update profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyName, gstNumber, billingAddress, webhookUrl } = body;

    const updateData: any = {};
    if (companyName) updateData.companyName = companyName;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (billingAddress) updateData.billingAddress = billingAddress;
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;

    const client = await prisma.client.update({
      where: { id: clientContext.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: client.id,
        companyName: client.companyName,
        gstNumber: client.gstNumber,
        billingAddress: client.billingAddress,
        webhookUrl: client.webhookUrl,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
