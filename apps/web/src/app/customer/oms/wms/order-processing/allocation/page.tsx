"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CheckCircle,
  XCircle,
  Filter,
  Check,
  X,
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  extOrderNumber: string;
  status: string;
  orderDate: string;
  siteLocation: string;
  customerName: string;
  customerEmail: string;
  skuCount: number;
  totalQty: number;
  allocatedQty: number;
  onHold: boolean;
  channel: string;
}

const demoOrders: Order[] = [
  { id: "1", orderNumber: "ORD-2024-001234", extOrderNumber: "EXT-5678", status: "ALLOCATED", orderDate: "2024-01-08", siteLocation: "Warehouse A", customerName: "Rahul Kumar", customerEmail: "rahul@email.com", skuCount: 3, totalQty: 5, allocatedQty: 5, onHold: false, channel: "Website" },
  { id: "2", orderNumber: "ORD-2024-001235", extOrderNumber: "EXT-5679", status: "UNALLOCATED", orderDate: "2024-01-08", siteLocation: "Warehouse A", customerName: "Priya Sharma", customerEmail: "priya@email.com", skuCount: 2, totalQty: 3, allocatedQty: 0, onHold: false, channel: "Amazon" },
  { id: "3", orderNumber: "ORD-2024-001236", extOrderNumber: "EXT-5680", status: "PART_ALLOCATED", orderDate: "2024-01-08", siteLocation: "Warehouse B", customerName: "Amit Patel", customerEmail: "amit@email.com", skuCount: 5, totalQty: 10, allocatedQty: 6, onHold: false, channel: "Flipkart" },
  { id: "4", orderNumber: "ORD-2024-001237", extOrderNumber: "EXT-5681", status: "CONFIRMED", orderDate: "2024-01-07", siteLocation: "Warehouse A", customerName: "Sneha Gupta", customerEmail: "sneha@email.com", skuCount: 1, totalQty: 2, allocatedQty: 0, onHold: true, channel: "Website" },
  { id: "5", orderNumber: "ORD-2024-001238", extOrderNumber: "EXT-5682", status: "ALLOCATED", orderDate: "2024-01-07", siteLocation: "Warehouse A", customerName: "Mohan Lal", customerEmail: "mohan@email.com", skuCount: 4, totalQty: 8, allocatedQty: 8, onHold: false, channel: "Myntra" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  ALLOCATED: { bg: "bg-green-100", text: "text-green-700" },
  UNALLOCATED: { bg: "bg-red-100", text: "text-red-700" },
  PART_ALLOCATED: { bg: "bg-orange-100", text: "text-orange-700" },
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-700" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-700" },
};

export default function OrderAllocationPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/oms/wms/order-allocation");
      const result = await response.json();
      if (result.success && result.data?.orders) {
        setOrders(result.data.orders);
      } else {
        setOrders(demoOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders(demoOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (selectedOrders.length === 0) return;
    try {
      await fetch("/api/oms/wms/order-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "allocate", orderIds: selectedOrders }),
      });
      fetchOrders();
      setSelectedOrders([]);
    } catch (error) {
      console.error("Error allocating orders:", error);
    }
  };

  const handleUnallocate = async () => {
    if (selectedOrders.length === 0) return;
    try {
      await fetch("/api/oms/wms/order-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unallocate", orderIds: selectedOrders }),
      });
      fetchOrders();
      setSelectedOrders([]);
    } catch (error) {
      console.error("Error unallocating orders:", error);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.extOrderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order Allocation</h1>
          <p className="text-sm text-gray-500">Allocate and unallocate orders for warehouse fulfillment</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAllocate}
            disabled={selectedOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Allocate ({selectedOrders.length})
          </button>
          <button
            onClick={handleUnallocate}
            disabled={selectedOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Unallocate
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            Import
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order Number</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="UNALLOCATED">Unallocated</option>
              <option value="PART_ALLOCATED">Part Allocated</option>
              <option value="CONFIRMED">Confirmed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Site Location</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none">
              <option>All Locations</option>
              <option>Warehouse A</option>
              <option>Warehouse B</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchOrders()}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <Filter className="w-3 h-3" />
          {showAdvanced ? "Hide" : "Show"} Advanced Search
        </button>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">External Order No</label>
              <input type="text" className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="External order..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer Email</label>
              <input type="email" className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Email..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SKU Code</label>
              <input type="text" className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="SKU..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Channel</label>
              <select className="w-full px-3 py-2 text-sm border rounded-lg">
                <option>All Channels</option>
                <option>Website</option>
                <option>Amazon</option>
                <option>Flipkart</option>
                <option>Myntra</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={toggleAllSelection}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Order Number</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Ext Order No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Channel</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">SKUs</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">On Hold</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Order Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-blue-600">{order.orderNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.extOrderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{order.channel}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{order.skuCount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">{order.allocatedQty}</span>
                        <span className="text-gray-400"> / {order.totalQty}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${statusColors[order.status]?.bg} ${statusColors[order.status]?.text}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.onHold ? (
                          <CheckCircle className="w-4 h-4 text-red-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{order.orderDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                {selectedOrders.length > 0 && <span className="font-medium">{selectedOrders.length} selected | </span>}
                Showing 1-{filteredOrders.length} of {filteredOrders.length} orders
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 border rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
                <button className="p-1 border rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
