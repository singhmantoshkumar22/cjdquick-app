"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DollarSign, FileText, AlertCircle, TrendingUp, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@cjdquick/ui";

interface FinanceStats {
  overview: {
    codCollected30d: number;
    codPending: number;
    outstandingInvoices: number;
    pendingInvoiceCount: number;
    claimsUnderReview: number;
    claimsCount: number;
  };
  recentTransactions: {
    type: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

export default function FinancesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem("portal_token");
    if (!token) {
      router.push("/portal/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portal/finances/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${Math.abs(amount).toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your remittances, invoices, and claims</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            {stats?.overview.codPending ? (
              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                {formatCurrency(stats.overview.codPending)} pending
              </span>
            ) : (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                All settled
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats?.overview.codCollected30d || 0)}
          </div>
          <div className="text-sm text-gray-500 mb-4">Total COD Collected (30d)</div>
          <Link href="/portal/finances/remittances">
            <Button variant="outline" size="sm" className="w-full gap-2">
              View Remittances <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {stats?.overview.pendingInvoiceCount || 0} pending
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats?.overview.outstandingInvoices || 0)}
          </div>
          <div className="text-sm text-gray-500 mb-4">Outstanding Invoices</div>
          <Link href="/portal/finances/invoices">
            <Button variant="outline" size="sm" className="w-full gap-2">
              View Invoices <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              {stats?.overview.claimsCount || 0} open claims
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats?.overview.claimsUnderReview || 0)}
          </div>
          <div className="text-sm text-gray-500 mb-4">Claims Under Review</div>
          <Link href="/portal/finances/claims">
            <Button variant="outline" size="sm" className="w-full gap-2">
              View Claims <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="divide-y divide-gray-100">
          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            stats.recentTransactions.map((tx, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.amount > 0 ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {tx.amount > 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tx.type}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(tx.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {tx.amount > 0 ? "+" : "-"}{formatCurrency(tx.amount)}
                  </div>
                  <div className="text-xs text-gray-500">{tx.status}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
