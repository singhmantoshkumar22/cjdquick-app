"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  DollarSign,
  Wallet,
} from "lucide-react";

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  claimType: string;
  claimReason: string;
  description: string;
  claimAmount: number;
  approvedAmount?: number;
  settledAmount?: number;
  status: string;
  createdAt: string;
  policy: {
    id: string;
    policyNumber: string;
    insurerName: string;
    policyType: string;
  };
}

interface ClaimStats {
  filed: number;
  underReview: number;
  approved: number;
  rejected: number;
  settled: number;
  totalClaimAmount: number;
  totalSettledAmount: number;
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  FILED: { bg: "bg-blue-100", text: "text-blue-700", icon: FileText },
  UNDER_REVIEW: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  ADDITIONAL_INFO_REQUIRED: { bg: "bg-purple-100", text: "text-purple-700", icon: AlertCircle },
  APPROVED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  SETTLED: { bg: "bg-emerald-100", text: "text-emerald-700", icon: Wallet },
};

export default function InsurancePage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: claimsData, isLoading, refetch } = useQuery({
    queryKey: ["insurance-claims", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/insurance/claims?${params}`);
      return res.json();
    },
  });

  const claims: InsuranceClaim[] = claimsData?.data?.items || [];
  const stats: ClaimStats = claimsData?.data?.stats || {
    filed: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    settled: 0,
    totalClaimAmount: 0,
    totalSettledAmount: 0,
  };

  const filteredClaims = claims.filter(
    (claim) =>
      claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.claimReason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateClaimMutation = useMutation({
    mutationFn: async ({ id, action, ...data }: { id: string; action: string; [key: string]: any }) => {
      const res = await fetch("/api/insurance/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...data }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-claims"] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-7 w-7 text-indigo-600" />
            Insurance Management
          </h1>
          <p className="text-gray-500 mt-1">
            Shipment insurance & claims management for high-value goods
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowNewClaimModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            File New Claim
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-500">Filed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.filed}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-gray-500">Under Review</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.underReview}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-500">Approved</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-gray-500">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-gray-500">Settled</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.settled}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-gray-500">Total Claimed</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            Rs. {(stats.totalClaimAmount / 100000).toFixed(1)}L
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-gray-500">Total Settled</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            Rs. {(stats.totalSettledAmount / 100000).toFixed(1)}L
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by claim number or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="FILED">Filed</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ADDITIONAL_INFO_REQUIRED">Info Required</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SETTLED">Settled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Insurance Claims</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
            <p className="text-gray-500 mt-2">Loading claims...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No claims found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredClaims.map((claim) => {
              const statusConfig = statusColors[claim.status] || statusColors.FILED;
              const StatusIcon = statusConfig.icon;

              return (
                <div key={claim.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-medium text-gray-900">
                          {claim.claimNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {claim.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-gray-400">
                          {claim.policy.policyNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-700">{claim.claimType}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{claim.claimReason}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{claim.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Insurer: {claim.policy.insurerName}</span>
                        <span>Filed: {new Date(claim.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-gray-900">
                        Rs. {claim.claimAmount.toLocaleString()}
                      </div>
                      {claim.approvedAmount && (
                        <div className="text-sm text-green-600">
                          Approved: Rs. {claim.approvedAmount.toLocaleString()}
                        </div>
                      )}
                      {claim.settledAmount && (
                        <div className="text-sm text-emerald-600">
                          Settled: Rs. {claim.settledAmount.toLocaleString()}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3 justify-end">
                        {claim.status === "FILED" && (
                          <button
                            onClick={() =>
                              updateClaimMutation.mutate({
                                id: claim.id,
                                action: "REVIEW",
                                reviewedBy: "Admin",
                              })
                            }
                            className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                          >
                            Start Review
                          </button>
                        )}
                        {claim.status === "UNDER_REVIEW" && (
                          <>
                            <button
                              onClick={() =>
                                updateClaimMutation.mutate({
                                  id: claim.id,
                                  action: "APPROVE",
                                  approvedBy: "Admin",
                                })
                              }
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                updateClaimMutation.mutate({
                                  id: claim.id,
                                  action: "REJECT",
                                  rejectionReason: "Does not meet policy criteria",
                                })
                              }
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {claim.status === "APPROVED" && (
                          <button
                            onClick={() =>
                              updateClaimMutation.mutate({
                                id: claim.id,
                                action: "SETTLE",
                                paymentRef: `PAY-${Date.now()}`,
                                paymentMode: "BANK_TRANSFER",
                              })
                            }
                            className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                          >
                            Settle Payment
                          </button>
                        )}
                        <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insurance Policies Overview */}
      <div className="mt-6 bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-500" />
          Active Insurance Policies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: "ICICI Lombard",
              policyType: "TRANSIT",
              coverage: "50L",
              premium: "0.15%",
              active: true,
            },
            {
              name: "HDFC ERGO",
              policyType: "ALL_RISK",
              coverage: "1Cr",
              premium: "0.25%",
              active: true,
            },
            {
              name: "New India Assurance",
              policyType: "MARINE",
              coverage: "2Cr",
              premium: "0.20%",
              active: true,
            },
          ].map((policy) => (
            <div
              key={policy.name}
              className="border rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{policy.name}</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Policy Type</span>
                  <span className="text-gray-900">{policy.policyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Max Coverage</span>
                  <span className="text-gray-900 font-medium">Rs. {policy.coverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Premium Rate</span>
                  <span className="text-gray-900">{policy.premium}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
