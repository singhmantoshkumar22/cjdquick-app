"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Package,
  Clock,
  CheckCircle,
  Truck,
  RefreshCw,
  MapPin,
} from "lucide-react";

interface STOOrder {
  id: string;
  stoNo: string;
  stoType: "WAREHOUSE_TO_WAREHOUSE" | "WAREHOUSE_TO_STORE" | "STORE_TO_WAREHOUSE";
  sourceLocation: string;
  destinationLocation: string;
  status: "DRAFT" | "APPROVED" | "PICKING" | "DISPATCHED" | "IN_TRANSIT" | "RECEIVED" | "CLOSED" | "CANCELLED";
  totalItems: number;
  totalQty: number;
  totalValue: number;
  dispatchDate: string;
  expectedDate: string;
  awbNo: string;
  transporterName: string;
  createdDate: string;
  createdBy: string;
}

const demoSTOData: STOOrder[] = [
  { id: "1", stoNo: "STO-2024-001234", stoType: "WAREHOUSE_TO_WAREHOUSE", sourceLocation: "WH-DELHI", destinationLocation: "WH-MUMBAI", status: "IN_TRANSIT", totalItems: 15, totalQty: 500, totalValue: 125000, dispatchDate: "2024-01-07", expectedDate: "2024-01-10", awbNo: "AWB123456789", transporterName: "Delhivery", createdDate: "2024-01-06", createdBy: "Rahul Kumar" },
  { id: "2", stoNo: "STO-2024-001235", stoType: "WAREHOUSE_TO_STORE", sourceLocation: "WH-MUMBAI", destinationLocation: "STORE-PUNE-01", status: "APPROVED", totalItems: 8, totalQty: 200, totalValue: 45000, dispatchDate: "", expectedDate: "2024-01-12", awbNo: "", transporterName: "", createdDate: "2024-01-08", createdBy: "Priya Sharma" },
  { id: "3", stoNo: "STO-2024-001236", stoType: "WAREHOUSE_TO_WAREHOUSE", sourceLocation: "WH-BANGALORE", destinationLocation: "WH-CHENNAI", status: "DISPATCHED", totalItems: 25, totalQty: 1000, totalValue: 350000, dispatchDate: "2024-01-08", expectedDate: "2024-01-11", awbNo: "AWB123456790", transporterName: "BlueDart", createdDate: "2024-01-05", createdBy: "Amit Patel" },
  { id: "4", stoNo: "STO-2024-001237", stoType: "STORE_TO_WAREHOUSE", sourceLocation: "STORE-HYD-01", destinationLocation: "WH-BANGALORE", status: "RECEIVED", totalItems: 5, totalQty: 75, totalValue: 18000, dispatchDate: "2024-01-03", expectedDate: "2024-01-06", awbNo: "AWB123456791", transporterName: "Ekart", createdDate: "2024-01-02", createdBy: "Sneha Gupta" },
  { id: "5", stoNo: "STO-2024-001238", stoType: "WAREHOUSE_TO_WAREHOUSE", sourceLocation: "WH-DELHI", destinationLocation: "WH-KOLKATA", status: "CLOSED", totalItems: 12, totalQty: 400, totalValue: 95000, dispatchDate: "2024-01-01", expectedDate: "2024-01-04", awbNo: "AWB123456792", transporterName: "DTDC", createdDate: "2023-12-28", createdBy: "Vikram Singh" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700" },
  APPROVED: { bg: "bg-blue-100", text: "text-blue-700" },
  PICKING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  DISPATCHED: { bg: "bg-purple-100", text: "text-purple-700" },
  IN_TRANSIT: { bg: "bg-orange-100", text: "text-orange-700" },
  RECEIVED: { bg: "bg-green-100", text: "text-green-700" },
  CLOSED: { bg: "bg-cyan-100", text: "text-cyan-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

const typeLabels: Record<string, string> = {
  WAREHOUSE_TO_WAREHOUSE: "WH → WH",
  WAREHOUSE_TO_STORE: "WH → Store",
  STORE_TO_WAREHOUSE: "Store → WH",
};

export default function STOOrderEnquiryPage() {
  const [data, setData] = useState<STOOrder[]>(demoSTOData);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    stoNo: "",
    stoType: "",
    sourceLocation: "",
    destinationLocation: "",
    status: "",
    awbNo: "",
    fromDate: "",
    toDate: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const statusTabs = [
    { id: "all", label: "All", count: 245 },
    { id: "draft", label: "Draft", count: 12 },
    { id: "approved", label: "Approved", count: 28 },
    { id: "dispatched", label: "Dispatched", count: 45 },
    { id: "in_transit", label: "In Transit", count: 38 },
    { id: "received", label: "Received", count: 95 },
    { id: "closed", label: "Closed", count: 27 },
  ];

  const summaryStats = [
    { label: "Total STOs", value: "245", icon: ArrowLeftRight, color: "bg-blue-500" },
    { label: "In Transit", value: "38", icon: Truck, color: "bg-orange-500" },
    { label: "Pending Dispatch", value: "40", icon: Clock, color: "bg-yellow-500" },
    { label: "Received", value: "95", icon: CheckCircle, color: "bg-green-500" },
  ];

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleReset = () => {
    setFilters({
      stoNo: "",
      stoType: "",
      sourceLocation: "",
      destinationLocation: "",
      status: "",
      awbNo: "",
      fromDate: "",
      toDate: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.color} rounded-lg p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-90">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            STO Order Enquiry
          </h1>
          <p className="text-sm text-gray-500">Search and view Stock Transfer Orders</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export
        </button>
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
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">STO No</label>
            <input
              type="text"
              value={filters.stoNo}
              onChange={(e) => setFilters({ ...filters, stoNo: e.target.value })}
              placeholder="Enter STO No"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">STO Type</label>
            <select
              value={filters.stoType}
              onChange={(e) => setFilters({ ...filters, stoType: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="WAREHOUSE_TO_WAREHOUSE">Warehouse to Warehouse</option>
              <option value="WAREHOUSE_TO_STORE">Warehouse to Store</option>
              <option value="STORE_TO_WAREHOUSE">Store to Warehouse</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Source Location</label>
            <select
              value={filters.sourceLocation}
              onChange={(e) => setFilters({ ...filters, sourceLocation: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              <option value="WH-DELHI">WH-DELHI</option>
              <option value="WH-MUMBAI">WH-MUMBAI</option>
              <option value="WH-BANGALORE">WH-BANGALORE</option>
              <option value="WH-CHENNAI">WH-CHENNAI</option>
              <option value="WH-KOLKATA">WH-KOLKATA</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
            <select
              value={filters.destinationLocation}
              onChange={(e) => setFilters({ ...filters, destinationLocation: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              <option value="WH-DELHI">WH-DELHI</option>
              <option value="WH-MUMBAI">WH-MUMBAI</option>
              <option value="WH-BANGALORE">WH-BANGALORE</option>
              <option value="WH-CHENNAI">WH-CHENNAI</option>
              <option value="WH-KOLKATA">WH-KOLKATA</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="PICKING">Picking</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="RECEIVED">Received</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">AWB No</label>
              <input
                type="text"
                value={filters.awbNo}
                onChange={(e) => setFilters({ ...filters, awbNo: e.target.value })}
                placeholder="Enter AWB No"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAdvancedFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
          </button>
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
              Reset
            </button>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">STO No</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Route</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Value</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">AWB / Transporter</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Expected</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{item.stoNo}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                        {typeLabels[item.stoType]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-medium">{item.sourceLocation}</span>
                        <ArrowLeftRight className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{item.destinationLocation}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{item.totalItems}</td>
                    <td className="px-4 py-3 text-center font-medium">{item.totalQty}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{item.totalValue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${statusColors[item.status]?.bg} ${statusColors[item.status]?.text}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.awbNo ? (
                        <div>
                          <p className="text-xs font-medium">{item.awbNo}</p>
                          <p className="text-xs text-gray-400">{item.transporterName}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.expectedDate}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1 text-gray-400 hover:text-blue-600" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">Showing 1-5 of 245 records</div>
          <div className="flex items-center gap-2">
            <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
            <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">2</span>
            <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">3</span>
            <button className="p-1 border rounded hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
