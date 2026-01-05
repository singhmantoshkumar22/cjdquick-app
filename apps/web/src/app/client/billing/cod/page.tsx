"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  IndianRupee,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Package,
  Banknote,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@cjdquick/ui";

interface CODRemittance {
  id: string;
  remittanceNumber: string;
  periodStart: string;
  periodEnd: string;
  grossCodCollected: number;
  deductions: number;
  netRemittance: number;
  shipmentCount: number;
  deliveredCount: number;
  rtoCount: number;
  status: string;
  paymentMode: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface CODStats {
  totalRemittances: number;
  grossCollected: number;
  totalDeductions: number;
  netRemittance: number;
  pendingRemittances: number;
  paidAmount: number;
}

async function fetchCODRemittances(status?: string, page?: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page) params.set("page", page.toString());
  const res = await fetch(`/api/client/billing/cod?${params.toString()}`);
  return res.json();
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  APPROVED: { label: "Approved", color: "info", icon: CheckCircle },
  PROCESSING: { label: "Processing", color: "info", icon: RefreshCw },
  PAID: { label: "Paid", color: "success", icon: CheckCircle },
  FAILED: { label: "Failed", color: "danger", icon: AlertTriangle },
};

export default function CODRemittancePage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["client-cod-remittances", statusFilter, page],
    queryFn: () => fetchCODRemittances(statusFilter, page),
  });

  const remittances: CODRemittance[] = data?.data?.items || [];
  const stats: CODStats = data?.data?.stats || {
    totalRemittances: 0,
    grossCollected: 0,
    totalDeductions: 0,
    netRemittance: 0,
    pendingRemittances: 0,
    paidAmount: 0,
  };
  const pagination = data?.data?.pagination || { total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/client/billing">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">COD Remittance</h1>
            <p className="text-gray-600">Track your cash-on-delivery settlements</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Banknote className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹{stats.grossCollected.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total COD Collected</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹{stats.totalDeductions.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Deductions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹{stats.paidAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Remitted</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingRemittances}</p>
              <p className="text-sm text-gray-500">Pending Remittances</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Remittance List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Remittance History</CardTitle>
          <div className="flex gap-2">
            {["", "PENDING", "PROCESSING", "PAID"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  statusFilter === status
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status === "" ? "All" : STATUS_CONFIG[status]?.label || status}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : remittances.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No COD remittances found</p>
              <p className="text-sm text-gray-400 mt-2">
                COD remittances will appear here once your COD orders are delivered
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Remittance ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Shipments
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      COD Collected
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deductions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Net Remittance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {remittances.map((remittance) => {
                    const statusConfig = STATUS_CONFIG[remittance.status];
                    return (
                      <tr key={remittance.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {remittance.remittanceNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(remittance.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(remittance.periodStart).toLocaleDateString()} -{" "}
                            {new Date(remittance.periodEnd).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>
                              {remittance.deliveredCount}/{remittance.shipmentCount}
                            </span>
                          </div>
                          {remittance.rtoCount > 0 && (
                            <p className="text-xs text-red-500">
                              {remittance.rtoCount} RTO
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          ₹{remittance.grossCodCollected.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-red-600">
                          -₹{remittance.deductions.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-green-600">
                            ₹{remittance.netRemittance.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={statusConfig?.color as any || "default"}
                            size="sm"
                          >
                            {statusConfig?.label || remittance.status}
                          </Badge>
                          {remittance.paidAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(remittance.paidAt).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 20 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of{" "}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 20 >= pagination.total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
