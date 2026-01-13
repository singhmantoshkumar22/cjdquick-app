// OMS Backend Client for internal service-to-service communication

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";
const INTERNAL_API_KEY = process.env.OMS_INTERNAL_API_KEY || "cjd-internal-api-key-2024";

interface OmsRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Make a request to the OMS backend with internal API key authentication
 */
export async function omsRequest<T = unknown>(
  endpoint: string,
  options: OmsRequestOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { method = "GET", body, headers = {} } = options;

  try {
    const response = await fetch(`${OMS_BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": INTERNAL_API_KEY,
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: error || `OMS request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("OMS request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if OMS backend is available
 */
export async function isOmsAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OMS_BASE_URL}/api/health`, {
      method: "GET",
      headers: {
        "x-internal-api-key": INTERNAL_API_KEY,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export { OMS_BASE_URL, INTERNAL_API_KEY };
