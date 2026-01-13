import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { prisma } from "@cjdquick/database";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: user.brandId },
      select: {
        id: true,
        name: true,
        businessName: true,
        legalName: true,
        gst: true,
        pan: true,
        address: true,
        website: true,
        description: true,
      },
    });

    if (!brand) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    // Parse address JSON
    let addressData = { address: "", city: "", state: "", pincode: "" };
    if (brand.address) {
      try {
        addressData = JSON.parse(brand.address);
      } catch (e) {
        addressData.address = brand.address;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        companyName: brand.businessName || brand.name,
        legalName: brand.legalName || "",
        gstNumber: brand.gst || "",
        panNumber: brand.pan || "",
        registeredAddress: addressData.address || "",
        city: addressData.city || "",
        state: addressData.state || "",
        pincode: addressData.pincode || "",
        industry: brand.description || "E-Commerce",
        website: brand.website || "",
      },
    });
  } catch (error) {
    console.error("Company fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch company" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, gstNumber, panNumber, registeredAddress, city, state, pincode, industry, website } = body;

    const addressJson = JSON.stringify({ address: registeredAddress, city, state, pincode });

    await prisma.brand.update({
      where: { id: user.brandId },
      data: {
        businessName: companyName,
        gst: gstNumber,
        pan: panNumber,
        address: addressJson,
        description: industry,
        website,
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Company details updated successfully" },
    });
  } catch (error) {
    console.error("Company update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update company" }, { status: 500 });
  }
}
