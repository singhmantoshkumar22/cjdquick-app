"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, DollarSign, CheckCircle, Clock, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@cjdquick/ui";

interface Remittance {
  id: string;
  remittanceNumber: string;
  amount: number;
  orderCount: number;
  cycleStart: string;
  cycleEnd: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface RemittanceStats {
  totalRemitted30d: number;
  pendingSettlement: number;
  settlementsCount: number;
}

export default function RemittancesPage() {
  const router = useRouter();
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [stats, setStats] = useState<RemittanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchRemittances();
  }, [currentPage]);

  const fetchRemittances = async () => {
    const token = localStorage.getItem("portal_token");
    const serviceType = localStorage.getItem("portal_service_type") || "B2B";

    if (!token) {
      router.push("/portal/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/portal/finances/remittances?serviceType=${serviceType}&page=${currentPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRemittances(data.data.remittances);
        setTotalPages(data.data.totalPages);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch remittances:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (remittances.length === 0) return;

    const headers = ["Remittance ID", "Period Start", "Period End", "Orders", "Amount", "Status", "Paid On"];
    const rows = remittances.map(r => [
      r.remittanceNumber,
      new Date(r.cycleStart).toLocaleDateString(),
      new Date(r.cycleEnd).toLocaleDateString(),
      r.orderCount,
      r.amount,
      r.status,
      r.paidAt ? new Date(r.paidAt).toLocaleDateString() : "-"
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `remittances-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Remittances</h1>
          <p className="text-sm text-gray-500 mt-1">Track your COD remittances and settlements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRemittances} className="gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                Rs. {(stats?.totalRemitted30d || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Remitted (30d)</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                Rs. {(stats?.pendingSettlement || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Pending Settlement</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats?.settlementsCount || 0}</div>
              <div className="text-sm text-gray-500">Pending Settlements</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading remittances...
          </div>
        ) : remittances.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No remittances yet</h3>
            <p className="text-sm text-gray-500">COD collections will appear here once orders are delivered</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Remittance ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cycle Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paid On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {remittances.map((rem) => (
                  <tr key={rem.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{rem.remittanceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(rem.cycleStart).toLocaleDateString()} - {new Date(rem.cycleEnd).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{rem.orderCount}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">Rs. {rem.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        rem.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {rem.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {rem.paidAt ? new Date(rem.paidAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
