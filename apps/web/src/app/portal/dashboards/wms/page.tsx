"use client";

import { useState, useEffect } from "react";
import {
  Warehouse,
  Package,
  Boxes,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Loader2,
  RefreshCcw,
  Store,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

type TabType = "overview" | "inbound" | "outbound";

interface WMSData {
  serviceModel: string;
  assignedWarehouses: { id: string; name: string; isPrimary: boolean }[];
  overview: {
    totalSKUs: number;
    totalInventory: number;
    ordersToday: number;
    inboundToday: number;
    returnsInTransit: number;
  };
  outbound: {
    pendingPicklist: number;
    pickingInProgress: number;
    packed: number;
    readyToShip: number;
    total: number;
  };
  inbound: {
    expectedToday: number;
    pendingReceiving: number;
    pendingOrders: { id: string; grnNumber: string; status: string; remarks: string; createdAt: string }[];
  };
  locations: { id: string; name: string; items: number; skuCount: number; capacity: number }[];
}

export default function WMSDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [data, setData] = useState<WMSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("portal_token");
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/dashboards/wms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to fetch WMS data");
      }
    } catch (err) {
      setError("Failed to fetch WMS dashboard");
      console.error("WMS Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
    { id: "inbound" as TabType, label: "Inbound", icon: ArrowDownToLine },
    { id: "outbound" as TabType, label: "Outbound", icon: ArrowUpFromLine },
  ];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CJDQuick WMS</h1>
          <p className="text-gray-500">Warehouse Management System • {data.serviceModel} Model</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Assigned Warehouses */}
      {data.assignedWarehouses.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Store className="h-4 w-4" />
          <span>Your Warehouses:</span>
          {data.assignedWarehouses.map((wh) => (
            <span key={wh.id} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {wh.name} {wh.isPrimary && "(Primary)"}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab data={data} />}
      {activeTab === "inbound" && <InboundTab data={data} />}
      {activeTab === "outbound" && <OutboundTab data={data} />}
    </div>
  );
}

// Overview Tab
function OverviewTab({ data }: { data: WMSData }) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total SKUs"
          value={data.overview.totalSKUs.toLocaleString()}
          icon={Package}
        />
        <StatCard
          title="Total Inventory"
          value={data.overview.totalInventory.toLocaleString()}
          icon={Boxes}
        />
        <StatCard
          title="Orders Today"
          value={data.overview.ordersToday.toLocaleString()}
          icon={ArrowUpFromLine}
        />
        <StatCard
          title="Pending Inbound"
          value={data.inbound.expectedToday.toLocaleString()}
          icon={ArrowDownToLine}
        />
        <StatCard
          title="Returns In Transit"
          value={data.overview.returnsInTransit.toLocaleString()}
          icon={Truck}
        />
      </div>

      {/* Location Stats */}
      {data.locations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Warehouse Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.locations.map((loc) => (
              <div key={loc.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{loc.name}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Utilization</span>
                    <span className="font-medium text-gray-900">{loc.capacity}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        loc.capacity > 80 ? "bg-red-500" : loc.capacity > 60 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${loc.capacity}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{loc.items.toLocaleString()} units</span>
                    <span>{loc.skuCount} SKUs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inbound & Outbound Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbound Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Inbound Summary</h3>
            <ArrowDownToLine className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 mb-2">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{data.inbound.expectedToday}</div>
              <div className="text-xs text-gray-500">Pending Receiving</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600 mb-2">
                <Truck className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{data.overview.returnsInTransit}</div>
              <div className="text-xs text-gray-500">Returns In Transit</div>
            </div>
          </div>
        </div>

        {/* Outbound Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Outbound Summary</h3>
            <ArrowUpFromLine className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-100 text-yellow-600 mb-2">
                <Package className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{data.outbound.pendingPicklist}</div>
              <div className="text-xs text-gray-500">Pending Picklist</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 mb-2">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{data.outbound.pickingInProgress}</div>
              <div className="text-xs text-gray-500">Picking In Progress</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 mb-2">
                <Boxes className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{data.outbound.packed}</div>
              <div className="text-xs text-gray-500">Packed</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 text-green-600 mb-2">
                <Truck className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{data.outbound.readyToShip}</div>
              <div className="text-xs text-gray-500">Ready to Ship</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inbound Tab
function InboundTab({ data }: { data: WMSData }) {
  return (
    <div className="space-y-6">
      {/* Inbound Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 mb-3">
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.inbound.expectedToday}</div>
          <div className="text-sm text-gray-500">Pending GRNs</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600 mb-3">
            <Truck className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.overview.returnsInTransit}</div>
          <div className="text-sm text-gray-500">Returns In Transit</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 text-green-600 mb-3">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.overview.totalInventory.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total in Stock</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 mb-3">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.overview.totalSKUs}</div>
          <div className="text-sm text-gray-500">Active SKUs</div>
        </div>
      </div>

      {/* Pending Receiving Orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Pending Receiving Orders</h3>
        {data.inbound.pendingOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">GRN #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Remarks</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.inbound.pendingOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-blue-600">{order.grnNumber}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                        order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{order.remarks || "-"}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No pending receiving orders</p>
        )}
      </div>
    </div>
  );
}

// Outbound Tab
function OutboundTab({ data }: { data: WMSData }) {
  const outboundStats = [
    { status: "Pending Picklist", count: data.outbound.pendingPicklist, icon: Package, color: "text-yellow-600 bg-yellow-50" },
    { status: "Picking in Progress", count: data.outbound.pickingInProgress, icon: Clock, color: "text-blue-600 bg-blue-50" },
    { status: "Packed", count: data.outbound.packed, icon: Boxes, color: "text-purple-600 bg-purple-50" },
    { status: "Ready to Ship", count: data.outbound.readyToShip, icon: Truck, color: "text-green-600 bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Outbound Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {outboundStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.status} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
              <div className="text-sm text-gray-500">{stat.status}</div>
            </div>
          );
        })}
      </div>

      {/* Outbound Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Fulfillment Pipeline</h3>
        <div className="flex items-center justify-between">
          {outboundStats.map((stat, idx) => {
            const Icon = stat.icon;
            const isLast = idx === outboundStats.length - 1;
            return (
              <div key={stat.status} className="flex items-center">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${stat.color} mx-auto mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{stat.count}</div>
                  <div className="text-xs text-gray-500">{stat.status}</div>
                </div>
                {!isLast && (
                  <div className="w-24 h-1 bg-gray-200 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders Today */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Today&apos;s Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-gray-900">{data.overview.ordersToday}</div>
            <div className="text-sm text-gray-500">Orders Today</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-gray-900">{data.outbound.total}</div>
            <div className="text-sm text-gray-500">In Process</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-gray-900">{data.outbound.readyToShip}</div>
            <div className="text-sm text-gray-500">Shipped</div>
          </div>
        </div>
      </div>
    </div>
  );
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
