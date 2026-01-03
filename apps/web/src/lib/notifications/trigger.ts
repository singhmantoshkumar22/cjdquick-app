/**
 * Notification Trigger Service
 * Automatically sends notifications based on shipment events
 */

import { prisma } from "@cjdquick/database";
import { sendNotification } from "./providers";

// Event types that trigger notifications
export type NotificationEvent =
  | "SHIPMENT_BOOKED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "AT_HUB"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "RTO_INITIATED"
  | "NDR_CREATED"
  | "COD_COLLECTED";

export interface TriggerContext {
  shipmentId: string;
  awbNumber: string;
  event: NotificationEvent;
  additionalData?: Record<string, any>;
}

// Main trigger function - call this when shipment status changes
export async function triggerNotifications(context: TriggerContext) {
  const { shipmentId, awbNumber, event, additionalData } = context;

  console.log(`[Notification Trigger] Event: ${event}, AWB: ${awbNumber}`);

  try {
    // Get shipment details
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      console.error(`[Notification Trigger] Shipment not found: ${shipmentId}`);
      return { triggered: 0, errors: ["Shipment not found"] };
    }

    // Get client details separately
    const client = shipment.clientId
      ? await prisma.client.findUnique({
          where: { id: shipment.clientId },
          select: { id: true, companyName: true },
        })
      : null;

    // Get active templates for this event
    const templates = await prisma.notificationTemplate.findMany({
      where: {
        triggerEvent: event,
        isActive: true,
        OR: [
          { isClientSpecific: false },
          { clientId: shipment.clientId },
        ],
      },
    });

    if (templates.length === 0) {
      console.log(`[Notification Trigger] No active templates for event: ${event}`);
      return { triggered: 0, errors: [] };
    }

    // Prepare common variables
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://track.cjdquick.com"}/track?awb=${awbNumber}`;
    const baseVariables = {
      awb: awbNumber,
      client_name: client?.companyName || "",
      consignee_name: shipment.consigneeName || "",
      consignee_phone: shipment.consigneePhone || "",
      shipper_name: shipment.shipperName || "",
      origin: `${shipment.shipperCity || ""} ${shipment.shipperPincode || ""}`.trim(),
      destination: `${shipment.consigneeCity || ""} ${shipment.consigneePincode || ""}`.trim(),
      tracking_url: trackingUrl,
      expected_delivery: shipment.expectedDeliveryDate
        ? formatDate(shipment.expectedDeliveryDate)
        : "As per schedule",
      cod_amount: shipment.codAmount?.toString() || "0",
      ...additionalData,
    };

    const results = [];
    const errors: string[] = [];

    for (const template of templates) {
      try {
        // Determine recipient
        let recipientPhone = "";
        let recipientEmail = "";
        let recipientName = "";

        switch (template.recipientType) {
          case "CONSIGNEE":
            recipientPhone = shipment.consigneePhone || "";
            recipientEmail = ""; // Email not stored on shipment
            recipientName = shipment.consigneeName || "";
            break;
          case "SHIPPER":
            recipientPhone = shipment.shipperPhone || "";
            recipientEmail = ""; // Email not stored on shipment
            recipientName = shipment.shipperName || "";
            break;
          // Add more recipient types as needed
        }

        if (!recipientPhone && ["SMS", "WHATSAPP"].includes(template.channel)) {
          console.warn(`[Notification] No phone for ${template.recipientType}, skipping ${template.code}`);
          continue;
        }

        // Resolve message with variables
        const messageBody = replaceVariables(template.body, baseVariables);
        const subject = template.subject
          ? replaceVariables(template.subject, baseVariables)
          : undefined;

        // Calculate scheduled time
        const scheduledAt = new Date(Date.now() + (template.delayMinutes || 0) * 60 * 1000);

        // Queue the notification
        const queued = await prisma.notificationQueue.create({
          data: {
            templateId: template.id,
            templateCode: template.code,
            channel: template.channel,
            recipientType: template.recipientType,
            recipientPhone,
            recipientEmail,
            recipientName,
            shipmentId: shipment.id,
            awbNumber: shipment.awbNumber,
            clientId: shipment.clientId,
            subject,
            messageBody,
            scheduledAt,
            priority: getEventPriority(event),
          },
        });

        results.push({
          templateCode: template.code,
          channel: template.channel,
          queueId: queued.id,
          scheduledAt,
        });

        // If no delay, send immediately
        if (template.delayMinutes === 0) {
          await processNotificationImmediately(queued.id);
        }
      } catch (err: any) {
        console.error(`[Notification] Error with template ${template.code}:`, err);
        errors.push(`${template.code}: ${err.message}`);
      }
    }

    console.log(`[Notification Trigger] Queued ${results.length} notifications for ${event}`);
    return { triggered: results.length, results, errors };
  } catch (error: any) {
    console.error(`[Notification Trigger] Error:`, error);
    return { triggered: 0, errors: [error.message] };
  }
}

// Process a notification immediately (for no-delay templates)
async function processNotificationImmediately(queueId: string) {
  try {
    const notification = await prisma.notificationQueue.findUnique({
      where: { id: queueId },
    });

    if (!notification || notification.status !== "PENDING") return;

    // Mark as processing
    await prisma.notificationQueue.update({
      where: { id: queueId },
      data: { status: "PROCESSING", attempts: 1 },
    });

    // Send via provider
    const result = await sendNotification({
      channel: notification.channel as "SMS" | "WHATSAPP" | "EMAIL",
      to: notification.recipientPhone || notification.recipientEmail || "",
      message: notification.messageBody,
    });

    if (result.success) {
      // Log success
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
          providerName: result.provider,
          providerRef: result.providerRef,
          costCredits: result.cost,
          sentAt: new Date(),
        },
      });

      // Update queue
      await prisma.notificationQueue.update({
        where: { id: queueId },
        data: {
          status: "SENT",
          processedAt: new Date(),
          providerRef: result.providerRef,
        },
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error: any) {
    console.error(`[Immediate Send] Error:`, error);

    // Update queue with failure
    await prisma.notificationQueue.update({
      where: { id: queueId },
      data: {
        status: "PENDING", // Keep pending for retry
        failureReason: error.message,
      },
    });
  }
}

// Replace template placeholders
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, "gi");
    result = result.replace(placeholder, value || "");
  });
  return result;
}

// Format date for display
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Get priority based on event type
function getEventPriority(event: NotificationEvent): number {
  const priorities: Record<NotificationEvent, number> = {
    SHIPMENT_BOOKED: 1,
    PICKUP_SCHEDULED: 1,
    PICKED_UP: 1,
    IN_TRANSIT: 1,
    AT_HUB: 1,
    OUT_FOR_DELIVERY: 2, // Higher priority
    DELIVERED: 2,
    DELIVERY_FAILED: 3, // Urgent
    RTO_INITIATED: 2,
    NDR_CREATED: 3,
    COD_COLLECTED: 1,
  };
  return priorities[event] || 1;
}

// Convenience functions for common events
export async function notifyShipmentBooked(shipmentId: string, awbNumber: string) {
  return triggerNotifications({
    shipmentId,
    awbNumber,
    event: "SHIPMENT_BOOKED",
  });
}

export async function notifyOutForDelivery(
  shipmentId: string,
  awbNumber: string,
  deliveryAgent?: string,
  deliveryPhone?: string,
  otp?: string
) {
  return triggerNotifications({
    shipmentId,
    awbNumber,
    event: "OUT_FOR_DELIVERY",
    additionalData: {
      delivery_agent: deliveryAgent || "",
      delivery_phone: deliveryPhone || "",
      otp: otp || "",
    },
  });
}

export async function notifyDelivered(
  shipmentId: string,
  awbNumber: string,
  receiverName?: string,
  podLink?: string
) {
  return triggerNotifications({
    shipmentId,
    awbNumber,
    event: "DELIVERED",
    additionalData: {
      delivery_time: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      receiver_name: receiverName || "",
      pod_link: podLink || "",
    },
  });
}

export async function notifyDeliveryFailed(
  shipmentId: string,
  awbNumber: string,
  failureReason: string,
  nextAttemptDate?: string
) {
  return triggerNotifications({
    shipmentId,
    awbNumber,
    event: "DELIVERY_FAILED",
    additionalData: {
      failure_reason: failureReason,
      next_attempt_date: nextAttemptDate || "To be scheduled",
    },
  });
}
