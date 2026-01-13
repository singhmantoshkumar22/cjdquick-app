"use client";

import { useState } from "react";
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
  Repeat,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

interface CycleCountItem {
  id: string;
  countNo: string;
  zone: string;
  binRange: string;
  totalBins: number;
  countedBins: number;
  skusCount: number;
  variance: number;
  status: string;
  assignedTo: string;
  scheduledDate: string;
  completedDate: string | null;
}

const demoCycleCounts: CycleCountItem[] = [
  {
    id: "1",
    countNo: "CC-2024-001234",
    zone: "Zone A",
    binRange: "A-01-01 to A-05-10",
    totalBins: 50,
    countedBins: 50,
    skusCount: 125,
    variance: 2,
    status: "COMPLETED",
    assignedTo: "John Smith",
    scheduledDate: "2024-01-08",
    completedDate: "2024-01-08",
  },
  {
    id: "2",
    countNo: "CC-2024-001235",
    zone: "Zone B",
    binRange: "B-01-01 to B-03-08",
    totalBins: 32,
    countedBins: 18,
    skusCount: 89,
    variance: 0,
    status: "IN_PROGRESS",
    assignedTo: "Jane Doe",
    scheduledDate: "2024-01-08",
    completedDate: null,
  },
  {
    id: "3",
    countNo: "CC-2024-001236",
    zone: "Zone C",
    binRange: "C-01-01 to C-04-12",
    totalBins: 48,
    countedBins: 0,
    skusCount: 156,
    variance: 0,
    status: "SCHEDULED",
    assignedTo: "Mike Johnson",
    scheduledDate: "2024-01-09",
    completedDate: null,
  },
  {
    id: "4",
    countNo: "CC-2024-001237",
    zone: "Zone A",
    binRange: "A-06-01 to A-10-10",
    totalBins: 50,
    countedBins: 50,
    skusCount: 142,
    variance: 5,
    status: "VARIANCE",
    assignedTo: "Sarah Williams",
    scheduledDate: "2024-01-07",
    completedDate: "2024-01-07",
  },
  {
    id: "5",
    countNo: "CC-2024-001238",
    zone: "Zone D",
    binRange: "D-01-01 to D-02-15",
    totalBins: 30,
    countedBins: 0,
    skusCount: 78,
    variance: 0,
    status: "SCHEDULED",
    assignedTo: "Unassigned",
    scheduledDate: "2024-01-10",
    completedDate: null,
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
  SCHEDULED: { bg: "bg-yellow-100", text: "text-yellow-700" },
  VARIANCE: { bg: "bg-red-100", text: "text-red-700" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-700" },
};

const statusTabs = [
  { id: "all", label: "All Counts", count: 156 },
  { id: "scheduled", label: "Scheduled", count: 45 },
  { id: "in_progress", label: "In Progress", count: 12 },
  { id: "completed", label: "Completed", count: 89 },
  { id: "variance", label: "Variance", count: 10 },
];

const summaryStats = [
  { label: "Total Counts", value: "156", color: "bg-blue-500", icon: Repeat },
  { label: "Scheduled", value: "45", color: "bg-yellow-500", icon: Clock },
  { label: "Completed", value: "89", color: "bg-green-500", icon: CheckCircle },
  { label: "With Variance", value: "10", color: "bg-red-500", icon: AlertTriangle },
];

export default function WMSCycleCountPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
        <h1 className="text-xl font-bold text-gray-900">Cycle Count</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Schedule Count
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
            placeholder="Search by Count No, Zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
          <option>All Zones</option>
          <option>Zone A</option>
          <option>Zone B</option>
          <option>Zone C</option>
          <option>Zone D</option>
        </select>
        <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
          <option>All Assignees</option>
          <option>John Smith</option>
          <option>Jane Doe</option>
          <option>Mike Johnson</option>
          <option>Unassigned</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Cycle Count Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Count No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Zone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Bin Range</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Bins</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Progress</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">SKUs</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Variance</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Assigned To</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Scheduled</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoCycleCounts.map((item) => {
                const progress = Math.round((item.countedBins / item.totalBins) * 100);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{item.countNo}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {item.zone}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{item.binRange}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{item.countedBins}</span>
                      <span className="text-gray-400"> / {item.totalBins}</span>
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
                    <td className="px-4 py-3 text-center">{item.skusCount}</td>
                    <td className="px-4 py-3 text-center">
                      {item.variance > 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                          {item.variance} items
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
                    <td className="px-4 py-3 text-center text-gray-600">{item.scheduledDate}</td>
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
                          <BarChart3 className="w-4 h-4" />
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
          <div className="text-sm text-gray-500">Showing 1-5 of 156 cycle counts</div>
          <div className="flex items-center gap-2">
            <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
            <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">2</span>
            <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">3</span>
            <span className="text-gray-400">...</span>
            <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">32</span>
            <button className="p-1 border rounded hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
