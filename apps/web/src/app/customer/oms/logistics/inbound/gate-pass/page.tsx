"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Truck,
  Clock,
  CheckCircle,
} from "lucide-react";

interface GatePass {
  id: string;
  gatePassNo: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  transporter: string;
  grnCount: number;
  totalItems: number;
  inTime: string;
  outTime: string | null;
  status: string;
}

const demoGatePasses: GatePass[] = [
  {
    id: "1",
    gatePassNo: "GP-2024-001234",
    vehicleNo: "MH-12-AB-1234",
    driverName: "Rajesh Kumar",
    driverPhone: "+91 98765 43210",
    transporter: "Delhivery",
    grnCount: 3,
    totalItems: 450,
    inTime: "2024-01-08 09:30",
    outTime: "2024-01-08 11:45",
    status: "COMPLETED",
  },
  {
    id: "2",
    gatePassNo: "GP-2024-001235",
    vehicleNo: "MH-12-CD-5678",
    driverName: "Suresh Singh",
    driverPhone: "+91 98765 43211",
    transporter: "BlueDart",
    grnCount: 2,
    totalItems: 280,
    inTime: "2024-01-08 10:15",
    outTime: null,
    status: "IN_PROGRESS",
  },
  {
    id: "3",
    gatePassNo: "GP-2024-001236",
    vehicleNo: "MH-12-EF-9012",
    driverName: "Mohan Lal",
    driverPhone: "+91 98765 43212",
    transporter: "FedEx",
    grnCount: 1,
    totalItems: 150,
    inTime: "2024-01-08 11:00",
    outTime: null,
    status: "PENDING",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

const summaryStats = [
  { label: "Today's Gate Passes", value: "24", color: "bg-blue-500", icon: ScrollText },
  { label: "Vehicles In", value: "8", color: "bg-orange-500", icon: Truck },
  { label: "Completed", value: "16", color: "bg-green-500", icon: CheckCircle },
  { label: "Avg. Turnaround", value: "2.5h", color: "bg-purple-500", icon: Clock },
];

export default function InboundGatePassPage() {
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
        <h1 className="text-xl font-bold text-gray-900">Inbound Gate Pass</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Create Gate Pass
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Gate Pass No, Vehicle No..."
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

      {/* Gate Pass Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Gate Pass No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Driver</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Transporter</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">GRNs</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">In Time</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Out Time</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoGatePasses.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{item.gatePassNo}</td>
                  <td className="px-4 py-3 font-medium">{item.vehicleNo}</td>
                  <td className="px-4 py-3">
                    <p>{item.driverName}</p>
                    <p className="text-xs text-gray-500">{item.driverPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.transporter}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{item.grnCount}</td>
                  <td className="px-4 py-3 text-center">{item.totalItems}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.inTime}</td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.outTime || <span className="text-gray-400">-</span>}
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">Showing 1-3 of 24 gate passes</div>
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
