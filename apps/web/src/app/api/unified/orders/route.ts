import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext, buildLocationFilter } from "@/lib/unified-auth";
import {
  createUnifiedOrder,
  listOrders,
  getOrderStats,
  selectTransporter,
  type CreateOrderParams,
} from "@/lib/unified-order-service";

// GET: List orders with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status") || undefined;
    const orderType = searchParams.get("orderType") as "B2B" | "B2C" | undefined;
    const channel = searchParams.get("channel") || undefined;
    const search = searchParams.get("search") || undefined;
    const locationId = searchParams.get("locationId") || undefined;
    const brandId = searchParams.get("brandId") || undefined;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;
    const statsOnly = searchParams.get("statsOnly") === "true";

    // Build filters based on auth context
    let filters: any = {};

    if (auth.type === "brand") {
      // Brand user can only see their own orders
      filters.brandId = auth.context.brandId;
      // Apply location filter if user has limited access
      const locFilter = buildLocationFilter(auth.context.locationIds, locationId);
      if (locFilter) {
        filters = { ...filters, ...locFilter };
      }
    } else {
      // Admin user
      if (brandId) {
        filters.brandId = brandId;
      }
      const locFilter = buildLocationFilter(auth.context.locationIds, locationId);
      if (locFilter) {
        filters = { ...filters, ...locFilter };
      }
    }

    if (status) filters.status = status;
    if (orderType) filters.orderType = orderType;
    if (channel) filters.channel = channel;

    // Return stats only if requested
    if (statsOnly) {
      const stats = await getOrderStats(
        filters.brandId,
        filters.locationId,
        fromDate ? Math.ceil((Date.now() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)) : 30
      );
      return NextResponse.json({ success: true, data: stats });
    }

    const result = await listOrders({
      page,
      pageSize,
      ...filters,
      search,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("List unified orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST: Create a new order
export async function POST(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "customerName",
      "customerPhone",
      "shippingAddress",
      "shippingCity",
      "shippingState",
      "shippingPincode",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate items
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Build order params
    let brandId: string;
    let orderType: "B2B" | "B2C";

    if (auth.type === "brand") {
      brandId = auth.context.brandId;
      orderType = auth.context.brandType;
    } else {
      // Admin creating order - brandId must be provided
      if (!body.brandId) {
        return NextResponse.json(
          { success: false, error: "brandId is required for admin users" },
          { status: 400 }
        );
      }
      brandId = body.brandId;
      orderType = body.orderType || "B2C";
    }

    // Validate location access
    if (body.locationId) {
      const allowedLocations = auth.type === "brand"
        ? auth.context.locationIds
        : auth.context.locationIds;

      if (allowedLocations && !allowedLocations.includes(body.locationId)) {
        return NextResponse.json(
          { success: false, error: "Access denied to specified location" },
          { status: 403 }
        );
      }
    }

    // Calculate total weight from items if not provided
    const totalWeight = body.totalWeight || body.items.reduce((sum: number, item: any) => {
      return sum + (item.weight || 0.5) * (item.quantity || 1);
    }, 0) || 0.5;

    const orderParams: CreateOrderParams = {
      brandId,
      orderType,
      channel: body.channel || "MANUAL",
      externalOrderNo: body.externalOrderNo || body.channelOrderId,
      locationId: body.locationId,
      pickupLocationId: body.pickupLocationId,
      brandPickupId: body.brandPickupId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      shippingAddress: body.shippingAddress,
      shippingPincode: body.shippingPincode,
      shippingCity: body.shippingCity,
      shippingState: body.shippingState,
      shippingCountry: body.shippingCountry || "India",
      billingAddress: body.billingAddress,
      originPincode: body.originPincode || body.pickupPincode || "",
      totalWeight,
      length: body.length,
      width: body.width,
      height: body.height,
      packageCount: body.packageCount || 1,
      items: body.items.map((item: any) => ({
        skuId: item.skuId,
        skuCode: item.skuCode,
        name: item.name || item.skuName || "Item",
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        taxAmount: item.taxAmount || item.tax || 0,
        discount: item.discount || 0,
        weight: item.weight,
        hsn: item.hsn,
      })),
      paymentMode: body.paymentMode || "PREPAID",
      codAmount: body.codAmount || 0,
      priority: body.priority || 0,
      tags: body.tags,
      remarks: body.remarks || body.instructions,
      shipByDate: body.shipByDate ? new Date(body.shipByDate) : undefined,
      promisedDate: body.promisedDate ? new Date(body.promisedDate) : undefined,
    };

    // Auto-select transporter if requested
    let autoTransporter = null;
    if (body.autoSelectTransporter && orderParams.originPincode) {
      const transporterResult = await selectTransporter({
        originPincode: orderParams.originPincode,
        destinationPincode: orderParams.shippingPincode,
        weightKg: totalWeight,
        isCod: orderParams.paymentMode === "COD",
        codAmount: orderParams.codAmount || 0,
      });

      if (transporterResult.recommended) {
        autoTransporter = transporterResult.recommended;
      }
    }

    const order = await createUnifiedOrder(orderParams);

    return NextResponse.json({
      success: true,
      data: order,
      ...(autoTransporter && {
        transporterSelection: {
          selected: autoTransporter,
          alternatives: [],
          message: `Auto-selected ${autoTransporter.transporterCode} with rate ₹${autoTransporter.rate}`,
        },
      }),
    });
  } catch (error: any) {
    console.error("Create unified order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
