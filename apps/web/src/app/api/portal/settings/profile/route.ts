import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { prisma } from "@cjdquick/database";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const brandUser = await prisma.brandUser.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        designation: true,
        role: true,
      },
    });

    if (!brandUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Split name into first/last
    const nameParts = (brandUser.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return NextResponse.json({
      success: true,
      data: {
        firstName,
        lastName,
        email: brandUser.email,
        phone: brandUser.phone || "",
        designation: brandUser.designation || "",
        role: brandUser.role,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, designation } = body;

    const name = `${firstName} ${lastName}`.trim();

    const updated = await prisma.brandUser.update({
      where: { id: user.id },
      data: {
        name,
        phone,
        designation,
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Profile updated successfully" },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
