import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List notification templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const channel = searchParams.get("channel");
    const triggerEvent = searchParams.get("triggerEvent");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (channel) where.channel = channel;
    if (triggerEvent) where.triggerEvent = triggerEvent;
    if (isActive !== null) where.isActive = isActive === "true";

    const templates = await prisma.notificationTemplate.findMany({
      where,
      orderBy: [{ channel: "asc" }, { triggerEvent: "asc" }],
    });

    // Parse availableVars JSON
    const enriched = templates.map((t) => ({
      ...t,
      availableVars: JSON.parse(t.availableVars || "[]"),
    }));

    return NextResponse.json({
      success: true,
      data: { templates: enriched },
    });
  } catch (error) {
    console.error("Templates List Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Create notification template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      code,
      name,
      description,
      channel,
      triggerEvent,
      recipientType,
      subject,
      body: templateBody,
      bodyHtml,
      isActive = true,
      isClientSpecific = false,
      clientId,
      delayMinutes = 0,
      scheduledTime,
    } = body;

    // Validate required fields
    if (!code || !name || !channel || !triggerEvent || !recipientType || !templateBody) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.notificationTemplate.findUnique({
      where: { code },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Template code already exists" },
        { status: 400 }
      );
    }

    // Define available variables based on trigger event
    const availableVars = getAvailableVars(triggerEvent);

    const template = await prisma.notificationTemplate.create({
      data: {
        code,
        name,
        description,
        channel,
        triggerEvent,
        recipientType,
        subject,
        body: templateBody,
        bodyHtml,
        isActive,
        isClientSpecific,
        clientId,
        availableVars: JSON.stringify(availableVars),
        delayMinutes,
        scheduledTime,
      },
    });

    return NextResponse.json({
      success: true,
      data: { template },
    });
  } catch (error) {
    console.error("Template Create Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create template" },
      { status: 500 }
    );
  }
}

function getAvailableVars(triggerEvent: string): string[] {
  const baseVars = ["{{awb}}", "{{client_name}}", "{{consignee_name}}", "{{consignee_phone}}"];

  const eventVars: Record<string, string[]> = {
    SHIPMENT_BOOKED: [...baseVars, "{{origin}}", "{{destination}}", "{{expected_delivery}}"],
    PICKUP_SCHEDULED: [...baseVars, "{{pickup_date}}", "{{pickup_time}}", "{{pickup_address}}"],
    PICKED_UP: [...baseVars, "{{pickup_time}}", "{{expected_delivery}}"],
    IN_TRANSIT: [...baseVars, "{{current_location}}", "{{expected_delivery}}"],
    OUT_FOR_DELIVERY: [...baseVars, "{{delivery_agent}}", "{{delivery_phone}}", "{{otp}}"],
    DELIVERED: [...baseVars, "{{delivery_time}}", "{{receiver_name}}", "{{pod_link}}"],
    DELIVERY_FAILED: [...baseVars, "{{failure_reason}}", "{{next_attempt_date}}"],
    RTO_INITIATED: [...baseVars, "{{rto_reason}}"],
    NDR_CREATED: [...baseVars, "{{ndr_reason}}", "{{reattempt_date}}"],
    COD_COLLECTED: [...baseVars, "{{cod_amount}}", "{{payment_mode}}"],
  };

  return eventVars[triggerEvent] || baseVars;
}
