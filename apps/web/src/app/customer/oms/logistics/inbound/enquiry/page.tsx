"use client";

import { useState } from "react";
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, PackageSearch, Clock, CheckCircle, AlertCircle } from "lucide-react";

const demoEnquiries = [
  { id: "1", enquiryNo: "ENQ-2024-001234", asnNo: "ASN-2024-005678", vendor: "Tech Supplies", expectedDate: "2024-01-08", items: 150, status: "EXPECTED" },
  { id: "2", enquiryNo: "ENQ-2024-001235", asnNo: "ASN-2024-005679", vendor: "Electronics Hub", expectedDate: "2024-01-09", items: 200, status: "IN_TRANSIT" },
  { id: "3", enquiryNo: "ENQ-2024-001236", asnNo: "ASN-2024-005680", vendor: "Office Mart", expectedDate: "2024-01-07", items: 75, status: "RECEIVED" },
  { id: "4", enquiryNo: "ENQ-2024-001237", asnNo: "ASN-2024-005681", vendor: "Fashion World", expectedDate: "2024-01-06", items: 300, status: "DELAYED" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  EXPECTED: { bg: "bg-blue-100", text: "text-blue-700" },
  IN_TRANSIT: { bg: "bg-orange-100", text: "text-orange-700" },
  RECEIVED: { bg: "bg-green-100", text: "text-green-700" },
  DELAYED: { bg: "bg-red-100", text: "text-red-700" },
};

export default function InboundEnquiryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Enquiries", value: "156", color: "bg-blue-500", icon: PackageSearch },
          { label: "Expected Today", value: "12", color: "bg-yellow-500", icon: Clock },
          { label: "Received", value: "89", color: "bg-green-500", icon: CheckCircle },
          { label: "Delayed", value: "8", color: "bg-red-500", icon: AlertCircle },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.color} rounded-lg p-4 text-white relative overflow-hidden`}>
              <p className="text-xs font-medium opacity-90">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <div className="absolute right-2 bottom-2 opacity-30"><Icon className="w-10 h-10" /></div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Inbound Enquiry</h1>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />Export
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by Enquiry No, ASN No, Vendor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><Filter className="w-4 h-4" />Filters</button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Enquiry No</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ASN No</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Vendor</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Expected Date</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {demoEnquiries.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-600">{item.enquiryNo}</td>
                <td className="px-4 py-3 text-gray-600">{item.asnNo}</td>
                <td className="px-4 py-3">{item.vendor}</td>
                <td className="px-4 py-3 text-center">{item.expectedDate}</td>
                <td className="px-4 py-3 text-center font-medium">{item.items}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 text-xs rounded ${statusColors[item.status]?.bg} ${statusColors[item.status]?.text}`}>{item.status}</span>
                </td>
                <td className="px-4 py-3 text-center"><button className="p-1 text-gray-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">Showing 1-4 of 156 enquiries</div>
          <div className="flex items-center gap-2">
            <button className="p-1 border rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
            <button className="p-1 border rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
