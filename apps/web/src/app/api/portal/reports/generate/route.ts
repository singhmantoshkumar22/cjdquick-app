import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getPortalUserFromRequest } from "@/lib/portal-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reportType, dateRange, serviceType } = body;

    // Calculate date range
    let startDate = new Date();
    switch (dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "last7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "last30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "thisMonth":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        break;
      case "lastMonth":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        break;
    }

    let csvContent = "";

    if (reportType === "shipment") {
      // Fetch orders and generate CSV
      const orders = await prisma.unifiedOrder.findMany({
        where: {
          orderType: serviceType,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });

      csvContent = "Order Number,AWB,Customer Name,Phone,City,State,Pincode,Amount,Payment Mode,Status,Created At\n";
      orders.forEach((o) => {
        csvContent += `${o.orderNumber},${o.awbNumber || ""},${o.customerName},${o.customerPhone},${o.shippingCity},${o.shippingState},${o.shippingPincode},${o.totalAmount},${o.paymentMode},${o.status},${o.createdAt.toISOString()}\n`;
      });
    } else if (reportType === "delivery") {
      const orders = await prisma.unifiedOrder.findMany({
        where: {
          orderType: serviceType,
          status: "DELIVERED",
          deliveredAt: { gte: startDate },
        },
        take: 1000,
      });

      csvContent = "Order Number,AWB,Customer,City,Delivered At,TAT Days\n";
      orders.forEach((o) => {
        const tat = o.deliveredAt && o.createdAt
          ? Math.ceil((o.deliveredAt.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : "N/A";
        csvContent += `${o.orderNumber},${o.awbNumber || ""},${o.customerName},${o.shippingCity},${o.deliveredAt?.toISOString() || ""},${tat}\n`;
      });
    } else if (reportType === "ndr") {
      const orders = await prisma.unifiedOrder.findMany({
        where: {
          orderType: serviceType,
          status: { in: ["NDR", "EXCEPTION", "UNDELIVERED"] },
          updatedAt: { gte: startDate },
        },
        take: 1000,
      });

      csvContent = "Order Number,AWB,Customer,Phone,City,Status,Updated At\n";
      orders.forEach((o) => {
        csvContent += `${o.orderNumber},${o.awbNumber || ""},${o.customerName},${o.customerPhone},${o.shippingCity},${o.status},${o.updatedAt.toISOString()}\n`;
      });
    } else if (reportType === "cod") {
      const orders = await prisma.unifiedOrder.findMany({
        where: {
          orderType: serviceType,
          paymentMode: "COD",
          createdAt: { gte: startDate },
        },
        take: 1000,
      });

      csvContent = "Order Number,AWB,Customer,COD Amount,Collected,Status,Created At\n";
      orders.forEach((o) => {
        csvContent += `${o.orderNumber},${o.awbNumber || ""},${o.customerName},${o.codAmount},${o.codCollected},${o.status},${o.createdAt.toISOString()}\n`;
      });
    } else if (reportType === "rto") {
      const orders = await prisma.unifiedOrder.findMany({
        where: {
          orderType: serviceType,
          status: { in: ["RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED"] },
          updatedAt: { gte: startDate },
        },
        take: 1000,
      });

      csvContent = "Order Number,AWB,Customer,City,RTO Status,Updated At\n";
      orders.forEach((o) => {
        csvContent += `${o.orderNumber},${o.awbNumber || ""},${o.customerName},${o.shippingCity},${o.status},${o.updatedAt.toISOString()}\n`;
      });
    } else {
      // Default billing report
      csvContent = "Report Type,Date Range,Service Type\n";
      csvContent += `${reportType},${dateRange},${serviceType}\n`;
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${reportType}-report.csv"`,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}
