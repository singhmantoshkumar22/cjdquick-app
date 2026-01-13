"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Package,
  Clock,
  CheckCircle,
  Truck,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface ReturnItem {
  id: string;
  returnNo: string;
  orderNo: string;
  channel: string;
  customerName: string;
  customerPhone: string;
  returnType: "CUSTOMER_RETURN" | "RTO" | "EXCHANGE" | "REFUND";
  status: "INITIATED" | "IN_TRANSIT" | "RECEIVED" | "QC_PENDING" | "QC_PASSED" | "QC_FAILED" | "RESTOCKED" | "DISPOSED";
  reason: string;
  totalItems: number;
  totalValue: number;
  awbNo: string;
  courierPartner: string;
  locationCode: string;
  createdDate: string;
  receivedDate: string;
}

const demoReturns: ReturnItem[] = [
  { id: "1", returnNo: "RTN-2024-001234", orderNo: "ORD-2024-005678", channel: "Amazon", customerName: "Rahul Sharma", customerPhone: "9876543210", returnType: "CUSTOMER_RETURN", status: "QC_PENDING", reason: "Defective Product", totalItems: 2, totalValue: 4500, awbNo: "AWB123456789", courierPartner: "Delhivery", locationCode: "WH-DELHI", createdDate: "2024-01-08 10:30", receivedDate: "2024-01-08 14:00" },
  { id: "2", returnNo: "RTN-2024-001235", orderNo: "ORD-2024-005679", channel: "Flipkart", customerName: "Priya Patel", customerPhone: "9876543211", returnType: "RTO", status: "IN_TRANSIT", reason: "Customer Refused", totalItems: 1, totalValue: 8200, awbNo: "AWB123456790", courierPartner: "BlueDart", locationCode: "WH-MUMBAI", createdDate: "2024-01-08 09:15", receivedDate: "" },
  { id: "3", returnNo: "RTN-2024-001236", orderNo: "ORD-2024-005680", channel: "Shopify", customerName: "Amit Kumar", customerPhone: "9876543212", returnType: "EXCHANGE", status: "RESTOCKED", reason: "Size Issue", totalItems: 1, totalValue: 2500, awbNo: "AWB123456791", courierPartner: "Ekart", locationCode: "WH-BANGALORE", createdDate: "2024-01-07 16:45", receivedDate: "2024-01-08 10:00" },
  { id: "4", returnNo: "RTN-2024-001237", orderNo: "ORD-2024-005681", channel: "Amazon", customerName: "Sneha Gupta", customerPhone: "9876543213", returnType: "REFUND", status: "QC_PASSED", reason: "Wrong Item Delivered", totalItems: 3, totalValue: 12500, awbNo: "AWB123456792", courierPartner: "DTDC", locationCode: "WH-CHENNAI", createdDate: "2024-01-07 14:20", receivedDate: "2024-01-08 09:30" },
  { id: "5", returnNo: "RTN-2024-001238", orderNo: "ORD-2024-005682", channel: "Manual", customerName: "Vikram Singh", customerPhone: "9876543214", returnType: "CUSTOMER_RETURN", status: "QC_FAILED", reason: "Damaged in Transit", totalItems: 1, totalValue: 6800, awbNo: "AWB123456793", courierPartner: "Delhivery", locationCode: "WH-DELHI", createdDate: "2024-01-06 11:00", receivedDate: "2024-01-07 15:00" },
];

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  INITIATED: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
  IN_TRANSIT: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Truck },
  RECEIVED: { bg: "bg-purple-100", text: "text-purple-700", icon: Package },
  QC_PENDING: { bg: "bg-orange-100", text: "text-orange-700", icon: Clock },
  QC_PASSED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  QC_FAILED: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle },
  RESTOCKED: { bg: "bg-cyan-100", text: "text-cyan-700", icon: Package },
  DISPOSED: { bg: "bg-gray-100", text: "text-gray-700", icon: Package },
};

const typeColors: Record<string, string> = {
  CUSTOMER_RETURN: "bg-blue-100 text-blue-700",
  RTO: "bg-orange-100 text-orange-700",
  EXCHANGE: "bg-purple-100 text-purple-700",
  REFUND: "bg-green-100 text-green-700",
};

export default function ReturnEnquiryPage() {
  const [data, setData] = useState<ReturnItem[]>(demoReturns);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    returnNo: "",
    orderNo: "",
    awbNo: "",
    customerName: "",
    customerPhone: "",
    channel: "",
    returnType: "",
    status: "",
    locationCode: "",
    fromDate: "",
    toDate: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const statusTabs = [
    { id: "all", label: "All", count: 1245 },
    { id: "initiated", label: "Initiated", count: 45 },
    { id: "in_transit", label: "In Transit", count: 128 },
    { id: "received", label: "Received", count: 89 },
    { id: "qc_pending", label: "QC Pending", count: 156 },
    { id: "restocked", label: "Restocked", count: 712 },
    { id: "disposed", label: "Disposed", count: 115 },
  ];

  const summaryStats = [
    { label: "Total Returns", value: "1,245", icon: RotateCcw, color: "bg-blue-500" },
    { label: "In Transit", value: "128", icon: Truck, color: "bg-yellow-500" },
    { label: "QC Pending", value: "156", icon: Clock, color: "bg-orange-500" },
    { label: "Restocked", value: "712", icon: CheckCircle, color: "bg-green-500" },
  ];

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleReset = () => {
    setFilters({
      returnNo: "",
      orderNo: "",
      awbNo: "",
      customerName: "",
      customerPhone: "",
      channel: "",
      returnType: "",
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
          <h1 className="text-xl font-bold text-gray-900">Return Enquiry</h1>
          <p className="text-sm text-gray-500">Search and view customer returns and RTO</p>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Return No</label>
            <input
              type="text"
              value={filters.returnNo}
              onChange={(e) => setFilters({ ...filters, returnNo: e.target.value })}
              placeholder="Enter Return No"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Order No</label>
            <input
              type="text"
              value={filters.orderNo}
              onChange={(e) => setFilters({ ...filters, orderNo: e.target.value })}
              placeholder="Enter Order No"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Return Type</label>
            <select
              value={filters.returnType}
              onChange={(e) => setFilters({ ...filters, returnType: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="CUSTOMER_RETURN">Customer Return</option>
              <option value="RTO">RTO</option>
              <option value="EXCHANGE">Exchange</option>
              <option value="REFUND">Refund</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Channels</option>
              <option value="Amazon">Amazon</option>
              <option value="Flipkart">Flipkart</option>
              <option value="Shopify">Shopify</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
              <input
                type="text"
                value={filters.customerName}
                onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                placeholder="Enter Customer Name"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer Phone</label>
              <input
                type="text"
                value={filters.customerPhone}
                onChange={(e) => setFilters({ ...filters, customerPhone: e.target.value })}
                placeholder="Enter Phone"
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Return No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Channel</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Value</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">AWB</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{item.returnNo}</td>
                    <td className="px-4 py-3">{item.orderNo}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{item.customerName}</p>
                        <p className="text-xs text-gray-500">{item.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">{item.channel}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${typeColors[item.returnType]}`}>
                        {item.returnType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{item.reason}</td>
                    <td className="px-4 py-3 text-center">{item.totalItems}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{item.totalValue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${statusColors[item.status]?.bg} ${statusColors[item.status]?.text}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium">{item.awbNo}</p>
                        <p className="text-xs text-gray-400">{item.courierPartner}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1 text-gray-400 hover:text-blue-600">
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
          <div className="text-sm text-gray-500">Showing 1-5 of 1,245 records</div>
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
