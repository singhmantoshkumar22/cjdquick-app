import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { prisma } from "@cjdquick/database";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: user.brandId },
      select: {
        apiKey: true,
        webhookUrl: true,
      },
    });

    if (!brand) {
      return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
    }

    // Mask API key (show first 8 and last 4 chars)
    let maskedKey = "";
    if (brand.apiKey) {
      maskedKey = brand.apiKey.substring(0, 8) + "••••••••••••••••••••" + brand.apiKey.slice(-4);
    }

    return NextResponse.json({
      success: true,
      data: {
        apiKey: maskedKey,
        hasApiKey: !!brand.apiKey,
        webhookUrl: brand.webhookUrl || "",
      },
    });
  } catch (error) {
    console.error("API keys fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch API keys" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, webhookUrl } = body;

    if (action === "regenerate") {
      // Generate new API key
      const newApiKey = `pk_live_${crypto.randomBytes(32).toString("base64url")}`;

      await prisma.brand.update({
        where: { id: user.brandId },
        data: { apiKey: newApiKey },
      });

      return NextResponse.json({
        success: true,
        data: {
          apiKey: newApiKey,
          message: "API key regenerated. Please update your integrations.",
        },
      });
    }

    if (action === "update_webhook") {
      await prisma.brand.update({
        where: { id: user.brandId },
        data: { webhookUrl },
      });

      return NextResponse.json({
        success: true,
        data: { message: "Webhook URL updated successfully" },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("API keys update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update API keys" }, { status: 500 });
  }
}
