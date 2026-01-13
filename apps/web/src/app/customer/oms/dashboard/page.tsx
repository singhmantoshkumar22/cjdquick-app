"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, TrendingUp, RefreshCw } from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  totalOrderLines: number;
  totalOrderQuantity: number;
  distinctSkuSold: number;
  avgLinesPerOrder: number;
  totalOrderAmount: number;
  avgOrderAmount: number;
  codOrdersPercent: number;
  totalDiscount: number;
  orderQtyPendingStock: number;
  totalPendingOrder: number;
  unfulfillableLineLevelOrder: number;
  totalUnfulfillableOrder: number;
  totalSlaBreachedOrder: number;
  totalFailedOrder: number;
}

interface ChartData {
  date: string;
  value: number;
}

const statsConfig = [
  // Row 1
  [
    { key: "totalOrders", label: "Total Orders", color: "bg-orange-500", format: "number" },
    { key: "totalOrderLines", label: "Total Order Lines", color: "bg-yellow-500", format: "number" },
    { key: "totalOrderQuantity", label: "Total Order Quantity", color: "bg-green-500", format: "number" },
    { key: "distinctSkuSold", label: "Distinct SKU Sold", color: "bg-blue-500", format: "number" },
    { key: "avgLinesPerOrder", label: "Average Lines Per Order", color: "bg-gray-400", format: "decimal" },
  ],
  // Row 2
  [
    { key: "totalOrderAmount", label: "Total Order Amount", color: "bg-red-500", format: "currency" },
    { key: "avgOrderAmount", label: "Avg. Order Amount", color: "bg-yellow-500", format: "currency" },
    { key: "codOrdersPercent", label: "% COD Orders", color: "bg-green-500", format: "percent" },
    { key: "totalDiscount", label: "Total Discount", color: "bg-blue-500", format: "currency" },
    { key: "orderQtyPendingStock", label: "Order Qty Pending Stock", color: "bg-green-600", format: "number" },
  ],
  // Row 3
  [
    { key: "totalPendingOrder", label: "Total Pending Order", color: "bg-cyan-500", format: "number" },
    { key: "unfulfillableLineLevelOrder", label: "Unfulfillable Line Level Order", color: "bg-yellow-500", format: "number" },
    { key: "totalUnfulfillableOrder", label: "Total Unfulfillable Order", color: "bg-red-500", format: "number" },
    { key: "totalSlaBreachedOrder", label: "Total SLA Breached Order", color: "bg-gray-500", format: "number" },
    { key: "totalFailedOrder", label: "Total Failed Order", color: "bg-green-500", format: "number" },
  ],
];

// Demo data
const demoStats: DashboardStats = {
  totalOrders: 3693,
  totalOrderLines: 8051,
  totalOrderQuantity: 73102,
  distinctSkuSold: 3296,
  avgLinesPerOrder: 2.18,
  totalOrderAmount: 70250074,
  avgOrderAmount: 19022,
  codOrdersPercent: 8.45,
  totalDiscount: 442497,
  orderQtyPendingStock: 1897,
  totalPendingOrder: 815,
  unfulfillableLineLevelOrder: 48,
  totalUnfulfillableOrder: 32,
  totalSlaBreachedOrder: 423,
  totalFailedOrder: 116,
};

const demoOrderCountData: ChartData[] = [
  { date: "Jan 1", value: 450 },
  { date: "Jan 2", value: 520 },
  { date: "Jan 3", value: 610 },
  { date: "Jan 4", value: 590 },
  { date: "Jan 5", value: 680 },
  { date: "Jan 6", value: 720 },
  { date: "Jan 7", value: 480 },
];

const demoOrderLineData: ChartData[] = [
  { date: "Jan 1", value: 980 },
  { date: "Jan 2", value: 1150 },
  { date: "Jan 3", value: 1420 },
  { date: "Jan 4", value: 1380 },
  { date: "Jan 5", value: 1650 },
  { date: "Jan 6", value: 1840 },
  { date: "Jan 7", value: 1100 },
];

export default function OMSDashboardPage() {
  const searchParams = useSearchParams();
  const dashboardType = searchParams.get("type") || "eretail";
  const [stats, setStats] = useState<DashboardStats>(demoStats);
  const [orderCountData, setOrderCountData] = useState<ChartData[]>(demoOrderCountData);
  const [orderLineData, setOrderLineData] = useState<ChartData[]>(demoOrderLineData);
  const [dateRange, setDateRange] = useState("7");
  const [loading, setLoading] = useState(false);

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return `${(value / 100000).toFixed(0) !== "0" ? (value / 100000).toFixed(2) + "L" : value.toLocaleString()}`;
      case "percent":
        return value.toFixed(2);
      case "decimal":
        return value.toFixed(2);
      default:
        return value.toLocaleString();
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `${(value / 100000).toFixed(2)} L`;
    }
    return value.toLocaleString();
  };

  const maxChartValue = Math.max(...orderCountData.map((d) => d.value));
  const maxLineChartValue = Math.max(...orderLineData.map((d) => d.value));

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      {statsConfig.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {row.map((stat) => (
            <div
              key={stat.key}
              className={`${stat.color} rounded-lg p-4 text-white relative overflow-hidden`}
            >
              <div className="relative z-10">
                <p className="text-xs font-medium opacity-90 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">
                  {stat.format === "currency"
                    ? formatCurrency(stats[stat.key as keyof DashboardStats] as number)
                    : formatValue(stats[stat.key as keyof DashboardStats] as number, stat.format)}
                </p>
              </div>
              {/* Chart icon decoration */}
              <div className="absolute right-2 bottom-2 opacity-30">
                <BarChart3 className="w-10 h-10" />
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Order Count Chart */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <div className="flex gap-2">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <ChevronLeft />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <ChevronRight />
              </button>
            </div>
          </div>
          <h3 className="text-center font-semibold text-gray-700 mb-1">
            Order Count - By Date
          </h3>
          <p className="text-center text-xs text-gray-500 mb-4">
            [Click On The Bar(s) To Drilldown]
          </p>
          <div className="h-48 flex items-end justify-around gap-2">
            {orderCountData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 cursor-pointer transition-colors"
                  style={{
                    height: `${(data.value / maxChartValue) * 160}px`,
                    minHeight: "20px",
                  }}
                  title={`${data.date}: ${data.value}`}
                />
                <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                  {data.date.split(" ")[1]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
            <span>{Math.round(maxChartValue * 0.25)}</span>
            <span>{Math.round(maxChartValue * 0.5)}</span>
            <span>{Math.round(maxChartValue * 0.75)}</span>
            <span>{maxChartValue}</span>
          </div>
        </div>

        {/* Order Line Count Chart */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <div className="flex gap-2">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <ChevronLeft />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <ChevronRight />
              </button>
            </div>
          </div>
          <h3 className="text-center font-semibold text-gray-700 mb-1">
            Order Line Count - By Date
          </h3>
          <p className="text-center text-xs text-gray-500 mb-4">
            [Click On The Bar(s) To Drilldown]
          </p>
          <div className="h-48 flex items-end justify-around gap-2">
            {orderLineData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 cursor-pointer transition-colors"
                  style={{
                    height: `${(data.value / maxLineChartValue) * 160}px`,
                    minHeight: "20px",
                  }}
                  title={`${data.date}: ${data.value}`}
                />
                <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                  {data.date.split(" ")[1]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
            <span>{Math.round(maxLineChartValue * 0.25)}</span>
            <span>{Math.round(maxLineChartValue * 0.5)}</span>
            <span>{Math.round(maxLineChartValue * 0.75)}</span>
            <span>{maxLineChartValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
