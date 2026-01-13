"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Store,
  Truck,
  PackageCheck,
  AlertTriangle,
  Clock,
  Boxes,
  RotateCcw,
  IndianRupee,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

type TabType = "sales" | "fulfillment" | "inventory" | "returns";

interface OMSData {
  serviceModel: string;
  assignedWarehouses: { id: string; name: string; isPrimary: boolean }[];
  overview: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    fulfillmentRate: number;
  };
  inventory: {
    totalQuantity: number;
    lowStockCount: number;
    pendingReceiving: number;
  };
  returns: { total: number };
  period: { range: string; startDate: string; endDate: string };
}

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
}

interface FulfillmentData {
  summary: {
    totalInProcess: number;
    pendingPicklist: number;
    pickingInProgress: number;
    packedPendingShip: number;
    pendingReceiving: number;
    completedToday: number;
  };
  fulfillmentByStatus: { status: string; count: number }[];
  pendingReceivingOrders: { id: string; grnNumber: string; status: string; remarks: string; createdAt: string }[];
}

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
}

export default function OMSDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sales");
  const [dateRange, setDateRange] = useState("last30days");
  const [omsData, setOmsData] = useState<OMSData | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [fulfillmentData, setFulfillmentData] = useState<FulfillmentData | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [returnsData, setReturnsData] = useState<ReturnsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: "sales" as TabType, label: "Sales", icon: ShoppingCart },
    { id: "fulfillment" as TabType, label: "Fulfillment", icon: Truck },
    { id: "inventory" as TabType, label: "Inventory", icon: Boxes },
    { id: "returns" as TabType, label: "Returns", icon: RotateCcw },
  ];

  const fetchData = async () => {
    const token = localStorage.getItem("portal_token");
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all dashboard data in parallel
      const [omsRes, salesRes, fulfillmentRes, inventoryRes, returnsRes] = await Promise.all([
        fetch(`/api/portal/dashboards/oms?range=${dateRange}`, { headers }),
        fetch(`/api/portal/dashboards/sales?range=${dateRange}`, { headers }),
        fetch(`/api/portal/dashboards/fulfillment?range=${dateRange}`, { headers }),
        fetch(`/api/portal/dashboards/inventory`, { headers }),
        fetch(`/api/portal/dashboards/returns?range=${dateRange}`, { headers }),
      ]);

      const [omsJson, salesJson, fulfillmentJson, inventoryJson, returnsJson] = await Promise.all([
        omsRes.json(),
        salesRes.json(),
        fulfillmentRes.json(),
        inventoryRes.json(),
        returnsRes.json(),
      ]);

      if (omsJson.success) setOmsData(omsJson.data);
      if (salesJson.success) setSalesData(salesJson.data);
      if (fulfillmentJson.success) setFulfillmentData(fulfillmentJson.data);
      if (inventoryJson.success) setInventoryData(inventoryJson.data);
      if (returnsJson.success) setReturnsData(returnsJson.data);

    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error("Dashboard fetch error:", err);
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-600">{error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">OMS Dashboard</h1>
          <p className="text-gray-500">
            Order Management System Analytics
            {omsData?.serviceModel && ` • ${omsData.serviceModel} Model`}
          </p>
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

      {/* Assigned Warehouses */}
      {omsData?.assignedWarehouses && omsData.assignedWarehouses.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Store className="h-4 w-4" />
          <span>Assigned Warehouses:</span>
          {omsData.assignedWarehouses.map((wh, idx) => (
            <span key={wh.id} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
              {wh.name} {wh.isPrimary && "(Primary)"}
            </span>
          ))}
        </div>
      )}

      {/* Quick Overview Cards */}
      {omsData && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard
            title="Total Orders"
            value={omsData.overview.totalOrders.toLocaleString()}
            icon={ShoppingCart}
          />
          <StatCard
            title="Pending"
            value={omsData.overview.pendingOrders.toLocaleString()}
            icon={Clock}
          />
          <StatCard
            title="Delivered"
            value={omsData.overview.completedOrders.toLocaleString()}
            icon={PackageCheck}
          />
          <StatCard
            title="Inventory Qty"
            value={omsData.inventory.totalQuantity.toLocaleString()}
            icon={Boxes}
          />
          <StatCard
            title="Returns"
            value={omsData.returns.total.toLocaleString()}
            icon={RotateCcw}
          />
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
      {activeTab === "sales" && salesData && <SalesTab data={salesData} />}
      {activeTab === "fulfillment" && fulfillmentData && <FulfillmentTab data={fulfillmentData} />}
      {activeTab === "inventory" && inventoryData && <InventoryTab data={inventoryData} />}
      {activeTab === "returns" && returnsData && <ReturnsTab data={returnsData} />}
    </div>
  );
}

// Sales Tab Component
function SalesTab({ data }: { data: SalesData }) {
  const maxStatus = Math.max(...data.ordersByStatus.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          title="Delivery Rate"
          value={`${data.summary.deliveryRate}%`}
          icon={PackageCheck}
        />
      </div>

      {/* Charts */}
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
          <div className="space-y-3">
            {data.ordersByChannel.length > 0 ? (
              data.ordersByChannel.map((ch) => (
                <div key={ch.channel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{ch.channel || "Direct"}</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    {ch.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No channel data</p>
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
              <div className="text-lg font-bold text-gray-900">{pm.count}</div>
              <div className="text-sm text-gray-500">{pm.paymentMode}</div>
              <div className="text-xs text-green-600 mt-1">₹{(pm.revenue / 1000).toFixed(1)}K revenue</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-blue-600">{order.orderNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{order.customerName}</td>
                  <td className="py-3 px-4 text-gray-700">₹{order.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
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

// Fulfillment Tab Component
function FulfillmentTab({ data }: { data: FulfillmentData }) {
  const shipmentStatus = [
    { status: "In Process", count: data.summary.totalInProcess, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
    { status: "Pending Picklist", count: data.summary.pendingPicklist, icon: Package, color: "text-blue-600 bg-blue-50" },
    { status: "Picking In Progress", count: data.summary.pickingInProgress, icon: PackageCheck, color: "text-indigo-600 bg-indigo-50" },
    { status: "Packed Pending Ship", count: data.summary.packedPendingShip, icon: Boxes, color: "text-purple-600 bg-purple-50" },
    { status: "Pending Receiving", count: data.summary.pendingReceiving, icon: Truck, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      {/* In Process Shipment Status */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">In Process Shipment Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {shipmentStatus.map((status) => {
            const Icon = status.icon;
            return (
              <div
                key={status.status}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.color} mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                <div className="text-sm text-gray-500">{status.status}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fulfillment by Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Order Fulfillment Status</h3>
        <div className="space-y-3">
          {data.fulfillmentByStatus.map((status) => (
            <div key={status.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{status.status}</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                {status.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Receiving Orders */}
      {data.pendingReceivingOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Pending Receiving Orders</h3>
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
                {data.pendingReceivingOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-blue-600">{order.grnNumber}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
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
        </div>
      )}
    </div>
  );
}

// Inventory Tab Component
function InventoryTab({ data }: { data: InventoryData }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total SKUs"
          value={data.summary.totalSKUs.toLocaleString()}
          icon={Boxes}
        />
        <StatCard
          title="Total Quantity"
          value={data.summary.totalQuantity.toLocaleString()}
          icon={Package}
        />
        <StatCard
          title="Inventory Value"
          value={`₹${(data.summary.totalValue / 100000).toFixed(1)}L`}
          icon={IndianRupee}
        />
        <StatCard
          title="Low Stock"
          value={data.summary.lowStockCount.toLocaleString()}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Out of Stock"
          value={data.summary.outOfStockCount.toLocaleString()}
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
                  <td className="py-3 px-4 font-medium text-gray-900">{loc.locationName}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{loc.skuCount}</td>
                  <td className="py-3 px-4 text-center font-semibold text-gray-900">{loc.totalQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Items */}
      {data.lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Low Stock Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Current Qty</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Min Level</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockItems.map((item) => (
                  <tr key={item.skuId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm text-blue-600">{item.skuCode}</td>
                    <td className="py-3 px-4 text-gray-700">{item.skuName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        {item.totalQuantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">{item.minStockLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Returns Tab Component
function ReturnsTab({ data }: { data: ReturnsData }) {
  return (
    <div className="space-y-6">
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

      {/* Returns by Type and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <h3 className="font-semibold text-gray-900 mb-4">Recent Returns</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Return #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentReturns.map((ret) => (
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
                </tr>
              ))}
            </tbody>
          </table>
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
