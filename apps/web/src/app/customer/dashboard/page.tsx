"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  CreditCard,
  PlusCircle,
  Search,
  FileText,
  BarChart3,
  Users,
  Warehouse,
  ClipboardList,
  Settings,
} from "lucide-react";
import { useService } from "../service-context";

interface DashboardData {
  overview: {
    totalShipments: number;
    activeShipments: number;
    deliveredShipments: number;
    pendingPickup: number;
  };
  sla: {
    adherencePercentage: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    averageTat: string;
    targetSla: number;
  };
  billing: {
    creditLimit: number;
    currentBalance: number;
    availableCredit: number;
  };
}

export default function CustomerDashboard() {
  const { selectedService } = useService();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("customer_token");
      if (!token) return;

      try {
        setLoading(true);
        const res = await fetch("/api/customer/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  // Render different dashboards based on selected service
  switch (selectedService) {
    case "b2b":
      return <B2BDashboard data={data} />;
    case "b2c":
      return <B2CDashboard data={data} />;
    case "oms":
      return <OMSDashboard data={data} />;
    default:
      return <B2BDashboard data={data} />;
  }
}

// B2B Dashboard Component
function B2BDashboard({ data }: { data: DashboardData | null }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2B Dashboard</h1>
          <p className="text-gray-500">Business to Business logistics management</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/customer/b2b/book"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            Book Shipment
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Shipments"
          value={data?.overview.totalShipments || 0}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="In Transit"
          value={data?.overview.activeShipments || 0}
          icon={Truck}
          color="amber"
        />
        <StatCard
          title="Delivered"
          value={data?.overview.deliveredShipments || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Pickup"
          value={data?.overview.pendingPickup || 0}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction href="/customer/b2b/shipments" icon={Package} label="My Shipments" color="blue" />
        <QuickAction href="/customer/b2b/track" icon={Search} label="Track Shipment" color="green" />
        <QuickAction href="/customer/b2b/invoices" icon={FileText} label="Invoices" color="purple" />
        <QuickAction href="/customer/b2b/reports" icon={BarChart3} label="Reports" color="amber" />
      </div>

      {/* SLA & Billing Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SLA Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {data?.sla.adherencePercentage || 0}%
              </div>
              <p className="text-sm text-gray-500 mt-1">SLA Adherence</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {data?.sla.averageTat || "0"}
              </div>
              <p className="text-sm text-gray-500 mt-1">Avg TAT (Days)</p>
            </div>
          </div>
        </div>

        {/* Billing Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Credit Limit</span>
              <span className="font-semibold">₹{(data?.billing.creditLimit || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Used</span>
              <span className="font-semibold text-red-600">₹{(data?.billing.currentBalance || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Available</span>
              <span className="font-semibold text-green-600">₹{(data?.billing.availableCredit || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// B2C Dashboard Component
function B2CDashboard({ data }: { data: DashboardData | null }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2C Dashboard</h1>
          <p className="text-gray-500">E-commerce & retail delivery management</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/customer/b2c/orders/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlusCircle className="h-4 w-4" />
            Create Order
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={data?.overview.totalShipments || 0}
          icon={Package}
          color="green"
        />
        <StatCard
          title="In Transit"
          value={data?.overview.activeShipments || 0}
          icon={Truck}
          color="amber"
        />
        <StatCard
          title="Delivered"
          value={data?.overview.deliveredShipments || 0}
          icon={CheckCircle}
          color="blue"
        />
        <StatCard
          title="Returns"
          value={0}
          icon={RefreshCw}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction href="/customer/b2c/orders" icon={ClipboardList} label="All Orders" color="green" />
        <QuickAction href="/customer/b2c/track" icon={Search} label="Track Order" color="blue" />
        <QuickAction href="/customer/b2c/ndr" icon={AlertTriangle} label="NDR Management" color="red" />
        <QuickAction href="/customer/b2c/cod" icon={CreditCard} label="COD Remittance" color="purple" />
      </div>

      {/* Performance & COD Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Performance</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data?.sla.onTimeDeliveries || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">On-Time</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {data?.sla.lateDeliveries || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Delayed</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">0</div>
              <p className="text-xs text-gray-500 mt-1">RTO</p>
            </div>
          </div>
        </div>

        {/* COD Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">COD Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Collected</span>
              <span className="font-semibold text-green-600">₹0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-amber-600">₹0</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Remitted</span>
              <span className="font-semibold text-blue-600">₹0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// OMS Dashboard Component
function OMSDashboard({ data }: { data: DashboardData | null }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OMS Dashboard</h1>
          <p className="text-gray-500">Order Management System for fulfillment</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/customer/oms/orders/new"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <PlusCircle className="h-4 w-4" />
            New Order
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={data?.overview.totalShipments || 0}
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          title="Processing"
          value={data?.overview.pendingPickup || 0}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Shipped"
          value={data?.overview.activeShipments || 0}
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={data?.overview.deliveredShipments || 0}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction href="/customer/oms/orders" icon={ClipboardList} label="All Orders" color="purple" />
        <QuickAction href="/customer/oms/inventory" icon={Warehouse} label="Inventory" color="blue" />
        <QuickAction href="/customer/oms/channels" icon={Users} label="Channels" color="green" />
        <QuickAction href="/customer/oms/settings" icon={Settings} label="Settings" color="gray" />
      </div>

      {/* Order Pipeline & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Pipeline</h2>
          <div className="space-y-4">
            <PipelineItem label="New Orders" count={0} color="blue" />
            <PipelineItem label="Confirmed" count={0} color="green" />
            <PipelineItem label="Packing" count={0} color="amber" />
            <PipelineItem label="Ready to Ship" count={0} color="purple" />
          </div>
        </div>

        {/* Channel Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Channel Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Amazon</span>
              <span className="font-semibold">0 orders</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Flipkart</span>
              <span className="font-semibold">0 orders</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Shopify</span>
              <span className="font-semibold">0 orders</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Manual</span>
              <span className="font-semibold">0 orders</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: "blue" | "green" | "amber" | "purple" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: any;
  label: string;
  color: "blue" | "green" | "amber" | "purple" | "red" | "gray";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
    gray: "bg-gray-50 text-gray-600 hover:bg-gray-100",
  };

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${colors[color]}`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function PipelineItem({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "blue" | "green" | "amber" | "purple";
}) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${colors[color]}`} />
        <span className="text-gray-600">{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{count}</span>
    </div>
  );
}
