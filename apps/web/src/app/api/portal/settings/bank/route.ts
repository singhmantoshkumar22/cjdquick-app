import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { prisma } from "@cjdquick/database";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const bankAccount = await prisma.brandBankAccount.findFirst({
      where: { brandId: user.brandId, isDefault: true },
    });

    if (!bankAccount) {
      return NextResponse.json({
        success: true,
        data: {
          accountHolderName: "",
          accountNumber: "",
          ifscCode: "",
          bankName: "",
          branchName: "",
          hasAccount: false,
        },
      });
    }

    // Mask account number for security (show last 4 digits)
    const maskedAccount = bankAccount.accountNumber
      ? "••••••••" + bankAccount.accountNumber.slice(-4)
      : "";

    return NextResponse.json({
      success: true,
      data: {
        id: bankAccount.id,
        accountHolderName: bankAccount.accountHolderName,
        accountNumber: maskedAccount,
        ifscCode: bankAccount.ifscCode,
        bankName: bankAccount.bankName,
        branchName: bankAccount.branchName || "",
        hasAccount: true,
        isVerified: bankAccount.isVerified,
      },
    });
  } catch (error) {
    console.error("Bank fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bank details" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { accountHolderName, accountNumber, ifscCode, bankName, branchName } = body;

    // Validate required fields
    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if bank account exists
    const existing = await prisma.brandBankAccount.findFirst({
      where: { brandId: user.brandId },
    });

    if (existing) {
      await prisma.brandBankAccount.update({
        where: { id: existing.id },
        data: {
          accountHolderName,
          accountNumber,
          ifscCode,
          bankName,
          branchName,
          isVerified: false, // Reset verification on update
        },
      });
    } else {
      await prisma.brandBankAccount.create({
        data: {
          brandId: user.brandId,
          accountHolderName,
          accountNumber,
          ifscCode,
          bankName,
          branchName,
          isDefault: true,
          isVerified: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: "Bank details updated successfully" },
    });
  } catch (error) {
    console.error("Bank update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update bank details" }, { status: 500 });
  }
}
