"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ReturnInbound {
  id: string;
  returnNo: string;
  orderNo: string;
  customer: string;
  reason: string;
  totalItems: number;
  receivedItems: number;
  condition: string;
  receivedDate: string | null;
  status: string;
}

const demoReturnInbounds: ReturnInbound[] = [
  {
    id: "1",
    returnNo: "RET-2024-001234",
    orderNo: "ORD-2024-005678",
    customer: "Ramesh Kumar",
    reason: "Size Issue",
    totalItems: 2,
    receivedItems: 2,
    condition: "Good",
    receivedDate: "2024-01-08 09:30",
    status: "COMPLETED",
  },
  {
    id: "2",
    returnNo: "RET-2024-001235",
    orderNo: "ORD-2024-005679",
    customer: "Priya Sharma",
    reason: "Defective Product",
    totalItems: 1,
    receivedItems: 1,
    condition: "Damaged",
    receivedDate: "2024-01-08 10:15",
    status: "QC_PENDING",
  },
  {
    id: "3",
    returnNo: "RET-2024-001236",
    orderNo: "ORD-2024-005680",
    customer: "Amit Patel",
    reason: "Wrong Item",
    totalItems: 3,
    receivedItems: 0,
    condition: "-",
    receivedDate: null,
    status: "IN_TRANSIT",
  },
  {
    id: "4",
    returnNo: "RET-2024-001237",
    orderNo: "ORD-2024-005681",
    customer: "Sneha Gupta",
    reason: "Not as Expected",
    totalItems: 1,
    receivedItems: 0,
    condition: "-",
    receivedDate: null,
    status: "INITIATED",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  QC_PENDING: { bg: "bg-orange-100", text: "text-orange-700" },
  IN_TRANSIT: { bg: "bg-blue-100", text: "text-blue-700" },
  INITIATED: { bg: "bg-yellow-100", text: "text-yellow-700" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700" },
};

const conditionColors: Record<string, string> = {
  Good: "text-green-600",
  Damaged: "text-red-600",
  "-": "text-gray-400",
};

const summaryStats = [
  { label: "Total Return Inbounds", value: "156", color: "bg-blue-500", icon: RotateCcw },
  { label: "In Transit", value: "24", color: "bg-orange-500", icon: Package },
  { label: "QC Pending", value: "18", color: "bg-yellow-500", icon: Clock },
  { label: "Completed", value: "114", color: "bg-green-500", icon: CheckCircle },
];

export default function ReturnInboundPage() {
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
        <h1 className="text-xl font-bold text-gray-900">Return Inbound Create/Edit</h1>
        <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Create Return Inbound
        </button>
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
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="initiated">Initiated</option>
          <option value="in_transit">In Transit</option>
          <option value="qc_pending">QC Pending</option>
          <option value="completed">Completed</option>
        </select>
        <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
          <option value="all">All Reasons</option>
          <option value="size">Size Issue</option>
          <option value="defective">Defective Product</option>
          <option value="wrong">Wrong Item</option>
          <option value="expected">Not as Expected</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Return Inbound Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Return No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Condition</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Received Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoReturnInbounds.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{item.returnNo}</td>
                  <td className="px-4 py-3 text-gray-600">{item.orderNo}</td>
                  <td className="px-4 py-3">{item.customer}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.reason}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{item.receivedItems}</span>
                    <span className="text-gray-400"> / {item.totalItems}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${conditionColors[item.condition] || ""}`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.receivedDate || <span className="text-gray-400">-</span>}
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
                          <Edit className="w-4 h-4" />
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
          <div className="text-sm text-gray-500">Showing 1-4 of 156 return inbounds</div>
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
