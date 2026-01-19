"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
  ArrowLeft,
} from "lucide-react";

interface NDR {
  id: string;
  ndrCode: string;
  status: string;
  reason: string;
  priority: string;
  riskScore: number | null;
  confidence: number | null;
  attemptNumber: number | null;
  order: {
    id: string;
    orderNo: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
  } | null;
  delivery: {
    id: string;
    awbNo: string;
  } | null;
}

interface NDRSummary {
  summary: {
    totalNDRs: number;
    openNDRs: number;
    inProgressNDRs: number;
    resolvedNDRs: number;
    rtoNDRs: number;
    ndrsToday: number;
    resolvedToday: number;
  };
  breakdown: {
    byStatus: Record<string, number>;
    byReason: Record<string, number>;
    byPriority: Record<string, number>;
  };
  riskMetrics: {
    avgRiskScore: number;
    highRiskCount: number;
  };
}

export default function ClientNDRCommandCenterPage() {
  const router = useRouter();

  // Filter state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");

  // Data state
  const [ndrs, setNdrs] = useState<NDR[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [ndrSummary, setNdrSummary] = useState<NDRSummary | null>(null);
  const [stats, setStats] = useState({
    statusCounts: {} as Record<string, number>,
    priorityCounts: {} as Record<string, number>,
    reasonCounts: {} as Record<string, number>,
    avgResolutionHours: 0,
  });

  // Fetch NDR summary
  const fetchNdrSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/control-tower/ndr-summary");
      if (response.ok) {
        const data = await response.json();
        setNdrSummary(data);
      }
    } catch (error) {
      console.error("Failed to fetch NDR summary:", error);
    }
  }, []);

  // Fetch NDRs list
  const fetchNdrs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (reasonFilter) params.set("reason", reasonFilter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/v1/ndr?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNdrs(data.ndrs || []);
        setTotal(data.total || 0);
        setStats({
          statusCounts: data.statusCounts || {},
          priorityCounts: data.priorityCounts || {},
          reasonCounts: data.reasonCounts || {},
          avgResolutionHours: data.avgResolutionHours || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch NDRs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, priorityFilter, reasonFilter, search]);

  useEffect(() => {
    fetchNdrSummary();
    fetchNdrs();
  }, [fetchNdrSummary, fetchNdrs]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNdrSummary();
      fetchNdrs();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchNdrSummary, fetchNdrs]);

  // Calculate stats
  const totalNDRs = Object.values(stats.statusCounts).reduce((a, b) => a + b, 0);
  const openNDRs = stats.statusCounts.OPEN || 0;
  const actionRequestedNDRs = stats.statusCounts.ACTION_REQUESTED || 0;
  const resolvedNDRs = stats.statusCounts.RESOLVED || 0;
  const rtoNDRs = stats.statusCounts.RTO || 0;
  const criticalNDRs = stats.priorityCounts.CRITICAL || 0;
  const highPriorityNDRs = stats.priorityCounts.HIGH || 0;

  const resolutionRate = totalNDRs > 0 ? Math.round((resolvedNDRs / totalNDRs) * 100) : 0;
  const contactRate = totalNDRs > 0 ? Math.round(((actionRequestedNDRs + resolvedNDRs) / totalNDRs) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/client/control-tower")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Bot className="h-7 w-7" />
              NDR Command Center
            </h1>
            <p className="text-gray-500">
              Track and manage non-delivery reports for your orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { fetchNdrs(); fetchNdrSummary(); }}
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
              NDR rules scan every 15 minutes
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="bg-white rounded-lg border border-l-4 border-l-orange-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Open NDRs</span>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">{openNDRs}</div>
          <p className="text-xs text-gray-500">Awaiting action</p>
        </div>

        <div className="bg-white rounded-lg border border-l-4 border-l-blue-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Action Requested</span>
            <Phone className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{actionRequestedNDRs}</div>
          <p className="text-xs text-gray-500">Awaiting response</p>
        </div>

        <div className="bg-white rounded-lg border border-l-4 border-l-green-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Resolved</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{resolvedNDRs}</div>
          <p className="text-xs text-gray-500">{resolutionRate}% resolution rate</p>
        </div>

        <div className="bg-white rounded-lg border border-l-4 border-l-red-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">RTO</span>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{rtoNDRs}</div>
          <p className="text-xs text-gray-500">Return initiated</p>
        </div>

        <div className="bg-white rounded-lg border border-l-4 border-l-purple-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Critical</span>
            <ShieldAlert className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalNDRs}</div>
          <p className="text-xs text-gray-500">Needs immediate action</p>
        </div>

        <div className="bg-white rounded-lg border border-l-4 border-l-amber-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">High Priority</span>
            <Target className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{highPriorityNDRs}</div>
          <p className="text-xs text-gray-500">Priority attention</p>
        </div>
      </div>

      {/* AI Performance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">AI Auto-Resolution</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">{resolutionRate}%</span>
            {resolutionRate >= 50 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {resolvedNDRs} of {totalNDRs} NDRs resolved
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Contact Success Rate</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">{contactRate}%</span>
            {contactRate >= 70 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${contactRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Customers reached successfully</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Avg. Resolution Time</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">
              {stats.avgResolutionHours > 0 ? `${stats.avgResolutionHours}h` : "N/A"}
            </span>
            {stats.avgResolutionHours > 0 && stats.avgResolutionHours < 4 ? (
              <TrendingDown className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-amber-600 h-2 rounded-full"
              style={{ width: `${stats.avgResolutionHours > 0 ? Math.min(100, (4 / stats.avgResolutionHours) * 100) : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Based on {resolvedNDRs} resolved cases</p>
        </div>
      </div>

      {/* NDR Reason Breakdown */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-2">NDR Reasons Distribution</h3>
        <p className="text-sm text-gray-500 mb-4">AI-classified NDR reasons across all active cases</p>
        <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
          {[
            { key: "CUSTOMER_UNAVAILABLE", label: "Not Available", color: "bg-blue-500" },
            { key: "WRONG_ADDRESS", label: "Wrong Address", color: "bg-red-500" },
            { key: "PHONE_UNREACHABLE", label: "Phone Off", color: "bg-orange-500" },
            { key: "CUSTOMER_REFUSED", label: "Refused", color: "bg-purple-500" },
            { key: "COD_NOT_READY", label: "COD Not Ready", color: "bg-amber-500" },
            { key: "DELIVERY_RESCHEDULED", label: "Reschedule", color: "bg-green-500" },
            { key: "OTHER", label: "Other", color: "bg-gray-500" },
          ].map(({ key, label, color }) => {
            const count = stats.reasonCounts[key] || 0;
            const percentage = totalNDRs > 0 ? Math.round((count / totalNDRs) * 100) : 0;
            return (
              <div
                key={key}
                className={`rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  reasonFilter === key ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setReasonFilter(reasonFilter === key ? "" : key)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-3 w-3 rounded-full ${color}`} />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                <div className="text-xl font-bold">{count}</div>
                <div className="text-xs text-gray-500">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">NDR Queue</h3>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order, AWB, customer..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="ACTION_REQUESTED">Action Requested</option>
            <option value="REATTEMPT_SCHEDULED">Reattempt</option>
            <option value="RESOLVED">Resolved</option>
            <option value="RTO">RTO</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priority</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* NDR Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="p-3 font-medium">NDR Code</th>
                <th className="p-3 font-medium">Order</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Reason</th>
                <th className="p-3 font-medium">Priority</th>
                <th className="p-3 font-medium">Risk</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              ) : ndrs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-500">No NDRs matching your filters</p>
                  </td>
                </tr>
              ) : (
                ndrs.map((ndr) => (
                  <tr key={ndr.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{ndr.ndrCode}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{ndr.order?.orderNo || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {ndr.delivery?.awbNo || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{ndr.order?.customerName || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {ndr.order?.customerPhone || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 rounded">
                          {ndr.reason.replace(/_/g, " ")}
                        </span>
                        {ndr.confidence && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round(ndr.confidence * 100)}% confident
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          ndr.priority === "CRITICAL"
                            ? "bg-red-100 text-red-700"
                            : ndr.priority === "HIGH"
                              ? "bg-orange-100 text-orange-700"
                              : ndr.priority === "MEDIUM"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                        }`}
                      >
                        {ndr.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      {ndr.riskScore !== null && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                ndr.riskScore > 70 ? "bg-red-500" : ndr.riskScore > 40 ? "bg-amber-500" : "bg-green-500"
                              }`}
                              style={{ width: `${ndr.riskScore}%` }}
                            />
                          </div>
                          <span className="text-xs">{ndr.riskScore}%</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          ndr.status === "RESOLVED"
                            ? "bg-green-100 text-green-700"
                            : ndr.status === "ACTION_REQUESTED"
                              ? "bg-blue-100 text-blue-700"
                              : ndr.status === "RTO"
                                ? "bg-red-100 text-red-700"
                                : ndr.status === "REATTEMPT_SCHEDULED"
                                  ? "bg-amber-100 text-amber-700"
                                  : ndr.status === "CLOSED"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {ndr.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => ndr.order?.id && router.push(`/client/orders?search=${ndr.order.orderNo}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="View Order"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 25 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * 25) + 1} - {Math.min(page * 25, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page * 25 >= total}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
