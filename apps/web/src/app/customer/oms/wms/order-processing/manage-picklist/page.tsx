"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Unlock,
  Plus,
} from "lucide-react";

interface Picklist {
  id: string;
  picklistNumber: string;
  createdDate: string;
  status: string;
  generatedBy: string;
  assignedUser: string;
  finishTime: string | null;
  picklistQty: number;
  processQty: number;
  locationCode: string;
  printDate: string | null;
}

const demoPicklists: Picklist[] = [
  { id: "1", picklistNumber: "PCK-2024-001234", createdDate: "2024-01-08", status: "COMPLETE", generatedBy: "Rahul Kumar", assignedUser: "Picker 1", finishTime: "2024-01-08 11:30", picklistQty: 25, processQty: 25, locationCode: "WH-A", printDate: "2024-01-08 09:30" },
  { id: "2", picklistNumber: "PCK-2024-001235", createdDate: "2024-01-08", status: "PROCESSING", generatedBy: "Priya Sharma", assignedUser: "Picker 2", finishTime: null, picklistQty: 18, processQty: 10, locationCode: "WH-A", printDate: "2024-01-08 10:15" },
  { id: "3", picklistNumber: "PCK-2024-001236", createdDate: "2024-01-08", status: "PENDING", generatedBy: "Amit Patel", assignedUser: "-", finishTime: null, picklistQty: 30, processQty: 0, locationCode: "WH-B", printDate: null },
  { id: "4", picklistNumber: "PCK-2024-001237", createdDate: "2024-01-07", status: "CANCELLED", generatedBy: "Sneha Gupta", assignedUser: "-", finishTime: null, picklistQty: 12, processQty: 0, locationCode: "WH-A", printDate: null },
];

const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  COMPLETE: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  PROCESSING: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

export default function ManagePicklistPage() {
  const [activeTab, setActiveTab] = useState<"enquiry" | "generate">("enquiry");
  const [picklists, setPicklists] = useState<Picklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Generate Picklist Form State
  const [generateMethod, setGenerateMethod] = useState<"order_list" | "zones_bins">("order_list");
  const [orderDate, setOrderDate] = useState("");
  const [channel, setChannel] = useState("");
  const [orderStatus, setOrderStatus] = useState("ALLOCATED");
  const [picklistFor, setPicklistFor] = useState("SO");

  useEffect(() => {
    fetchPicklists();
  }, []);

  const fetchPicklists = async () => {
    try {
      const response = await fetch("/api/oms/wms/picklist");
      const result = await response.json();
      if (result.success && result.data?.picklists) {
        setPicklists(result.data.picklists);
      } else {
        setPicklists(demoPicklists);
      }
    } catch (error) {
      console.error("Error fetching picklists:", error);
      setPicklists(demoPicklists);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePicklist = async () => {
    try {
      await fetch("/api/oms/wms/picklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: generateMethod, orderDate, channel, orderStatus, picklistFor }),
      });
      setActiveTab("enquiry");
      fetchPicklists();
    } catch (error) {
      console.error("Error generating picklist:", error);
    }
  };

  const filteredPicklists = picklists.filter((picklist) => {
    const matchesSearch = picklist.picklistNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || picklist.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage Picklist</h1>
          <p className="text-sm text-gray-500">Generate and manage picklists for order fulfillment</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("enquiry")}
          className={`px-4 py-2 text-sm rounded-lg ${
            activeTab === "enquiry" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          Enquiry Picklist
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
            activeTab === "generate" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Plus className="w-4 h-4" />
          Generate Picklist
        </button>
      </div>

      {activeTab === "enquiry" ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Picklist Number</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Created Date</label>
                <input type="date" className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Assigned User</label>
                <select className="w-full px-3 py-2 text-sm border rounded-lg">
                  <option>All Users</option>
                  <option>Picker 1</option>
                  <option>Picker 2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Location</label>
                <select className="w-full px-3 py-2 text-sm border rounded-lg">
                  <option>All Locations</option>
                  <option>WH-A</option>
                  <option>WH-B</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search
                </button>
                <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Reset</button>
              </div>
            </div>
          </div>

          {/* Picklists Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading picklists...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Picklist Number</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Created Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Generated By</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Assigned User</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Processed</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredPicklists.map((picklist) => {
                        const StatusIcon = statusColors[picklist.status]?.icon || Clock;
                        return (
                          <tr key={picklist.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-blue-600">{picklist.picklistNumber}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">{picklist.createdDate}</td>
                            <td className="px-4 py-3 text-gray-600">{picklist.generatedBy}</td>
                            <td className="px-4 py-3 text-gray-600">{picklist.assignedUser}</td>
                            <td className="px-4 py-3 text-center font-medium">{picklist.picklistQty}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-medium">{picklist.processQty}</span>
                              <span className="text-gray-400"> / {picklist.picklistQty}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${statusColors[picklist.status]?.bg} ${statusColors[picklist.status]?.text}`}>
                                <StatusIcon className="w-3 h-3" />
                                {picklist.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button className="p-1 text-gray-400 hover:text-blue-600" title="Print">
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-green-600" title="Export">
                                  <Download className="w-4 h-4" />
                                </button>
                                {picklist.status === "PROCESSING" && (
                                  <button className="p-1 text-gray-400 hover:text-orange-600" title="Unlock">
                                    <Unlock className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <div className="text-sm text-gray-500">Showing 1-{filteredPicklists.length} of {filteredPicklists.length} picklists</div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 border rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
                    <button className="p-1 border rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* Generate Picklist Form */
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Generate Method</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  value="order_list"
                  checked={generateMethod === "order_list"}
                  onChange={(e) => setGenerateMethod(e.target.value as "order_list" | "zones_bins")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">By Show Order List</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  value="zones_bins"
                  checked={generateMethod === "zones_bins"}
                  onChange={(e) => setGenerateMethod(e.target.value as "order_list" | "zones_bins")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">By Zones/Bins</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              >
                <option value="">All Channels</option>
                <option value="Website">Website</option>
                <option value="Amazon">Amazon</option>
                <option value="Flipkart">Flipkart</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              >
                <option value="ALLOCATED">Allocated</option>
                <option value="PART_ALLOCATED">Part Allocated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Picklist For *</label>
              <select
                value={picklistFor}
                onChange={(e) => setPicklistFor(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              >
                <option value="SO">SO (Sales Order)</option>
                <option value="STO">STO (Stock Transfer Order)</option>
                <option value="RTV">RTV (Return to Vendor)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
              <select className="w-full px-3 py-2 text-sm border rounded-lg">
                <option value="">All Types</option>
                <option value="COD">COD</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={() => setActiveTab("enquiry")}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePicklist}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate Picklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
