import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getAdminUser } from "@/lib/admin-auth";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clients = await prisma.client.findMany({
      orderBy: { companyName: "asc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            clientUsers: true,
            warehouses: true,
            orders: true,
            pickupRequests: true,
            supportTickets: true,
          },
        },
      },
    });

    // Format response
    const formattedClients = clients.map((client) => ({
      id: client.id,
      companyName: client.companyName,
      contactPerson: client.user?.name || "",
      email: client.user?.email || "",
      phone: client.user?.phone || "",
      gstNumber: client.gstNumber,
      billingAddress: client.billingAddress,
      status: "ACTIVE", // Client doesn't have a status field, so default to ACTIVE
      createdAt: client.createdAt.toISOString(),
      _count: {
        users: client._count.clientUsers,
        warehouses: client._count.warehouses,
        orders: client._count.orders,
        pickupRequests: client._count.pickupRequests,
        supportTickets: client._count.supportTickets,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedClients,
    });
  } catch (error) {
    console.error("Admin clients error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      contactName,
      email,
      phone,
      password,
      gstNumber,
      billingAddress,
      creditLimit,
      paymentTermsDays,
    } = body;

    // Validate required fields
    if (!companyName || !contactName || !email || !password || !billingAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if client user email already exists
    const existingClientUser = await prisma.clientUser.findUnique({
      where: { email },
    });

    if (existingClientUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered as client user" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Create user, client, and client user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the main user
      const user = await tx.user.create({
        data: {
          email,
          name: contactName,
          phone,
          passwordHash,
          role: "CLIENT",
          isActive: true,
        },
      });

      // Create the client
      const client = await tx.client.create({
        data: {
          userId: user.id,
          companyName,
          gstNumber,
          billingAddress,
          creditLimit: creditLimit || 0,
          paymentTermsDays: paymentTermsDays || 15,
        },
      });

      // Create the client user (owner)
      const clientUser = await tx.clientUser.create({
        data: {
          clientId: client.id,
          email,
          passwordHash,
          name: contactName,
          phone,
          role: "OWNER",
          isActive: true,
        },
      });

      return { user, client, clientUser };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.client.id,
        companyName: result.client.companyName,
        email: result.user.email,
        message: "Client created successfully",
      },
    });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
