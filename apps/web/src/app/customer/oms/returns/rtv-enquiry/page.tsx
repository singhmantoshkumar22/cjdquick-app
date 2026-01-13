"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
} from "lucide-react";

interface RTVItem {
  id: string;
  rtvNo: string;
  vendorCode: string;
  vendorName: string;
  rtvType: "DEFECTIVE" | "EXCESS" | "EXPIRY" | "DAMAGED" | "OTHER";
  status: "DRAFT" | "PENDING" | "APPROVED" | "DISPATCHED" | "RECEIVED" | "CLOSED" | "CANCELLED";
  totalItems: number;
  totalQty: number;
  totalValue: number;
  locationCode: string;
  createdDate: string;
  dispatchDate: string;
  createdBy: string;
}

const demoRTVData: RTVItem[] = [
  { id: "1", rtvNo: "RTV-2024-001234", vendorCode: "VND-001", vendorName: "ABC Electronics Pvt Ltd", rtvType: "DEFECTIVE", status: "PENDING", totalItems: 5, totalQty: 25, totalValue: 45000, locationCode: "WH-DELHI", createdDate: "2024-01-08 10:30", dispatchDate: "", createdBy: "Rahul Kumar" },
  { id: "2", rtvNo: "RTV-2024-001235", vendorCode: "VND-002", vendorName: "XYZ Traders", rtvType: "EXCESS", status: "APPROVED", totalItems: 3, totalQty: 100, totalValue: 25000, locationCode: "WH-MUMBAI", createdDate: "2024-01-08 09:15", dispatchDate: "", createdBy: "Priya Sharma" },
  { id: "3", rtvNo: "RTV-2024-001236", vendorCode: "VND-003", vendorName: "Metro Distributors", rtvType: "EXPIRY", status: "DISPATCHED", totalItems: 8, totalQty: 200, totalValue: 78000, locationCode: "WH-DELHI", createdDate: "2024-01-07 14:20", dispatchDate: "2024-01-08 11:00", createdBy: "Amit Patel" },
  { id: "4", rtvNo: "RTV-2024-001237", vendorCode: "VND-001", vendorName: "ABC Electronics Pvt Ltd", rtvType: "DAMAGED", status: "RECEIVED", totalItems: 2, totalQty: 10, totalValue: 15000, locationCode: "WH-BANGALORE", createdDate: "2024-01-06 11:45", dispatchDate: "2024-01-07 09:30", createdBy: "Sneha Gupta" },
  { id: "5", rtvNo: "RTV-2024-001238", vendorCode: "VND-004", vendorName: "National Suppliers", rtvType: "OTHER", status: "CLOSED", totalItems: 4, totalQty: 50, totalValue: 32000, locationCode: "WH-CHENNAI", createdDate: "2024-01-05 16:30", dispatchDate: "2024-01-06 10:00", createdBy: "Vikram Singh" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  APPROVED: { bg: "bg-blue-100", text: "text-blue-700" },
  DISPATCHED: { bg: "bg-purple-100", text: "text-purple-700" },
  RECEIVED: { bg: "bg-green-100", text: "text-green-700" },
  CLOSED: { bg: "bg-cyan-100", text: "text-cyan-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

const typeColors: Record<string, string> = {
  DEFECTIVE: "bg-red-100 text-red-700",
  EXCESS: "bg-blue-100 text-blue-700",
  EXPIRY: "bg-orange-100 text-orange-700",
  DAMAGED: "bg-yellow-100 text-yellow-700",
  OTHER: "bg-gray-100 text-gray-700",
};

export default function RTVEnquiryPage() {
  const [data, setData] = useState<RTVItem[]>(demoRTVData);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    rtvNo: "",
    vendorCode: "",
    vendorName: "",
    rtvType: "",
    status: "",
    locationCode: "",
    fromDate: "",
    toDate: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const summaryStats = [
    { label: "Total RTVs", value: "156", icon: Building2, color: "bg-blue-500" },
    { label: "Pending Approval", value: "23", icon: Clock, color: "bg-yellow-500" },
    { label: "Dispatched", value: "45", icon: Truck, color: "bg-purple-500" },
    { label: "Closed", value: "88", icon: CheckCircle, color: "bg-green-500" },
  ];

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleReset = () => {
    setFilters({
      rtvNo: "",
      vendorCode: "",
      vendorName: "",
      rtvType: "",
      status: "",
      locationCode: "",
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
          <h1 className="text-xl font-bold text-gray-900">RTV Enquiry</h1>
          <p className="text-sm text-gray-500">Search and view Return to Vendor records</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">RTV No</label>
            <input
              type="text"
              value={filters.rtvNo}
              onChange={(e) => setFilters({ ...filters, rtvNo: e.target.value })}
              placeholder="Enter RTV No"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Code</label>
            <input
              type="text"
              value={filters.vendorCode}
              onChange={(e) => setFilters({ ...filters, vendorCode: e.target.value })}
              placeholder="Enter Vendor Code"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">RTV Type</label>
            <select
              value={filters.rtvType}
              onChange={(e) => setFilters({ ...filters, rtvType: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="DEFECTIVE">Defective</option>
              <option value="EXCESS">Excess</option>
              <option value="EXPIRY">Expiry</option>
              <option value="DAMAGED">Damaged</option>
              <option value="OTHER">Other</option>
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="RECEIVED">Received</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Name</label>
              <input
                type="text"
                value={filters.vendorName}
                onChange={(e) => setFilters({ ...filters, vendorName: e.target.value })}
                placeholder="Enter Vendor Name"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <select
                value={filters.locationCode}
                onChange={(e) => setFilters({ ...filters, locationCode: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Locations</option>
                <option value="WH-DELHI">WH-DELHI</option>
                <option value="WH-MUMBAI">WH-MUMBAI</option>
                <option value="WH-BANGALORE">WH-BANGALORE</option>
                <option value="WH-CHENNAI">WH-CHENNAI</option>
              </select>
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
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">RTV No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vendor</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Value</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
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
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No RTV records found
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{item.rtvNo}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.vendorCode}</p>
                        <p className="text-xs text-gray-500">{item.vendorName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${typeColors[item.rtvType]}`}>
                        {item.rtvType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{item.totalItems}</td>
                    <td className="px-4 py-3 text-center font-medium">{item.totalQty}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{item.totalValue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-xs">{item.locationCode}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${statusColors[item.status]?.bg} ${statusColors[item.status]?.text}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <div>{item.createdDate}</div>
                      <div className="text-gray-400">{item.createdBy}</div>
                    </td>
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
          <div className="text-sm text-gray-500">Showing 1-5 of 156 records</div>
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
