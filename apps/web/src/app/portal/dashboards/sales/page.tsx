"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  TrendingUp,
  IndianRupee,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Filter,
  Loader2,
  RefreshCcw,
  PackageCheck,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

interface SalesData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    deliveredOrders: number;
    deliveryRate: number;
  };
  ordersByStatus: { status: string; count: number }[];
  ordersByChannel: { channel: string; count: number }[];
  ordersByPaymentMode: { paymentMode: string; count: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    totalAmount: number;
    createdAt: string;
  }[];
  period: { range: string; startDate: string; endDate: string };
}

export default function SalesDashboardPage() {
  const [dateRange, setDateRange] = useState("last30days");
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("portal_token");
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/portal/dashboards/sales?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to fetch data");
      }
    } catch (err) {
      setError("Failed to fetch sales data");
      console.error("Sales Dashboard error:", err);
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

  const maxStatus = Math.max(...data.ordersByStatus.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-500">Track your sales performance across channels</p>
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
        <StatCard
          title="Total Orders"
          value={data.summary.totalOrders.toLocaleString()}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(data.summary.totalRevenue / 1000).toFixed(1)}K`}
          icon={IndianRupee}
        />
        <StatCard
          title="Avg. Order Value"
          value={`₹${Math.round(data.summary.avgOrderValue).toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Delivered"
          value={data.summary.deliveredOrders.toLocaleString()}
          icon={PackageCheck}
        />
        <StatCard
          title="Delivery Rate"
          value={`${data.summary.deliveryRate}%`}
          icon={Package}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {data.ordersByStatus.map((status) => (
              <div key={status.status} className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-500 truncate">{status.status}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(status.count / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-gray-700 text-right">
                  {status.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Channel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Channel</h3>
          <div className="space-y-4">
            {data.ordersByChannel.length > 0 ? (
              data.ordersByChannel.map((channel) => (
                <div key={channel.channel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{channel.channel || "Direct"}</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    {channel.count} orders
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No channel data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Mode Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Orders by Payment Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.ordersByPaymentMode.map((pm) => (
            <div key={pm.paymentMode} className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{pm.count}</div>
              <div className="text-sm font-medium text-gray-700">{pm.paymentMode}</div>
              <div className="text-sm text-green-600 mt-1">
                ₹{(pm.revenue / 1000).toFixed(1)}K revenue
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-blue-600">{order.orderNumber}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{order.customerName}</td>
                  <td className="py-3 px-4 text-center font-medium text-gray-900">
                    ₹{order.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500 text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
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

function getStatusColor(status: string): string {
  switch (status) {
    case "DELIVERED":
      return "bg-green-100 text-green-700";
    case "IN_TRANSIT":
    case "SHIPPED":
      return "bg-blue-100 text-blue-700";
    case "CANCELLED":
    case "RTO":
      return "bg-red-100 text-red-700";
    case "PROCESSING":
    case "CONFIRMED":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <Icon className="h-4 w-4 text-green-600" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
