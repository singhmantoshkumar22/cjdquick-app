"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Truck,
  ArrowRight,
  ScanLine,
  FileText,
} from "lucide-react";

interface STOInboundItem {
  id: string;
  stoNo: string;
  stoDate: string;
  fromLocation: string;
  toLocation: string;
  status: "PENDING" | "IN_TRANSIT" | "RECEIVED" | "PARTIAL" | "CANCELLED";
  totalSkus: number;
  totalQty: number;
  receivedQty: number;
  dispatchDate: string;
  expectedDate: string;
  vehicleNo: string;
  driverName: string;
  createdBy: string;
  remarks: string;
}

interface STOLineItem {
  id: string;
  skuCode: string;
  skuDescription: string;
  uom: string;
  dispatchedQty: number;
  receivedQty: number;
  pendingQty: number;
  batchNo: string;
  status: "PENDING" | "RECEIVED" | "PARTIAL" | "SHORT";
}

const demoSTOInbounds: STOInboundItem[] = [
  { id: "1", stoNo: "STO-2024-001234", stoDate: "2024-01-05", fromLocation: "Warehouse A", toLocation: "Warehouse B", status: "IN_TRANSIT", totalSkus: 5, totalQty: 500, receivedQty: 0, dispatchDate: "2024-01-06", expectedDate: "2024-01-08", vehicleNo: "MH-12-AB-1234", driverName: "Rajesh Kumar", createdBy: "Rahul Kumar", remarks: "Urgent transfer" },
  { id: "2", stoNo: "STO-2024-001235", stoDate: "2024-01-04", fromLocation: "Warehouse B", toLocation: "Warehouse A", status: "PARTIAL", totalSkus: 3, totalQty: 200, receivedQty: 150, dispatchDate: "2024-01-05", expectedDate: "2024-01-07", vehicleNo: "MH-12-CD-5678", driverName: "Suresh Singh", createdBy: "Priya Sharma", remarks: "" },
  { id: "3", stoNo: "STO-2024-001236", stoDate: "2024-01-03", fromLocation: "Headoffice", toLocation: "Warehouse A", status: "RECEIVED", totalSkus: 8, totalQty: 1000, receivedQty: 1000, dispatchDate: "2024-01-04", expectedDate: "2024-01-06", vehicleNo: "MH-04-EF-9012", driverName: "Amit Patel", createdBy: "Amit Patel", remarks: "Monthly stock replenishment" },
  { id: "4", stoNo: "STO-2024-001237", stoDate: "2024-01-02", fromLocation: "Warehouse A", toLocation: "Headoffice", status: "PENDING", totalSkus: 2, totalQty: 100, receivedQty: 0, dispatchDate: "", expectedDate: "2024-01-09", vehicleNo: "", driverName: "", createdBy: "Sneha Gupta", remarks: "Return to HO" },
];

const demoLineItems: STOLineItem[] = [
  { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", uom: "PCS", dispatchedQty: 100, receivedQty: 0, pendingQty: 100, batchNo: "BATCH-001", status: "PENDING" },
  { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", uom: "PCS", dispatchedQty: 150, receivedQty: 0, pendingQty: 150, batchNo: "BATCH-002", status: "PENDING" },
  { id: "3", skuCode: "SKU-003", skuDescription: "Monitor Stand", uom: "PCS", dispatchedQty: 100, receivedQty: 0, pendingQty: 100, batchNo: "BATCH-003", status: "PENDING" },
  { id: "4", skuCode: "SKU-004", skuDescription: "Laptop Bag", uom: "PCS", dispatchedQty: 100, receivedQty: 0, pendingQty: 100, batchNo: "BATCH-004", status: "PENDING" },
  { id: "5", skuCode: "SKU-005", skuDescription: "Webcam HD", uom: "PCS", dispatchedQty: 50, receivedQty: 0, pendingQty: 50, batchNo: "BATCH-005", status: "PENDING" },
];

export default function STOInboundPage() {
  const [stoInbounds, setSTOInbounds] = useState<STOInboundItem[]>(demoSTOInbounds);
  const [loading, setLoading] = useState(false);
  const [selectedSTO, setSelectedSTO] = useState<STOInboundItem | null>(null);
  const [lineItems, setLineItems] = useState<STOLineItem[]>([]);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  // Filter states
  const [stoNo, setStoNo] = useState("");
  const [fromLocation, setFromLocation] = useState("all");
  const [toLocation, setToLocation] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSTOInbounds = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/oms/inbound/sto");
      const result = await response.json();
      if (result.success && result.data?.stos) {
        setSTOInbounds(result.data.stos);
      }
    } catch (error) {
      console.error("Error fetching STO inbounds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSTO = (sto: STOInboundItem) => {
    setSelectedSTO(sto);
    setLineItems(demoLineItems); // In real implementation, fetch line items
  };

  const handleStartReceive = (sto: STOInboundItem) => {
    setSelectedSTO(sto);
    setLineItems(demoLineItems);
    setShowReceiveModal(true);
  };

  const handleReceiveQtyChange = (lineId: string, qty: number) => {
    setLineItems(lineItems.map(line =>
      line.id === lineId ? {
        ...line,
        receivedQty: qty,
        pendingQty: line.dispatchedQty - qty,
        status: qty === 0 ? "PENDING" : qty >= line.dispatchedQty ? "RECEIVED" : qty < line.dispatchedQty ? "PARTIAL" : "SHORT"
      } : line
    ));
  };

  const handleSaveReceiving = () => {
    const totalReceived = lineItems.reduce((sum, l) => sum + l.receivedQty, 0);
    alert(`STO receiving saved! Total received: ${totalReceived} units`);
    setShowReceiveModal(false);
    setSelectedSTO(null);
  };

  const handleReset = () => {
    setStoNo("");
    setFromLocation("all");
    setToLocation("all");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
  };

  const filteredSTOs = stoInbounds.filter((item) => {
    const matchesStoNo = !stoNo || item.stoNo.toLowerCase().includes(stoNo.toLowerCase());
    const matchesFrom = fromLocation === "all" || item.fromLocation === fromLocation;
    const matchesTo = toLocation === "all" || item.toLocation === toLocation;
    const matchesStatus = status === "all" || item.status === status;
    return matchesStoNo && matchesFrom && matchesTo && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Received</span>;
      case "IN_TRANSIT":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"><Truck className="w-3 h-3" />In Transit</span>;
      case "PARTIAL":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-orange-100 text-orange-700"><Clock className="w-3 h-3" />Partial</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-100 text-red-700"><XCircle className="w-3 h-3" />Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Pending</span>;
    }
  };

  const pendingCount = stoInbounds.filter(s => s.status === "PENDING" || s.status === "IN_TRANSIT").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">STO Inbound</h1>
          <p className="text-sm text-gray-500">Receive stock transfers from other locations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSTOInbounds}
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
          <p className="text-sm text-yellow-600">Pending Receipt</p>
          <p className="text-2xl font-bold text-yellow-800">{pendingCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">In Transit</p>
          <p className="text-2xl font-bold text-blue-800">{stoInbounds.filter(s => s.status === "IN_TRANSIT").length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600">Partial Received</p>
          <p className="text-2xl font-bold text-orange-800">{stoInbounds.filter(s => s.status === "PARTIAL").length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Completed</p>
          <p className="text-2xl font-bold text-green-800">{stoInbounds.filter(s => s.status === "RECEIVED").length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">STO No</label>
            <input
              type="text"
              value={stoNo}
              onChange={(e) => setStoNo(e.target.value)}
              placeholder="Enter STO no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Location</label>
            <select
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Locations</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
              <option value="Headoffice">Headoffice</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Location</label>
            <select
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Locations</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
              <option value="Headoffice">Headoffice</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="PARTIAL">Partial</option>
              <option value="RECEIVED">Received</option>
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
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

      {/* STO List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading STO inbounds...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">STO Details</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Transfer Route</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Qty Progress</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Dispatch Info</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSTOs.map((sto) => {
                  const progress = Math.round((sto.receivedQty / sto.totalQty) * 100);
                  return (
                    <tr key={sto.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-blue-600">{sto.stoNo}</div>
                        <div className="text-xs text-gray-400">{sto.stoDate}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">{sto.fromLocation}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">{sto.toLocation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">{sto.totalSkus}</span>
                        <span className="text-gray-400 text-xs ml-1">SKUs</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{sto.receivedQty}/{sto.totalQty}</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                progress === 100 ? "bg-green-500" :
                                progress > 0 ? "bg-blue-500" : "bg-gray-300"
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {sto.dispatchDate ? (
                          <div className="text-xs">
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3 text-gray-400" />
                              {sto.vehicleNo}
                            </div>
                            <div className="text-gray-400">{sto.driverName}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Not dispatched</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(sto.status)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewSTO(sto)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(sto.status === "IN_TRANSIT" || sto.status === "PARTIAL") && (
                            <button
                              onClick={() => handleStartReceive(sto)}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Start Receiving"
                            >
                              <ScanLine className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-1 text-gray-400 hover:text-purple-600" title="Print">
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STO Detail Panel */}
      {selectedSTO && !showReceiveModal && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">STO Details - {selectedSTO.stoNo}</h3>
            <button
              onClick={() => setSelectedSTO(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <span className="text-gray-500">From:</span>
              <span className="ml-2 font-medium">{selectedSTO.fromLocation}</span>
            </div>
            <div>
              <span className="text-gray-500">To:</span>
              <span className="ml-2 font-medium">{selectedSTO.toLocation}</span>
            </div>
            <div>
              <span className="text-gray-500">Expected:</span>
              <span className="ml-2 font-medium">{selectedSTO.expectedDate}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2">{getStatusBadge(selectedSTO.status)}</span>
            </div>
          </div>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">SKU</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Description</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Batch</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Dispatched</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Received</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Pending</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lineItems.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-2 font-medium">{line.skuCode}</td>
                    <td className="px-4 py-2 text-gray-600">{line.skuDescription}</td>
                    <td className="px-4 py-2 text-center">{line.batchNo}</td>
                    <td className="px-4 py-2 text-center">{line.dispatchedQty}</td>
                    <td className="px-4 py-2 text-center text-green-600">{line.receivedQty}</td>
                    <td className="px-4 py-2 text-center text-orange-600">{line.pendingQty}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        line.status === "RECEIVED" ? "bg-green-100 text-green-700" :
                        line.status === "PARTIAL" ? "bg-orange-100 text-orange-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {line.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && selectedSTO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Receive STO - {selectedSTO.stoNo}</h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">SKU</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Description</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">Dispatched</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">Receive Qty</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lineItems.map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-2 font-medium">{line.skuCode}</td>
                        <td className="px-4 py-2 text-gray-600">{line.skuDescription}</td>
                        <td className="px-4 py-2 text-center">{line.dispatchedQty}</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            value={line.receivedQty}
                            onChange={(e) => handleReceiveQtyChange(line.id, parseInt(e.target.value) || 0)}
                            max={line.dispatchedQty}
                            min={0}
                            className="w-20 px-2 py-1 text-sm border rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-2 text-center text-orange-600">{line.pendingQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button onClick={() => setShowReceiveModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleSaveReceiving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Save Receiving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
