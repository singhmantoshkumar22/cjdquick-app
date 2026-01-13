import { NextRequest } from "next/server";
import { prisma } from "@cjdquick/database";

export interface UnifiedContext {
  // Company context (3PL operator)
  companyId: string;
  companyCode: string;
  companyName: string;

  // Brand context (B2B client or B2C seller)
  brandId: string;
  brandCode: string;
  brandName: string;
  brandType: "B2B" | "B2C";

  // User context
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;

  // Status
  status: string;
  kycStatus: string;

  // Location access (for multi-location brands)
  locationIds: string[] | null; // null means all locations
}

export interface AdminContext {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  companyId: string | null;
  locationIds: string[] | null; // null means all locations (super admin)
}

/**
 * Get unified brand user context from request
 * Works for both B2B and B2C users authenticating via Brand model
 * Note: This requires BrandUserSession with user relation to be set up
 */
export async function getUnifiedUserFromRequest(
  request: NextRequest
): Promise<UnifiedContext | null> {
  // For now, this returns null - the brand user authentication
  // needs to be implemented separately when the portal is built
  return null;
}

/**
 * Get admin user context from request
 * For internal staff (3PL operators)
 */
export async function getAdminFromRequest(
  request: NextRequest
): Promise<AdminContext | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            companyId: true,
            locationAccess: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || !session.isActive || new Date() > session.expiresAt) {
      return null;
    }

    if (!session.user.isActive) {
      return null;
    }

    const ADMIN_ROLES = ["SUPER_ADMIN", "HUB_MANAGER", "OPERATOR", "ADMIN"];
    if (!ADMIN_ROLES.includes(session.user.role)) {
      return null;
    }

    // Update last used timestamp
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    // Parse location access
    let locationIds: string[] | null = null;
    if (session.user.role !== "SUPER_ADMIN" && session.user.locationAccess) {
      try {
        locationIds = JSON.parse(session.user.locationAccess);
      } catch {
        locationIds = [];
      }
    }

    return {
      userId: session.user.id,
      userName: session.user.name ?? "",
      userEmail: session.user.email,
      userRole: session.user.role,
      companyId: session.user.companyId,
      locationIds,
    };
  } catch (error) {
    console.error("Admin auth error:", error);
    return null;
  }
}

/**
 * Try to authenticate from either unified (brand) or admin context
 * Returns whichever context is valid
 */
export async function getAnyAuthContext(
  request: NextRequest
): Promise<{ type: "brand"; context: UnifiedContext } | { type: "admin"; context: AdminContext } | null> {
  // Try brand auth first (for future when it's implemented)
  const brandContext = await getUnifiedUserFromRequest(request);
  if (brandContext) {
    return { type: "brand", context: brandContext };
  }

  // Try admin auth
  const adminContext = await getAdminFromRequest(request);
  if (adminContext) {
    return { type: "admin", context: adminContext };
  }

  return null;
}

/**
 * Build location filter based on user's access
 */
export function buildLocationFilter(
  locationIds: string[] | null,
  requestedLocationId?: string | null,
  fieldName: string = "locationId"
): Record<string, any> | undefined {
  // If locationIds is null, user has access to all locations
  if (locationIds === null) {
    if (requestedLocationId) {
      return { [fieldName]: requestedLocationId };
    }
    return undefined;
  }

  // Limited location access
  if (locationIds.length === 0) {
    return { [fieldName]: "NO_ACCESS" };
  }

  if (requestedLocationId) {
    if (locationIds.includes(requestedLocationId)) {
      return { [fieldName]: requestedLocationId };
    }
    return { [fieldName]: "NO_ACCESS" };
  }

  if (locationIds.length === 1) {
    return { [fieldName]: locationIds[0] };
  }

  return { [fieldName]: { in: locationIds } };
}

/**
 * Generate random token for sessions
 */
export function generateToken(length: number = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
