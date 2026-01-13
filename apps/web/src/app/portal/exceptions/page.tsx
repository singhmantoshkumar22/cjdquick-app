"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

interface NdrCase {
  id: string;
  orderNumber: string;
  awbNumber: string;
  customerName: string;
  customerPhone: string;
  shippingCity: string;
  ndrReason: string;
  attemptCount: number;
  status: string;
  lastAttemptAt: string;
  createdAt: string;
}

const ndrReasons: Record<string, string> = {
  CUSTOMER_NOT_AVAILABLE: "Customer Not Available",
  WRONG_ADDRESS: "Wrong/Incomplete Address",
  PHONE_UNREACHABLE: "Phone Unreachable",
  REFUSED_DELIVERY: "Refused Delivery",
  CASH_NOT_READY: "Cash Not Ready (COD)",
  AREA_INACCESSIBLE: "Area Inaccessible",
  FUTURE_DELIVERY_REQUESTED: "Future Delivery Requested",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING_ACTION: { label: "Action Required", color: "bg-red-100 text-red-700" },
  REATTEMPT_SCHEDULED: { label: "Reattempt Scheduled", color: "bg-blue-100 text-blue-700" },
  ADDRESS_UPDATED: { label: "Address Updated", color: "bg-purple-100 text-purple-700" },
  RTO_INITIATED: { label: "RTO Initiated", color: "bg-amber-100 text-amber-700" },
  RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-700" },
};

export default function ExceptionsPage() {
  const router = useRouter();
  const [ndrCases, setNdrCases] = useState<NdrCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ndr");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchNdrCases();
  }, [currentPage, statusFilter, activeTab]);

  const fetchNdrCases = async () => {
    const token = localStorage.getItem("portal_token");
    const serviceType = localStorage.getItem("portal_service_type") || "B2B";

    if (!token) {
      router.push("/portal/login");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        serviceType,
        type: activeTab,
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const res = await fetch(`/api/portal/exceptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setNdrCases(data.data.cases);
        setTotalPages(data.data.totalPages);
        setTotalCases(data.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch NDR cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (caseId: string, action: string) => {
    const token = localStorage.getItem("portal_token");
    try {
      await fetch(`/api/portal/exceptions/${caseId}/action`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      fetchNdrCases();
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exceptions & NDR</h1>
          <p className="text-sm text-gray-500 mt-1">Manage delivery exceptions and non-delivery reports</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">7</div>
              <div className="text-sm text-gray-500">Action Required</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">5</div>
              <div className="text-sm text-gray-500">Reattempt Scheduled</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-500">RTO Initiated</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">15</div>
              <div className="text-sm text-gray-500">Resolved (7d)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: "ndr", label: "NDR Cases", count: 12 },
              { id: "address", label: "Address Issues", count: 3 },
              { id: "on_hold", label: "On Hold", count: 2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by AWB, Order ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING_ACTION">Action Required</option>
              <option value="REATTEMPT_SCHEDULED">Reattempt Scheduled</option>
              <option value="RTO_INITIATED">RTO Initiated</option>
            </select>

            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading cases...</div>
        ) : ndrCases.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No exceptions found</h3>
            <p className="text-sm text-gray-500">All deliveries are on track!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order/AWB</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NDR Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Attempts</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ndrCases.map((ndrCase) => (
                    <tr key={ndrCase.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{ndrCase.orderNumber}</div>
                        <div className="text-xs text-blue-600 font-mono">{ndrCase.awbNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{ndrCase.customerName}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />
                          {ndrCase.customerPhone}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {ndrCase.shippingCity}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                          {ndrReasons[ndrCase.ndrReason] || ndrCase.ndrReason}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{ndrCase.attemptCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusConfig[ndrCase.status]?.color || "bg-gray-100 text-gray-700"
                        }`}>
                          {statusConfig[ndrCase.status]?.label || ndrCase.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(ndrCase.id, "reattempt")}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reattempt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleAction(ndrCase.id, "rto")}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            RTO
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCases)} of {totalCases}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
