"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Search,
  X,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  ArrowLeft,
} from "lucide-react";

interface Exception {
  id: string;
  exceptionCode: string;
  type: string;
  source: string;
  severity: string;
  entityType: string;
  entityId: string;
  orderId: string | null;
  title: string;
  description: string;
  autoResolvable: boolean;
  status: string;
  priority: number;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface DashboardStats {
  exceptions: {
    critical: number;
    open: number;
    inProgress: number;
    resolvedToday: number;
    byType: Record<string, number>;
  };
  operations: {
    ordersToday: number;
    openNDRs: number;
  };
  timestamp: string;
}

const severityConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CRITICAL: { label: "Critical", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle },
  MEDIUM: { label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  LOW: { label: "Low", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "bg-red-100 text-red-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-700" },
  IGNORED: { label: "Ignored", color: "bg-gray-100 text-gray-700" },
};

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  STUCK_ORDER: { label: "Stuck Order", icon: Package },
  SLA_BREACH: { label: "SLA Breach", icon: Clock },
  NDR_ESCALATION: { label: "NDR Escalation", icon: AlertTriangle },
  CARRIER_DELAY: { label: "Carrier Delay", icon: Truck },
  INVENTORY_ISSUE: { label: "Inventory Issue", icon: Package },
  PAYMENT_ISSUE: { label: "Payment Issue", icon: AlertTriangle },
};

const exceptionTypes = [
  { value: "all", label: "All Types" },
  { value: "STUCK_ORDER", label: "Stuck Orders" },
  { value: "SLA_BREACH", label: "SLA Breach" },
  { value: "NDR_ESCALATION", label: "NDR Escalation" },
  { value: "CARRIER_DELAY", label: "Carrier Delays" },
  { value: "INVENTORY_ISSUE", label: "Inventory Issues" },
  { value: "PAYMENT_ISSUE", label: "Payment Issues" },
];

export default function ClientExceptionManagementPage() {
  const router = useRouter();
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/control-tower/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  // Fetch exceptions list
  const fetchExceptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeTab !== "all") params.set("type", activeTab);
      params.set("limit", "50");

      const response = await fetch(`/api/v1/system/exceptions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch exceptions");
      const result = await response.json();

      setExceptions(result || []);
    } catch (error) {
      console.error("Error fetching exceptions:", error);
      setExceptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, activeTab]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
    fetchExceptions();
  }, [fetchStats, fetchExceptions]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchExceptions();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchExceptions]);

  function clearFilters() {
    setSearch("");
    setActiveTab("all");
  }

  const hasFilters = search || activeTab !== "all";

  const getSeverityBadge = (severity: string) => {
    const config = severityConfig[severity] || severityConfig.MEDIUM;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = typeConfig[type] || { label: type, icon: AlertTriangle };
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
        <config.icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/client/control-tower")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exception Management</h1>
            <p className="text-gray-500">
              Monitor and track operational exceptions for your orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchStats(); fetchExceptions(); }}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Auto-Detection Status Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-indigo-700">Auto-Detection Active</span>
            </div>
            <span className="text-indigo-600">
              Exceptions are automatically detected every 15 minutes
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-red-200 bg-red-50/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Critical</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {stats?.exceptions.critical ?? 0}
          </div>
          <p className="text-xs text-gray-500">Requires immediate action</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Open</span>
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.exceptions.open ?? 0}
          </div>
          <p className="text-xs text-gray-500">Awaiting resolution</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">In Progress</span>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.exceptions.inProgress ?? 0}
          </div>
          <p className="text-xs text-gray-500">Being worked on</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Resolved Today</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.exceptions.resolvedToday ?? 0}
          </div>
          <p className="text-xs text-gray-500">Successfully resolved</p>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="bg-white rounded-lg border p-1 inline-flex flex-wrap gap-1">
        {exceptionTypes.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.value
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            {stats?.exceptions.byType[tab.value] && tab.value !== "all" && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                {stats.exceptions.byType[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by exception code, entity ID, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Exception Queue</h2>
          <p className="text-sm text-gray-500">
            {exceptions.length} exceptions found {hasFilters && "(filtered)"}
          </p>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : exceptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">All Clear!</h3>
              <p className="text-sm text-gray-500 mt-2">
                {hasFilters
                  ? "No exceptions match your filters"
                  : "No exceptions detected. Operations running smoothly."}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Auto-detection runs every 15 minutes
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Exception</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Entity</th>
                    <th className="pb-3 font-medium">Severity</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((exception) => {
                    const statusInfo = statusConfig[exception.status] || {
                      label: exception.status,
                      color: "bg-gray-100 text-gray-700",
                    };

                    return (
                      <tr key={exception.id} className="border-b last:border-0">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{exception.exceptionCode}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {exception.title}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">{getTypeBadge(exception.type)}</td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{exception.entityId}</p>
                            <p className="text-xs text-gray-500">
                              {exception.entityType}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">{getSeverityBadge(exception.severity)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-500">
                          {format(new Date(exception.createdAt), "dd MMM, HH:mm")}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              if (exception.orderId) {
                                router.push(`/client/orders?search=${exception.orderId}`);
                              }
                            }}
                            disabled={!exception.orderId}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
