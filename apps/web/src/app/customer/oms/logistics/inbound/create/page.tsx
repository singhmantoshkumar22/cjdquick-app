"use client";

import { useState } from "react";
import { Search, Filter, Plus, Eye, Edit, ChevronLeft, ChevronRight, ClipboardCheck, Package, Clock, CheckCircle } from "lucide-react";

const demoInbounds = [
  { id: "1", inboundNo: "INB-2024-001234", poNo: "PO-2024-005678", vendor: "Tech Supplies", warehouse: "Warehouse A", items: 150, received: 150, status: "COMPLETED", createdAt: "2024-01-08 09:30" },
  { id: "2", inboundNo: "INB-2024-001235", poNo: "PO-2024-005679", vendor: "Electronics Hub", warehouse: "Warehouse A", items: 200, received: 120, status: "IN_PROGRESS", createdAt: "2024-01-08 10:15" },
  { id: "3", inboundNo: "INB-2024-001236", poNo: "PO-2024-005680", vendor: "Office Mart", warehouse: "Warehouse B", items: 75, received: 0, status: "PENDING", createdAt: "2024-01-08 11:00" },
  { id: "4", inboundNo: "INB-2024-001237", poNo: "PO-2024-005681", vendor: "Fashion World", warehouse: "Warehouse A", items: 300, received: 150, status: "PARTIAL", createdAt: "2024-01-07 16:30" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  PARTIAL: { bg: "bg-orange-100", text: "text-orange-700" },
};

export default function InboundCreatePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Inbounds", value: "245", color: "bg-blue-500", icon: ClipboardCheck },
          { label: "Pending", value: "32", color: "bg-yellow-500", icon: Clock },
          { label: "In Progress", value: "18", color: "bg-orange-500", icon: Package },
          { label: "Completed", value: "195", color: "bg-green-500", icon: CheckCircle },
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
        <h1 className="text-xl font-bold text-gray-900">Inbound Create / Edit</h1>
        <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />Create Inbound
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by Inbound No, PO No, Vendor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><Filter className="w-4 h-4" />Filters</button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Inbound No</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">PO No</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Vendor</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Warehouse</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Received</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {demoInbounds.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-600">{item.inboundNo}</td>
                <td className="px-4 py-3 text-gray-600">{item.poNo}</td>
                <td className="px-4 py-3">{item.vendor}</td>
                <td className="px-4 py-3 text-gray-600">{item.warehouse}</td>
                <td className="px-4 py-3 text-center">{item.items}</td>
                <td className="px-4 py-3 text-center"><span className="font-medium">{item.received}</span><span className="text-gray-400"> / {item.items}</span></td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 text-xs rounded ${statusColors[item.status]?.bg} ${statusColors[item.status]?.text}`}>{item.status.replace(/_/g, " ")}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1 text-gray-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button>
                    <button className="p-1 text-gray-400 hover:text-green-600"><Edit className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">Showing 1-4 of 245 inbounds</div>
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
