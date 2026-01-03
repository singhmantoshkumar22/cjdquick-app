"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  IndianRupee,
  Users,
  Building2,
  RefreshCw,
  Calendar,
  Percent,
  Scale,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

// Fetch analytics
async function fetchAnalytics(period: string) {
  const res = await fetch(`/api/analytics?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function AnalyticsDashboardPage() {
  const [period, setPeriod] = useState("30");

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ["analytics", period],
    queryFn: () => fetchAnalytics(period),
    refetchInterval: 60000,
  });

  const data = analyticsData?.data;
  const overview = data?.overview || {};
  const performance = data?.performance || {};
  const cod = data?.cod || {};
  const statusBreakdown = data?.statusBreakdown || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Analytics & Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Comprehensive insights into operations performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 1 year</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Shipments */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Shipments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(overview.totalShipments || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Last {period} days
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Delivery Rate */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delivery Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {overview.deliveryRate || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {overview.deliveredCount || 0} delivered
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">SLA Compliance</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {performance.slaCompliance || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {performance.slaBreachCount || 0} breaches
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* NDR Rate */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">NDR Rate</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {performance.ndrRate || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {performance.ndrCount || 0} NDRs
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* In Transit */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Transit</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatNumber(overview.inTransit || 0)}
              </p>
            </div>
            <Truck className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        {/* RTO Rate */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">RTO Rate</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {performance.rtoRate || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {performance.rtoCount || 0} returns
              </p>
            </div>
            <RotateCcw className="h-8 w-8 text-red-200" />
          </div>
        </div>

        {/* COD Collection */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">COD Collection</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(cod.totalAmount || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {cod.shipmentCount || 0} COD orders ({cod.percentage || 0}%)
              </p>
            </div>
            <IndianRupee className="h-8 w-8 text-emerald-200" />
          </div>
        </div>

        {/* Avg Weight */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Weight</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {performance.avgWeight || 0} kg
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Total: {formatNumber(performance.totalWeight || 0)} kg
              </p>
            </div>
            <Scale className="h-8 w-8 text-gray-200" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {[
              { label: "Delivered", value: statusBreakdown.delivered, color: "green" },
              { label: "In Transit", value: statusBreakdown.inTransit, color: "blue" },
              { label: "In Hub", value: statusBreakdown.inHub, color: "purple" },
              { label: "Out for Delivery", value: statusBreakdown.outForDelivery, color: "indigo" },
              { label: "NDR", value: statusBreakdown.ndr, color: "orange" },
              { label: "RTO", value: statusBreakdown.rto, color: "red" },
              { label: "Pending", value: statusBreakdown.pending, color: "gray" },
            ].map(({ label, value, color }) => {
              const percentage = overview.totalShipments > 0
                ? ((value || 0) / overview.totalShipments) * 100
                : 0;
              return (
                <div key={label} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-gray-600">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div
                      className={`bg-${color}-500 h-3 rounded-full`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm font-medium text-gray-900">
                    {value || 0}
                  </span>
                  <span className="w-12 text-right text-xs text-gray-500">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            Top Clients by Volume
          </h3>
          <div className="space-y-3">
            {data?.topClients?.length > 0 ? (
              data.topClients.slice(0, 7).map((client: any, index: number) => (
                <div key={client.clientId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{client.clientName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{client.shipmentCount}</p>
                    <p className="text-xs text-gray-500">{client.percentage}%</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No client data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Hub Performance */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-500" />
          Hub Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data?.hubPerformance?.length > 0 ? (
            data.hubPerformance.map((hub: any) => (
              <div key={hub.hubId} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{hub.hubCode}</p>
                <p className="font-semibold text-gray-900 mt-1">{hub.hubName}</p>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{hub.shipmentCount}</p>
                <p className="text-xs text-gray-500">shipments</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center py-4">No hub data available</p>
          )}
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <h4 className="font-medium opacity-90">Delivery Performance</h4>
          <p className="text-3xl font-bold mt-2">{overview.deliveryRate || 0}%</p>
          <p className="text-sm opacity-75 mt-1">
            {overview.deliveredCount || 0} out of {overview.totalShipments || 0} delivered
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
          <h4 className="font-medium opacity-90">On-Time Performance</h4>
          <p className="text-3xl font-bold mt-2">{performance.slaCompliance || 0}%</p>
          <p className="text-sm opacity-75 mt-1">
            {performance.slaBreachCount || 0} SLA breaches
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white">
          <h4 className="font-medium opacity-90">First Attempt Delivery</h4>
          <p className="text-3xl font-bold mt-2">
            {(100 - parseFloat(performance.ndrRate || "0")).toFixed(1)}%
          </p>
          <p className="text-sm opacity-75 mt-1">
            {performance.ndrCount || 0} required reattempts
          </p>
        </div>
      </div>
    </div>
  );
}
