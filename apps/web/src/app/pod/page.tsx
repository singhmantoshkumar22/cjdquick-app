"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileCheck,
  Camera,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  MapPin,
  Smartphone,
  Fingerprint,
  Star,
  Users,
  Percent,
  TrendingUp,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

// Fetch POD summary
async function fetchPodSummary(period: string) {
  const res = await fetch(`/api/pod/summary?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch POD summary");
  return res.json();
}

// Fetch PODs list
async function fetchPods(params: {
  status?: string;
  search?: string;
  isDisputed?: boolean;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.isDisputed) searchParams.set("isDisputed", "true");
  if (params.page) searchParams.set("page", String(params.page));
  searchParams.set("pageSize", "15");

  const res = await fetch(`/api/pod?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch PODs");
  return res.json();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    VERIFIED: "bg-green-100 text-green-700",
    DISPUTED: "bg-red-100 text-red-700",
    REJECTED: "bg-gray-100 text-gray-700",
  };
  return styles[status] || "bg-gray-100 text-gray-700";
}

function getQualityBadge(score: number) {
  if (score >= 80) return { label: "Excellent", class: "bg-green-100 text-green-700" };
  if (score >= 60) return { label: "Good", class: "bg-blue-100 text-blue-700" };
  if (score >= 40) return { label: "Fair", class: "bg-yellow-100 text-yellow-700" };
  return { label: "Poor", class: "bg-red-100 text-red-700" };
}

export default function PODManagementPage() {
  const [period, setPeriod] = useState("30");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showDisputed, setShowDisputed] = useState(false);

  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ["pod-summary", period],
    queryFn: () => fetchPodSummary(period),
    refetchInterval: 60000,
  });

  const { data: podsData, isLoading: podsLoading, refetch: refetchPods } = useQuery({
    queryKey: ["pods", statusFilter, search, showDisputed],
    queryFn: () => fetchPods({ status: statusFilter, search, isDisputed: showDisputed }),
  });

  const summary = summaryData?.data;
  const kpis = summary?.kpis || {};
  const quality = summary?.quality || {};
  const pods = podsData?.data?.pods || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="h-7 w-7 text-indigo-600" />
            POD Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Proof of Delivery capture, verification, and dispute management
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
              refetchSummary();
              refetchPods();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total PODs */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total PODs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {kpis.totalPods || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Last {period} days</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Camera className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Verified */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Verified</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {kpis.verifiedCount || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {kpis.verificationRate || 0}% verification rate
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {kpis.pendingCount || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Awaiting verification</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Disputed */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Disputed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {kpis.disputedCount || 0}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {kpis.disputeRate || 0}% dispute rate
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quality Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Avg Quality Score */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Avg Quality Score</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {kpis.avgQualityScore || 0}
            </span>
            <span className="text-gray-500 mb-1">/ 100</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-green-50 rounded p-2">
              <p className="font-semibold text-green-700">
                {quality.distribution?.excellent || 0}
              </p>
              <p className="text-green-600">Excellent</p>
            </div>
            <div className="bg-blue-50 rounded p-2">
              <p className="font-semibold text-blue-700">
                {quality.distribution?.good || 0}
              </p>
              <p className="text-blue-600">Good</p>
            </div>
            <div className="bg-yellow-50 rounded p-2">
              <p className="font-semibold text-yellow-700">
                {quality.distribution?.fair || 0}
              </p>
              <p className="text-yellow-600">Fair</p>
            </div>
            <div className="bg-red-50 rounded p-2">
              <p className="font-semibold text-red-700">
                {quality.distribution?.poor || 0}
              </p>
              <p className="text-red-600">Poor</p>
            </div>
          </div>
        </div>

        {/* Capture Rates */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3 mb-4">
            <Percent className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Capture Rates</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-gray-600">
                  <Smartphone className="h-4 w-4" /> OTP Verified
                </span>
                <span className="font-medium">{quality.otpVerificationRate || 0}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${Math.min(parseFloat(quality.otpVerificationRate || "0"), 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" /> GPS Captured
                </span>
                <span className="font-medium">{quality.gpsCaptureRate || 0}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(parseFloat(quality.gpsCaptureRate || "0"), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Agents */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Top Agents</h3>
          </div>
          <div className="space-y-2">
            {summary?.topAgents?.slice(0, 5).map((agent: any, index: number) => (
              <div key={agent.agentId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-gray-900 truncate max-w-[120px]">
                    {agent.agentName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{agent.podCount}</span>
                  <span className="text-xs text-gray-400">({agent.avgQuality})</span>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-2">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* POD List */}
      <div className="bg-white rounded-xl shadow-sm border">
        {/* Filters */}
        <div className="p-4 border-b flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by AWB..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="DISPUTED">Disputed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDisputed}
              onChange={(e) => setShowDisputed(e.target.checked)}
              className="rounded"
            />
            <span>Disputed Only</span>
          </label>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
          <div className="col-span-2">AWB</div>
          <div className="col-span-2">Receiver</div>
          <div className="col-span-2">Captured At</div>
          <div className="col-span-2">Method</div>
          <div className="col-span-1">Quality</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y">
          {podsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : pods.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No PODs found</div>
          ) : (
            pods.map((pod: any) => {
              const qualityBadge = getQualityBadge(pod.qualityScore);
              return (
                <div
                  key={pod.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 items-center"
                >
                  <div className="col-span-2">
                    <p className="font-medium text-blue-600">{pod.awbNumber}</p>
                    <p className="text-xs text-gray-400">{pod.clientName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{pod.receiverName}</p>
                    <p className="text-xs text-gray-400">{pod.receiverRelation || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">{formatDate(pod.capturedAt)}</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      {pod.captureMethod === "SIGNATURE" && (
                        <Fingerprint className="h-4 w-4 text-purple-500" />
                      )}
                      {pod.captureMethod === "PHOTO" && (
                        <Camera className="h-4 w-4 text-blue-500" />
                      )}
                      {pod.captureMethod === "OTP" && (
                        <Smartphone className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm text-gray-600">{pod.captureMethod}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {pod.otpVerified && (
                        <span className="text-xs text-green-600">OTP</span>
                      )}
                      {pod.deliveryLatitude && (
                        <span className="text-xs text-blue-600">GPS</span>
                      )}
                      {pod.signatureUrl && (
                        <span className="text-xs text-purple-600">Sign</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${qualityBadge.class}`}
                    >
                      {pod.qualityScore}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                        pod.verificationStatus
                      )}`}
                    >
                      {pod.verificationStatus}
                    </span>
                    {pod.isDisputed && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        Disputed
                      </span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {pods.length} of {podsData?.data?.pagination?.total || 0} PODs
          </p>
        </div>
      </div>

      {/* Recent Disputes */}
      {summary?.recentDisputes?.length > 0 && (
        <div className="mt-6 bg-red-50 rounded-xl p-5">
          <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Disputes
          </h3>
          <div className="space-y-3">
            {summary.recentDisputes.map((dispute: any) => (
              <div
                key={dispute.id}
                className="bg-white rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{dispute.awbNumber}</p>
                  <p className="text-sm text-gray-500">{dispute.clientName}</p>
                  <p className="text-sm text-red-600 mt-1">{dispute.disputeReason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {dispute.disputeRaisedAt && formatDate(dispute.disputeRaisedAt)}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Resolve
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
