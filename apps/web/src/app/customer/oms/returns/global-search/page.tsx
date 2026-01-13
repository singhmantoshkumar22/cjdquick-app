"use client";

import { useState } from "react";
import {
  Search,
  Globe,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Package,
  Truck,
  RefreshCw,
  Filter,
} from "lucide-react";

interface SearchResult {
  id: string;
  referenceNo: string;
  referenceType: "RETURN" | "RTO" | "RTV" | "STO";
  orderNo: string;
  channel: string;
  partyName: string;
  status: string;
  totalItems: number;
  totalValue: number;
  awbNo: string;
  locationCode: string;
  createdDate: string;
}

const demoResults: SearchResult[] = [
  { id: "1", referenceNo: "RTN-2024-001234", referenceType: "RETURN", orderNo: "ORD-2024-005678", channel: "Amazon", partyName: "Rahul Sharma", status: "QC_PENDING", totalItems: 2, totalValue: 4500, awbNo: "AWB123456789", locationCode: "WH-DELHI", createdDate: "2024-01-08" },
  { id: "2", referenceNo: "RTO-2024-000456", referenceType: "RTO", orderNo: "ORD-2024-005679", channel: "Flipkart", partyName: "Priya Patel", status: "IN_TRANSIT", totalItems: 1, totalValue: 8200, awbNo: "AWB123456790", locationCode: "WH-MUMBAI", createdDate: "2024-01-08" },
  { id: "3", referenceNo: "RTV-2024-001235", referenceType: "RTV", orderNo: "", channel: "", partyName: "ABC Electronics", status: "APPROVED", totalItems: 5, totalValue: 25000, awbNo: "", locationCode: "WH-BANGALORE", createdDate: "2024-01-07" },
  { id: "4", referenceNo: "STO-2024-000789", referenceType: "STO", orderNo: "", channel: "", partyName: "WH-CHENNAI", status: "DISPATCHED", totalItems: 10, totalValue: 45000, awbNo: "AWB123456793", locationCode: "WH-DELHI", createdDate: "2024-01-07" },
  { id: "5", referenceNo: "RTN-2024-001236", referenceType: "RETURN", orderNo: "ORD-2024-005680", channel: "Shopify", partyName: "Amit Kumar", status: "RESTOCKED", totalItems: 1, totalValue: 2500, awbNo: "AWB123456791", locationCode: "WH-BANGALORE", createdDate: "2024-01-06" },
];

const typeColors: Record<string, string> = {
  RETURN: "bg-blue-100 text-blue-700",
  RTO: "bg-orange-100 text-orange-700",
  RTV: "bg-purple-100 text-purple-700",
  STO: "bg-green-100 text-green-700",
};

export default function GlobalReturnSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [results, setResults] = useState<SearchResult[]>(demoResults);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    referenceType: "",
    status: "",
    locationCode: "",
    fromDate: "",
    toDate: "",
  });

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Global Return Search
          </h1>
          <p className="text-sm text-gray-500">Search across all return types - Returns, RTO, RTV, and STO</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export Results
        </button>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search Query</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Return No, Order No, AWB No, Customer Name, Vendor Code..."
                className="w-full pl-10 pr-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search In</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full px-3 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Fields</option>
              <option value="reference">Reference No</option>
              <option value="order">Order No</option>
              <option value="awb">AWB No</option>
              <option value="party">Party Name</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-6 py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              value={filters.referenceType}
              onChange={(e) => setFilters({ ...filters, referenceType: e.target.value })}
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="RETURN">Customer Return</option>
              <option value="RTO">RTO</option>
              <option value="RTV">Vendor Return</option>
              <option value="STO">Stock Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="INITIATED">Initiated</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="RECEIVED">Received</option>
              <option value="QC_PENDING">QC Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="RESTOCKED">Restocked</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <select
              value={filters.locationCode}
              onChange={(e) => setFilters({ ...filters, locationCode: e.target.value })}
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
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
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <span className="text-sm text-gray-600">
            Found <strong>{results.length}</strong> results
          </span>
          <div className="flex gap-2">
            {["RETURN", "RTO", "RTV", "STO"].map((type) => (
              <span key={type} className={`px-2 py-0.5 text-xs rounded ${typeColors[type]}`}>
                {type}: {results.filter((r) => r.referenceType === type).length}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reference No</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Channel</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Party</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Value</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">AWB</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Searching...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    No results found. Try adjusting your search criteria.
                  </td>
                </tr>
              ) : (
                results.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{item.referenceNo}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${typeColors[item.referenceType]}`}>
                        {item.referenceType}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.orderNo || "-"}</td>
                    <td className="px-4 py-3">{item.channel || "-"}</td>
                    <td className="px-4 py-3">{item.partyName}</td>
                    <td className="px-4 py-3 text-center">{item.totalItems}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{item.totalValue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{item.awbNo || "-"}</td>
                    <td className="px-4 py-3 text-center text-xs">{item.locationCode}</td>
                    <td className="px-4 py-3 text-gray-500">{item.createdDate}</td>
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
          <div className="text-sm text-gray-500">Showing 1-5 of 5 results</div>
          <div className="flex items-center gap-2">
            <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
            <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
