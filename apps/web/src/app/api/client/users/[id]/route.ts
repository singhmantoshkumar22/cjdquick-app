import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getClientFromRequest } from "@/lib/client-auth";
import crypto from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await prisma.clientUser.findFirst({
      where: {
        id,
        clientId: clientContext.id,
      },
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

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only OWNER or ADMIN can update users
    if (!["OWNER", "ADMIN"].includes(clientContext.clientUserRole)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check user exists and belongs to client
    const existingUser = await prisma.clientUser.findFirst({
      where: {
        id,
        clientId: clientContext.id,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Cannot modify OWNER unless you are the OWNER
    if (existingUser.role === "OWNER" && clientContext.clientUserRole !== "OWNER") {
      return NextResponse.json(
        { success: false, error: "Cannot modify owner account" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phone, role, password, isActive } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role && ["ADMIN", "OPERATIONS_USER"].includes(role)) {
      updateData.role = role;
    }
    if (password) {
      updateData.passwordHash = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.clientUser.update({
      where: { id },
      data: updateData,
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
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only OWNER can delete users
    if (clientContext.clientUserRole !== "OWNER") {
      return NextResponse.json(
        { success: false, error: "Only account owner can delete users" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check user exists and belongs to client
    const existingUser = await prisma.clientUser.findFirst({
      where: {
        id,
        clientId: clientContext.id,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Cannot delete OWNER
    if (existingUser.role === "OWNER") {
      return NextResponse.json(
        { success: false, error: "Cannot delete owner account" },
        { status: 403 }
      );
    }

    // Cannot delete self
    if (existingUser.id === clientContext.clientUserId) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 403 }
      );
    }

    await prisma.clientUser.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
