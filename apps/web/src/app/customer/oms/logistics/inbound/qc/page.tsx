"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Scan,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";

interface InboundQC {
  id: string;
  qcNo: string;
  grnNo: string;
  vendor: string;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  holdItems: number;
  qcBy: string;
  qcDate: string;
  status: string;
}

const demoQCData: InboundQC[] = [
  {
    id: "1",
    qcNo: "QC-2024-001234",
    grnNo: "GRN-2024-005678",
    vendor: "Tech Supplies",
    totalItems: 150,
    passedItems: 145,
    failedItems: 3,
    holdItems: 2,
    qcBy: "Rahul Kumar",
    qcDate: "2024-01-08 10:30",
    status: "COMPLETED",
  },
  {
    id: "2",
    qcNo: "QC-2024-001235",
    grnNo: "GRN-2024-005679",
    vendor: "Electronics Hub",
    totalItems: 200,
    passedItems: 120,
    failedItems: 0,
    holdItems: 80,
    qcBy: "Priya Sharma",
    qcDate: "2024-01-08 11:15",
    status: "IN_PROGRESS",
  },
  {
    id: "3",
    qcNo: "QC-2024-001236",
    grnNo: "GRN-2024-005680",
    vendor: "Office Mart",
    totalItems: 75,
    passedItems: 0,
    failedItems: 0,
    holdItems: 0,
    qcBy: "-",
    qcDate: "-",
    status: "PENDING",
  },
  {
    id: "4",
    qcNo: "QC-2024-001237",
    grnNo: "GRN-2024-005681",
    vendor: "Fashion World",
    totalItems: 300,
    passedItems: 280,
    failedItems: 15,
    holdItems: 5,
    qcBy: "Amit Patel",
    qcDate: "2024-01-07 16:45",
    status: "COMPLETED",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  FAILED: { bg: "bg-red-100", text: "text-red-700" },
};

const summaryStats = [
  { label: "Total QC Tasks", value: "156", color: "bg-blue-500", icon: ClipboardCheck },
  { label: "Pending QC", value: "24", color: "bg-yellow-500", icon: Scan },
  { label: "Passed", value: "120", color: "bg-green-500", icon: CheckCircle },
  { label: "Failed/Hold", value: "12", color: "bg-red-500", icon: AlertTriangle },
];

export default function InboundQCPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
        <h1 className="text-xl font-bold text-gray-900">Inbound Quality Check</h1>
        <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Scan className="w-4 h-4" />
          Start QC
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by QC No, GRN No, Vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* QC Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">QC No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">GRN No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vendor</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Passed</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Failed</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Hold</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">QC By</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoQCData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{item.qcNo}</td>
                  <td className="px-4 py-3 text-gray-600">{item.grnNo}</td>
                  <td className="px-4 py-3">{item.vendor}</td>
                  <td className="px-4 py-3 text-center font-medium">{item.totalItems}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      {item.passedItems}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-red-600">
                      <XCircle className="w-3 h-3" />
                      {item.failedItems}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-yellow-600">
                      <AlertTriangle className="w-3 h-3" />
                      {item.holdItems}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{item.qcBy}</p>
                    <p className="text-xs text-gray-500">{item.qcDate}</p>
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
                      {item.status !== "COMPLETED" && (
                        <button className="p-1 text-gray-400 hover:text-green-600">
                          <Scan className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">Showing 1-4 of 156 QC tasks</div>
          <div className="flex items-center gap-2">
            <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
            <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">2</span>
            <button className="p-1 border rounded hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
