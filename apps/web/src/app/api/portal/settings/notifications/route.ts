import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { prisma } from "@cjdquick/database";

const DEFAULT_SETTINGS = {
  emailOrderUpdates: true,
  emailDeliveryConfirmation: true,
  emailNdrAlerts: true,
  emailRemittanceUpdates: true,
  emailWeeklyDigest: false,
  smsOrderUpdates: false,
  smsDeliveryConfirmation: true,
  smsNdrAlerts: true,
};

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: user.brandId },
      select: { settings: true },
    });

    let notificationSettings = DEFAULT_SETTINGS;

    if (brand?.settings) {
      try {
        const parsed = JSON.parse(brand.settings);
        if (parsed.notifications) {
          notificationSettings = { ...DEFAULT_SETTINGS, ...parsed.notifications };
        }
      } catch (e) {
        // Use defaults if parsing fails
      }
    }

    return NextResponse.json({
      success: true,
      data: notificationSettings,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get existing settings
    const brand = await prisma.brand.findUnique({
      where: { id: user.brandId },
      select: { settings: true },
    });

    let existingSettings = {};
    if (brand?.settings) {
      try {
        existingSettings = JSON.parse(brand.settings);
      } catch (e) {
        existingSettings = {};
      }
    }

    // Merge notification settings
    const updatedSettings = {
      ...existingSettings,
      notifications: body,
    };

    await prisma.brand.update({
      where: { id: user.brandId },
      data: { settings: JSON.stringify(updatedSettings) },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Notification preferences saved" },
    });
  } catch (error) {
    console.error("Notifications update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update notifications" }, { status: 500 });
  }
}
