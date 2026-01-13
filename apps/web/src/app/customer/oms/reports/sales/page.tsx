"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";

interface SalesData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalUnits: number;
    grossMargin: number;
    discountGiven: number;
  };
  byChannel: Array<{ channel: string; revenue: number; orders: number; aov: number; growth: number }>;
  byPaymentMode: Array<{ mode: string; amount: number; percentage: number }>;
  byLocation: Array<{ location: string; revenue: number; orders: number }>;
  dailyData: Array<{ date: string; revenue: number; orders: number }>;
}

export default function SalesReportsPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last7days");
  const [channel, setChannel] = useState("all");

  useEffect(() => {
    fetchSalesData();
  }, [dateRange, channel]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/oms/reports/sales?dateRange=${dateRange}&channel=${channel}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-600">Revenue, orders, and channel performance analysis</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">All Channels</option>
            <option value="amazon">Amazon</option>
            <option value="flipkart">Flipkart</option>
            <option value="shopify">Shopify</option>
            <option value="manual">Manual</option>
          </select>
          <button
            onClick={fetchSalesData}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!data) return;
              const csvContent = [
                ["Sales Report - " + dateRange].join(","),
                [""],
                ["Summary"].join(","),
                ["Total Revenue", data.summary.totalRevenue].join(","),
                ["Total Orders", data.summary.totalOrders].join(","),
                ["Avg Order Value", data.summary.avgOrderValue].join(","),
                ["Units Sold", data.summary.totalUnits].join(","),
                ["Gross Margin", data.summary.grossMargin + "%"].join(","),
                ["Discount Given", data.summary.discountGiven].join(","),
                [""],
                ["Channel", "Revenue", "Orders", "AOV", "Growth"].join(","),
                ...data.byChannel.map(c => [c.channel, c.revenue, c.orders, c.aov, c.growth + "%"].join(",")),
                [""],
                ["Payment Mode", "Amount", "Percentage"].join(","),
                ...data.byPaymentMode.map(p => [p.mode, p.amount, p.percentage + "%"].join(",")),
              ].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(data.summary.totalRevenue / 100000).toFixed(1)}L
              </p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>12.5%</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalOrders.toLocaleString()}</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>8.3%</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{data.summary.avgOrderValue.toLocaleString()}</p>
              <div className="flex items-center text-red-600 text-sm mt-1">
                <ArrowDownRight className="w-4 h-4" />
                <span>2.1%</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Units Sold</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalUnits.toLocaleString()}</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>15.2%</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Gross Margin</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.grossMargin}%</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>0.5%</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Discounts</p>
              <p className="text-2xl font-bold text-gray-900">₹{(data.summary.discountGiven / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500 mt-1">5.2% of revenue</p>
            </div>
          </div>

          {/* Channel Performance */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Channel Performance</h3>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AOV</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.byChannel.map((item) => (
                  <tr key={item.channel} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.channel}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{(item.revenue / 100000).toFixed(2)}L</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.orders.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">₹{item.aov.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center text-sm ${
                          item.growth >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {item.growth >= 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        {Math.abs(item.growth)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Mode & Location */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Payment Mode Breakdown</h3>
              </div>
              <div className="p-4 space-y-4">
                {data.byPaymentMode.map((item) => (
                  <div key={item.mode}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.mode}</span>
                      <span className="font-medium">₹{(item.amount / 1000).toFixed(0)}K ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Sales by Location</h3>
              </div>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.byLocation.map((item) => (
                    <tr key={item.location} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">₹{(item.revenue / 100000).toFixed(2)}L</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.orders.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
