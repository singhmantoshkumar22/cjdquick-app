"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  IndianRupee,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@cjdquick/ui";

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  totalShipments: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  pdfUrl: string | null;
}

interface BillingStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

async function fetchInvoices(status?: string, page?: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page) params.set("page", page.toString());
  const res = await fetch(`/api/client/billing?${params.toString()}`);
  return res.json();
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: "Draft", color: "default", icon: FileText },
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  SENT: { label: "Sent", color: "info", icon: FileText },
  PAID: { label: "Paid", color: "success", icon: CheckCircle },
  PARTIALLY_PAID: { label: "Partial", color: "warning", icon: AlertTriangle },
  OVERDUE: { label: "Overdue", color: "danger", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", color: "default", icon: FileText },
};

export default function BillingPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["client-invoices", statusFilter, page],
    queryFn: () => fetchInvoices(statusFilter, page),
  });

  const invoices: Invoice[] = data?.data?.items || [];
  const stats: BillingStats = data?.data?.stats || {
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    balanceDue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
  };
  const pagination = data?.data?.pagination || { total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">View and manage your invoices</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/client/billing/cod">
            <Button variant="outline">
              <IndianRupee className="h-4 w-4 mr-2" />
              COD Remittance
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalInvoices}</p>
              <p className="text-sm text-gray-500">Total Invoices</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Billed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingInvoices}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹{stats.balanceDue.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Balance Due</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Invoices</CardTitle>
          <div className="flex gap-2">
            {["", "PENDING", "PAID", "OVERDUE"].map((status) => (
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
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Shipments
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Due Date
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
                  {invoices.map((invoice) => {
                    const statusConfig = STATUS_CONFIG[invoice.status];
                    const isOverdue =
                      invoice.status !== "PAID" &&
                      new Date(invoice.dueDate) < new Date();
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(invoice.invoiceDate).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {invoice.periodStart && invoice.periodEnd ? (
                            <span>
                              {new Date(invoice.periodStart).toLocaleDateString()} -{" "}
                              {new Date(invoice.periodEnd).toLocaleDateString()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {invoice.totalShipments}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            ₹{invoice.totalAmount.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {invoice.balanceDue > 0 ? (
                            <p className="font-medium text-red-600">
                              ₹{invoice.balanceDue.toLocaleString()}
                            </p>
                          ) : (
                            <p className="text-green-600">Paid</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p
                            className={`text-sm ${
                              isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                            }`}
                          >
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={statusConfig?.color as any || "default"}
                            size="sm"
                          >
                            {statusConfig?.label || invoice.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {invoice.pdfUrl && (
                              <a
                                href={invoice.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
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
