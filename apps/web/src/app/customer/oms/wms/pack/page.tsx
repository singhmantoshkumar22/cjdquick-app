"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Package,
  Printer,
  ScanLine,
  Box,
  RefreshCw,
} from "lucide-react";

interface PackItem {
  id: string;
  packNo: string;
  orderNo: string;
  picklistNo: string;
  customerName: string;
  totalItems: number;
  packedItems: number;
  boxCount: number;
  weight: string;
  status: string;
  packedBy: string;
  createdAt: string;
}

interface StatusCounts {
  all: number;
  pending: number;
  in_progress: number;
  completed: number;
}

const demoPacks: PackItem[] = [
  {
    id: "1",
    packNo: "PAK-2024-001234",
    orderNo: "ORD-2024-005678",
    picklistNo: "PCK-2024-001234",
    customerName: "Rahul Sharma",
    totalItems: 5,
    packedItems: 5,
    boxCount: 2,
    weight: "2.5 kg",
    status: "COMPLETED",
    packedBy: "John Smith",
    createdAt: "2024-01-08 10:30",
  },
  {
    id: "2",
    packNo: "PAK-2024-001235",
    orderNo: "ORD-2024-005679",
    picklistNo: "PCK-2024-001235",
    customerName: "Priya Patel",
    totalItems: 8,
    packedItems: 4,
    boxCount: 1,
    weight: "1.2 kg",
    status: "IN_PROGRESS",
    packedBy: "Jane Doe",
    createdAt: "2024-01-08 11:15",
  },
  {
    id: "3",
    packNo: "PAK-2024-001236",
    orderNo: "ORD-2024-005680",
    picklistNo: "PCK-2024-001236",
    customerName: "Amit Kumar",
    totalItems: 3,
    packedItems: 0,
    boxCount: 0,
    weight: "-",
    status: "PENDING",
    packedBy: "Unassigned",
    createdAt: "2024-01-08 11:45",
  },
  {
    id: "4",
    packNo: "PAK-2024-001237",
    orderNo: "ORD-2024-005681",
    picklistNo: "PCK-2024-001237",
    customerName: "Sneha Gupta",
    totalItems: 12,
    packedItems: 12,
    boxCount: 3,
    weight: "5.8 kg",
    status: "COMPLETED",
    packedBy: "Mike Johnson",
    createdAt: "2024-01-08 09:30",
  },
  {
    id: "5",
    packNo: "PAK-2024-001238",
    orderNo: "ORD-2024-005682",
    picklistNo: "PCK-2024-001238",
    customerName: "Vikram Singh",
    totalItems: 6,
    packedItems: 0,
    boxCount: 0,
    weight: "-",
    status: "PENDING",
    packedBy: "Unassigned",
    createdAt: "2024-01-08 12:00",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  ON_HOLD: { bg: "bg-orange-100", text: "text-orange-700" },
};

export default function WMSPackPage() {
  const [packs, setPacks] = useState<PackItem[]>(demoPacks);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [packerFilter, setPackerFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 89, totalPages: 5 });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ all: 89, pending: 28, in_progress: 15, completed: 46 });

  useEffect(() => {
    fetchPacks();
  }, [activeTab, packerFilter, pagination.page]);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(activeTab !== "all" && { status: activeTab }),
        ...(packerFilter !== "all" && { packedBy: packerFilter }),
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/oms/wms/pack?${params}`);
      const result = await response.json();
      if (result.success && result.data) {
        setPacks(result.data.items || demoPacks);
        setPagination(prev => ({
          ...prev,
          total: result.data.total || 89,
          totalPages: result.data.totalPages || 5,
        }));
        if (result.data.statusCounts) {
          setStatusCounts(result.data.statusCounts);
        }
      }
    } catch (error) {
      console.error("Error fetching packs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Pack No", "Order No", "Picklist No", "Customer", "Total Items", "Packed", "Boxes", "Weight", "Status", "Packed By"].join(","),
      ...packs.map(p => [
        p.packNo, p.orderNo, p.picklistNo, p.customerName, p.totalItems, p.packedItems, p.boxCount, p.weight, p.status, p.packedBy
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `packing-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statusTabs = [
    { id: "all", label: "All Packing", count: statusCounts.all },
    { id: "pending", label: "Pending", count: statusCounts.pending },
    { id: "in_progress", label: "In Progress", count: statusCounts.in_progress },
    { id: "completed", label: "Completed", count: statusCounts.completed },
  ];

  const summaryStats = [
    { label: "Total Packing", value: statusCounts.all.toString(), color: "bg-blue-500", icon: Package },
    { label: "Pending", value: statusCounts.pending.toString(), color: "bg-yellow-500", icon: Clock },
    { label: "In Progress", value: statusCounts.in_progress.toString(), color: "bg-orange-500", icon: Box },
    { label: "Completed Today", value: statusCounts.completed.toString(), color: "bg-green-500", icon: CheckCircle },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <h1 className="text-xl font-bold text-gray-900">Pack</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchPacks}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <ScanLine className="w-4 h-4" />
            Scan to Pack
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Pack No, Order No, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPacks()}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={packerFilter}
          onChange={(e) => setPackerFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Packers</option>
          <option value="John Smith">John Smith</option>
          <option value="Jane Doe">Jane Doe</option>
          <option value="Mike Johnson">Mike Johnson</option>
          <option value="Unassigned">Unassigned</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Pack Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Pack No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order / Picklist</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Progress</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Boxes</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Weight</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Packed By</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {packs.map((item) => {
                const progress = Math.round((item.packedItems / item.totalItems) * 100);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{item.packNo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.orderNo}</p>
                      <p className="text-xs text-gray-500">{item.picklistNo}</p>
                    </td>
                    <td className="px-4 py-3">{item.customerName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{item.packedItems}</span>
                      <span className="text-gray-400"> / {item.totalItems}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              progress === 100
                                ? "bg-green-500"
                                : progress > 50
                                ? "bg-blue-500"
                                : progress > 0
                                ? "bg-yellow-500"
                                : "bg-gray-300"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.boxCount > 0 ? (
                        <span className="flex items-center justify-center gap-1">
                          <Box className="w-3 h-3 text-gray-400" />
                          {item.boxCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{item.weight}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.packedBy === "Unassigned" ? "text-gray-400 italic" : ""
                        }
                      >
                        {item.packedBy}
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
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} packing tasks
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                  className={`px-3 py-1 text-sm rounded ${
                    pagination.page === pageNum ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {pagination.totalPages > 5 && (
              <>
                <span className="text-gray-400">...</span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.totalPages }))}
                  className={`px-3 py-1 text-sm rounded ${
                    pagination.page === pagination.totalPages ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {pagination.totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
