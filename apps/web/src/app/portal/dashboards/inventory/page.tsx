"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  Package,
  AlertTriangle,
  Search,
  Download,
  IndianRupee,
  Loader2,
  RefreshCcw,
  MapPin,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

interface InventoryData {
  summary: {
    totalSKUs: number;
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  inventoryByLocation: { locationId: string; locationName: string; skuCount: number; totalQuantity: number }[];
  lowStockItems: { skuId: string; skuCode: string; skuName: string; totalQuantity: number; minStockLevel: number }[];
}

export default function InventoryDashboardPage() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    const token = localStorage.getItem("portal_token");
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/portal/dashboards/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to fetch data");
      }
    } catch (err) {
      setError("Failed to fetch inventory data");
      console.error("Inventory Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const filteredLowStock = data.lowStockItems.filter(
    (item) =>
      item.skuCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.skuName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-500">Track stock levels and inventory analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total SKUs"
          value={data.summary.totalSKUs.toLocaleString()}
          icon={Package}
        />
        <StatCard
          title="Total Stock"
          value={data.summary.totalQuantity.toLocaleString()}
          icon={Boxes}
        />
        <StatCard
          title="Stock Value"
          value={`₹${(data.summary.totalValue / 100000).toFixed(1)}L`}
          icon={IndianRupee}
        />
        <StatCard
          title="Low Stock"
          value={data.summary.lowStockCount.toString()}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Out of Stock"
          value={data.summary.outOfStockCount.toString()}
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Inventory by Location */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Inventory by Location</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">SKU Count</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Total Quantity</th>
              </tr>
            </thead>
            <tbody>
              {data.inventoryByLocation.map((loc) => (
                <tr key={loc.locationId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{loc.locationName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">{loc.skuCount}</td>
                  <td className="py-3 px-4 text-center font-semibold text-gray-900">{loc.totalQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert Table */}
      {data.lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alerts ({data.lowStockItems.length})
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search SKU..."
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product Name</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Current Stock</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Min Stock</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLowStock.map((item) => {
                  const isCritical = item.totalQuantity < item.minStockLevel / 2;
                  return (
                    <tr key={item.skuId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm text-blue-600">{item.skuCode}</td>
                      <td className="py-3 px-4 text-gray-700">{item.skuName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${isCritical ? "text-red-600" : "text-yellow-600"}`}>
                          {item.totalQuantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-500">{item.minStockLevel}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isCritical
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {isCritical ? "Critical" : "Low Stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  variant?: "default" | "warning" | "danger";
}) {
  const colorClasses = {
    default: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-600",
    danger: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
