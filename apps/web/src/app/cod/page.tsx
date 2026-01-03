"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building2,
  RefreshCw,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

// Fetch COD summary
async function fetchCODSummary() {
  const res = await fetch("/api/cod/summary");
  if (!res.ok) throw new Error("Failed to fetch COD summary");
  return res.json();
}

// Fetch recent collections
async function fetchCollections(page = 1) {
  const res = await fetch(`/api/cod/collections?page=${page}&pageSize=10`);
  if (!res.ok) throw new Error("Failed to fetch collections");
  return res.json();
}

// Fetch pending remittances
async function fetchRemittances() {
  const res = await fetch("/api/cod/remittances?status=PENDING");
  if (!res.ok) throw new Error("Failed to fetch remittances");
  return res.json();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CODDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "collections" | "deposits" | "remittances">("overview");

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["cod", "summary"],
    queryFn: fetchCODSummary,
    refetchInterval: 30000,
  });

  const { data: collectionsData, isLoading: collectionsLoading } = useQuery({
    queryKey: ["cod", "collections"],
    queryFn: () => fetchCollections(),
  });

  const { data: remittancesData } = useQuery({
    queryKey: ["cod", "remittances", "pending"],
    queryFn: fetchRemittances,
  });

  const summary = summaryData?.data;
  const kpis = summary?.kpis || {};
  const statusBreakdown = summary?.statusBreakdown || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote className="h-7 w-7 text-green-600" />
            COD Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track cash collections, deposits, and client remittances
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchSummary()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Today's Collection */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Collection</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(kpis.todayCollected || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.todayCount || 0} deliveries
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Deposits */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Deposits</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatCurrency(kpis.pendingDepositAmount || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.pendingDepositCount || 0} collections
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Pending Remittances */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Remittances</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(kpis.pendingRemittanceAmount || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.pendingRemittanceCount || 0} clients
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Discrepancies */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Discrepancies</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {summary?.discrepancies?.length || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Requires attention
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Flow */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">COD Flow Status</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
              <IndianRupee className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Collected</p>
            <p className="text-lg font-bold text-yellow-600">
              {formatCurrency(statusBreakdown.collected?.amount || 0)}
            </p>
            <p className="text-xs text-gray-500">{statusBreakdown.collected?.count || 0} orders</p>
          </div>

          <div className="text-center relative">
            <div className="absolute top-8 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Deposited</p>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(statusBreakdown.deposited?.amount || 0)}
            </p>
            <p className="text-xs text-gray-500">{statusBreakdown.deposited?.count || 0} orders</p>
          </div>

          <div className="text-center relative">
            <div className="absolute top-8 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Reconciled</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(statusBreakdown.reconciled?.amount || 0)}
            </p>
            <p className="text-xs text-gray-500">{statusBreakdown.reconciled?.count || 0} orders</p>
          </div>

          <div className="text-center relative">
            <div className="absolute top-8 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Disputed</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(statusBreakdown.disputed?.amount || 0)}
            </p>
            <p className="text-xs text-gray-500">{statusBreakdown.disputed?.count || 0} orders</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drivers */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            Top Collectors (This Week)
          </h3>
          <div className="space-y-3">
            {summary?.topDrivers?.length > 0 ? (
              summary.topDrivers.slice(0, 5).map((driver: any, index: number) => (
                <div key={driver.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{driver.name}</p>
                      <p className="text-xs text-gray-500">{driver.collectionCount} collections</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(driver.totalCollected)}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Recent Collections */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Banknote className="h-5 w-5 text-gray-500" />
            Recent Collections
          </h3>
          <div className="space-y-3">
            {summary?.recentCollections?.length > 0 ? (
              summary.recentCollections.slice(0, 5).map((collection: any) => (
                <div key={collection.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{collection.awbNumber}</p>
                    <p className="text-xs text-gray-500">
                      {collection.collectedByName} • {formatTime(collection.collectionTime)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(collection.collectedAmount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      collection.paymentMode === "CASH" ? "bg-green-100 text-green-700" :
                      collection.paymentMode === "UPI" ? "bg-purple-100 text-purple-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {collection.paymentMode}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent collections</p>
            )}
          </div>
        </div>
      </div>

      {/* Discrepancies Alert */}
      {summary?.discrepancies?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-6">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Deposit Discrepancies - Requires Attention
          </h3>
          <div className="space-y-2">
            {summary.discrepancies.map((disc: any) => (
              <div key={disc.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{disc.depositNumber}</p>
                  <p className="text-sm text-gray-500">
                    {disc.depositedByName} • {formatTime(disc.depositTime)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Expected: {formatCurrency(disc.expectedAmount)}
                  </p>
                  <p className="text-sm text-red-600 font-semibold">
                    Shortage: {formatCurrency(disc.shortageAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
