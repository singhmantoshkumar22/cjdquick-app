import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import bcrypt from "bcryptjs";

function generateToken(length: number = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find brand user by email (get first matching user)
    const brandUser = await prisma.brandUser.findFirst({
      where: { email, isActive: true },
      include: {
        brand: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            companyId: true,
            status: true,
            isActive: true,
            serviceModel: true,
          },
        },
      },
    });

    if (!brandUser) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!brandUser.isActive) {
      return NextResponse.json(
        { success: false, error: "Account is disabled" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, brandUser.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if brand is active
    if (!brandUser.brand.isActive || brandUser.brand.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Brand account is not active" },
        { status: 401 }
      );
    }

    // Get all brands accessible by this user (where they have a BrandUser record)
    const userBrandAccess = await prisma.brandUser.findMany({
      where: {
        email: brandUser.email,
        isActive: true,
        brand: {
          isActive: true,
          status: "ACTIVE",
        },
      },
      include: {
        brand: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            serviceModel: true,
          },
        },
      },
      orderBy: {
        brand: { name: "asc" },
      },
    });

    // Extract unique brands
    const brands = userBrandAccess.map((uba) => ({
      id: uba.brand.id,
      code: uba.brand.code,
      name: uba.brand.name,
      type: uba.brand.type,
      serviceModel: uba.brand.serviceModel,
    }));

    // Create session token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    await prisma.brandUserSession.create({
      data: {
        token,
        brandUserId: brandUser.id,
        expiresAt,
        isActive: true,
      },
    });

    // Update last login
    await prisma.brandUser.update({
      where: { id: brandUser.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: brandUser.id,
          name: brandUser.name,
          email: brandUser.email,
          role: brandUser.role,
          serviceModel: brandUser.brand.serviceModel,
        },
        brands: brands.map((b) => ({
          id: b.id,
          code: b.code,
          name: b.name,
          type: b.type,
          serviceModel: b.serviceModel,
        })),
        currentBrand: {
          id: brandUser.brand.id,
          code: brandUser.brand.code,
          name: brandUser.brand.name,
          type: brandUser.brand.type,
          serviceModel: brandUser.brand.serviceModel,
        },
      },
    });
  } catch (error) {
    console.error("Portal login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
