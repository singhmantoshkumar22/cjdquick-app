import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getClientFromRequest } from "@/lib/client-auth";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await prisma.clientUser.findMany({
      where: { clientId: clientContext.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Client users error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only OWNER or ADMIN can create users
    if (!["OWNER", "ADMIN"].includes(clientContext.clientUserRole)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, phone, role, password } = body;

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["ADMIN", "OPERATIONS_USER"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.clientUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user = await prisma.clientUser.create({
      data: {
        clientId: clientContext.id,
        email,
        name,
        phone,
        role: role || "OPERATIONS_USER",
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
