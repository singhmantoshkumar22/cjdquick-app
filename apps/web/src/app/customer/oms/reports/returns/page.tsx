"use client";

import { useState, useEffect } from "react";
import {
  RotateCcw,
  Download,
  TrendingDown,
  Package,
  AlertTriangle,
  RefreshCw,
  DollarSign,
} from "lucide-react";

interface ReturnsReportData {
  summary: {
    totalReturns: number;
    returnRate: number;
    avgProcessingTime: string;
    pendingReturns: number;
    refundAmount: number;
    restockRate: number;
  };
  byReason: Array<{ reason: string; count: number; percentage: number }>;
  byChannel: Array<{ channel: string; returns: number; returnRate: number; refundAmount: number }>;
  byCategory: Array<{ category: string; returns: number; returnRate: number }>;
  processingBreakdown: Array<{ status: string; count: number; avgTime: string }>;
  refundBreakdown: Array<{ type: string; count: number; amount: number }>;
  trend: Array<{ date: string; returns: number; returnRate: number }>;
}

export default function ReturnsReportsPage() {
  const [data, setData] = useState<ReturnsReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last30days");
  const [channel, setChannel] = useState("all");

  useEffect(() => {
    fetchReturnsData();
  }, [dateRange, channel]);

  const fetchReturnsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/oms/reports/returns?dateRange=${dateRange}&channel=${channel}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching returns data:", error);
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
          <h1 className="text-2xl font-bold text-gray-900">Returns Reports</h1>
          <p className="text-gray-600">Return rates, reasons, and processing analysis</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisQuarter">This Quarter</option>
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
          </select>
          <button
            onClick={fetchReturnsData}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!data) return;
              const csvContent = [
                ["Returns Report - " + dateRange].join(","),
                [""],
                ["Summary"].join(","),
                ["Total Returns", data.summary.totalReturns].join(","),
                ["Return Rate", data.summary.returnRate + "%"].join(","),
                ["Avg Processing Time", data.summary.avgProcessingTime].join(","),
                ["Pending Returns", data.summary.pendingReturns].join(","),
                ["Refund Amount", data.summary.refundAmount].join(","),
                ["Restock Rate", data.summary.restockRate + "%"].join(","),
                [""],
                ["Reason", "Count", "Percentage"].join(","),
                ...data.byReason.map(r => [r.reason, r.count, r.percentage + "%"].join(",")),
                [""],
                ["Channel", "Returns", "Return Rate", "Refund Amount"].join(","),
                ...data.byChannel.map(c => [c.channel, c.returns, c.returnRate + "%", c.refundAmount].join(",")),
              ].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `returns-report-${new Date().toISOString().split("T")[0]}.csv`;
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
              <p className="text-sm text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalReturns}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <p className="text-sm text-gray-600">Return Rate</p>
              <p className="text-2xl font-bold text-red-600">{data.summary.returnRate}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.avgProcessingTime}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{data.summary.pendingReturns}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Refund Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{(data.summary.refundAmount / 100000).toFixed(1)}L</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Restock Rate</p>
              <p className="text-2xl font-bold text-green-600">{data.summary.restockRate}%</p>
            </div>
          </div>

          {/* Return Reasons & Processing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Return Reasons</h3>
              <div className="space-y-4">
                {data.byReason.map((item) => (
                  <div key={item.reason}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.reason}</span>
                      <span className="font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Processing Status</h3>
              <div className="space-y-4">
                {data.processingBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.status}</p>
                      <p className="text-sm text-gray-500">Avg time: {item.avgTime}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Channel Performance */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Returns by Channel</h3>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returns</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.byChannel.map((item) => (
                  <tr key={item.channel} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.channel}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.returns}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          item.returnRate > 10 ? "text-red-600" : item.returnRate > 5 ? "text-yellow-600" : "text-green-600"
                        }`}
                      >
                        {item.returnRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{(item.refundAmount / 1000).toFixed(0)}K
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category & Refund Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Returns by Category</h3>
              </div>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returns</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.byCategory.map((item) => (
                    <tr key={item.category} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.returns}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-medium ${
                            item.returnRate > 15 ? "text-red-600" : item.returnRate > 8 ? "text-yellow-600" : "text-green-600"
                          }`}
                        >
                          {item.returnRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Refund Breakdown</h3>
              </div>
              <div className="p-4 space-y-4">
                {data.refundBreakdown.map((item) => (
                  <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.type}</p>
                      <p className="text-sm text-gray-500">{item.count} refunds</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">₹{(item.amount / 1000).toFixed(0)}K</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
