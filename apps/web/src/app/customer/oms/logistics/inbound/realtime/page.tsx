"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";

interface InboundRealtime {
  id: string;
  asnNo: string;
  vehicleNo: string;
  transporter: string;
  origin: string;
  destination: string;
  currentLocation: string;
  eta: string;
  items: number;
  status: string;
  lastUpdated: string;
}

const demoRealtimeData: InboundRealtime[] = [
  {
    id: "1",
    asnNo: "ASN-2024-001234",
    vehicleNo: "MH-12-AB-1234",
    transporter: "Delhivery",
    origin: "Mumbai",
    destination: "Warehouse A",
    currentLocation: "Pune (45 km away)",
    eta: "2024-01-08 14:30",
    items: 450,
    status: "IN_TRANSIT",
    lastUpdated: "5 mins ago",
  },
  {
    id: "2",
    asnNo: "ASN-2024-001235",
    vehicleNo: "MH-12-CD-5678",
    transporter: "BlueDart",
    origin: "Delhi",
    destination: "Warehouse B",
    currentLocation: "At Gate",
    eta: "2024-01-08 12:00",
    items: 280,
    status: "ARRIVED",
    lastUpdated: "2 mins ago",
  },
  {
    id: "3",
    asnNo: "ASN-2024-001236",
    vehicleNo: "MH-12-EF-9012",
    transporter: "FedEx",
    origin: "Bangalore",
    destination: "Warehouse A",
    currentLocation: "Hyderabad Hub",
    eta: "2024-01-09 10:00",
    items: 150,
    status: "IN_TRANSIT",
    lastUpdated: "15 mins ago",
  },
  {
    id: "4",
    asnNo: "ASN-2024-001237",
    vehicleNo: "MH-12-GH-3456",
    transporter: "Ecom Express",
    origin: "Chennai",
    destination: "Warehouse C",
    currentLocation: "Delayed - Traffic",
    eta: "2024-01-08 18:00",
    items: 320,
    status: "DELAYED",
    lastUpdated: "10 mins ago",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  IN_TRANSIT: { bg: "bg-blue-100", text: "text-blue-700" },
  ARRIVED: { bg: "bg-green-100", text: "text-green-700" },
  DELAYED: { bg: "bg-red-100", text: "text-red-700" },
  SCHEDULED: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

const summaryStats = [
  { label: "Shipments In Transit", value: "24", color: "bg-blue-500", icon: Truck },
  { label: "Expected Today", value: "12", color: "bg-orange-500", icon: Package },
  { label: "Arrived", value: "8", color: "bg-green-500", icon: CheckCircle },
  { label: "Delayed", value: "3", color: "bg-red-500", icon: AlertCircle },
];

export default function InboundRealtimePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLastRefresh(new Date());
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
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inbound RealTime Tracking</h1>
          <p className="text-sm text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ASN No, Vehicle No..."
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
          <option value="in_transit">In Transit</option>
          <option value="arrived">Arrived</option>
          <option value="delayed">Delayed</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Realtime Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ASN No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Transporter</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Route</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Current Location</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">ETA</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoRealtimeData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{item.asnNo}</td>
                  <td className="px-4 py-3 font-medium">{item.vehicleNo}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.transporter}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{item.origin}</p>
                    <p className="text-xs text-gray-500">→ {item.destination}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{item.currentLocation}</span>
                    </div>
                    <p className="text-xs text-gray-400">{item.lastUpdated}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{item.eta.split(" ")[1]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{item.items}</td>
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
          <div className="text-sm text-gray-500">Showing 1-4 of 24 shipments</div>
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
