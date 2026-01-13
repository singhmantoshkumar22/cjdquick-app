import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { prisma } from "@cjdquick/database";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.brandUser.findMany({
      where: { brandId: user.brandId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        name: u.name || u.email.split("@")[0],
        email: u.email,
        role: u.role,
        status: u.status,
        lastLogin: u.lastLoginAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to invite
    const currentUser = await prisma.brandUser.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    // Check if user already exists
    const existing = await prisma.brandUser.findFirst({
      where: { brandId: user.brandId, email },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "User already exists" }, { status: 400 });
    }

    // Create invited user with temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.brandUser.create({
      data: {
        brandId: user.brandId,
        email,
        name: email.split("@")[0],
        passwordHash: hashedPassword,
        role: role || "OPERATIONS",
        status: "INVITED",
      },
    });

    // In a real app, send invitation email here

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        message: "User invited successfully",
      },
    });
  } catch (error) {
    console.error("User invite error:", error);
    return NextResponse.json({ success: false, error: "Failed to invite user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    // Check permissions
    const currentUser = await prisma.brandUser.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    // Cannot delete owner
    const targetUser = await prisma.brandUser.findUnique({
      where: { id: userId },
      select: { role: true, brandId: true },
    });

    if (!targetUser || targetUser.brandId !== user.brandId) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "OWNER") {
      return NextResponse.json({ success: false, error: "Cannot remove owner" }, { status: 400 });
    }

    await prisma.brandUser.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      data: { message: "User removed successfully" },
    });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to remove user" }, { status: 500 });
  }
}
