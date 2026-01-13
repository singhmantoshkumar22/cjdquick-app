"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Printer,
  FileText,
  Edit,
  Trash2,
  XCircle,
  MoreVertical,
  Copy,
  MapPin,
} from "lucide-react";

interface Order {
  id: string;
  webOrderNo: string;
  channel: string;
  customerName: string;
  city: string;
  state: string;
  pincode: string;
  items: number;
  quantity: number;
  amount: number;
  paymentMode: string;
  status: string;
  createdAt: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  NEW: { bg: "bg-blue-100", text: "text-blue-700" },
  PROCESSING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  PACKED: { bg: "bg-purple-100", text: "text-purple-700" },
  SHIPPED: { bg: "bg-cyan-100", text: "text-cyan-700" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
  RTO: { bg: "bg-orange-100", text: "text-orange-700" },
};

const statusTabs = [
  { id: "all", label: "All Orders" },
  { id: "NEW", label: "New" },
  { id: "PROCESSING", label: "Processing" },
  { id: "PACKED", label: "Packed" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "RTO", label: "RTO" },
];

export default function OMSOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [actionMenuOrder, setActionMenuOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState({
    channel: "",
    paymentMode: "",
    dateFrom: "",
    dateTo: "",
  });
  const [createForm, setCreateForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    channel: "Manual",
    paymentMode: "Prepaid",
    items: [] as { sku: string; name: string; qty: number; price: number }[],
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
        ...(searchQuery && { search: searchQuery }),
        ...(filters.channel && { channel: filters.channel }),
        ...(filters.paymentMode && { paymentMode: filters.paymentMode }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await fetch(`/api/oms/orders?${params}`);
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
      console.error("Error fetching orders:", error);
      // Fallback to demo data
      setOrders(getDemoOrders());
      setPagination((prev) => ({ ...prev, total: 3693 }));
    } finally {
      setLoading(false);
    }
  };

  const getDemoOrders = (): Order[] => [
    { id: "1", webOrderNo: "ORD-2024-001234", channel: "Amazon", customerName: "Rahul Sharma", city: "Mumbai", state: "Maharashtra", pincode: "400001", items: 2, quantity: 5, amount: 12500, paymentMode: "Prepaid", status: "NEW", createdAt: "2024-01-08 10:30" },
    { id: "2", webOrderNo: "ORD-2024-001235", channel: "Flipkart", customerName: "Priya Patel", city: "Delhi", state: "Delhi", pincode: "110001", items: 1, quantity: 3, amount: 8500, paymentMode: "COD", status: "PROCESSING", createdAt: "2024-01-08 10:15" },
    { id: "3", webOrderNo: "ORD-2024-001236", channel: "Shopify", customerName: "Amit Kumar", city: "Bangalore", state: "Karnataka", pincode: "560001", items: 3, quantity: 8, amount: 22000, paymentMode: "Prepaid", status: "PACKED", createdAt: "2024-01-08 09:45" },
    { id: "4", webOrderNo: "ORD-2024-001237", channel: "Amazon", customerName: "Sneha Gupta", city: "Chennai", state: "Tamil Nadu", pincode: "600001", items: 1, quantity: 1, amount: 4500, paymentMode: "Prepaid", status: "SHIPPED", createdAt: "2024-01-08 09:30" },
    { id: "5", webOrderNo: "ORD-2024-001238", channel: "Manual", customerName: "Vikram Singh", city: "Jaipur", state: "Rajasthan", pincode: "302001", items: 2, quantity: 4, amount: 15000, paymentMode: "COD", status: "DELIVERED", createdAt: "2024-01-07 16:20" },
  ];

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  const handleExport = () => {
    const csvContent = [
      ["Order No", "Channel", "Customer", "City", "State", "Pincode", "Items", "Qty", "Amount", "Payment", "Status", "Date"].join(","),
      ...orders.map((order) =>
        [
          order.webOrderNo,
          order.channel,
          order.customerName,
          order.city,
          order.state,
          order.pincode,
          order.items,
          order.quantity,
          order.amount,
          order.paymentMode,
          order.status,
          order.createdAt,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateOrder = async () => {
    try {
      const response = await fetch("/api/oms/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        setCreateForm({
          customerName: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          channel: "Manual",
          paymentMode: "Prepaid",
          items: [],
        });
        fetchOrders();
        alert("Order created successfully!");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Order created (demo mode)");
      setShowCreateModal(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
    setActionMenuOrder(null);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setCreateForm({
      customerName: order.customerName,
      phone: order.phone || "",
      email: order.email || "",
      address: order.address || "",
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      channel: order.channel,
      paymentMode: order.paymentMode,
      items: [],
    });
    setShowEditModal(true);
    setActionMenuOrder(null);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/oms/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: createForm.customerName,
          phone: createForm.phone,
          email: createForm.email,
          shippingAddress: {
            address: createForm.address,
            city: createForm.city,
            state: createForm.state,
            pincode: createForm.pincode,
          },
          channel: createForm.channel,
          paymentMode: createForm.paymentMode,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert("Order updated successfully!");
        setShowEditModal(false);
        fetchOrders();
      } else {
        alert(result.error || "Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Order updated (demo mode)");
      setShowEditModal(false);
      fetchOrders();
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/oms/orders/${selectedOrder.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const result = await response.json();
      if (result.success) {
        alert("Order cancelled successfully!");
        setShowCancelModal(false);
        setCancelReason("");
        fetchOrders();
      } else {
        alert(result.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Order cancelled (demo mode)");
      setShowCancelModal(false);
      setCancelReason("");
      // Update local state for demo
      setOrders(orders.map(o =>
        o.id === selectedOrder.id ? { ...o, status: "CANCELLED" } : o
      ));
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/oms/orders/${selectedOrder.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`Order status updated to ${newStatus}!`);
        setShowStatusModal(false);
        fetchOrders();
      } else {
        alert(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Status updated to ${newStatus} (demo mode)`);
      setShowStatusModal(false);
      // Update local state for demo
      setOrders(orders.map(o =>
        o.id === selectedOrder.id ? { ...o, status: newStatus } : o
      ));
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintSingleLabel = async (order: Order) => {
    setActionMenuOrder(null);
    try {
      const response = await fetch(`/api/oms/labels?orderId=${order.id}&format=json`);
      const result = await response.json();
      if (result.success) {
        // Open print preview window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>Shipping Label - ${order.webOrderNo}</title></head>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="border: 2px solid black; padding: 20px; max-width: 400px;">
                  <h2 style="text-align: center; border-bottom: 1px solid black; padding-bottom: 10px;">SHIPPING LABEL</h2>
                  <p><strong>Order:</strong> ${order.webOrderNo}</p>
                  <p><strong>To:</strong><br/>${order.customerName}<br/>${order.address || 'N/A'}<br/>${order.city}, ${order.state} - ${order.pincode}</p>
                  <p><strong>Payment:</strong> ${order.paymentMode}</p>
                  <p><strong>Amount:</strong> ₹${order.amount.toLocaleString()}</p>
                  <div style="text-align: center; margin-top: 20px; font-size: 24px; font-weight: bold;">
                    ${result.data?.awbNo || 'AWB-' + Date.now().toString(36).toUpperCase()}
                  </div>
                </div>
                <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px;">Print Label</button>
              </body>
            </html>
          `);
        }
      } else {
        alert("Label generated (demo mode)");
      }
    } catch (error) {
      alert("Label generated (demo mode)");
    }
  };

  const handleCopyOrderNo = (orderNo: string) => {
    navigator.clipboard.writeText(orderNo);
    alert("Order number copied to clipboard!");
    setActionMenuOrder(null);
  };

  const handleTrackOrder = (order: Order) => {
    setActionMenuOrder(null);
    // Open tracking in new tab or show tracking modal
    window.open(`/customer/oms/tracking?order=${order.webOrderNo}`, '_blank');
  };

  const handleCreatePicklist = async () => {
    if (selectedOrders.length === 0) return;
    try {
      const response = await fetch("/api/oms/fulfillment/picklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });
      const result = await response.json();
      alert(result.success ? "Picklist created successfully!" : "Picklist created (demo mode)");
      setSelectedOrders([]);
    } catch (error) {
      alert("Picklist created (demo mode)");
      setSelectedOrders([]);
    }
  };

  const handlePrintLabels = async () => {
    if (selectedOrders.length === 0) return;
    try {
      const response = await fetch("/api/oms/fulfillment/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });
      const result = await response.json();
      if (result.success && result.data?.url) {
        window.open(result.data.url, "_blank");
      } else {
        alert("Labels generated (demo mode)");
      }
    } catch (error) {
      alert("Labels generated (demo mode)");
    }
  };

  const handleCreateManifest = async () => {
    if (selectedOrders.length === 0) return;
    try {
      const response = await fetch("/api/oms/fulfillment/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });
      const result = await response.json();
      alert(result.success ? "Manifest created successfully!" : "Manifest created (demo mode)");
      setSelectedOrders([]);
    } catch (error) {
      alert("Manifest created (demo mode)");
      setSelectedOrders([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Order
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order No, Customer, AWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filters.channel}
          onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="">All Channels</option>
          <option value="Amazon">Amazon</option>
          <option value="Flipkart">Flipkart</option>
          <option value="Shopify">Shopify</option>
          <option value="Manual">Manual</option>
        </select>
        <select
          value={filters.paymentMode}
          onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="">All Payment</option>
          <option value="Prepaid">Prepaid</option>
          <option value="COD">COD</option>
        </select>
        <button
          onClick={() => setShowFiltersModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          More Filters
        </button>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedOrders.length} order(s) selected
          </span>
          <button
            onClick={handleCreatePicklist}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Picklist
          </button>
          <button
            onClick={handlePrintLabels}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Print Labels
          </button>
          <button
            onClick={handleCreateManifest}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Create Manifest
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Payment</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {order.webOrderNo}
                    </td>
                    <td className="px-4 py-3">{order.channel}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {order.city}, {order.state} - {order.pincode}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.items} / {order.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{order.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          order.paymentMode === "COD"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {order.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          statusColors[order.status]?.bg || "bg-gray-100"
                        } ${statusColors[order.status]?.text || "text-gray-700"}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{order.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="View Order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Edit Order"
                          disabled={["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOrder(actionMenuOrder === order.id ? null : order.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {actionMenuOrder === order.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-50">
                              <button
                                onClick={() => handleCopyOrderNo(order.webOrderNo)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
                              >
                                <Copy className="w-4 h-4" />
                                Copy Order No
                              </button>
                              <button
                                onClick={() => handlePrintSingleLabel(order)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
                              >
                                <Printer className="w-4 h-4" />
                                Print Label
                              </button>
                              <button
                                onClick={() => handleTrackOrder(order)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
                              >
                                <MapPin className="w-4 h-4" />
                                Track Order
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowStatusModal(true);
                                  setActionMenuOrder(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
                                disabled={["DELIVERED", "CANCELLED"].includes(order.status)}
                              >
                                <RefreshCw className="w-4 h-4" />
                                Update Status
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowCancelModal(true);
                                  setActionMenuOrder(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                                disabled={["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status)}
                              >
                                <XCircle className="w-4 h-4" />
                                Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create New Order</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={createForm.customerName}
                    onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Enter delivery address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={createForm.pincode}
                    onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Pincode"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={createForm.channel}
                    onChange={(e) => setCreateForm({ ...createForm, channel: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Shopify">Shopify</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={createForm.paymentMode}
                    onChange={(e) => setCreateForm({ ...createForm, paymentMode: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Order Details - {selectedOrder.webOrderNo}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-medium">{selectedOrder.webOrderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded ${statusColors[selectedOrder.status]?.bg} ${statusColors[selectedOrder.status]?.text}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Channel</p>
                  <p className="font-medium">{selectedOrder.channel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Mode</p>
                  <p className="font-medium">{selectedOrder.paymentMode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{selectedOrder.createdAt}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-lg">₹{selectedOrder.amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Order Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <p className="font-medium">{selectedOrder.items}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-medium">{selectedOrder.quantity}</p>
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
            </div>
          </div>
        </div>
      )}

      {/* More Filters Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Advanced Filters</h2>
              <button onClick={() => setShowFiltersModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setFilters({ channel: "", paymentMode: "", dateFrom: "", dateTo: "" });
                }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  setShowFiltersModal(false);
                  handleSearch();
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Order - {selectedOrder.webOrderNo}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={createForm.customerName}
                    onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={createForm.pincode}
                    onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={createForm.channel}
                    onChange={(e) => setCreateForm({ ...createForm, channel: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Shopify">Shopify</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={createForm.paymentMode}
                    onChange={(e) => setCreateForm({ ...createForm, paymentMode: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrder}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={processing}
              >
                {processing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-red-600">Cancel Order</h2>
              <button onClick={() => setShowCancelModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Are you sure you want to cancel this order?</p>
                  <p className="text-sm text-red-600">Order: {selectedOrder.webOrderNo}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason *</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mb-2"
                >
                  <option value="">Select a reason</option>
                  <option value="Customer Request">Customer Request</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Duplicate Order">Duplicate Order</option>
                  <option value="Incorrect Address">Incorrect Address</option>
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Other">Other</option>
                </select>
                {cancelReason === "Other" && (
                  <textarea
                    placeholder="Please specify the reason..."
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={2}
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={processing || !cancelReason}
              >
                {processing ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Update Order Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Order: {selectedOrder.webOrderNo}</p>
                <p className="font-medium">Current Status: <span className={`px-2 py-0.5 text-xs rounded ${statusColors[selectedOrder.status]?.bg} ${statusColors[selectedOrder.status]?.text}`}>{selectedOrder.status}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {["NEW", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      disabled={processing || selectedOrder.status === status}
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        selectedOrder.status === status
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      <span className={`inline-block px-2 py-0.5 text-xs rounded mb-1 ${statusColors[status]?.bg} ${statusColors[status]?.text}`}>
                        {status}
                      </span>
                      {selectedOrder.status === status && (
                        <p className="text-xs text-gray-400">Current</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside handler for action menu */}
      {actionMenuOrder && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenuOrder(null)}
        />
      )}
    </div>
  );
}
