"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  Building2,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Package,
  IndianRupee,
  AlertTriangle,
  RotateCcw,
  ArrowRightLeft,
  Eye,
  Percent,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

// Fetch partners
async function fetchPartners() {
  const res = await fetch("/api/partners?isActive=true");
  if (!res.ok) throw new Error("Failed to fetch partners");
  return res.json();
}

// Fetch partner performance
async function fetchPerformance(period: string) {
  const res = await fetch(`/api/partners/performance?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch performance");
  return res.json();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    HANDED_OVER: "bg-blue-100 text-blue-700",
    ACKNOWLEDGED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return styles[status] || "bg-gray-100 text-gray-700";
}

export default function PartnersPage() {
  const [period, setPeriod] = useState("30");

  const { data: partnersData, refetch: refetchPartners } = useQuery({
    queryKey: ["partners"],
    queryFn: fetchPartners,
  });

  const { data: performanceData, refetch: refetchPerformance } = useQuery({
    queryKey: ["partner-performance", period],
    queryFn: () => fetchPerformance(period),
    refetchInterval: 60000,
  });

  const partners = partnersData?.data?.items || [];
  const performance = performanceData?.data;
  const kpis = performance?.kpis || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-7 w-7 text-teal-600" />
            Partner Network
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage 3PL partners, handovers, and performance
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
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchPartners();
              refetchPerformance();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Partner
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Handed Over */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Handed to Partners</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {kpis.totalHandedOver || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.handoverCount || 0} handovers
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
              <ArrowRightLeft className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>

        {/* Delivery Rate */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Partner Delivery Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {kpis.deliveryRate || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.deliveredByPartner || 0} delivered
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* RTO Rate */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Partner RTO Rate</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {kpis.rtoRate || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.rtoByPartner || 0} returns
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <RotateCcw className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* COD with Partners */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">COD with Partners</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatCurrency(kpis.codAmount || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.codShipments || 0} COD orders
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Partner Performance + Active Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Partner Performance Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              Partner Performance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3">Partner</th>
                  <th className="text-right px-4 py-3">Orders</th>
                  <th className="text-right px-4 py-3">Delivery %</th>
                  <th className="text-right px-4 py-3">RTO %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {performance?.partnerPerformance?.length > 0 ? (
                  performance.partnerPerformance.map((partner: any) => (
                    <tr key={partner.partnerId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {partner.partnerName}
                        </p>
                        <p className="text-xs text-gray-400">{partner.partnerCode}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {partner.totalShipments}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${
                            parseFloat(partner.deliveryRate) >= 80
                              ? "text-green-600"
                              : parseFloat(partner.deliveryRate) >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {partner.deliveryRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${
                            parseFloat(partner.rtoRate) <= 5
                              ? "text-green-600"
                              : parseFloat(partner.rtoRate) <= 10
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {partner.rtoRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No partner data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Partners */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              Active Partners ({partners.length})
            </h3>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {partners.length > 0 ? (
              partners.map((partner: any) => (
                <div
                  key={partner.id}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{partner.displayName}</p>
                    <p className="text-xs text-gray-400">{partner.code}</p>
                    <div className="flex gap-2 mt-1">
                      {partner.supportsCod && (
                        <span className="px-2 py-0.5 text-xs rounded bg-green-50 text-green-700">
                          COD
                        </span>
                      )}
                      {partner.supportsReverse && (
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">
                          Reverse
                        </span>
                      )}
                      {partner.supportsHyperlocal && (
                        <span className="px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700">
                          Hyperlocal
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {partner.isActive ? (
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>No partners configured</p>
                <Button size="sm" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Partner
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Handovers */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-500" />
            Recent Handovers
          </h3>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
          <div className="col-span-3">Handover #</div>
          <div className="col-span-3">Partner</div>
          <div className="col-span-2">Shipments</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
        </div>

        {/* Rows */}
        <div className="divide-y">
          {performance?.recentHandovers?.length > 0 ? (
            performance.recentHandovers.map((handover: any) => (
              <div
                key={handover.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 items-center"
              >
                <div className="col-span-3">
                  <p className="font-medium text-blue-600">{handover.handoverNumber}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-gray-900">{handover.partner?.name}</p>
                  <p className="text-xs text-gray-400">{handover.partner?.code}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900">
                    {handover.shipmentCount}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">
                    {formatDate(handover.createdAt)}
                  </p>
                </div>
                <div className="col-span-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                      handover.status
                    )}`}
                  >
                    {handover.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">No handovers yet</div>
          )}
        </div>
      </div>

      {/* Quick Setup */}
      <div className="mt-6 bg-teal-50 rounded-xl p-5">
        <h3 className="font-semibold text-teal-900 mb-4">Partner Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Delhivery</h4>
            <p className="text-sm text-gray-500 mb-3">
              India's largest fully integrated logistics player
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Configure API
            </Button>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">XpressBees</h4>
            <p className="text-sm text-gray-500 mb-3">
              Express logistics and e-commerce delivery
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Configure API
            </Button>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Ecom Express</h4>
            <p className="text-sm text-gray-500 mb-3">
              B2C logistics and reverse pickup
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Configure API
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
