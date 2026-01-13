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
  ArrowDownToLine,
  Package,
  Clock,
  CheckCircle,
} from "lucide-react";

interface DirectInbound {
  id: string;
  inboundNo: string;
  invoiceNo: string;
  supplier: string;
  warehouse: string;
  totalItems: number;
  receivedItems: number;
  invoiceValue: number;
  receivedDate: string;
  status: string;
}

const demoDirectInbounds: DirectInbound[] = [
  {
    id: "1",
    inboundNo: "DI-2024-001234",
    invoiceNo: "INV-2024-005678",
    supplier: "Local Vendor A",
    warehouse: "Warehouse A",
    totalItems: 100,
    receivedItems: 100,
    invoiceValue: 125000,
    receivedDate: "2024-01-08 09:30",
    status: "COMPLETED",
  },
  {
    id: "2",
    inboundNo: "DI-2024-001235",
    invoiceNo: "INV-2024-005679",
    supplier: "Local Vendor B",
    warehouse: "Warehouse A",
    totalItems: 75,
    receivedItems: 50,
    invoiceValue: 89000,
    receivedDate: "2024-01-08 10:15",
    status: "IN_PROGRESS",
  },
  {
    id: "3",
    inboundNo: "DI-2024-001236",
    invoiceNo: "INV-2024-005680",
    supplier: "Walk-in Supplier",
    warehouse: "Warehouse B",
    totalItems: 30,
    receivedItems: 0,
    invoiceValue: 45000,
    receivedDate: "-",
    status: "PENDING",
  },
  {
    id: "4",
    inboundNo: "DI-2024-001237",
    invoiceNo: "INV-2024-005681",
    supplier: "Local Vendor C",
    warehouse: "Warehouse A",
    totalItems: 200,
    receivedItems: 200,
    invoiceValue: 250000,
    receivedDate: "2024-01-07 16:30",
    status: "COMPLETED",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

const summaryStats = [
  { label: "Total Direct Inbounds", value: "89", color: "bg-blue-500", icon: ArrowDownToLine },
  { label: "Pending", value: "12", color: "bg-yellow-500", icon: Clock },
  { label: "In Progress", value: "8", color: "bg-orange-500", icon: Package },
  { label: "Completed", value: "69", color: "bg-green-500", icon: CheckCircle },
];

export default function DirectInboundPage() {
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
        <h1 className="text-xl font-bold text-gray-900">Direct Inbound</h1>
        <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Create Direct Inbound
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Inbound No, Invoice No, Supplier..."
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

      {/* Direct Inbound Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Inbound No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Supplier</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Warehouse</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Invoice Value</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Received Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoDirectInbounds.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{item.inboundNo}</td>
                  <td className="px-4 py-3 text-gray-600">{item.invoiceNo}</td>
                  <td className="px-4 py-3">{item.supplier}</td>
                  <td className="px-4 py-3 text-gray-600">{item.warehouse}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{item.receivedItems}</span>
                    <span className="text-gray-400"> / {item.totalItems}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ₹{item.invoiceValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.receivedDate}</td>
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
          <div className="text-sm text-gray-500">Showing 1-4 of 89 direct inbounds</div>
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
