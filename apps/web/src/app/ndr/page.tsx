"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Phone,
  PhoneOff,
  PhoneCall,
  RefreshCw,
  Clock,
  MapPin,
  Package,
  ArrowRight,
  User,
  Building2,
  MessageSquare,
  RotateCcw,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

// Fetch NDR summary
async function fetchNDRSummary() {
  const res = await fetch("/api/ndr/summary");
  if (!res.ok) throw new Error("Failed to fetch NDR summary");
  return res.json();
}

// Fetch NDR reports
async function fetchNDRReports(params: {
  status?: string;
  priority?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.priority) searchParams.set("priority", params.priority);
  if (params.page) searchParams.set("page", String(params.page));
  searchParams.set("pageSize", "20");

  const res = await fetch(`/api/ndr/reports?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch NDR reports");
  return res.json();
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return "Just now";
}

function getPriorityBadge(priority: string) {
  const styles = {
    CRITICAL: "bg-red-100 text-red-800 border-red-200",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
    LOW: "bg-green-100 text-green-800 border-green-200",
  };
  return styles[priority as keyof typeof styles] || styles.MEDIUM;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    OPEN: "bg-red-100 text-red-800",
    CUSTOMER_CONTACTED: "bg-blue-100 text-blue-800",
    ACTION_TAKEN: "bg-purple-100 text-purple-800",
    REATTEMPT_SCHEDULED: "bg-green-100 text-green-800",
    RTO_INITIATED: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-emerald-100 text-emerald-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };
  return styles[status] || "bg-gray-100 text-gray-800";
}

function getFailureReasonLabel(reason: string) {
  const labels: Record<string, string> = {
    CUSTOMER_UNAVAILABLE: "Customer Unavailable",
    WRONG_ADDRESS: "Wrong/Incomplete Address",
    CUSTOMER_REFUSED: "Customer Refused",
    RESCHEDULE_REQUESTED: "Reschedule Requested",
    PAYMENT_NOT_READY: "COD Payment Not Ready",
    PREMISES_CLOSED: "Premises Closed",
    OUT_OF_DELIVERY_AREA: "Out of Delivery Area",
    PHONE_UNREACHABLE: "Phone Unreachable",
    OTHER: "Other",
  };
  return labels[reason] || reason;
}

export default function NDRDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [selectedNDR, setSelectedNDR] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["ndr", "summary"],
    queryFn: fetchNDRSummary,
    refetchInterval: 30000,
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ["ndr", "reports", statusFilter, priorityFilter],
    queryFn: () => fetchNDRReports({ status: statusFilter, priority: priorityFilter }),
  });

  const summary = summaryData?.data;
  const kpis = summary?.kpis || {};
  const reports = reportsData?.data?.reports || [];
  const stats = reportsData?.data?.stats || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-orange-600" />
            NDR Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and resolve non-delivery reports
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Open NDRs */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open NDRs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {kpis.totalOpenNDRs || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.todayNDRs || 0} today
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Critical Priority */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {kpis.criticalCount || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Immediate action needed
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {kpis.highPriorityCount || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Requires attention
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Not Contacted */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Not Contacted</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {kpis.notContactedCount || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Pending callback
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <PhoneOff className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Resolved (7 days) */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved (7d)</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {kpis.resolvedLast7Days || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Successfully closed
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Flow + Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">NDR Status Flow</h3>
          <div className="space-y-3">
            {[
              { status: "OPEN", label: "Open", color: "red", icon: AlertTriangle },
              { status: "CUSTOMER_CONTACTED", label: "Customer Contacted", color: "blue", icon: Phone },
              { status: "ACTION_TAKEN", label: "Action Taken", color: "purple", icon: MessageSquare },
              { status: "REATTEMPT_SCHEDULED", label: "Reattempt Scheduled", color: "green", icon: Calendar },
              { status: "RTO_INITIATED", label: "RTO Initiated", color: "orange", icon: RotateCcw },
            ].map(({ status, label, color, icon: Icon }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full bg-${color}-100 flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 text-${color}-600`} />
                  </div>
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {summary?.statusBreakdown?.[status.toLowerCase().replace(/_/g, "")] ||
                     summary?.statusBreakdown?.[status === "CUSTOMER_CONTACTED" ? "customerContacted" :
                       status === "ACTION_TAKEN" ? "actionTaken" :
                       status === "REATTEMPT_SCHEDULED" ? "reattemptScheduled" :
                       status === "RTO_INITIATED" ? "rtoInitiated" : "open"] || 0}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="h-6 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failure Reasons */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Failure Reasons</h3>
          <div className="space-y-3">
            {summary?.failureReasons?.slice(0, 5).map((reason: any) => (
              <div key={reason.reason} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {getFailureReasonLabel(reason.reason)}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (reason.count / (kpis.totalOpenNDRs || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {reason.count}
                  </span>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Aging Analysis + RTO Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Aging Analysis */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            NDR Aging
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {(summary?.aging as any[])?.map((bucket: any) => (
              <div
                key={bucket.age_bucket}
                className={`p-3 rounded-lg ${
                  bucket.age_bucket === "72h+"
                    ? "bg-red-50 border border-red-200"
                    : bucket.age_bucket === "48-72h"
                    ? "bg-orange-50 border border-orange-200"
                    : bucket.age_bucket === "24-48h"
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <p className="text-sm text-gray-600">{bucket.age_bucket}</p>
                <p className="text-xl font-bold text-gray-900">{bucket.count}</p>
              </div>
            )) || (
              <p className="text-gray-500 col-span-2 text-center py-4">No data</p>
            )}
          </div>
        </div>

        {/* RTO Stats */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-gray-500" />
            RTO Tracking
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Initiated</span>
              <span className="text-lg font-semibold text-orange-600">
                {summary?.rtoStats?.initiated || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">In Transit</span>
              <span className="text-lg font-semibold text-blue-600">
                {summary?.rtoStats?.inTransit || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Delivered to Origin</span>
              <span className="text-lg font-semibold text-green-600">
                {summary?.rtoStats?.delivered || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Top Hubs */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            Top NDR Hubs
          </h3>
          <div className="space-y-3">
            {summary?.topHubs?.slice(0, 4).map((hub: any, index: number) => (
              <div key={hub.hubId || index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-red-100 text-red-700" :
                    index === 1 ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">
                    {hub.hub?.name || hub.hub?.code || "Unknown Hub"}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{hub.count}</span>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* NDR List */}
      <div className="bg-white rounded-xl shadow-sm border">
        {/* Filters */}
        <div className="p-4 border-b flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Filters:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="CUSTOMER_CONTACTED">Customer Contacted</option>
            <option value="ACTION_TAKEN">Action Taken</option>
            <option value="REATTEMPT_SCHEDULED">Reattempt Scheduled</option>
            <option value="RTO_INITIATED">RTO Initiated</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5"
          >
            <option value="">All Priority</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          {(statusFilter || priorityFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("");
                setPriorityFilter("");
              }}
            >
              Clear
            </Button>
          )}
          <div className="ml-auto text-sm text-gray-500">
            {reportsData?.data?.pagination?.total || 0} NDRs
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
          <div className="col-span-2">AWB / NDR</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-2">Failure Reason</div>
          <div className="col-span-1">Attempts</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Age</div>
          <div className="col-span-2">Actions</div>
        </div>

        {/* NDR Rows */}
        <div className="divide-y">
          {reportsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No NDR reports found</div>
          ) : (
            reports.map((ndr: any) => (
              <div
                key={ndr.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 items-center"
              >
                <div className="col-span-2">
                  <p className="font-medium text-gray-900 text-sm">{ndr.awbNumber}</p>
                  <p className="text-xs text-gray-500">{ndr.ndrNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-900">{ndr.shipment?.consigneeName}</p>
                  <p className="text-xs text-gray-500">{ndr.shipment?.consigneeMobile}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-700">
                    {getFailureReasonLabel(ndr.failureReason)}
                  </p>
                </div>
                <div className="col-span-1">
                  <span className="text-sm font-medium text-gray-900">
                    #{ndr.attemptNumber}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(ndr.priority)}`}>
                    {ndr.priority}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ndr.status)}`}>
                    {ndr.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="col-span-1">
                  <p className="text-sm text-gray-600">{getTimeAgo(ndr.reportedAt)}</p>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    title="Call Customer"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    title="Schedule Reattempt"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    title="Initiate RTO"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Critical NDRs Alert */}
      {summary?.recentNDRs?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-6">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Critical & High Priority NDRs - Immediate Action Required
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.recentNDRs.slice(0, 6).map((ndr: any) => (
              <div key={ndr.id} className="bg-white rounded-lg p-4 border border-red-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{ndr.awbNumber}</p>
                    <p className="text-xs text-gray-500">{ndr.shipment?.clientName}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityBadge(ndr.priority)}`}>
                    {ndr.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {ndr.shipment?.consigneeName} - {ndr.shipment?.consigneeCity}
                </p>
                <p className="text-sm text-red-600 font-medium">
                  {getFailureReasonLabel(ndr.failureReason)}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <a
                    href={`tel:${ndr.shipment?.consigneeMobile}`}
                    className="flex-1 bg-green-100 text-green-700 text-center py-1.5 rounded text-sm font-medium"
                  >
                    Call Customer
                  </a>
                  <Button variant="outline" size="sm" className="flex-1">
                    Take Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
