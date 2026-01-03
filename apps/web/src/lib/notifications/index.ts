/**
 * Notification Service
 * Unified export for all notification functionality
 */

export * from "./providers";
export * from "./trigger";

// Re-export common functions
export {
  sendNotification,
  sendSMS,
  sendWhatsAppTwilio,
  sendWhatsAppGupshup,
} from "./providers";

export {
  triggerNotifications,
  notifyShipmentBooked,
  notifyOutForDelivery,
  notifyDelivered,
  notifyDeliveryFailed,
} from "./trigger";
