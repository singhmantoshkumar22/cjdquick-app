import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";

// Types for report data
interface SalesReport {
  reportType: "sales";
  dateRange: { from: Date; to: Date };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalDiscount: number;
    totalShipping: number;
    totalTax: number;
    avgOrderValue: number;
  };
  trend: Array<{ date: Date; orders: number; revenue: number; items: number }>;
  byChannel: Array<{ channel: string; orders: number; revenue: number }>;
  byPaymentMode: Array<{ paymentMode: string; orders: number; revenue: number }>;
  topSKUs: Array<{
    skuId: string;
    skuCode: string;
    skuName: string;
    quantity: number;
    revenue: number;
    orders: number;
  }>;
}

interface InventoryReport {
  reportType: "inventory";
  summary: {
    totalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    uniqueSKUs: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringCount: number;
  };
  byZoneType: Array<{ zoneType: string; quantity: number; skuCount: number }>;
  byLocation: Array<{
    locationId: string;
    locationCode: string;
    locationName: string;
    quantity: number;
    skuCount: number;
  }>;
  lowStockItems: Array<{
    skuId: string;
    skuCode: string;
    skuName: string;
    quantity: number;
    reorderLevel: number;
  }>;
  outOfStockItems: Array<{ skuId: string; skuCode: string; skuName: string }>;
}

interface FulfillmentReport {
  reportType: "fulfillment";
  dateRange: { from: Date; to: Date };
  summary: {
    avgFulfillmentTime: number;
    avgDeliveryTime: number;
    rtoRate: number;
    totalRTO: number;
  };
  ordersByStatus: Record<string, number>;
  dailyFulfillment: Array<{
    date: Date;
    created: number;
    shipped: number;
    delivered: number;
  }>;
  byTransporter: Array<{
    transporterId: string;
    transporterName: string;
    total: number;
    delivered: number;
    rto: number;
    deliveryRate: number;
  }>;
}

interface ReturnsReport {
  reportType: "returns";
  dateRange: { from: Date; to: Date };
  summary: {
    totalReturns: number;
    totalRefundAmount: number;
  };
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  dailyReturns: Array<{ date: Date; count: number; refundAmount: number }>;
  topReturnedSKUs: Array<{
    skuId: string;
    skuCode: string;
    skuName: string;
    quantity: number;
    returns: number;
  }>;
  qcAnalysis: Record<string, number>;
}

interface SKUPerformanceReport {
  reportType: "sku-performance";
  dateRange: { from: Date; to: Date };
  skuPerformance: Array<{
    skuId: string;
    skuCode: string;
    skuName: string;
    category: string;
    brand: string;
    orderCount: number;
    quantity: number;
    revenue: number;
    returns: number;
    returnRate: number;
    currentStock: number;
  }>;
  byCategory: Array<{
    category: string;
    orderCount: number;
    quantity: number;
    revenue: number;
  }>;
  byBrand: Array<{
    brand: string;
    orderCount: number;
    quantity: number;
    revenue: number;
  }>;
}

type ReportData =
  | SalesReport
  | InventoryReport
  | FulfillmentReport
  | ReturnsReport
  | SKUPerformanceReport;

// GET /api/reports/export - Export report in various formats
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "excel"; // excel, csv, pdf
    const reportType = searchParams.get("type") || "sales";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const locationId = searchParams.get("locationId") || "";
    const channel = searchParams.get("channel") || "";
    const groupBy = searchParams.get("groupBy") || "day";

    // Build query string for internal report fetch
    const params = new URLSearchParams({
      type: reportType,
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(locationId && { locationId }),
      ...(channel && { channel }),
      ...(groupBy && { groupBy }),
    });

    // Fetch report data from internal API
    const reportUrl = new URL(`/api/reports?${params.toString()}`, request.url);
    const reportResponse = await fetch(reportUrl.toString(), {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    });

    if (!reportResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch report data" },
        { status: 500 }
      );
    }

    const reportData: ReportData = await reportResponse.json();

    switch (format.toLowerCase()) {
      case "excel":
        return exportToExcel(reportData, reportType);
      case "csv":
        return exportToCSV(reportData, reportType);
      case "pdf":
        return exportToPDF(reportData, reportType);
      default:
        return NextResponse.json(
          { error: "Invalid format. Use excel, csv, or pdf" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

function exportToExcel(data: ReportData, reportType: string): NextResponse {
  const workbook = XLSX.utils.book_new();
  const timestamp = new Date().toISOString().split("T")[0];

  switch (reportType) {
    case "sales": {
      const salesData = data as SalesReport;

      // Summary sheet
      const summarySheet = XLSX.utils.json_to_sheet([
        {
          Metric: "Total Orders",
          Value: salesData.summary.totalOrders,
        },
        {
          Metric: "Total Revenue",
          Value: `₹${salesData.summary.totalRevenue.toLocaleString()}`,
        },
        {
          Metric: "Total Discount",
          Value: `₹${salesData.summary.totalDiscount.toLocaleString()}`,
        },
        {
          Metric: "Total Shipping",
          Value: `₹${salesData.summary.totalShipping.toLocaleString()}`,
        },
        {
          Metric: "Total Tax",
          Value: `₹${salesData.summary.totalTax.toLocaleString()}`,
        },
        {
          Metric: "Avg Order Value",
          Value: `₹${salesData.summary.avgOrderValue.toFixed(2)}`,
        },
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Trend sheet
      const trendSheet = XLSX.utils.json_to_sheet(
        salesData.trend.map((item) => ({
          Date: new Date(item.date).toLocaleDateString("en-IN"),
          Orders: item.orders,
          Revenue: item.revenue,
          Items: item.items,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, trendSheet, "Daily Trend");

      // By Channel sheet
      const channelSheet = XLSX.utils.json_to_sheet(
        salesData.byChannel.map((item) => ({
          Channel: item.channel,
          Orders: item.orders,
          Revenue: item.revenue,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, channelSheet, "By Channel");

      // By Payment Mode sheet
      const paymentSheet = XLSX.utils.json_to_sheet(
        salesData.byPaymentMode.map((item) => ({
          "Payment Mode": item.paymentMode,
          Orders: item.orders,
          Revenue: item.revenue,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, paymentSheet, "By Payment Mode");

      // Top SKUs sheet
      const skuSheet = XLSX.utils.json_to_sheet(
        salesData.topSKUs.map((item) => ({
          "SKU Code": item.skuCode,
          "SKU Name": item.skuName,
          Quantity: item.quantity,
          Revenue: item.revenue,
          Orders: item.orders,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, skuSheet, "Top SKUs");
      break;
    }

    case "inventory": {
      const invData = data as InventoryReport;

      // Summary sheet
      const summarySheet = XLSX.utils.json_to_sheet([
        { Metric: "Total Quantity", Value: invData.summary.totalQuantity },
        { Metric: "Reserved Quantity", Value: invData.summary.reservedQuantity },
        { Metric: "Available Quantity", Value: invData.summary.availableQuantity },
        { Metric: "Unique SKUs", Value: invData.summary.uniqueSKUs },
        { Metric: "Low Stock Count", Value: invData.summary.lowStockCount },
        { Metric: "Out of Stock Count", Value: invData.summary.outOfStockCount },
        { Metric: "Expiring Soon Count", Value: invData.summary.expiringCount },
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // By Zone sheet
      const zoneSheet = XLSX.utils.json_to_sheet(
        invData.byZoneType.map((item) => ({
          "Zone Type": item.zoneType,
          Quantity: item.quantity,
          "SKU Count": item.skuCount,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, zoneSheet, "By Zone");

      // By Location sheet
      const locationSheet = XLSX.utils.json_to_sheet(
        invData.byLocation.map((item) => ({
          "Location Code": item.locationCode,
          "Location Name": item.locationName,
          Quantity: item.quantity,
          "SKU Count": item.skuCount,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, locationSheet, "By Location");

      // Low Stock sheet
      const lowStockSheet = XLSX.utils.json_to_sheet(
        invData.lowStockItems.map((item) => ({
          "SKU Code": item.skuCode,
          "SKU Name": item.skuName,
          "Current Qty": item.quantity,
          "Reorder Level": item.reorderLevel,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, lowStockSheet, "Low Stock");

      // Out of Stock sheet
      const oosSheet = XLSX.utils.json_to_sheet(
        invData.outOfStockItems.map((item) => ({
          "SKU Code": item.skuCode,
          "SKU Name": item.skuName,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, oosSheet, "Out of Stock");
      break;
    }

    case "fulfillment": {
      const fulfillData = data as FulfillmentReport;

      // Summary sheet
      const summarySheet = XLSX.utils.json_to_sheet([
        {
          Metric: "Avg Fulfillment Time (hrs)",
          Value: fulfillData.summary.avgFulfillmentTime,
        },
        {
          Metric: "Avg Delivery Time (hrs)",
          Value: fulfillData.summary.avgDeliveryTime,
        },
        { Metric: "RTO Rate (%)", Value: fulfillData.summary.rtoRate },
        { Metric: "Total RTO", Value: fulfillData.summary.totalRTO },
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // By Status sheet
      const statusSheet = XLSX.utils.json_to_sheet(
        Object.entries(fulfillData.ordersByStatus).map(([status, count]) => ({
          Status: status,
          Count: count,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, statusSheet, "By Status");

      // Daily Fulfillment sheet
      const dailySheet = XLSX.utils.json_to_sheet(
        fulfillData.dailyFulfillment.map((item) => ({
          Date: new Date(item.date).toLocaleDateString("en-IN"),
          Created: item.created,
          Shipped: item.shipped,
          Delivered: item.delivered,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Fulfillment");

      // By Transporter sheet
      const transporterSheet = XLSX.utils.json_to_sheet(
        fulfillData.byTransporter.map((item) => ({
          Transporter: item.transporterName,
          Total: item.total,
          Delivered: item.delivered,
          RTO: item.rto,
          "Delivery Rate (%)": item.deliveryRate,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, transporterSheet, "By Transporter");
      break;
    }

    case "returns": {
      const returnsData = data as ReturnsReport;

      // Summary sheet
      const summarySheet = XLSX.utils.json_to_sheet([
        { Metric: "Total Returns", Value: returnsData.summary.totalReturns },
        {
          Metric: "Total Refund Amount",
          Value: `₹${returnsData.summary.totalRefundAmount.toLocaleString()}`,
        },
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // By Type sheet
      const typeSheet = XLSX.utils.json_to_sheet(
        Object.entries(returnsData.byType).map(([type, count]) => ({
          Type: type,
          Count: count,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, typeSheet, "By Type");

      // By Status sheet
      const statusSheet = XLSX.utils.json_to_sheet(
        Object.entries(returnsData.byStatus).map(([status, count]) => ({
          Status: status,
          Count: count,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, statusSheet, "By Status");

      // Daily Returns sheet
      const dailySheet = XLSX.utils.json_to_sheet(
        returnsData.dailyReturns.map((item) => ({
          Date: new Date(item.date).toLocaleDateString("en-IN"),
          Count: item.count,
          "Refund Amount": item.refundAmount,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Returns");

      // Top Returned SKUs sheet
      const skuSheet = XLSX.utils.json_to_sheet(
        returnsData.topReturnedSKUs.map((item) => ({
          "SKU Code": item.skuCode,
          "SKU Name": item.skuName,
          Quantity: item.quantity,
          Returns: item.returns,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, skuSheet, "Top Returned SKUs");
      break;
    }

    case "sku-performance": {
      const perfData = data as SKUPerformanceReport;

      // SKU Performance sheet
      const skuSheet = XLSX.utils.json_to_sheet(
        perfData.skuPerformance.map((item) => ({
          "SKU Code": item.skuCode,
          "SKU Name": item.skuName,
          Category: item.category,
          Brand: item.brand,
          Orders: item.orderCount,
          Quantity: item.quantity,
          Revenue: item.revenue,
          Returns: item.returns,
          "Return Rate (%)": item.returnRate,
          "Current Stock": item.currentStock,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, skuSheet, "SKU Performance");

      // By Category sheet
      const categorySheet = XLSX.utils.json_to_sheet(
        perfData.byCategory.map((item) => ({
          Category: item.category,
          Orders: item.orderCount,
          Quantity: item.quantity,
          Revenue: item.revenue,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, categorySheet, "By Category");

      // By Brand sheet
      const brandSheet = XLSX.utils.json_to_sheet(
        perfData.byBrand.map((item) => ({
          Brand: item.brand,
          Orders: item.orderCount,
          Quantity: item.quantity,
          Revenue: item.revenue,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, brandSheet, "By Brand");
      break;
    }
  }

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${reportType}-report-${timestamp}.xlsx"`,
    },
  });
}

function exportToCSV(data: ReportData, reportType: string): NextResponse {
  const timestamp = new Date().toISOString().split("T")[0];
  let csvContent = "";

  switch (reportType) {
    case "sales": {
      const salesData = data as SalesReport;
      // Main data - daily trend
      csvContent = "Date,Orders,Revenue,Items\n";
      salesData.trend.forEach((item) => {
        csvContent += `${new Date(item.date).toLocaleDateString("en-IN")},${item.orders},${item.revenue},${item.items}\n`;
      });
      break;
    }

    case "inventory": {
      const invData = data as InventoryReport;
      // Low stock items
      csvContent =
        "SKU Code,SKU Name,Current Quantity,Reorder Level,Status\n";
      invData.lowStockItems.forEach((item) => {
        csvContent += `"${item.skuCode}","${item.skuName}",${item.quantity},${item.reorderLevel},Low Stock\n`;
      });
      invData.outOfStockItems.forEach((item) => {
        csvContent += `"${item.skuCode}","${item.skuName}",0,0,Out of Stock\n`;
      });
      break;
    }

    case "fulfillment": {
      const fulfillData = data as FulfillmentReport;
      // Daily fulfillment
      csvContent = "Date,Created,Shipped,Delivered\n";
      fulfillData.dailyFulfillment.forEach((item) => {
        csvContent += `${new Date(item.date).toLocaleDateString("en-IN")},${item.created},${item.shipped},${item.delivered}\n`;
      });
      break;
    }

    case "returns": {
      const returnsData = data as ReturnsReport;
      // Daily returns
      csvContent = "Date,Count,Refund Amount\n";
      returnsData.dailyReturns.forEach((item) => {
        csvContent += `${new Date(item.date).toLocaleDateString("en-IN")},${item.count},${item.refundAmount}\n`;
      });
      break;
    }

    case "sku-performance": {
      const perfData = data as SKUPerformanceReport;
      csvContent =
        "SKU Code,SKU Name,Category,Brand,Orders,Quantity,Revenue,Returns,Return Rate %,Current Stock\n";
      perfData.skuPerformance.forEach((item) => {
        csvContent += `"${item.skuCode}","${item.skuName}","${item.category}","${item.brand}",${item.orderCount},${item.quantity},${item.revenue},${item.returns},${item.returnRate},${item.currentStock}\n`;
      });
      break;
    }
  }

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportType}-report-${timestamp}.csv"`,
    },
  });
}

function exportToPDF(data: ReportData, reportType: string): NextResponse {
  const timestamp = new Date().toISOString().split("T")[0];

  // Generate PDF content as HTML for simplicity (can be converted by browser)
  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${reportType.toUpperCase()} Report - ${timestamp}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #3b82f6; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f8f9fa; font-weight: 600; }
    tr:nth-child(even) { background-color: #f8f9fa; }
    .summary-box { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-item { display: inline-block; margin: 10px 20px; }
    .summary-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .summary-label { font-size: 14px; color: #666; }
    .generated { color: #999; font-size: 12px; margin-top: 40px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${formatReportTitle(reportType)} Report</h1>
  <p>Generated on: ${new Date().toLocaleString("en-IN")}</p>
`;

  switch (reportType) {
    case "sales": {
      const salesData = data as SalesReport;
      htmlContent += `
  <div class="summary-box">
    <div class="summary-item">
      <div class="summary-value">${salesData.summary.totalOrders.toLocaleString()}</div>
      <div class="summary-label">Total Orders</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">₹${salesData.summary.totalRevenue.toLocaleString()}</div>
      <div class="summary-label">Total Revenue</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">₹${salesData.summary.avgOrderValue.toFixed(2)}</div>
      <div class="summary-label">Avg Order Value</div>
    </div>
  </div>

  <h2>Sales by Channel</h2>
  <table>
    <tr><th>Channel</th><th>Orders</th><th>Revenue</th></tr>
    ${salesData.byChannel.map((c) => `<tr><td>${c.channel}</td><td>${c.orders}</td><td>₹${c.revenue.toLocaleString()}</td></tr>`).join("")}
  </table>

  <h2>Top 10 SKUs</h2>
  <table>
    <tr><th>SKU Code</th><th>SKU Name</th><th>Qty Sold</th><th>Revenue</th></tr>
    ${salesData.topSKUs.map((s) => `<tr><td>${s.skuCode}</td><td>${s.skuName}</td><td>${s.quantity}</td><td>₹${s.revenue.toLocaleString()}</td></tr>`).join("")}
  </table>
`;
      break;
    }

    case "inventory": {
      const invData = data as InventoryReport;
      htmlContent += `
  <div class="summary-box">
    <div class="summary-item">
      <div class="summary-value">${invData.summary.totalQuantity.toLocaleString()}</div>
      <div class="summary-label">Total Quantity</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${invData.summary.uniqueSKUs.toLocaleString()}</div>
      <div class="summary-label">Unique SKUs</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${invData.summary.lowStockCount}</div>
      <div class="summary-label">Low Stock Items</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${invData.summary.outOfStockCount}</div>
      <div class="summary-label">Out of Stock</div>
    </div>
  </div>

  <h2>Inventory by Location</h2>
  <table>
    <tr><th>Location</th><th>Quantity</th><th>SKU Count</th></tr>
    ${invData.byLocation.map((l) => `<tr><td>${l.locationName}</td><td>${l.quantity.toLocaleString()}</td><td>${l.skuCount}</td></tr>`).join("")}
  </table>

  <h2>Low Stock Items</h2>
  <table>
    <tr><th>SKU Code</th><th>SKU Name</th><th>Current Qty</th><th>Reorder Level</th></tr>
    ${invData.lowStockItems.slice(0, 20).map((s) => `<tr><td>${s.skuCode}</td><td>${s.skuName}</td><td>${s.quantity}</td><td>${s.reorderLevel}</td></tr>`).join("")}
  </table>
`;
      break;
    }

    case "fulfillment": {
      const fulfillData = data as FulfillmentReport;
      htmlContent += `
  <div class="summary-box">
    <div class="summary-item">
      <div class="summary-value">${fulfillData.summary.avgFulfillmentTime.toFixed(1)} hrs</div>
      <div class="summary-label">Avg Fulfillment Time</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${fulfillData.summary.avgDeliveryTime.toFixed(1)} hrs</div>
      <div class="summary-label">Avg Delivery Time</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${fulfillData.summary.rtoRate}%</div>
      <div class="summary-label">RTO Rate</div>
    </div>
  </div>

  <h2>Orders by Status</h2>
  <table>
    <tr><th>Status</th><th>Count</th></tr>
    ${Object.entries(fulfillData.ordersByStatus).map(([status, count]) => `<tr><td>${status}</td><td>${count}</td></tr>`).join("")}
  </table>

  <h2>Performance by Transporter</h2>
  <table>
    <tr><th>Transporter</th><th>Total</th><th>Delivered</th><th>RTO</th><th>Delivery Rate</th></tr>
    ${fulfillData.byTransporter.map((t) => `<tr><td>${t.transporterName}</td><td>${t.total}</td><td>${t.delivered}</td><td>${t.rto}</td><td>${t.deliveryRate}%</td></tr>`).join("")}
  </table>
`;
      break;
    }

    case "returns": {
      const returnsData = data as ReturnsReport;
      htmlContent += `
  <div class="summary-box">
    <div class="summary-item">
      <div class="summary-value">${returnsData.summary.totalReturns.toLocaleString()}</div>
      <div class="summary-label">Total Returns</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">₹${returnsData.summary.totalRefundAmount.toLocaleString()}</div>
      <div class="summary-label">Total Refunds</div>
    </div>
  </div>

  <h2>Returns by Type</h2>
  <table>
    <tr><th>Type</th><th>Count</th></tr>
    ${Object.entries(returnsData.byType).map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`).join("")}
  </table>

  <h2>Top Returned SKUs</h2>
  <table>
    <tr><th>SKU Code</th><th>SKU Name</th><th>Quantity</th><th>Returns</th></tr>
    ${returnsData.topReturnedSKUs.map((s) => `<tr><td>${s.skuCode}</td><td>${s.skuName}</td><td>${s.quantity}</td><td>${s.returns}</td></tr>`).join("")}
  </table>
`;
      break;
    }

    case "sku-performance": {
      const perfData = data as SKUPerformanceReport;
      htmlContent += `
  <h2>SKU Performance</h2>
  <table>
    <tr><th>SKU Code</th><th>SKU Name</th><th>Category</th><th>Orders</th><th>Qty</th><th>Revenue</th><th>Return Rate</th></tr>
    ${perfData.skuPerformance.slice(0, 30).map((s) => `<tr><td>${s.skuCode}</td><td>${s.skuName}</td><td>${s.category}</td><td>${s.orderCount}</td><td>${s.quantity}</td><td>₹${s.revenue.toLocaleString()}</td><td>${s.returnRate}%</td></tr>`).join("")}
  </table>

  <h2>Performance by Category</h2>
  <table>
    <tr><th>Category</th><th>Orders</th><th>Quantity</th><th>Revenue</th></tr>
    ${perfData.byCategory.map((c) => `<tr><td>${c.category}</td><td>${c.orderCount}</td><td>${c.quantity}</td><td>₹${c.revenue.toLocaleString()}</td></tr>`).join("")}
  </table>
`;
      break;
    }
  }

  htmlContent += `
  <p class="generated">Generated by CJDQuick OMS | ${new Date().toISOString()}</p>
</body>
</html>
`;

  // Return HTML that can be printed/saved as PDF by browser
  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportType}-report-${timestamp}.html"`,
    },
  });
}

function formatReportTitle(reportType: string): string {
  const titles: Record<string, string> = {
    sales: "Sales",
    inventory: "Inventory",
    fulfillment: "Fulfillment",
    returns: "Returns",
    "sku-performance": "SKU Performance",
  };
  return titles[reportType] || reportType;
}
