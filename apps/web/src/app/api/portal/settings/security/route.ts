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

    const brandUser = await prisma.brandUser.findUnique({
      where: { id: user.id },
      select: { updatedAt: true },
    });

    // Get active sessions
    const sessions = await prisma.brandUserSession.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastAccessedAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        lastPasswordChange: brandUser?.updatedAt?.toISOString(),
        twoFactorEnabled: false, // Not implemented yet
        activeSessions: sessions.map((s) => ({
          id: s.id,
          device: s.userAgent || "Unknown device",
          ipAddress: s.ipAddress || "Unknown",
          lastAccessed: s.lastAccessedAt?.toISOString(),
          current: s.token === request.headers.get("authorization")?.replace("Bearer ", ""),
        })),
      },
    });
  } catch (error) {
    console.error("Security fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch security info" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, currentPassword, newPassword, sessionId } = body;

    if (action === "change_password") {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ success: false, error: "Passwords required" }, { status: 400 });
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
      }

      const brandUser = await prisma.brandUser.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });

      if (!brandUser?.passwordHash) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, brandUser.passwordHash);
      if (!validPassword) {
        return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
      }

      // Update password
      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.brandUser.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({
        success: true,
        data: { message: "Password changed successfully" },
      });
    }

    if (action === "revoke_session") {
      if (!sessionId) {
        return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 });
      }

      await prisma.brandUserSession.delete({
        where: { id: sessionId, userId: user.id },
      });

      return NextResponse.json({
        success: true,
        data: { message: "Session revoked successfully" },
      });
    }

    if (action === "revoke_all_sessions") {
      const currentToken = request.headers.get("authorization")?.replace("Bearer ", "");

      await prisma.brandUserSession.deleteMany({
        where: {
          userId: user.id,
          token: { not: currentToken },
        },
      });

      return NextResponse.json({
        success: true,
        data: { message: "All other sessions revoked" },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Security update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update security" }, { status: 500 });
  }
}
