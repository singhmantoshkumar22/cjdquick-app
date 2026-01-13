"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  Save,
  ScanLine,
  Camera,
  AlertTriangle,
} from "lucide-react";

interface ReturnInboundItem {
  id: string;
  returnNo: string;
  orderNo: string;
  awbNo: string;
  returnType: "CUSTOMER_RETURN" | "RTO" | "EXCHANGE" | "REFUND";
  returnReason: string;
  customerName: string;
  customerPhone: string;
  skuCode: string;
  skuDescription: string;
  returnQty: number;
  receivedQty: number;
  qcStatus: "PENDING" | "PASSED" | "FAILED" | "DAMAGED";
  resellable: boolean;
  status: "PENDING" | "RECEIVED" | "QC_DONE" | "PUTAWAY" | "REFUNDED";
  receivedAt: string;
  receivedBy: string;
  location: string;
  remarks: string;
}

const demoReturnInbounds: ReturnInboundItem[] = [
  { id: "1", returnNo: "RET-2024-001234", orderNo: "ORD-2024-5678", awbNo: "AWB-001234567", returnType: "RTO", returnReason: "Customer not available", customerName: "Rahul Sharma", customerPhone: "9876543210", skuCode: "SKU-001", skuDescription: "Wireless Mouse", returnQty: 1, receivedQty: 0, qcStatus: "PENDING", resellable: false, status: "PENDING", receivedAt: "", receivedBy: "", location: "Warehouse A", remarks: "" },
  { id: "2", returnNo: "RET-2024-001235", orderNo: "ORD-2024-5679", awbNo: "AWB-001234568", returnType: "CUSTOMER_RETURN", returnReason: "Product defective", customerName: "Priya Gupta", customerPhone: "9876543211", skuCode: "SKU-002", skuDescription: "USB Keyboard", returnQty: 1, receivedQty: 1, qcStatus: "FAILED", resellable: false, status: "QC_DONE", receivedAt: "2024-01-08 10:30", receivedBy: "Amit Kumar", location: "Warehouse A", remarks: "Keys not working" },
  { id: "3", returnNo: "RET-2024-001236", orderNo: "ORD-2024-5680", awbNo: "AWB-001234569", returnType: "EXCHANGE", returnReason: "Wrong size", customerName: "Vikram Singh", customerPhone: "9876543212", skuCode: "SKU-003", skuDescription: "Laptop Bag - Large", returnQty: 1, receivedQty: 1, qcStatus: "PASSED", resellable: true, status: "PUTAWAY", receivedAt: "2024-01-08 09:15", receivedBy: "Sneha Patel", location: "Warehouse A", remarks: "" },
  { id: "4", returnNo: "RET-2024-001237", orderNo: "ORD-2024-5681", awbNo: "AWB-001234570", returnType: "RTO", returnReason: "Address incorrect", customerName: "Neha Verma", customerPhone: "9876543213", skuCode: "SKU-004", skuDescription: "Monitor Stand", returnQty: 2, receivedQty: 2, qcStatus: "PASSED", resellable: true, status: "PUTAWAY", receivedAt: "2024-01-07 14:20", receivedBy: "Rahul Kumar", location: "Warehouse B", remarks: "" },
  { id: "5", returnNo: "RET-2024-001238", orderNo: "ORD-2024-5682", awbNo: "AWB-001234571", returnType: "REFUND", returnReason: "Changed mind", customerName: "Amit Patel", customerPhone: "9876543214", skuCode: "SKU-005", skuDescription: "Webcam HD", returnQty: 1, receivedQty: 0, qcStatus: "PENDING", resellable: false, status: "PENDING", receivedAt: "", receivedBy: "", location: "Warehouse A", remarks: "" },
];

const returnReasons = [
  "Product defective",
  "Wrong product delivered",
  "Wrong size",
  "Changed mind",
  "Product not as described",
  "Damaged in transit",
  "Customer not available",
  "Address incorrect",
  "Refused to accept",
  "Other",
];

export default function ReturnInboundPage() {
  const [returns, setReturns] = useState<ReturnInboundItem[]>(demoReturnInbounds);
  const [loading, setLoading] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnInboundItem | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter states
  const [returnNo, setReturnNo] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [awbNo, setAwbNo] = useState("");
  const [returnType, setReturnType] = useState("all");
  const [status, setStatus] = useState("all");
  const [qcStatus, setQcStatus] = useState("all");
  const [location, setLocation] = useState("all");

  // Receive form state
  const [receiveQty, setReceiveQty] = useState(0);
  const [receiveQcStatus, setReceiveQcStatus] = useState("PENDING");
  const [receiveResellable, setReceiveResellable] = useState(false);
  const [receiveRemarks, setReceiveRemarks] = useState("");

  // Create form state
  const [newOrderNo, setNewOrderNo] = useState("");
  const [newAwbNo, setNewAwbNo] = useState("");
  const [newReturnType, setNewReturnType] = useState("CUSTOMER_RETURN");
  const [newReturnReason, setNewReturnReason] = useState("");
  const [newSkuCode, setNewSkuCode] = useState("");
  const [newQty, setNewQty] = useState(1);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/oms/inbound/return");
      const result = await response.json();
      if (result.success && result.data?.returns) {
        setReturns(result.data.returns);
      }
    } catch (error) {
      console.error("Error fetching returns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReceive = (item: ReturnInboundItem) => {
    setSelectedReturn(item);
    setReceiveQty(item.returnQty);
    setReceiveQcStatus("PENDING");
    setReceiveResellable(false);
    setReceiveRemarks("");
    setShowReceiveModal(true);
  };

  const handleSaveReceive = () => {
    if (!selectedReturn) return;

    setReturns(returns.map(r =>
      r.id === selectedReturn.id ? {
        ...r,
        receivedQty: receiveQty,
        qcStatus: receiveQcStatus as any,
        resellable: receiveResellable,
        status: "QC_DONE",
        receivedAt: new Date().toLocaleString(),
        receivedBy: "Current User",
        remarks: receiveRemarks,
      } : r
    ));
    setShowReceiveModal(false);
    setSelectedReturn(null);
  };

  const handleCreateReturn = () => {
    const newReturn: ReturnInboundItem = {
      id: Date.now().toString(),
      returnNo: `RET-2024-${String(returns.length + 1).padStart(6, "0")}`,
      orderNo: newOrderNo,
      awbNo: newAwbNo,
      returnType: newReturnType as any,
      returnReason: newReturnReason,
      customerName: "To be filled",
      customerPhone: "",
      skuCode: newSkuCode,
      skuDescription: "Product Description",
      returnQty: newQty,
      receivedQty: 0,
      qcStatus: "PENDING",
      resellable: false,
      status: "PENDING",
      receivedAt: "",
      receivedBy: "",
      location: "Warehouse A",
      remarks: "",
    };
    setReturns([newReturn, ...returns]);
    setShowCreateModal(false);
    resetCreateForm();
  };

  const resetCreateForm = () => {
    setNewOrderNo("");
    setNewAwbNo("");
    setNewReturnType("CUSTOMER_RETURN");
    setNewReturnReason("");
    setNewSkuCode("");
    setNewQty(1);
  };

  const handleReset = () => {
    setReturnNo("");
    setOrderNo("");
    setAwbNo("");
    setReturnType("all");
    setStatus("all");
    setQcStatus("all");
    setLocation("all");
  };

  const filteredReturns = returns.filter((item) => {
    const matchesReturnNo = !returnNo || item.returnNo.toLowerCase().includes(returnNo.toLowerCase());
    const matchesOrderNo = !orderNo || item.orderNo.toLowerCase().includes(orderNo.toLowerCase());
    const matchesAwbNo = !awbNo || item.awbNo.toLowerCase().includes(awbNo.toLowerCase());
    const matchesType = returnType === "all" || item.returnType === returnType;
    const matchesStatus = status === "all" || item.status === status;
    const matchesQcStatus = qcStatus === "all" || item.qcStatus === qcStatus;
    const matchesLocation = location === "all" || item.location === location;
    return matchesReturnNo && matchesOrderNo && matchesAwbNo && matchesType && matchesStatus && matchesQcStatus && matchesLocation;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"><Package className="w-3 h-3" />Received</span>;
      case "QC_DONE":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-purple-100 text-purple-700"><CheckCircle className="w-3 h-3" />QC Done</span>;
      case "PUTAWAY":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Putaway</span>;
      case "REFUNDED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-teal-100 text-teal-700"><CheckCircle className="w-3 h-3" />Refunded</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Pending</span>;
    }
  };

  const getQcStatusBadge = (qcStatus: string) => {
    switch (qcStatus) {
      case "PASSED":
        return <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Passed</span>;
      case "FAILED":
        return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Failed</span>;
      case "DAMAGED":
        return <span className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700">Damaged</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">Pending</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      CUSTOMER_RETURN: "bg-blue-100 text-blue-700",
      RTO: "bg-orange-100 text-orange-700",
      EXCHANGE: "bg-purple-100 text-purple-700",
      REFUND: "bg-teal-100 text-teal-700",
    };
    const labels: Record<string, string> = {
      CUSTOMER_RETURN: "Customer Return",
      RTO: "RTO",
      EXCHANGE: "Exchange",
      REFUND: "Refund",
    };
    return <span className={`px-2 py-0.5 text-xs rounded ${colors[type]}`}>{labels[type]}</span>;
  };

  const pendingCount = returns.filter(r => r.status === "PENDING").length;
  const qcPendingCount = returns.filter(r => r.qcStatus === "PENDING" && r.receivedQty > 0).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Return Inbound</h1>
          <p className="text-sm text-gray-500">Manage customer returns and RTO shipments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Return
          </button>
          <button
            onClick={fetchReturns}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-600">Pending Receipt</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-2">{pendingCount}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-orange-600">RTO</span>
          </div>
          <p className="text-2xl font-bold text-orange-800 mt-2">{returns.filter(r => r.returnType === "RTO").length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-600">Customer Returns</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">{returns.filter(r => r.returnType === "CUSTOMER_RETURN").length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-purple-600">QC Pending</span>
          </div>
          <p className="text-2xl font-bold text-purple-800 mt-2">{qcPendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Return No</label>
            <input
              type="text"
              value={returnNo}
              onChange={(e) => setReturnNo(e.target.value)}
              placeholder="Enter return no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order No</label>
            <input
              type="text"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Enter order no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">AWB No</label>
            <input
              type="text"
              value={awbNo}
              onChange={(e) => setAwbNo(e.target.value)}
              placeholder="Enter AWB no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Return Type</label>
            <select
              value={returnType}
              onChange={(e) => setReturnType(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="CUSTOMER_RETURN">Customer Return</option>
              <option value="RTO">RTO</option>
              <option value="EXCHANGE">Exchange</option>
              <option value="REFUND">Refund</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="RECEIVED">Received</option>
              <option value="QC_DONE">QC Done</option>
              <option value="PUTAWAY">Putaway</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">QC Status</label>
            <select
              value={qcStatus}
              onChange={(e) => setQcStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All QC Status</option>
              <option value="PENDING">Pending</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Locations</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button onClick={handleReset} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading return inbounds...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Return Details</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Order/AWB</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">QC</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Resellable</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReturns.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-blue-600">{item.returnNo}</div>
                      <div className="text-xs text-gray-400">{item.returnReason}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <div><span className="text-gray-400">Order:</span> {item.orderNo}</div>
                        <div><span className="text-gray-400">AWB:</span> {item.awbNo}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{getTypeBadge(item.returnType)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.skuCode}</div>
                      <div className="text-xs text-gray-400">{item.skuDescription}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${item.receivedQty > 0 ? "text-green-600" : "text-gray-600"}`}>
                        {item.receivedQty}/{item.returnQty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{getQcStatusBadge(item.qcStatus)}</td>
                    <td className="px-4 py-3 text-center">
                      {item.qcStatus !== "PENDING" && (
                        <span className={`px-2 py-0.5 text-xs rounded ${item.resellable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {item.resellable ? "Yes" : "No"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.status === "PENDING" && (
                          <button
                            onClick={() => handleStartReceive(item)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Receive"
                          >
                            <ScanLine className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1 text-gray-400 hover:text-purple-600" title="Upload Image">
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receive Modal */}
      {showReceiveModal && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Receive Return - {selectedReturn.returnNo}</h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">Order:</span> <span className="font-medium">{selectedReturn.orderNo}</span></div>
                  <div><span className="text-gray-500">AWB:</span> <span className="font-medium">{selectedReturn.awbNo}</span></div>
                  <div><span className="text-gray-500">SKU:</span> <span className="font-medium">{selectedReturn.skuCode}</span></div>
                  <div><span className="text-gray-500">Return Qty:</span> <span className="font-medium">{selectedReturn.returnQty}</span></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Qty *</label>
                <input
                  type="number"
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(parseInt(e.target.value) || 0)}
                  max={selectedReturn.returnQty}
                  min={0}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QC Status *</label>
                <select
                  value={receiveQcStatus}
                  onChange={(e) => setReceiveQcStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PASSED">Passed - Good Condition</option>
                  <option value="FAILED">Failed - Defective</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>

              {receiveQcStatus !== "PENDING" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="resellable"
                    checked={receiveResellable}
                    onChange={(e) => setReceiveResellable(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="resellable" className="text-sm text-gray-700">Mark as Resellable</label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={receiveRemarks}
                  onChange={(e) => setReceiveRemarks(e.target.value)}
                  placeholder="Enter remarks..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to upload photos of returned item</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button onClick={() => setShowReceiveModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleSaveReceive} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Save className="w-4 h-4 inline mr-1" />
                Save & Complete QC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Create Return Inbound</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order No *</label>
                <input
                  type="text"
                  value={newOrderNo}
                  onChange={(e) => setNewOrderNo(e.target.value)}
                  placeholder="Enter order no..."
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AWB No *</label>
                <input
                  type="text"
                  value={newAwbNo}
                  onChange={(e) => setNewAwbNo(e.target.value)}
                  placeholder="Enter AWB no..."
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Type *</label>
                <select
                  value={newReturnType}
                  onChange={(e) => setNewReturnType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="CUSTOMER_RETURN">Customer Return</option>
                  <option value="RTO">RTO</option>
                  <option value="EXCHANGE">Exchange</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason *</label>
                <select
                  value={newReturnReason}
                  onChange={(e) => setNewReturnReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select reason...</option>
                  {returnReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code *</label>
                <input
                  type="text"
                  value={newSkuCode}
                  onChange={(e) => setNewSkuCode(e.target.value)}
                  placeholder="Enter SKU code..."
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleCreateReturn}
                disabled={!newOrderNo || !newAwbNo || !newReturnReason || !newSkuCode}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Create Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
