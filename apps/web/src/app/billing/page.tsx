"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Receipt,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  RefreshCw,
  Plus,
  FileText,
  IndianRupee,
  Calendar,
  Building2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

// Fetch billing summary
async function fetchBillingSummary() {
  const res = await fetch("/api/billing/summary");
  if (!res.ok) throw new Error("Failed to fetch billing summary");
  return res.json();
}

// Fetch invoices
async function fetchInvoices(params: { status?: string; page?: number }) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  searchParams.set("pageSize", "10");

  const res = await fetch(`/api/billing/invoices?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch invoices");
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
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    SENT: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    PARTIALLY_PAID: "bg-orange-100 text-orange-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return styles[status] || "bg-gray-100 text-gray-700";
}

export default function BillingDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["billing", "summary"],
    queryFn: fetchBillingSummary,
    refetchInterval: 60000,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["billing", "invoices", statusFilter],
    queryFn: () => fetchInvoices({ status: statusFilter }),
  });

  const summary = summaryData?.data;
  const kpis = summary?.kpis || {};
  const aging = summary?.aging || {};
  const invoices = invoicesData?.data?.invoices || [];

  // Calculate month-over-month change
  const billingChange = kpis.lastMonthBilled
    ? ((kpis.thisMonthBilled - kpis.lastMonthBilled) / kpis.lastMonthBilled) * 100
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="h-7 w-7 text-blue-600" />
            Billing & Invoicing
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage invoices, payments, and client billing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetchSummary()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Outstanding */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(kpis.totalOutstanding || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.outstandingCount || 0} invoices
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue Amount</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(kpis.overdueAmount || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.overdueCount || 0} invoices overdue
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* This Month Billed */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month Billed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(kpis.thisMonthBilled || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {billingChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={`text-xs ${billingChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(billingChange).toFixed(1)}% vs last month
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* This Month Collected */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(kpis.thisMonthCollected || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.thisMonthPaymentCount || 0} payments
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Aging Analysis + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Aging Analysis */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Receivables Aging
          </h3>
          <div className="space-y-4">
            {[
              { label: "Current (0-30 days)", data: aging.current, color: "green" },
              { label: "31-60 days", data: aging.days31to60, color: "yellow" },
              { label: "61-90 days", data: aging.days61to90, color: "orange" },
              { label: "Over 90 days", data: aging.over90, color: "red" },
            ].map(({ label, data, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(data?.amount || 0)}
                  </p>
                  <p className="text-xs text-gray-500">{data?.count || 0} invoices</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Total Outstanding</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(kpis.totalOutstanding || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            Top Clients by Outstanding
          </h3>
          <div className="space-y-3">
            {summary?.topClientsOutstanding?.length > 0 ? (
              summary.topClientsOutstanding.map((client: any, index: number) => (
                <div key={client.clientId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-red-100 text-red-700" :
                      index === 1 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{client.clientName}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(client.outstanding)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No outstanding amounts</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border">
        {/* Filters */}
        <div className="p-4 border-b flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <span className="font-semibold text-gray-900">Recent Invoices</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
          <div className="col-span-2">Invoice #</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Balance</div>
          <div className="col-span-1">Status</div>
        </div>

        {/* Invoice Rows */}
        <div className="divide-y">
          {invoicesLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No invoices found</div>
          ) : (
            invoices.map((invoice: any) => (
              <div
                key={invoice.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 items-center cursor-pointer"
              >
                <div className="col-span-2">
                  <p className="font-medium text-blue-600">{invoice.invoiceNumber}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-gray-900">{invoice.clientName || invoice.client?.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">{formatDate(invoice.invoiceDate)}</p>
                  <p className="text-xs text-gray-400">Due: {formatDate(invoice.dueDate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className={`text-sm font-medium ${invoice.balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(invoice.balanceDue)}
                  </p>
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {invoices.length} of {invoicesData?.data?.pagination?.total || 0} invoices
          </p>
          <Button variant="outline" size="sm" className="gap-2">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
