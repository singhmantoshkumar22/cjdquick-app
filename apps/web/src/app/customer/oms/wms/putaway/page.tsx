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
  PackageCheck,
  ScanLine,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface PutawayItem {
  id: string;
  putawayNo: string;
  grnNo: string;
  sku: string;
  productName: string;
  quantity: number;
  fromBin: string;
  toBin: string;
  zone: string;
  status: string;
  assignedTo: string;
  createdAt: string;
}

const demoPutaways: PutawayItem[] = [
  {
    id: "1",
    putawayNo: "PUT-2024-001234",
    grnNo: "GRN-2024-001234",
    sku: "SKU-001",
    productName: "Wireless Bluetooth Headphones",
    quantity: 50,
    fromBin: "RECV-01",
    toBin: "A-01-01",
    zone: "Zone A",
    status: "COMPLETED",
    assignedTo: "John Smith",
    createdAt: "2024-01-08 10:30",
  },
  {
    id: "2",
    putawayNo: "PUT-2024-001235",
    grnNo: "GRN-2024-001235",
    sku: "SKU-002",
    productName: "USB-C Charging Cable",
    quantity: 100,
    fromBin: "RECV-02",
    toBin: "A-02-03",
    zone: "Zone A",
    status: "IN_PROGRESS",
    assignedTo: "Jane Doe",
    createdAt: "2024-01-08 11:15",
  },
  {
    id: "3",
    putawayNo: "PUT-2024-001236",
    grnNo: "GRN-2024-001236",
    sku: "SKU-003",
    productName: "Smart Watch Band",
    quantity: 75,
    fromBin: "RECV-01",
    toBin: "B-01-02",
    zone: "Zone B",
    status: "PENDING",
    assignedTo: "Unassigned",
    createdAt: "2024-01-08 11:45",
  },
  {
    id: "4",
    putawayNo: "PUT-2024-001237",
    grnNo: "GRN-2024-001237",
    sku: "SKU-004",
    productName: "Laptop Stand",
    quantity: 30,
    fromBin: "RECV-03",
    toBin: "A-03-01",
    zone: "Zone A",
    status: "PENDING",
    assignedTo: "Unassigned",
    createdAt: "2024-01-08 12:00",
  },
  {
    id: "5",
    putawayNo: "PUT-2024-001238",
    grnNo: "GRN-2024-001238",
    sku: "SKU-005",
    productName: "Portable Power Bank",
    quantity: 45,
    fromBin: "RECV-02",
    toBin: "B-02-04",
    zone: "Zone B",
    status: "COMPLETED",
    assignedTo: "Mike Johnson",
    createdAt: "2024-01-08 09:30",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

interface StatusCounts {
  all: number;
  pending: number;
  in_progress: number;
  completed: number;
}

export default function WMSPutawayPage() {
  const [putaways, setPutaways] = useState<PutawayItem[]>(demoPutaways);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 156, totalPages: 16 });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ all: 156, pending: 45, in_progress: 23, completed: 88 });

  useEffect(() => {
    fetchPutaways();
  }, [activeTab, zoneFilter, pagination.page]);

  const fetchPutaways = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.pageSize.toString(),
        ...(activeTab !== "all" && { status: activeTab.toUpperCase() }),
        ...(searchQuery && { putawayNo: searchQuery }),
      });
      const response = await fetch(`/api/oms/miscellaneous/putaway?${params}`);
      const result = await response.json();
      if (result.success && result.data) {
        const items = result.data.putaways || demoPutaways;
        setPutaways(items.map((p: any) => ({
          id: p.id,
          putawayNo: p.putawayNo,
          grnNo: p.inboundNo || "",
          sku: p.skuCode,
          productName: p.skuDescription,
          quantity: p.qtyForPutaway,
          fromBin: p.fromBin,
          toBin: p.toBin,
          zone: p.toZone || "Zone A",
          status: p.status,
          assignedTo: p.createdBy,
          createdAt: p.createdDate,
        })));
        if (result.data.summary) {
          setStatusCounts({
            all: result.data.total || 156,
            pending: result.data.summary.open || 45,
            in_progress: result.data.summary.partConfirmed || 23,
            completed: (result.data.summary.confirmed || 0) + (result.data.summary.closed || 0),
          });
        }
        setPagination(prev => ({
          ...prev,
          total: result.data.total || 156,
          totalPages: result.data.totalPages || 16,
        }));
      }
    } catch (error) {
      console.error("Error fetching putaways:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Putaway No", "GRN No", "SKU", "Product", "Qty", "From Bin", "To Bin", "Zone", "Status", "Assigned To"].join(","),
      ...putaways.map(p => [
        p.putawayNo, p.grnNo, p.sku, p.productName, p.quantity, p.fromBin, p.toBin, p.zone, p.status, p.assignedTo
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `putaway-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statusTabs = [
    { id: "all", label: "All Putaway", count: statusCounts.all },
    { id: "pending", label: "Pending", count: statusCounts.pending },
    { id: "in_progress", label: "In Progress", count: statusCounts.in_progress },
    { id: "completed", label: "Completed", count: statusCounts.completed },
  ];

  const summaryStats = [
    { label: "Total Putaway", value: statusCounts.all.toString(), color: "bg-blue-500", icon: PackageCheck },
    { label: "Pending", value: statusCounts.pending.toString(), color: "bg-yellow-500", icon: Clock },
    { label: "In Progress", value: statusCounts.in_progress.toString(), color: "bg-orange-500", icon: ScanLine },
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
        <h1 className="text-xl font-bold text-gray-900">Putaway</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchPutaways}
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
            Scan Putaway
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
            placeholder="Search by Putaway No, SKU, Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Zones</option>
          <option value="Zone A">Zone A</option>
          <option value="Zone B">Zone B</option>
          <option value="Zone C">Zone C</option>
        </select>
        <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
          <option value="all">All Assignees</option>
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

      {/* Putaway Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Putaway No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">SKU / Product</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">From Bin</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">To Bin</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Zone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Assigned To</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {putaways.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-blue-600">{item.putawayNo}</p>
                    <p className="text-xs text-gray-500">{item.grnNo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.sku}</p>
                    <p className="text-xs text-gray-500">{item.productName}</p>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.fromBin}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {item.toBin}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {item.zone}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        item.assignedTo === "Unassigned" ? "text-gray-400 italic" : ""
                      }
                    >
                      {item.assignedTo}
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
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} putaways
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
