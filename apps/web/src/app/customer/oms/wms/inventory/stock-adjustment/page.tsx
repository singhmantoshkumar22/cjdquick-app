"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";

interface StockAdjustment {
  id: string;
  skuCode: string;
  skuDescription: string;
  date: string;
  bin: string;
  mode: "INCREASE" | "DECREASE";
  bookedStock: number;
  adjustedStock: number;
  freeStock: number;
  reason: string;
  status: string;
  remarks: string;
  user: string;
  siteLocation: string;
}

const demoAdjustments: StockAdjustment[] = [
  { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", date: "2024-01-08 10:30", bin: "BIN-A001", mode: "INCREASE", bookedStock: 100, adjustedStock: 10, freeStock: 110, reason: "STOCK_TAKE", status: "CONFIRMED", remarks: "Found extra stock during count", user: "Rahul Kumar", siteLocation: "Warehouse A" },
  { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", date: "2024-01-08 11:15", bin: "BIN-A002", mode: "DECREASE", bookedStock: 50, adjustedStock: 5, freeStock: 45, reason: "DAMAGED", status: "CONFIRMED", remarks: "Water damage", user: "Priya Sharma", siteLocation: "Warehouse A" },
  { id: "3", skuCode: "SKU-003", skuDescription: "Monitor Stand", date: "2024-01-08 12:00", bin: "BIN-B001", mode: "DECREASE", bookedStock: 75, adjustedStock: 3, freeStock: 72, reason: "MISCELLANEOUS", status: "WIP", remarks: "Pending verification", user: "Amit Patel", siteLocation: "Warehouse B" },
];

const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  CONFIRMED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  WIP: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

const reasonOptions = [
  { value: "STOCK_TAKE", label: "Stock Take" },
  { value: "ORDER_SHIPMENT", label: "Order Shipment" },
  { value: "DAMAGED", label: "Damaged in Warehouse" },
  { value: "MISCELLANEOUS", label: "Miscellaneous" },
  { value: "EXPIRED", label: "Expired" },
];

export default function StockAdjustmentPage() {
  const [activeTab, setActiveTab] = useState<"enquiry" | "create">("enquiry");
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdjustments, setSelectedAdjustments] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Create form state
  const [adjustmentMode, setAdjustmentMode] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [skuCode, setSkuCode] = useState("");
  const [skuDesc, setSkuDesc] = useState("");
  const [reason, setReason] = useState("");
  const [adjustedBin, setAdjustedBin] = useState("");
  const [lot, setLot] = useState("");
  const [adjustedQty, setAdjustedQty] = useState(0);
  const [bookStock, setBookStock] = useState(0);

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const response = await fetch("/api/oms/wms/stock-adjustment");
      const result = await response.json();
      if (result.success && result.data?.adjustments) {
        setAdjustments(result.data.adjustments);
      } else {
        setAdjustments(demoAdjustments);
      }
    } catch (error) {
      console.error("Error fetching adjustments:", error);
      setAdjustments(demoAdjustments);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSelected = async () => {
    if (selectedAdjustments.length === 0) return;
    try {
      await fetch("/api/oms/wms/stock-adjustment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", ids: selectedAdjustments }),
      });
      fetchAdjustments();
      setSelectedAdjustments([]);
    } catch (error) {
      console.error("Error confirming adjustments:", error);
    }
  };

  const handleCancelSelected = async () => {
    if (selectedAdjustments.length === 0) return;
    try {
      await fetch("/api/oms/wms/stock-adjustment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", ids: selectedAdjustments }),
      });
      fetchAdjustments();
      setSelectedAdjustments([]);
    } catch (error) {
      console.error("Error cancelling adjustments:", error);
    }
  };

  const handleCreateAdjustment = async () => {
    if (!skuCode || !adjustedBin || adjustedQty <= 0) return;

    try {
      await fetch("/api/oms/wms/stock-adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: adjustmentMode,
          skuCode,
          reason,
          bin: adjustedBin,
          lot,
          quantity: adjustedQty,
        }),
      });
      setActiveTab("enquiry");
      fetchAdjustments();
      // Reset form
      setSkuCode("");
      setSkuDesc("");
      setReason("");
      setAdjustedBin("");
      setLot("");
      setAdjustedQty(0);
    } catch (error) {
      console.error("Error creating adjustment:", error);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedAdjustments((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stock Adjustment</h1>
          <p className="text-sm text-gray-500">Increase or decrease inventory to match physical stock</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "enquiry" && (
            <>
              <button
                onClick={handleConfirmSelected}
                disabled={selectedAdjustments.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm
              </button>
              <button
                onClick={handleCancelSelected}
                disabled={selectedAdjustments.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Export
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab("create")}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
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
          Stock Adjustment Enquiry
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 text-sm rounded-lg ${
            activeTab === "create" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          Create/Edit
        </button>
      </div>

      {activeTab === "enquiry" ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">SKU Code</label>
                <input type="text" placeholder="Search..." className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="date" className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bin</label>
                <input type="text" placeholder="Bin code..." className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Reason</label>
                <select className="w-full px-3 py-2 text-sm border rounded-lg">
                  <option>All Reasons</option>
                  {reasonOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select className="w-full px-3 py-2 text-sm border rounded-lg">
                  <option>All Status</option>
                  <option value="WIP">WIP</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
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

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <Filter className="w-3 h-3" />
              {showAdvanced ? "Hide" : "Show"} Advanced Search
            </button>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mode</label>
                  <select className="w-full px-3 py-2 text-sm border rounded-lg">
                    <option>All Modes</option>
                    <option value="INCREASE">Increase</option>
                    <option value="DECREASE">Decrease</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">SKU Description</label>
                  <input type="text" placeholder="Description..." className="w-full px-3 py-2 text-sm border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Site Location</label>
                  <select className="w-full px-3 py-2 text-sm border rounded-lg">
                    <option>All Locations</option>
                    <option>Warehouse A</option>
                    <option>Warehouse B</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Adjustments Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading adjustments...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input type="checkbox" className="rounded" />
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">SKU Code</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Date</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Mode</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Bin</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Book Stock</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Adjusted</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Reason</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {adjustments.map((item) => {
                        const StatusIcon = statusColors[item.status]?.icon || Clock;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedAdjustments.includes(item.id)}
                                onChange={() => toggleSelection(item.id)}
                                className="rounded"
                                disabled={item.status !== "WIP"}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-blue-600">{item.skuCode}</p>
                              <p className="text-xs text-gray-500">{item.skuDescription}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">{item.date}</td>
                            <td className="px-4 py-3 text-center">
                              {item.mode === "INCREASE" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                  <TrendingUp className="w-3 h-3" />
                                  Increase
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                  <TrendingDown className="w-3 h-3" />
                                  Decrease
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.bin}</span>
                            </td>
                            <td className="px-4 py-3 text-center font-medium">{item.bookedStock}</td>
                            <td className="px-4 py-3 text-center font-medium">
                              <span className={item.mode === "INCREASE" ? "text-green-600" : "text-red-600"}>
                                {item.mode === "INCREASE" ? "+" : "-"}{item.adjustedStock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                {item.reason.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${statusColors[item.status]?.bg} ${statusColors[item.status]?.text}`}>
                                <StatusIcon className="w-3 h-3" />
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.user}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <div className="text-sm text-gray-500">
                    {selectedAdjustments.length > 0 && <span className="font-medium">{selectedAdjustments.length} selected | </span>}
                    Showing 1-{adjustments.length} of {adjustments.length} adjustments
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
        </>
      ) : (
        /* Create Adjustment Form */
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Adjustment Mode *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="INCREASE"
                  checked={adjustmentMode === "INCREASE"}
                  onChange={(e) => setAdjustmentMode(e.target.value as "INCREASE" | "DECREASE")}
                  className="w-4 h-4 text-green-600"
                />
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm">Increase</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="DECREASE"
                  checked={adjustmentMode === "DECREASE"}
                  onChange={(e) => setAdjustmentMode(e.target.value as "INCREASE" | "DECREASE")}
                  className="w-4 h-4 text-red-600"
                />
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm">Decrease</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code *</label>
              <input
                type="text"
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
                placeholder="Enter SKU code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU Description</label>
              <input
                type="text"
                value={skuDesc}
                readOnly
                className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50"
                placeholder="Auto-populated"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              >
                <option value="">Select reason</option>
                {reasonOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adjusted Bin *</label>
              <input
                type="text"
                value={adjustedBin}
                onChange={(e) => setAdjustedBin(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
                placeholder="Bin code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lot</label>
              <select
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              >
                <option value="">Select lot</option>
                <option value="LOT-001">LOT-001</option>
                <option value="LOT-002">LOT-002</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adjusted Quantity *</label>
              <input
                type="number"
                value={adjustedQty || ""}
                onChange={(e) => setAdjustedQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border rounded-lg"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book Stock</label>
              <input
                type="number"
                value={bookStock}
                readOnly
                className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={() => setActiveTab("enquiry")}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAdjustment}
              disabled={!skuCode || !adjustedBin || adjustedQty <= 0}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add Adjustment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
