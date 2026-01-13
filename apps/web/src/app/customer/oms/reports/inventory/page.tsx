"use client";

import { useState, useEffect } from "react";
import {
  BarChart2,
  Download,
  AlertTriangle,
  Package,
  TrendingDown,
  RefreshCw,
  Filter,
} from "lucide-react";

interface InventoryReportData {
  summary: {
    totalSKUs: number;
    totalValue: number;
    outOfStock: number;
    lowStock: number;
    overStock: number;
    avgTurnover: number;
  };
  byCategory: Array<{ category: string; skus: number; quantity: number; value: number }>;
  stockHealth: Array<{ status: string; count: number; percentage: number; color: string }>;
  aging: Array<{ range: string; quantity: number; value: number; percentage: number }>;
  topMovers: Array<{ sku: string; name: string; sold: number; remaining: number; turnover: number }>;
  slowMovers: Array<{ sku: string; name: string; quantity: number; daysInStock: number; value: number }>;
}

export default function InventoryReportsPage() {
  const [data, setData] = useState<InventoryReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("all");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetchInventoryData();
  }, [location, category]);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/oms/reports/inventory?location=${location}&category=${category}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
          <p className="text-gray-600">Stock levels, movements, and aging analysis</p>
        </div>
        <div className="flex gap-3">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">All Locations</option>
            <option value="WH-DELHI">WH-DELHI</option>
            <option value="WH-MUMBAI">WH-MUMBAI</option>
            <option value="WH-BANGALORE">WH-BANGALORE</option>
            <option value="WH-CHENNAI">WH-CHENNAI</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="apparel">Apparel</option>
            <option value="home">Home & Kitchen</option>
            <option value="beauty">Beauty</option>
          </select>
          <button
            onClick={fetchInventoryData}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!data) return;
              const csvContent = [
                ["Inventory Report - " + new Date().toLocaleDateString()].join(","),
                [""],
                ["Summary"].join(","),
                ["Total SKUs", data.summary.totalSKUs].join(","),
                ["Total Value", data.summary.totalValue].join(","),
                ["Out of Stock", data.summary.outOfStock].join(","),
                ["Low Stock", data.summary.lowStock].join(","),
                ["Over Stock", data.summary.overStock].join(","),
                ["Avg Turnover", data.summary.avgTurnover].join(","),
                [""],
                ["Category", "SKUs", "Quantity", "Value"].join(","),
                ...data.byCategory.map(c => [c.category, c.skus, c.quantity, c.value].join(",")),
                [""],
                ["Stock Health", "Count", "Percentage"].join(","),
                ...data.stockHealth.map(s => [s.status, s.count, s.percentage + "%"].join(",")),
              ].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.csv`;
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
              <p className="text-sm text-gray-600">Total SKUs</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalSKUs.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{(data.summary.totalValue / 10000000).toFixed(1)}Cr</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{data.summary.outOfStock}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{data.summary.lowStock}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <p className="text-sm text-gray-600">Over Stock</p>
              <p className="text-2xl font-bold text-orange-600">{data.summary.overStock}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Avg Turnover</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.avgTurnover}x</p>
            </div>
          </div>

          {/* Stock Health & Aging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Stock Health Distribution</h3>
              <div className="space-y-4">
                {data.stockHealth.map((item) => (
                  <div key={item.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.status}</span>
                      <span className="font-medium">{item.count} SKUs ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Inventory Aging</h3>
              <div className="space-y-4">
                {data.aging.map((item) => (
                  <div key={item.range} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.range}</p>
                      <p className="text-sm text-gray-500">{item.quantity.toLocaleString()} units</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{(item.value / 100000).toFixed(1)}L</p>
                      <p className="text-sm text-gray-500">{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Inventory by Category</h3>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKUs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.byCategory.map((item) => (
                  <tr key={item.category} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.skus}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{(item.value / 100000).toFixed(2)}L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top & Slow Movers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-green-600 rotate-180" />
                <h3 className="font-semibold text-gray-900">Fast Moving Items</h3>
              </div>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turnover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.topMovers.map((item) => (
                    <tr key={item.sku} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.sku}</p>
                        <p className="text-xs text-gray-500">{item.name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sold}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.remaining}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">{item.turnover}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Slow Moving Items</h3>
              </div>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.slowMovers.map((item) => (
                    <tr key={item.sku} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.sku}</p>
                        <p className="text-xs text-gray-500">{item.name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-orange-600">{item.daysInStock}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{item.value.toLocaleString()}</td>
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
