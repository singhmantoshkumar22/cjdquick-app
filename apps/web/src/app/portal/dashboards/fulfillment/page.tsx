"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Package,
  PackageCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Boxes,
  MapPin,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

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
  period: { range: string; startDate: string; endDate: string };
}

export default function FulfillmentDashboardPage() {
  const [dateRange, setDateRange] = useState("last7days");
  const [data, setData] = useState<FulfillmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("portal_token");
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/portal/dashboards/fulfillment?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to fetch data");
      }
    } catch (err) {
      setError("Failed to fetch fulfillment data");
      console.error("Fulfillment Dashboard error:", err);
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

  const shipmentStatus = [
    { status: "In Process", count: data.summary.totalInProcess, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
    { status: "Pending Picklist", count: data.summary.pendingPicklist, icon: Package, color: "text-blue-600 bg-blue-50" },
    { status: "Picking In Progress", count: data.summary.pickingInProgress, icon: PackageCheck, color: "text-indigo-600 bg-indigo-50" },
    { status: "Packed Pending Ship", count: data.summary.packedPendingShip, icon: Boxes, color: "text-purple-600 bg-purple-50" },
    { status: "Pending Receiving", count: data.summary.pendingReceiving, icon: Truck, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fulfillment Dashboard</h1>
          <p className="text-gray-500">Track order fulfillment and shipping status</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="In Process"
          value={data.summary.totalInProcess.toString()}
          icon={Clock}
        />
        <StatCard
          title="Completed Today"
          value={data.summary.completedToday.toString()}
          icon={CheckCircle}
        />
        <StatCard
          title="Pending Receiving"
          value={data.summary.pendingReceiving.toString()}
          icon={Truck}
        />
        <StatCard
          title="Packed Ready"
          value={data.summary.packedPendingShip.toString()}
          icon={Boxes}
        />
      </div>

      {/* In Process Shipment Status */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">In Process Shipment Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {shipmentStatus.map((status) => {
            const Icon = status.icon;
            return (
              <div
                key={status.status}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
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
