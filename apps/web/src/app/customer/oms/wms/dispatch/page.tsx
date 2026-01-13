"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Truck,
  FileText,
  Printer,
  ArrowUpFromLine,
  RefreshCw,
} from "lucide-react";

interface ManifestItem {
  id: string;
  manifestNo: string;
  carrier: string;
  vehicleNo: string;
  driverName: string;
  orderCount: number;
  totalWeight: string;
  destination: string;
  status: string;
  dispatchTime: string;
  createdAt: string;
}

interface StatusCounts {
  all: number;
  pending: number;
  ready: number;
  dispatched: number;
}

const demoManifests: ManifestItem[] = [
  {
    id: "1",
    manifestNo: "MAN-2024-001234",
    carrier: "Delhivery",
    vehicleNo: "MH-12-AB-1234",
    driverName: "Rajesh Kumar",
    orderCount: 45,
    totalWeight: "125.5 kg",
    destination: "Mumbai Hub",
    status: "DISPATCHED",
    dispatchTime: "10:30",
    createdAt: "2024-01-08 10:15",
  },
  {
    id: "2",
    manifestNo: "MAN-2024-001235",
    carrier: "BlueDart",
    vehicleNo: "MH-12-CD-5678",
    driverName: "Suresh Singh",
    orderCount: 32,
    totalWeight: "89.2 kg",
    destination: "Delhi Hub",
    status: "READY",
    dispatchTime: "-",
    createdAt: "2024-01-08 11:00",
  },
  {
    id: "3",
    manifestNo: "MAN-2024-001236",
    carrier: "FedEx",
    vehicleNo: "-",
    driverName: "-",
    orderCount: 18,
    totalWeight: "45.8 kg",
    destination: "Bangalore Hub",
    status: "PENDING",
    dispatchTime: "-",
    createdAt: "2024-01-08 11:30",
  },
  {
    id: "4",
    manifestNo: "MAN-2024-001237",
    carrier: "Ecom Express",
    vehicleNo: "MH-12-EF-9012",
    driverName: "Mohan Lal",
    orderCount: 67,
    totalWeight: "178.3 kg",
    destination: "Chennai Hub",
    status: "DISPATCHED",
    dispatchTime: "09:45",
    createdAt: "2024-01-08 09:30",
  },
  {
    id: "5",
    manifestNo: "MAN-2024-001238",
    carrier: "DTDC",
    vehicleNo: "-",
    driverName: "-",
    orderCount: 25,
    totalWeight: "62.1 kg",
    destination: "Hyderabad Hub",
    status: "PENDING",
    dispatchTime: "-",
    createdAt: "2024-01-08 12:00",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  DISPATCHED: { bg: "bg-green-100", text: "text-green-700" },
  READY: { bg: "bg-blue-100", text: "text-blue-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

export default function WMSDispatchPage() {
  const [manifests, setManifests] = useState<ManifestItem[]>(demoManifests);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedManifests, setSelectedManifests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 156, totalPages: 8 });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ all: 156, pending: 28, ready: 15, dispatched: 113 });

  useEffect(() => {
    fetchManifests();
  }, [activeTab, carrierFilter, destinationFilter, pagination.page]);

  const fetchManifests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(activeTab !== "all" && { status: activeTab }),
        ...(carrierFilter !== "all" && { carrier: carrierFilter }),
        ...(destinationFilter !== "all" && { destination: destinationFilter }),
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/oms/wms/dispatch?${params}`);
      const result = await response.json();
      if (result.success && result.data) {
        setManifests(result.data.items || demoManifests);
        setPagination(prev => ({
          ...prev,
          total: result.data.total || 156,
          totalPages: result.data.totalPages || 8,
        }));
        if (result.data.statusCounts) {
          setStatusCounts(result.data.statusCounts);
        }
      }
    } catch (error) {
      console.error("Error fetching manifests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Manifest No", "Carrier", "Vehicle No", "Driver", "Orders", "Weight", "Destination", "Status", "Dispatch Time"].join(","),
      ...manifests.map(m => [
        m.manifestNo, m.carrier, m.vehicleNo, m.driverName, m.orderCount, m.totalWeight, m.destination, m.status, m.dispatchTime
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manifests-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleMarkDispatched = async () => {
    // Implementation for bulk mark dispatched
    alert(`Marking ${selectedManifests.length} manifest(s) as dispatched`);
    setSelectedManifests([]);
  };

  const handlePrintManifests = async () => {
    // Implementation for bulk print
    alert(`Printing ${selectedManifests.length} manifest(s)`);
  };

  const statusTabs = [
    { id: "all", label: "All Manifests", count: statusCounts.all },
    { id: "pending", label: "Pending", count: statusCounts.pending },
    { id: "ready", label: "Ready", count: statusCounts.ready },
    { id: "dispatched", label: "Dispatched", count: statusCounts.dispatched },
  ];

  const summaryStats = [
    { label: "Total Manifests", value: statusCounts.all.toString(), color: "bg-blue-500", icon: FileText },
    { label: "Pending", value: statusCounts.pending.toString(), color: "bg-yellow-500", icon: Clock },
    { label: "Ready to Dispatch", value: statusCounts.ready.toString(), color: "bg-orange-500", icon: ArrowUpFromLine },
    { label: "Dispatched Today", value: statusCounts.dispatched.toString(), color: "bg-green-500", icon: Truck },
  ];

  const toggleSelectAll = () => {
    if (selectedManifests.length === manifests.length) {
      setSelectedManifests([]);
    } else {
      setSelectedManifests(manifests.map((m) => m.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedManifests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
        <h1 className="text-xl font-bold text-gray-900">Dispatch / Manifest</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchManifests}
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
            <Plus className="w-4 h-4" />
            Create Manifest
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
            placeholder="Search by Manifest No, Vehicle No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchManifests()}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={carrierFilter}
          onChange={(e) => setCarrierFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Carriers</option>
          <option value="Delhivery">Delhivery</option>
          <option value="BlueDart">BlueDart</option>
          <option value="FedEx">FedEx</option>
          <option value="Ecom Express">Ecom Express</option>
          <option value="DTDC">DTDC</option>
        </select>
        <select
          value={destinationFilter}
          onChange={(e) => setDestinationFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Destinations</option>
          <option value="Mumbai Hub">Mumbai Hub</option>
          <option value="Delhi Hub">Delhi Hub</option>
          <option value="Bangalore Hub">Bangalore Hub</option>
          <option value="Chennai Hub">Chennai Hub</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedManifests.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedManifests.length} manifest(s) selected
          </span>
          <button
            onClick={handleMarkDispatched}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark Dispatched
          </button>
          <button
            onClick={handlePrintManifests}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Printer className="w-3 h-3" />
            Print
          </button>
          <button
            onClick={() => setSelectedManifests([])}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            Clear
          </button>
        </div>
      )}

      {/* Manifest Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={manifests.length > 0 && selectedManifests.length === manifests.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Manifest No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Carrier</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vehicle / Driver</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Orders</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Weight</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Destination</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Dispatch Time</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {manifests.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedManifests.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-blue-600">{item.manifestNo}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                      {item.carrier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.vehicleNo !== "-" ? (
                      <>
                        <p className="font-medium">{item.vehicleNo}</p>
                        <p className="text-xs text-gray-500">{item.driverName}</p>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{item.orderCount}</td>
                  <td className="px-4 py-3 text-center">{item.totalWeight}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-gray-400" />
                      {item.destination}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.dispatchTime !== "-" ? (
                      <span className="font-medium text-green-600">{item.dispatchTime}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        statusColors[item.status]?.bg || "bg-gray-100"
                      } ${statusColors[item.status]?.text || "text-gray-700"}`}
                    >
                      {item.status}
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} manifests
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
