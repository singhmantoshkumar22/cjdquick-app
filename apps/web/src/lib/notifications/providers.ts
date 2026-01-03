/**
 * SMS & WhatsApp Provider Integrations
 * Supports: MSG91, Twilio, Gupshup
 */

export interface SendResult {
  success: boolean;
  provider: string;
  providerRef: string | null;
  cost: number;
  error?: string;
  deliveryStatus?: string;
}

export interface NotificationMessage {
  channel: "SMS" | "WHATSAPP" | "EMAIL";
  to: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}

// SMS Provider - MSG91
export async function sendSMS(
  phone: string,
  message: string,
  templateId?: string
): Promise<SendResult> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || "CJDQCK";

  if (!authKey) {
    console.warn("MSG91_AUTH_KEY not configured, using simulation");
    return simulateSend("SMS", phone);
  }

  try {
    // Format phone number (add 91 prefix for India if not present)
    const formattedPhone = formatIndianPhone(phone);

    const response = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: authKey,
      },
      body: JSON.stringify({
        template_id: templateId || process.env.MSG91_DEFAULT_TEMPLATE,
        sender: senderId,
        mobiles: formattedPhone,
        message: message,
      }),
    });

    const data = await response.json();

    if (data.type === "success") {
      return {
        success: true,
        provider: "MSG91",
        providerRef: data.request_id,
        cost: 0.25,
        deliveryStatus: "SENT",
      };
    } else {
      return {
        success: false,
        provider: "MSG91",
        providerRef: null,
        cost: 0,
        error: data.message || "SMS sending failed",
      };
    }
  } catch (error: any) {
    console.error("MSG91 SMS Error:", error);
    return {
      success: false,
      provider: "MSG91",
      providerRef: null,
      cost: 0,
      error: error.message,
    };
  }
}

// WhatsApp via Twilio
export async function sendWhatsAppTwilio(
  phone: string,
  message: string,
  templateSid?: string,
  contentVariables?: Record<string, string>
): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    console.warn("Twilio credentials not configured, using simulation");
    return simulateSend("WHATSAPP", phone);
  }

  try {
    const formattedPhone = formatIndianPhone(phone);
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const params = new URLSearchParams();
    params.append("From", whatsappFrom);
    params.append("To", `whatsapp:+${formattedPhone}`);

    if (templateSid && contentVariables) {
      // Template message
      params.append("ContentSid", templateSid);
      params.append("ContentVariables", JSON.stringify(contentVariables));
    } else {
      // Regular message (sandbox only)
      params.append("Body", message);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const data = await response.json();

    if (data.sid) {
      return {
        success: true,
        provider: "TWILIO_WHATSAPP",
        providerRef: data.sid,
        cost: 0.5,
        deliveryStatus: data.status,
      };
    } else {
      return {
        success: false,
        provider: "TWILIO_WHATSAPP",
        providerRef: null,
        cost: 0,
        error: data.message || "WhatsApp sending failed",
      };
    }
  } catch (error: any) {
    console.error("Twilio WhatsApp Error:", error);
    return {
      success: false,
      provider: "TWILIO_WHATSAPP",
      providerRef: null,
      cost: 0,
      error: error.message,
    };
  }
}

// WhatsApp via Gupshup (Alternative provider, popular in India)
export async function sendWhatsAppGupshup(
  phone: string,
  message: string,
  templateName?: string,
  templateParams?: string[]
): Promise<SendResult> {
  const apiKey = process.env.GUPSHUP_API_KEY;
  const appName = process.env.GUPSHUP_APP_NAME;
  const sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER;

  if (!apiKey || !appName) {
    console.warn("Gupshup credentials not configured, using simulation");
    return simulateSend("WHATSAPP", phone);
  }

  try {
    const formattedPhone = formatIndianPhone(phone);

    const params = new URLSearchParams();
    params.append("channel", "whatsapp");
    params.append("source", sourceNumber || "");
    params.append("destination", formattedPhone);
    params.append("src.name", appName);

    if (templateName && templateParams) {
      // Template message
      params.append("template", JSON.stringify({
        id: templateName,
        params: templateParams,
      }));
    } else {
      // Text message
      params.append("message", JSON.stringify({
        type: "text",
        text: message,
      }));
    }

    const response = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: apiKey,
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.status === "submitted") {
      return {
        success: true,
        provider: "GUPSHUP",
        providerRef: data.messageId,
        cost: 0.45,
        deliveryStatus: "SENT",
      };
    } else {
      return {
        success: false,
        provider: "GUPSHUP",
        providerRef: null,
        cost: 0,
        error: data.message || "WhatsApp sending failed",
      };
    }
  } catch (error: any) {
    console.error("Gupshup WhatsApp Error:", error);
    return {
      success: false,
      provider: "GUPSHUP",
      providerRef: null,
      cost: 0,
      error: error.message,
    };
  }
}

// Format Indian phone numbers
function formatIndianPhone(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");

  // Handle various formats
  if (cleaned.length === 10) {
    // Add India country code
    cleaned = "91" + cleaned;
  } else if (cleaned.startsWith("0")) {
    // Remove leading 0 and add country code
    cleaned = "91" + cleaned.substring(1);
  } else if (!cleaned.startsWith("91") && cleaned.length === 12) {
    // Already has country code without +
  }

  return cleaned;
}

// Simulation for development/testing
function simulateSend(channel: string, to: string): Promise<SendResult> {
  // Simulate 95% success rate
  const success = Math.random() > 0.05;

  console.log(`[SIMULATED ${channel}] To: ${to}, Success: ${success}`);

  return Promise.resolve({
    success,
    provider: `SIMULATED_${channel}`,
    providerRef: success ? `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
    cost: channel === "SMS" ? 0.25 : 0.5,
    error: success ? undefined : "Simulated failure for testing",
    deliveryStatus: success ? "SENT" : "FAILED",
  });
}

// Main dispatcher
export async function sendNotification(notification: NotificationMessage): Promise<SendResult> {
  const preferredWhatsAppProvider = process.env.WHATSAPP_PROVIDER || "GUPSHUP"; // TWILIO or GUPSHUP

  switch (notification.channel) {
    case "SMS":
      return sendSMS(notification.to, notification.message, notification.templateId);

    case "WHATSAPP":
      if (preferredWhatsAppProvider === "TWILIO") {
        return sendWhatsAppTwilio(
          notification.to,
          notification.message,
          notification.templateId,
          notification.variables
        );
      } else {
        const params = notification.variables
          ? Object.values(notification.variables)
          : undefined;
        return sendWhatsAppGupshup(
          notification.to,
          notification.message,
          notification.templateId,
          params
        );
      }

    default:
      return {
        success: false,
        provider: "UNKNOWN",
        providerRef: null,
        cost: 0,
        error: `Unsupported channel: ${notification.channel}`,
      };
  }
}
