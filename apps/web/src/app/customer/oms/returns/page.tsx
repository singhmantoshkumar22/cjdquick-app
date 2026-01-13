"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";

interface Return {
  id: string;
  returnNo: string;
  orderNo: string;
  channel: string;
  customerName: string;
  reason: string;
  items: number;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface SummaryStats {
  totalReturns: number;
  customerReturns: number;
  rto: number;
  returnRate: string;
  pendingQc: number;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  INITIATED: { bg: "bg-blue-100", text: "text-blue-700" },
  IN_TRANSIT: { bg: "bg-yellow-100", text: "text-yellow-700" },
  RECEIVED: { bg: "bg-purple-100", text: "text-purple-700" },
  QC_PASSED: { bg: "bg-green-100", text: "text-green-700" },
  QC_FAILED: { bg: "bg-red-100", text: "text-red-700" },
  RESTOCKED: { bg: "bg-cyan-100", text: "text-cyan-700" },
  DISPOSED: { bg: "bg-gray-100", text: "text-gray-700" },
};

const statusTabs = [
  { id: "all", label: "All Returns" },
  { id: "INITIATED", label: "Initiated" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "RECEIVED", label: "Received" },
  { id: "QC_PENDING", label: "QC Pending" },
  { id: "RESTOCKED", label: "Restocked" },
  { id: "DISPOSED", label: "Disposed" },
];

export default function OMSReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<SummaryStats>({
    totalReturns: 847,
    customerReturns: 512,
    rto: 335,
    returnRate: "8.45%",
    pendingQc: 89,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [createForm, setCreateForm] = useState({
    orderNo: "",
    type: "RETURN",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    fetchReturns();
  }, [activeTab, pagination.page, typeFilter, channelFilter, reasonFilter]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(activeTab !== "all" && { status: activeTab }),
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(channelFilter && { channel: channelFilter }),
        ...(reasonFilter && { reason: reasonFilter }),
      });

      const response = await fetch(`/api/oms/returns?${params}`);
      const result = await response.json();

      if (result.success) {
        setReturns(result.data.returns || []);
        setPagination((prev) => ({
          ...prev,
          total: result.data.total || 0,
        }));
        if (result.data.statusCounts) {
          setStatusCounts(result.data.statusCounts);
        }
        if (result.data.summary) {
          setSummary(result.data.summary);
        }
      }
    } catch (error) {
      console.error("Error fetching returns:", error);
      setReturns(getDemoReturns());
      setPagination((prev) => ({ ...prev, total: 847 }));
    } finally {
      setLoading(false);
    }
  };

  const getDemoReturns = (): Return[] => [
    { id: "1", returnNo: "RTN-2024-001", orderNo: "ORD-2024-000892", channel: "Amazon", customerName: "Rahul Sharma", reason: "Defective Product", items: 1, amount: 4500, type: "RETURN", status: "INITIATED", createdAt: "2024-01-08 10:30" },
    { id: "2", returnNo: "RTN-2024-002", orderNo: "ORD-2024-000756", channel: "Flipkart", customerName: "Priya Patel", reason: "Wrong Item", items: 2, amount: 8200, type: "RTO", status: "IN_TRANSIT", createdAt: "2024-01-08 09:15" },
    { id: "3", returnNo: "RTN-2024-003", orderNo: "ORD-2024-000645", channel: "Shopify", customerName: "Amit Kumar", reason: "Size Issue", items: 1, amount: 2500, type: "RETURN", status: "RECEIVED", createdAt: "2024-01-07 16:45" },
    { id: "4", returnNo: "RTN-2024-004", orderNo: "ORD-2024-000534", channel: "Amazon", customerName: "Sneha Gupta", reason: "Customer Refused", items: 1, amount: 6800, type: "RTO", status: "QC_PASSED", createdAt: "2024-01-07 14:20" },
    { id: "5", returnNo: "RTN-2024-005", orderNo: "ORD-2024-000423", channel: "Manual", customerName: "Vikram Singh", reason: "Damaged in Transit", items: 3, amount: 12500, type: "RETURN", status: "RESTOCKED", createdAt: "2024-01-06 11:00" },
  ];

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchReturns();
  };

  const handleExport = () => {
    const csvContent = [
      ["Return No", "Order No", "Channel", "Customer", "Reason", "Items", "Amount", "Type", "Status", "Date"].join(","),
      ...returns.map((item) =>
        [
          item.returnNo,
          item.orderNo,
          item.channel,
          item.customerName,
          `"${item.reason}"`,
          item.items,
          item.amount,
          item.type,
          item.status,
          item.createdAt,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `returns-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateReturn = async () => {
    try {
      const response = await fetch("/api/oms/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const result = await response.json();

      if (result.success) {
        setShowCreateModal(false);
        setCreateForm({
          orderNo: "",
          type: "RETURN",
          reason: "",
          notes: "",
        });
        fetchReturns();
        alert("Return created successfully!");
      }
    } catch (error) {
      console.error("Error creating return:", error);
      alert("Return created (demo mode)");
      setShowCreateModal(false);
    }
  };

  const handleViewReturn = (item: Return) => {
    setSelectedReturn(item);
    setShowViewModal(true);
  };

  const handleUpdateStatus = async (returnId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/oms/returns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: returnId, status: newStatus }),
      });
      const result = await response.json();

      if (result.success) {
        fetchReturns();
        setShowViewModal(false);
        alert("Status updated successfully!");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Status updated (demo mode)");
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const summaryStats = [
    { label: "Total Returns", value: summary.totalReturns.toLocaleString(), color: "bg-blue-500", icon: RotateCcw },
    { label: "Customer Returns", value: summary.customerReturns.toLocaleString(), color: "bg-green-500", icon: Package },
    { label: "RTO", value: summary.rto.toLocaleString(), color: "bg-orange-500", icon: Truck },
    { label: "Return Rate", value: summary.returnRate, color: "bg-red-500", icon: RotateCcw },
    { label: "Pending QC", value: summary.pendingQc.toLocaleString(), color: "bg-yellow-500", icon: Clock },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.color} rounded-lg p-4 text-white relative overflow-hidden`}
            >
              <div className="relative z-10">
                <p className="text-xs font-medium opacity-90">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className="absolute right-2 bottom-2 opacity-30">
                <Icon className="w-10 h-10" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Returns</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchReturns}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RotateCcw className="w-4 h-4" />
            Create Return
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            {statusCounts[tab.id] !== undefined && (
              <span className="ml-1 text-xs opacity-75">({statusCounts[tab.id]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Return No, Order No, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="RETURN">Customer Return</option>
          <option value="RTO">RTO</option>
        </select>
        <select
          value={channelFilter}
          onChange={(e) => {
            setChannelFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="">All Channels</option>
          <option value="Amazon">Amazon</option>
          <option value="Flipkart">Flipkart</option>
          <option value="Shopify">Shopify</option>
          <option value="Manual">Manual</option>
        </select>
        <select
          value={reasonFilter}
          onChange={(e) => {
            setReasonFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="">All Reasons</option>
          <option value="Defective Product">Defective Product</option>
          <option value="Wrong Item">Wrong Item</option>
          <option value="Size Issue">Size Issue</option>
          <option value="Customer Refused">Customer Refused</option>
          <option value="Damaged in Transit">Damaged in Transit</option>
        </select>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Return No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Channel</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading returns...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No returns found
                  </td>
                </tr>
              ) : (
                returns.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{item.returnNo}</td>
                    <td className="px-4 py-3 text-gray-600">{item.orderNo}</td>
                    <td className="px-4 py-3">{item.channel}</td>
                    <td className="px-4 py-3">{item.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{item.reason}</td>
                    <td className="px-4 py-3 text-center">{item.items}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{item.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          item.type === "RTO"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          statusColors[item.status]?.bg || "bg-gray-100"
                        } ${statusColors[item.status]?.text || "text-gray-700"}`}
                      >
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewReturn(item)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} returns
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                  className={`px-3 py-1 text-sm rounded ${
                    pagination.page === pageNum
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-gray-400">...</span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: totalPages }))}
                  className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create New Return</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Number *</label>
                <input
                  type="text"
                  value={createForm.orderNo}
                  onChange={(e) => setCreateForm({ ...createForm, orderNo: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter order number (e.g., ORD-2024-XXXXX)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Type *</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="RETURN">Customer Return</option>
                    <option value="RTO">RTO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <select
                    value={createForm.reason}
                    onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Reason</option>
                    <option value="Defective Product">Defective Product</option>
                    <option value="Wrong Item">Wrong Item</option>
                    <option value="Size Issue">Size Issue</option>
                    <option value="Customer Refused">Customer Refused</option>
                    <option value="Damaged in Transit">Damaged in Transit</option>
                    <option value="Quality Issue">Quality Issue</option>
                    <option value="Not as Described">Not as Described</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Additional notes about the return..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReturn}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Return Modal */}
      {showViewModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Return Details - {selectedReturn.returnNo}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Return Number</p>
                  <p className="font-medium">{selectedReturn.returnNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-medium text-blue-600">{selectedReturn.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded ${statusColors[selectedReturn.status]?.bg} ${statusColors[selectedReturn.status]?.text}`}>
                    {selectedReturn.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <span className={`px-2 py-1 text-xs rounded ${selectedReturn.type === "RTO" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                    {selectedReturn.type}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedReturn.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Channel</p>
                    <p className="font-medium">{selectedReturn.channel}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Return Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Reason</p>
                    <p className="font-medium">{selectedReturn.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <p className="font-medium">{selectedReturn.items}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-lg">₹{selectedReturn.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {["INITIATED", "IN_TRANSIT", "RECEIVED", "QC_PASSED", "QC_FAILED", "RESTOCKED", "DISPOSED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedReturn.id, status)}
                      disabled={selectedReturn.status === status}
                      className={`px-3 py-1 text-xs rounded ${
                        selectedReturn.status === status
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : `${statusColors[status]?.bg || "bg-gray-100"} ${statusColors[status]?.text || "text-gray-700"} hover:opacity-80`
                      }`}
                    >
                      {status.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
