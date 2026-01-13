"use client";

import { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  DollarSign,
  ShoppingCart,
  Users,
} from "lucide-react";

interface DashboardData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalCustomers: number;
    newCustomers: number;
    repeatRate: number;
  };
  revenueByChannel: Array<{ channel: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{ sku: string; name: string; quantity: number; revenue: number }>;
  dailyTrend: Array<{ date: string; orders: number; revenue: number }>;
}

export default function ReportsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last7days");

  useEffect(() => {
    fetchDashboard();
  }, [dateRange]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/oms/reports/dashboard?dateRange=${dateRange}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600">Comprehensive business analytics overview</p>
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
            <option value="thisQuarter">This Quarter</option>
            <option value="thisYear">This Year</option>
          </select>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              if (!data) return;
              const csvContent = [
                ["Metric", "Value"].join(","),
                ["Total Revenue", data.kpis.totalRevenue].join(","),
                ["Total Orders", data.kpis.totalOrders].join(","),
                ["Avg Order Value", data.kpis.avgOrderValue].join(","),
                ["Total Customers", data.kpis.totalCustomers].join(","),
                ["New Customers", data.kpis.newCustomers].join(","),
                ["Repeat Rate", data.kpis.repeatRate + "%"].join(","),
                [""],
                ["Channel", "Revenue", "Orders"].join(","),
                ...data.revenueByChannel.map(c => [c.channel, c.revenue, c.orders].join(",")),
              ].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `dashboard-report-${new Date().toISOString().split("T")[0]}.csv`;
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
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{(data.kpis.totalRevenue / 100000).toFixed(1)}L
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">12.5%</span>
                <span className="text-gray-500 ml-2">vs last period</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.kpis.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">8.3%</span>
                <span className="text-gray-500 ml-2">vs last period</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{data.kpis.avgOrderValue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span className="text-red-600 font-medium">2.1%</span>
                <span className="text-gray-500 ml-2">vs last period</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.kpis.totalCustomers.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-gray-600">{data.kpis.newCustomers} new</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-gray-600">{data.kpis.repeatRate}% repeat</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue by Channel */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue by Channel</h3>
              <div className="space-y-4">
                {data.revenueByChannel.map((item) => (
                  <div key={item.channel}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.channel}</span>
                      <span className="font-medium">₹{(item.revenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(item.revenue / data.revenueByChannel[0].revenue) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.orders} orders</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders by Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
              <div className="grid grid-cols-2 gap-4">
                {data.ordersByStatus.map((item) => (
                  <div key={item.status} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{item.status}</p>
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Top Selling Products</h3>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.topProducts.map((product, index) => (
                  <tr key={product.sku} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{product.quantity}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ₹{product.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
