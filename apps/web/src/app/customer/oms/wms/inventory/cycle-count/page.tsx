"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface CycleCount {
  id: string;
  cycleId: string;
  type: string;
  bin: string;
  systemQty: number;
  physicalQty: number | null;
  variance: number | null;
  status: string;
  countedBy: string;
  updatedDate: string;
}

const demoCycleCounts: CycleCount[] = [
  { id: "1", cycleId: "CC-2024-001234", type: "FULL_COUNT", bin: "BIN-A001", systemQty: 100, physicalQty: 98, variance: -2, status: "CONFIRMED", countedBy: "Rahul Kumar", updatedDate: "2024-01-08 10:30" },
  { id: "2", cycleId: "CC-2024-001235", type: "SPOT_COUNT", bin: "BIN-A002", systemQty: 50, physicalQty: 50, variance: 0, status: "CONFIRMED", countedBy: "Priya Sharma", updatedDate: "2024-01-08 11:15" },
  { id: "3", cycleId: "CC-2024-001236", type: "FULL_COUNT", bin: "BIN-B001", systemQty: 75, physicalQty: null, variance: null, status: "WIP", countedBy: "Amit Patel", updatedDate: "2024-01-08 12:00" },
  { id: "4", cycleId: "CC-2024-001237", type: "SPOT_COUNT", bin: "BIN-C001", systemQty: 200, physicalQty: null, variance: null, status: "PENDING", countedBy: "-", updatedDate: "2024-01-07 16:30" },
];

const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  CONFIRMED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  WIP: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

export default function CycleCountPage() {
  const [activeTab, setActiveTab] = useState<"enquiry" | "create">("enquiry");
  const [cycleCounts, setCycleCounts] = useState<CycleCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Create form state
  const [countType, setCountType] = useState("FULL_COUNT");
  const [binCode, setBinCode] = useState("");

  useEffect(() => {
    fetchCycleCounts();
  }, []);

  const fetchCycleCounts = async () => {
    try {
      const response = await fetch("/api/oms/wms/cycle-count");
      const result = await response.json();
      if (result.success && result.data?.cycleCounts) {
        setCycleCounts(result.data.cycleCounts);
      } else {
        setCycleCounts(demoCycleCounts);
      }
    } catch (error) {
      console.error("Error fetching cycle counts:", error);
      setCycleCounts(demoCycleCounts);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycleCount = async () => {
    if (!binCode) return;

    try {
      await fetch("/api/oms/wms/cycle-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: countType, bin: binCode }),
      });
      setBinCode("");
      setActiveTab("enquiry");
      fetchCycleCounts();
    } catch (error) {
      console.error("Error creating cycle count:", error);
    }
  };

  const filteredCycleCounts = cycleCounts.filter((item) =>
    statusFilter === "all" || item.status === statusFilter
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cycle Count</h1>
          <p className="text-sm text-gray-500">Verify physical inventory against system records</p>
        </div>
        <button
          onClick={() => setActiveTab("create")}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Cycle Count
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("enquiry")}
          className={`px-4 py-2 text-sm rounded-lg ${
            activeTab === "enquiry" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          Cycle Count Enquiry
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 text-sm rounded-lg ${
            activeTab === "create" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          Create/Edit
        </button>
      </div>

      {activeTab === "enquiry" ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cycle ID</label>
                <input type="text" placeholder="Search..." className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select className="w-full px-3 py-2 text-sm border rounded-lg">
                  <option>All Types</option>
                  <option value="FULL_COUNT">Full Count</option>
                  <option value="SPOT_COUNT">Spot Count</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="WIP">WIP</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bin</label>
                <input type="text" placeholder="Bin code..." className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div className="flex items-end gap-2">
                <button className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search
                </button>
                <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Reset</button>
              </div>
            </div>
          </div>

          {/* Cycle Counts Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading cycle counts...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Cycle ID</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Bin</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">System Qty</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Physical Qty</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Variance</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Counted By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCycleCounts.map((item) => {
                        const StatusIcon = statusColors[item.status]?.icon || Clock;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <ClipboardCheck className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-blue-600">{item.cycleId}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {item.type.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{item.bin}</span>
                            </td>
                            <td className="px-4 py-3 text-center font-medium">{item.systemQty}</td>
                            <td className="px-4 py-3 text-center font-medium">
                              {item.physicalQty !== null ? item.physicalQty : "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.variance !== null ? (
                                <span className={`font-medium ${
                                  item.variance === 0 ? "text-green-600" :
                                  item.variance < 0 ? "text-red-600" : "text-orange-600"
                                }`}>
                                  {item.variance > 0 ? `+${item.variance}` : item.variance}
                                </span>
                              ) : "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${statusColors[item.status]?.bg} ${statusColors[item.status]?.text}`}>
                                <StatusIcon className="w-3 h-3" />
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.countedBy}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <div className="text-sm text-gray-500">Showing 1-{filteredCycleCounts.length} of {filteredCycleCounts.length} counts</div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 border rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
                    <button className="p-1 border rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* Create Cycle Count Form */
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Create New Cycle Count</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Count Type *</label>
              <select
                value={countType}
                onChange={(e) => setCountType(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              >
                <option value="FULL_COUNT">Full Count</option>
                <option value="SPOT_COUNT">Spot Count</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bin Code *</label>
              <input
                type="text"
                value={binCode}
                onChange={(e) => setBinCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bin code"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={() => setActiveTab("enquiry")}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCycleCount}
              disabled={!binCode}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
