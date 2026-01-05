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

    const client = await prisma.client.findUnique({
      where: { id: clientContext.id },
      select: {
        apiKey: true,
        webhookUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        hasApiKey: !!client?.apiKey,
        apiKeyPreview: client?.apiKey ? `${client.apiKey.substring(0, 8)}...${client.apiKey.substring(client.apiKey.length - 4)}` : null,
        webhookUrl: client?.webhookUrl,
      },
    });
  } catch (error) {
    console.error("Get API key error:", error);
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

    // Only OWNER can generate API keys
    if (clientContext.clientUserRole !== "OWNER") {
      return NextResponse.json(
        { success: false, error: "Only account owner can manage API keys" },
        { status: 403 }
      );
    }

    // Generate new API key
    const apiKey = `cjd_${crypto.randomBytes(32).toString("hex")}`;

    await prisma.client.update({
      where: { id: clientContext.id },
      data: { apiKey },
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey,
        message: "Store this key securely. It will not be shown again.",
      },
    });
  } catch (error) {
    console.error("Generate API key error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only OWNER can revoke API keys
    if (clientContext.clientUserRole !== "OWNER") {
      return NextResponse.json(
        { success: false, error: "Only account owner can manage API keys" },
        { status: 403 }
      );
    }

    await prisma.client.update({
      where: { id: clientContext.id },
      data: { apiKey: null },
    });

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("Revoke API key error:", error);
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

    // Only OWNER can update webhook
    if (clientContext.clientUserRole !== "OWNER") {
      return NextResponse.json(
        { success: false, error: "Only account owner can manage webhooks" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { webhookUrl } = body;

    // Validate URL if provided
    if (webhookUrl) {
      try {
        new URL(webhookUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid webhook URL" },
          { status: 400 }
        );
      }
    }

    await prisma.client.update({
      where: { id: clientContext.id },
      data: { webhookUrl: webhookUrl || null },
    });

    return NextResponse.json({
      success: true,
      message: "Webhook URL updated successfully",
    });
  } catch (error) {
    console.error("Update webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
