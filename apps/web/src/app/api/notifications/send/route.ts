import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// POST - Queue notification for sending
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      templateCode,
      shipmentId,
      awbNumber,
      recipientPhone,
      recipientEmail,
      recipientName,
      variables, // object with placeholder values
      priority = 1,
      scheduleAt, // optional delay
    } = body;

    // Get template
    const template = await prisma.notificationTemplate.findUnique({
      where: { code: templateCode },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    if (!template.isActive) {
      return NextResponse.json(
        { success: false, error: "Template is inactive" },
        { status: 400 }
      );
    }

    // Get shipment if provided
    let shipment = null;
    let clientId = null;
    if (shipmentId) {
      shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        select: {
          id: true,
          awbNumber: true,
          clientId: true,
          consigneeName: true,
          consigneePhone: true,
          shipperPincode: true,
          consigneePincode: true,
          consigneeCity: true,
          status: true,
        },
      });
      clientId = shipment?.clientId;
    }

    // Resolve message body with variables
    let messageBody = template.body;
    let subject = template.subject || "";

    // Replace placeholders
    const allVars = {
      awb: awbNumber || shipment?.awbNumber || "",
      consignee_name: shipment?.consigneeName || recipientName || "",
      consignee_phone: shipment?.consigneePhone || recipientPhone || "",
      destination: shipment?.consigneeCity || "",
      ...variables,
    };

    Object.entries(allVars).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      messageBody = messageBody.replace(new RegExp(placeholder, "g"), String(value || ""));
      subject = subject.replace(new RegExp(placeholder, "g"), String(value || ""));
    });

    // Determine recipient contact
    let phone = recipientPhone;
    let email = recipientEmail;
    let name = recipientName;

    if (template.recipientType === "CONSIGNEE" && shipment) {
      phone = phone || shipment.consigneePhone;
      // Email not available on shipment
      name = name || shipment.consigneeName;
    }

    // Validate contact based on channel
    if (["SMS", "WHATSAPP"].includes(template.channel) && !phone) {
      return NextResponse.json(
        { success: false, error: "Phone number required for SMS/WhatsApp" },
        { status: 400 }
      );
    }
    if (template.channel === "EMAIL" && !email) {
      return NextResponse.json(
        { success: false, error: "Email required for Email notifications" },
        { status: 400 }
      );
    }

    // Calculate scheduled time
    const scheduledAt = scheduleAt
      ? new Date(scheduleAt)
      : new Date(Date.now() + template.delayMinutes * 60 * 1000);

    // Queue notification
    const queued = await prisma.notificationQueue.create({
      data: {
        templateId: template.id,
        templateCode: template.code,
        channel: template.channel,
        recipientType: template.recipientType,
        recipientPhone: phone,
        recipientEmail: email,
        recipientName: name,
        shipmentId,
        awbNumber: awbNumber || shipment?.awbNumber,
        clientId,
        subject,
        messageBody,
        scheduledAt,
        priority,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        queueId: queued.id,
        scheduledAt: queued.scheduledAt,
        channel: queued.channel,
      },
      message: "Notification queued successfully",
    });
  } catch (error) {
    console.error("Send Notification Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to queue notification" },
      { status: 500 }
    );
  }
}

// POST - Process queued notifications (called by cron/worker)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get pending notifications that are due
    const pending = await prisma.notificationQueue.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: new Date() },
      },
      orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
      take: limit,
    });

    const results = [];

    for (const notification of pending) {
      // Mark as processing
      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: { status: "PROCESSING", attempts: notification.attempts + 1 },
      });

      try {
        // Send via actual SMS/WhatsApp/Email provider
        const sendResult = await sendViaProvider(notification);

        if (sendResult.success) {
          // Move to log
          await prisma.notificationLog.create({
            data: {
              templateId: notification.templateId,
              templateCode: notification.templateCode,
              channel: notification.channel,
              recipientType: notification.recipientType,
              recipientPhone: notification.recipientPhone,
              recipientEmail: notification.recipientEmail,
              recipientName: notification.recipientName,
              shipmentId: notification.shipmentId,
              awbNumber: notification.awbNumber,
              clientId: notification.clientId,
              subject: notification.subject,
              messageBody: notification.messageBody,
              status: "SENT",
              providerName: sendResult.provider,
              providerRef: sendResult.providerRef,
              costCredits: sendResult.cost || 0,
              sentAt: new Date(),
            },
          });

          // Update queue status
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: "SENT",
              processedAt: new Date(),
              providerRef: sendResult.providerRef,
            },
          });

          results.push({ id: notification.id, status: "SENT" });
        } else {
          throw new Error(sendResult.error);
        }
      } catch (error: any) {
        // Check if max attempts reached
        if (notification.attempts >= notification.maxAttempts) {
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: "FAILED",
              failureReason: error.message,
              processedAt: new Date(),
            },
          });
        } else {
          // Retry later
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: "PENDING",
              failureReason: error.message,
            },
          });
        }

        results.push({ id: notification.id, status: "FAILED", error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        results,
      },
    });
  } catch (error) {
    console.error("Process Notifications Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process notifications" },
      { status: 500 }
    );
  }
}

// Send via actual providers
async function sendViaProvider(notification: any) {
  // Import the notification providers dynamically to avoid circular dependencies
  const { sendNotification } = await import("@/lib/notifications/providers");

  const result = await sendNotification({
    channel: notification.channel,
    to: notification.recipientPhone || notification.recipientEmail || "",
    message: notification.messageBody,
    templateId: notification.templateCode,
  });

  return {
    success: result.success,
    provider: result.provider,
    providerRef: result.providerRef,
    cost: result.cost,
    error: result.error,
  };
}
