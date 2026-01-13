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
  ClipboardCheck,
  Printer,
  Users,
  X,
  RefreshCw,
} from "lucide-react";

interface PickListItem {
  id: string;
  picklistNo: string;
  orderCount: number;
  totalItems: number;
  pickedItems: number;
  zone: string;
  priority: string;
  status: string;
  assignedTo: string;
  createdAt: string;
  dueTime: string;
}

interface StatusCounts {
  all: number;
  pending: number;
  in_progress: number;
  completed: number;
}

const demoPicklists: PickListItem[] = [
  {
    id: "1",
    picklistNo: "PCK-2024-001234",
    orderCount: 15,
    totalItems: 45,
    pickedItems: 45,
    zone: "Zone A",
    priority: "HIGH",
    status: "COMPLETED",
    assignedTo: "John Smith",
    createdAt: "2024-01-08 08:00",
    dueTime: "10:00",
  },
  {
    id: "2",
    picklistNo: "PCK-2024-001235",
    orderCount: 22,
    totalItems: 68,
    pickedItems: 34,
    zone: "Zone B",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedTo: "Jane Doe",
    createdAt: "2024-01-08 09:30",
    dueTime: "11:30",
  },
  {
    id: "3",
    picklistNo: "PCK-2024-001236",
    orderCount: 8,
    totalItems: 25,
    pickedItems: 0,
    zone: "Zone A",
    priority: "MEDIUM",
    status: "PENDING",
    assignedTo: "Unassigned",
    createdAt: "2024-01-08 10:00",
    dueTime: "12:00",
  },
  {
    id: "4",
    picklistNo: "PCK-2024-001237",
    orderCount: 30,
    totalItems: 92,
    pickedItems: 0,
    zone: "Zone C",
    priority: "LOW",
    status: "PENDING",
    assignedTo: "Unassigned",
    createdAt: "2024-01-08 10:30",
    dueTime: "14:00",
  },
  {
    id: "5",
    picklistNo: "PCK-2024-001238",
    orderCount: 12,
    totalItems: 38,
    pickedItems: 20,
    zone: "Zone B",
    priority: "URGENT",
    status: "IN_PROGRESS",
    assignedTo: "Mike Johnson",
    createdAt: "2024-01-08 07:30",
    dueTime: "09:30",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: "bg-red-100", text: "text-red-700" },
  HIGH: { bg: "bg-orange-100", text: "text-orange-700" },
  MEDIUM: { bg: "bg-yellow-100", text: "text-yellow-700" },
  LOW: { bg: "bg-gray-100", text: "text-gray-700" },
};

export default function WMSPicklistPage() {
  const [picklists, setPicklists] = useState<PickListItem[]>(demoPicklists);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPicklists, setSelectedPicklists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 128, totalPages: 7 });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ all: 128, pending: 35, in_progress: 28, completed: 65 });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPicklists();
  }, [activeTab, zoneFilter, priorityFilter, pagination.page]);

  const fetchPicklists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(activeTab !== "all" && { status: activeTab }),
        ...(zoneFilter !== "all" && { zone: zoneFilter }),
        ...(priorityFilter !== "all" && { priority: priorityFilter }),
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/oms/wms/picklist?${params}`);
      const result = await response.json();
      if (result.success && result.data) {
        setPicklists(result.data.items || demoPicklists);
        setPagination(prev => ({
          ...prev,
          total: result.data.total || 128,
          totalPages: result.data.totalPages || 7,
        }));
        if (result.data.statusCounts) {
          setStatusCounts(result.data.statusCounts);
        }
      }
    } catch (error) {
      console.error("Error fetching picklists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Picklist No", "Orders", "Total Items", "Picked", "Zone", "Priority", "Status", "Assigned To", "Due Time"].join(","),
      ...picklists.map(p => [
        p.picklistNo, p.orderCount, p.totalItems, p.pickedItems, p.zone, p.priority, p.status, p.assignedTo, p.dueTime
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `picklists-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreatePicklist = async (orderIds: string[]) => {
    try {
      const response = await fetch("/api/oms/wms/picklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
      });
      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        fetchPicklists();
      }
    } catch (error) {
      console.error("Error creating picklist:", error);
    }
  };

  const handleAssignPicker = async () => {
    // Implementation for bulk assign picker
    alert(`Assign picker to ${selectedPicklists.length} picklist(s)`);
  };

  const handlePrintPicklists = async () => {
    // Implementation for bulk print
    alert(`Printing ${selectedPicklists.length} picklist(s)`);
  };

  const statusTabs = [
    { id: "all", label: "All Picklists", count: statusCounts.all },
    { id: "pending", label: "Pending", count: statusCounts.pending },
    { id: "in_progress", label: "In Progress", count: statusCounts.in_progress },
    { id: "completed", label: "Completed", count: statusCounts.completed },
  ];

  const summaryStats = [
    { label: "Total Picklists", value: statusCounts.all.toString(), color: "bg-blue-500", icon: ClipboardCheck },
    { label: "Pending", value: statusCounts.pending.toString(), color: "bg-yellow-500", icon: Clock },
    { label: "In Progress", value: statusCounts.in_progress.toString(), color: "bg-orange-500", icon: Users },
    { label: "Completed Today", value: statusCounts.completed.toString(), color: "bg-green-500", icon: CheckCircle },
  ];

  const toggleSelectAll = () => {
    if (selectedPicklists.length === picklists.length) {
      setSelectedPicklists([]);
    } else {
      setSelectedPicklists(picklists.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedPicklists((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPicklists();
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
        <h1 className="text-xl font-bold text-gray-900">Pick List</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchPicklists}
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Picklist
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
            placeholder="Search by Picklist No..."
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
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedPicklists.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedPicklists.length} picklist(s) selected
          </span>
          <button
            onClick={handleAssignPicker}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Assign Picker
          </button>
          <button
            onClick={handlePrintPicklists}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Printer className="w-3 h-3" />
            Print
          </button>
          <button
            onClick={() => setSelectedPicklists([])}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            Clear
          </button>
        </div>
      )}

      {/* Picklist Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={picklists.length > 0 && selectedPicklists.length === picklists.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Picklist No</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Orders</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Progress</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Zone</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Assigned To</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Due Time</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {picklists.map((item) => {
                const progress = Math.round((item.pickedItems / item.totalItems) * 100);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPicklists.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600">{item.picklistNo}</td>
                    <td className="px-4 py-3 text-center">{item.orderCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{item.pickedItems}</span>
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
                    <td className="px-4 py-3 text-center text-gray-600">{item.zone}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          priorityColors[item.priority]?.bg || "bg-gray-100"
                        } ${priorityColors[item.priority]?.text || "text-gray-700"}`}
                      >
                        {item.priority}
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
                      <span className={`font-medium ${
                        item.priority === "URGENT" ? "text-red-600" : ""
                      }`}>
                        {item.dueTime}
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
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} picklists
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
