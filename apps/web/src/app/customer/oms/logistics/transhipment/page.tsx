"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Truck,
  Package,
  Clock,
  CheckCircle,
  ArrowRightLeft,
  MapPin,
} from "lucide-react";

interface Transhipment {
  id: string;
  transhipmentNo: string;
  sourceHub: string;
  destinationHub: string;
  vehicleNo: string;
  totalPackages: number;
  totalWeight: number;
  departureTime: string;
  arrivalTime: string | null;
  status: string;
}

const demoTranshipments: Transhipment[] = [
  {
    id: "1",
    transhipmentNo: "TRN-2024-001234",
    sourceHub: "Mumbai Hub",
    destinationHub: "Delhi Hub",
    vehicleNo: "MH-12-AB-1234",
    totalPackages: 450,
    totalWeight: 2500,
    departureTime: "2024-01-08 06:00",
    arrivalTime: "2024-01-08 18:00",
    status: "COMPLETED",
  },
  {
    id: "2",
    transhipmentNo: "TRN-2024-001235",
    sourceHub: "Delhi Hub",
    destinationHub: "Bangalore Hub",
    vehicleNo: "DL-01-CD-5678",
    totalPackages: 320,
    totalWeight: 1800,
    departureTime: "2024-01-08 08:00",
    arrivalTime: null,
    status: "IN_TRANSIT",
  },
  {
    id: "3",
    transhipmentNo: "TRN-2024-001236",
    sourceHub: "Mumbai Hub",
    destinationHub: "Chennai Hub",
    vehicleNo: "MH-12-EF-9012",
    totalPackages: 280,
    totalWeight: 1500,
    departureTime: "2024-01-08 10:00",
    arrivalTime: null,
    status: "IN_TRANSIT",
  },
  {
    id: "4",
    transhipmentNo: "TRN-2024-001237",
    sourceHub: "Kolkata Hub",
    destinationHub: "Mumbai Hub",
    vehicleNo: "-",
    totalPackages: 200,
    totalWeight: 1200,
    departureTime: "-",
    arrivalTime: null,
    status: "SCHEDULED",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  IN_TRANSIT: { bg: "bg-blue-100", text: "text-blue-700" },
  SCHEDULED: { bg: "bg-yellow-100", text: "text-yellow-700" },
  DELAYED: { bg: "bg-red-100", text: "text-red-700" },
};

const summaryStats = [
  { label: "Total Transhipments", value: "156", color: "bg-blue-500", icon: ArrowRightLeft },
  { label: "In Transit", value: "24", color: "bg-orange-500", icon: Truck },
  { label: "Scheduled", value: "18", color: "bg-yellow-500", icon: Clock },
  { label: "Completed Today", value: "32", color: "bg-green-500", icon: CheckCircle },
];

export default function TranshipmentPage() {
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
        <h1 className="text-xl font-bold text-gray-900">Transhipment</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Create Transhipment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Transhipment No, Hub, Vehicle..."
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
          <option value="scheduled">Scheduled</option>
          <option value="in_transit">In Transit</option>
          <option value="completed">Completed</option>
          <option value="delayed">Delayed</option>
        </select>
        <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
          <option>All Source Hubs</option>
          <option>Mumbai Hub</option>
          <option>Delhi Hub</option>
          <option>Bangalore Hub</option>
          <option>Chennai Hub</option>
          <option>Kolkata Hub</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Transhipment Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Transhipment No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Route</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vehicle</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Packages</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Weight (kg)</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Departure</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Arrival</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoTranshipments.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{item.transhipmentNo}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-green-500" />
                        <span className="text-sm">{item.sourceHub}</span>
                      </div>
                      <RefreshCw className="w-3 h-3 text-gray-400" />
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        <span className="text-sm">{item.destinationHub}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.vehicleNo !== "-" ? (
                      <div className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-gray-400" />
                        <span>{item.vehicleNo}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">{item.totalPackages}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {item.totalWeight.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.departureTime !== "-" ? item.departureTime.split(" ")[1] : "-"}
                    {item.departureTime !== "-" && (
                      <p className="text-xs text-gray-400">{item.departureTime.split(" ")[0]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.arrivalTime ? (
                      <>
                        {item.arrivalTime.split(" ")[1]}
                        <p className="text-xs text-gray-400">{item.arrivalTime.split(" ")[0]}</p>
                      </>
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
          <div className="text-sm text-gray-500">Showing 1-4 of 156 transhipments</div>
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
