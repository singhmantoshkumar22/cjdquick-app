"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Play,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
} from "lucide-react";

interface FulfillmentOrder {
  id: string;
  orderNo: string;
  channel: string;
  customerName: string;
  items: number;
  qty: number;
  status: "PENDING" | "ALLOCATED" | "PICKING" | "PICKED" | "PACKING" | "PACKED" | "SHIPPED" | "ON_HOLD";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  slaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED";
  orderDate: string;
  promisedDate: string;
  locationCode: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  ALLOCATED: { bg: "bg-blue-100", text: "text-blue-700" },
  PICKING: { bg: "bg-purple-100", text: "text-purple-700" },
  PICKED: { bg: "bg-indigo-100", text: "text-indigo-700" },
  PACKING: { bg: "bg-cyan-100", text: "text-cyan-700" },
  PACKED: { bg: "bg-green-100", text: "text-green-700" },
  SHIPPED: { bg: "bg-gray-100", text: "text-gray-700" },
  ON_HOLD: { bg: "bg-red-100", text: "text-red-700" },
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  NORMAL: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

const slaColors: Record<string, { bg: string; text: string; icon: any }> = {
  ON_TRACK: { bg: "bg-green-100", text: "text-green-600", icon: CheckCircle },
  AT_RISK: { bg: "bg-yellow-100", text: "text-yellow-600", icon: Clock },
  BREACHED: { bg: "bg-red-100", text: "text-red-600", icon: AlertTriangle },
};

const statusTabs = [
  { id: "all", label: "All Orders" },
  { id: "PENDING", label: "Pending" },
  { id: "PICKING", label: "Picking" },
  { id: "PACKING", label: "Packing" },
  { id: "PACKED", label: "Ready to Ship" },
  { id: "ON_HOLD", label: "On Hold" },
];

export default function FulfillmentOrdersPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<FulfillmentOrder | null>(null);
  const [filters, setFilters] = useState({
    orderNo: "",
    channel: "",
    status: "",
    priority: "",
    slaStatus: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [activeTab, pagination.page, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(activeTab !== "all" && { status: activeTab }),
        ...(filters.orderNo && { search: filters.orderNo }),
        ...(filters.channel && { channel: filters.channel }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.slaStatus && { slaStatus: filters.slaStatus }),
      });

      const response = await fetch(`/api/oms/fulfillment/orders?${params}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data.orders || []);
        setPagination((prev) => ({
          ...prev,
          total: result.data.total || 0,
        }));
        if (result.data.statusCounts) {
          setStatusCounts(result.data.statusCounts);
        }
      }
    } catch (error) {
      console.error("Error fetching fulfillment orders:", error);
      setOrders(getDemoOrders());
      setPagination((prev) => ({ ...prev, total: 524 }));
    } finally {
      setLoading(false);
    }
  };

  const getDemoOrders = (): FulfillmentOrder[] => [
    { id: "1", orderNo: "ORD-2024-005678", channel: "Amazon", customerName: "Rahul Sharma", items: 3, qty: 5, status: "PENDING", priority: "HIGH", slaStatus: "AT_RISK", orderDate: "2024-01-08 08:30", promisedDate: "2024-01-09", locationCode: "WH-DELHI" },
    { id: "2", orderNo: "ORD-2024-005679", channel: "Flipkart", customerName: "Priya Patel", items: 2, qty: 2, status: "PICKING", priority: "NORMAL", slaStatus: "ON_TRACK", orderDate: "2024-01-08 09:15", promisedDate: "2024-01-10", locationCode: "WH-MUMBAI" },
    { id: "3", orderNo: "ORD-2024-005680", channel: "Shopify", customerName: "Amit Kumar", items: 1, qty: 1, status: "PACKED", priority: "NORMAL", slaStatus: "ON_TRACK", orderDate: "2024-01-08 07:45", promisedDate: "2024-01-10", locationCode: "WH-DELHI" },
    { id: "4", orderNo: "ORD-2024-005681", channel: "Amazon", customerName: "Sneha Gupta", items: 5, qty: 8, status: "ON_HOLD", priority: "URGENT", slaStatus: "BREACHED", orderDate: "2024-01-07 14:20", promisedDate: "2024-01-08", locationCode: "WH-BANGALORE" },
    { id: "5", orderNo: "ORD-2024-005682", channel: "Manual", customerName: "Vikram Singh", items: 2, qty: 3, status: "ALLOCATED", priority: "LOW", slaStatus: "ON_TRACK", orderDate: "2024-01-08 10:00", promisedDate: "2024-01-11", locationCode: "WH-CHENNAI" },
  ];

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  const handleExport = () => {
    const csvContent = [
      ["Order No", "Channel", "Customer", "Items", "Qty", "Status", "Priority", "SLA", "Promised Date", "Location"].join(","),
      ...orders.map((order) =>
        [
          order.orderNo,
          order.channel,
          order.customerName,
          order.items,
          order.qty,
          order.status,
          order.priority,
          order.slaStatus,
          order.promisedDate,
          order.locationCode,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fulfillment-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleStartFulfillment = async (orderId: string) => {
    try {
      const response = await fetch("/api/oms/fulfillment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const result = await response.json();

      if (result.success) {
        fetchOrders();
        alert("Fulfillment started successfully!");
      }
    } catch (error) {
      console.error("Error starting fulfillment:", error);
      alert("Fulfillment started (demo mode)");
    }
  };

  const handleStartBatch = async () => {
    if (selectedOrders.length === 0) {
      alert("Please select orders to start batch fulfillment");
      return;
    }

    try {
      const response = await fetch("/api/oms/fulfillment/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });
      const result = await response.json();

      if (result.success) {
        setSelectedOrders([]);
        fetchOrders();
        alert(`Batch started for ${selectedOrders.length} orders!`);
      }
    } catch (error) {
      console.error("Error starting batch:", error);
      alert(`Batch started for ${selectedOrders.length} orders (demo mode)`);
      setSelectedOrders([]);
    }
  };

  const handleViewOrder = (order: FulfillmentOrder) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fulfillment Orders</h1>
          <p className="text-sm text-gray-500">Manage and process orders for fulfillment</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleStartBatch}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Play className="w-4 h-4" />
            Start Batch {selectedOrders.length > 0 && `(${selectedOrders.length})`}
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            {statusCounts[tab.id] !== undefined && (
              <span className="ml-1 text-xs opacity-75">({statusCounts[tab.id]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Order No</label>
            <input
              type="text"
              value={filters.orderNo}
              onChange={(e) => setFilters({ ...filters, orderNo: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search order..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
            >
              <option value="">All Channels</option>
              <option value="Amazon">Amazon</option>
              <option value="Flipkart">Flipkart</option>
              <option value="Shopify">Shopify</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
            >
              <option value="">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">SLA Status</label>
            <select
              value={filters.slaStatus}
              onChange={(e) => setFilters({ ...filters, slaStatus: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
            >
              <option value="">All</option>
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">At Risk</option>
              <option value="BREACHED">Breached</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Selected Orders Action Bar */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedOrders.length} order(s) selected
          </span>
          <button
            onClick={handleStartBatch}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Batch Fulfillment
          </button>
          <button
            onClick={() => setSelectedOrders([])}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrders.length === orders.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Channel</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items/Qty</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Priority</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">SLA</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Promise Date</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const SlaIcon = slaColors[order.slaStatus]?.icon || Clock;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-600">{order.orderNo}</td>
                      <td className="px-4 py-3">{order.channel}</td>
                      <td className="px-4 py-3">{order.customerName}</td>
                      <td className="px-4 py-3 text-center">{order.items}/{order.qty}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${priorityColors[order.priority]}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${statusColors[order.status]?.bg} ${statusColors[order.status]?.text}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${slaColors[order.slaStatus]?.bg} ${slaColors[order.slaStatus]?.text}`}>
                          <SlaIcon className="w-3 h-3" />
                          {order.slaStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{order.promisedDate}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status === "PENDING" && (
                            <button
                              onClick={() => handleStartFulfillment(order.id)}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Start Fulfillment"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                  className={`px-3 py-1 text-sm rounded ${
                    pagination.page === pageNum
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-gray-400">...</span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: totalPages }))}
                  className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Order Details - {selectedOrder.orderNo}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-medium">{selectedOrder.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded ${statusColors[selectedOrder.status]?.bg} ${statusColors[selectedOrder.status]?.text}`}>
                    {selectedOrder.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Channel</p>
                  <p className="font-medium">{selectedOrder.channel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <span className={`px-2 py-1 text-xs rounded ${priorityColors[selectedOrder.priority]}`}>
                    {selectedOrder.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SLA Status</p>
                  <span className={`px-2 py-1 text-xs rounded ${slaColors[selectedOrder.slaStatus]?.bg} ${slaColors[selectedOrder.slaStatus]?.text}`}>
                    {selectedOrder.slaStatus.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Order Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <p className="font-medium">{selectedOrder.items}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-medium">{selectedOrder.qty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{selectedOrder.locationCode}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium">{selectedOrder.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Promise Date</p>
                    <p className="font-medium">{selectedOrder.promisedDate}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {selectedOrder.status === "PENDING" && (
                <button
                  onClick={() => {
                    handleStartFulfillment(selectedOrder.id);
                    setShowViewModal(false);
                  }}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Start Fulfillment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
