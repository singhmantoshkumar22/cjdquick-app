"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Package,
  AlertCircle,
} from "lucide-react";

interface InventoryLog {
  id: string;
  logNo: string;
  sku: string;
  productName: string;
  warehouse: string;
  transactionType: string;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  reference: string;
  createdBy: string;
  createdAt: string;
}

const demoInventoryLogs: InventoryLog[] = [
  {
    id: "1",
    logNo: "LOG-2024-001234",
    sku: "SKU-001",
    productName: "Wireless Mouse",
    warehouse: "Warehouse A",
    transactionType: "INBOUND",
    quantity: 100,
    beforeQty: 50,
    afterQty: 150,
    reference: "GRN-2024-005678",
    createdBy: "System",
    createdAt: "2024-01-08 09:30",
  },
  {
    id: "2",
    logNo: "LOG-2024-001235",
    sku: "SKU-002",
    productName: "USB Keyboard",
    warehouse: "Warehouse A",
    transactionType: "OUTBOUND",
    quantity: 25,
    beforeQty: 200,
    afterQty: 175,
    reference: "ORD-2024-005679",
    createdBy: "System",
    createdAt: "2024-01-08 10:15",
  },
  {
    id: "3",
    logNo: "LOG-2024-001236",
    sku: "SKU-003",
    productName: "Monitor Stand",
    warehouse: "Warehouse B",
    transactionType: "ADJUSTMENT",
    quantity: -5,
    beforeQty: 80,
    afterQty: 75,
    reference: "ADJ-2024-001234",
    createdBy: "Rahul Kumar",
    createdAt: "2024-01-08 11:00",
  },
  {
    id: "4",
    logNo: "LOG-2024-001237",
    sku: "SKU-004",
    productName: "Laptop Bag",
    warehouse: "Warehouse A",
    transactionType: "TRANSFER",
    quantity: 30,
    beforeQty: 100,
    afterQty: 70,
    reference: "STO-2024-001234",
    createdBy: "System",
    createdAt: "2024-01-08 11:45",
  },
  {
    id: "5",
    logNo: "LOG-2024-001238",
    sku: "SKU-005",
    productName: "Webcam HD",
    warehouse: "Warehouse A",
    transactionType: "RETURN",
    quantity: 2,
    beforeQty: 45,
    afterQty: 47,
    reference: "RET-2024-001234",
    createdBy: "System",
    createdAt: "2024-01-08 12:00",
  },
];

const transactionColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  INBOUND: { bg: "bg-green-100", text: "text-green-700", icon: TrendingUp },
  OUTBOUND: { bg: "bg-blue-100", text: "text-blue-700", icon: TrendingDown },
  ADJUSTMENT: { bg: "bg-orange-100", text: "text-orange-700", icon: AlertCircle },
  TRANSFER: { bg: "bg-purple-100", text: "text-purple-700", icon: ArrowRight },
  RETURN: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Package },
};

const summaryStats = [
  { label: "Total Transactions", value: "12,456", color: "bg-blue-500", icon: FileText },
  { label: "Inbound Today", value: "234", color: "bg-green-500", icon: TrendingUp },
  { label: "Outbound Today", value: "189", color: "bg-orange-500", icon: TrendingDown },
  { label: "Adjustments", value: "12", color: "bg-red-500", icon: AlertCircle },
];

export default function InventoryLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");

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
        <h1 className="text-xl font-bold text-gray-900">MP Inventory Log</h1>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Log No, SKU, Product Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
          <option value="adjustment">Adjustment</option>
          <option value="transfer">Transfer</option>
          <option value="return">Return</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
        <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
          <option>All Warehouses</option>
          <option>Warehouse A</option>
          <option>Warehouse B</option>
          <option>Warehouse C</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Inventory Log Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Log No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">SKU / Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Warehouse</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Qty Change</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Before</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">After</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reference</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoInventoryLogs.map((log) => {
                const TypeIcon = transactionColors[log.transactionType]?.icon || FileText;
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{log.logNo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{log.sku}</p>
                      <p className="text-xs text-gray-500">{log.productName}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.warehouse}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                          transactionColors[log.transactionType]?.bg
                        } ${transactionColors[log.transactionType]?.text}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {log.transactionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-medium ${
                          log.quantity > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{log.beforeQty}</td>
                    <td className="px-4 py-3 text-center font-medium">{log.afterQty}</td>
                    <td className="px-4 py-3">
                      <span className="text-blue-600 text-xs">{log.reference}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{log.createdBy}</p>
                      <p className="text-xs text-gray-500">{log.createdAt}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">Showing 1-5 of 12,456 logs</div>
          <div className="flex items-center gap-2">
            <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
            <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">2</span>
            <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">3</span>
            <span className="text-gray-400">...</span>
            <button className="p-1 border rounded hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
