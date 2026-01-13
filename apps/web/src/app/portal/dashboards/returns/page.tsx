"use client";

import { useState, useEffect } from "react";
import {
  RotateCcw,
  Package,
  Clock,
  CheckCircle,
  Search,
  IndianRupee,
  Truck,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

interface ReturnsData {
  summary: {
    totalReturns: number;
    returnRate: number;
    pendingReturns: number;
    receivedReturns: number;
    processedReturns: number;
  };
  returnsByStatus: { status: string; count: number }[];
  returnsByType: { type: string; count: number }[];
  recentReturns: {
    id: string;
    returnNumber: string;
    type: string;
    status: string;
    reason: string;
    createdAt: string;
    order: { orderNumber: string; customerName: string };
  }[];
  period: { range: string; startDate: string; endDate: string };
}

export default function ReturnsDashboardPage() {
  const [dateRange, setDateRange] = useState("last30days");
  const [data, setData] = useState<ReturnsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    const token = localStorage.getItem("portal_token");
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/portal/dashboards/returns?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to fetch data");
      }
    } catch (err) {
      setError("Failed to fetch returns data");
      console.error("Returns Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-600">{error || "No data available"}</p>
        <Button onClick={fetchData} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const filteredReturns = data.recentReturns.filter(
    (ret) =>
      ret.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.order?.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns Dashboard</h1>
          <p className="text-gray-500">Track returns, RTO, and refund analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="today">Today</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Returns</div>
          <div className="text-2xl font-bold text-gray-900">{data.summary.totalReturns}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Return Rate</div>
          <div className="text-2xl font-bold text-red-600">{data.summary.returnRate}%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{data.summary.pendingReturns}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Received</div>
          <div className="text-2xl font-bold text-blue-600">{data.summary.receivedReturns}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Processed</div>
          <div className="text-2xl font-bold text-green-600">{data.summary.processedReturns}</div>
        </div>
      </div>

      {/* Return Status Overview */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Return Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {data.returnsByStatus.map((status) => (
            <div
              key={status.status}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-2xl font-bold text-gray-900">{status.count}</div>
              <div className="text-sm text-gray-500">{status.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Returns by Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Returns by Type</h3>
          <div className="space-y-3">
            {data.returnsByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{item.type}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.type === "RTO" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Returns by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Returns by Status</h3>
          <div className="space-y-3">
            {data.returnsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{item.status}</span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Returns Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Returns</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search returns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Return #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-blue-600">{ret.returnNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{ret.order?.orderNumber || "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ret.type === "RTO" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {ret.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{ret.reason}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {ret.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {new Date(ret.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
