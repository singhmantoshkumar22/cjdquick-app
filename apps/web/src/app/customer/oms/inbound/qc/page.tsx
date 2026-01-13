"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Camera,
  ClipboardCheck,
  Package,
  ChevronLeft,
  ChevronRight,
  Save,
  RefreshCw,
} from "lucide-react";

interface QCItem {
  id: string;
  inboundNo: string;
  grnNo: string;
  skuCode: string;
  skuDescription: string;
  batchNo: string;
  receivedQty: number;
  qcStatus: "PENDING" | "PASSED" | "FAILED" | "PARTIAL";
  passedQty: number;
  failedQty: number;
  damageType: string;
  remarks: string;
  qcBy: string;
  qcDate: string;
  images: string[];
}

const demoQCItems: QCItem[] = [
  { id: "1", inboundNo: "INB-2024-001234", grnNo: "GRN-001", skuCode: "SKU-001", skuDescription: "Wireless Mouse", batchNo: "BATCH-001", receivedQty: 100, qcStatus: "PENDING", passedQty: 0, failedQty: 0, damageType: "", remarks: "", qcBy: "", qcDate: "", images: [] },
  { id: "2", inboundNo: "INB-2024-001234", grnNo: "GRN-001", skuCode: "SKU-002", skuDescription: "USB Keyboard", batchNo: "BATCH-002", receivedQty: 50, qcStatus: "PASSED", passedQty: 48, failedQty: 2, damageType: "Packaging Damage", remarks: "Minor scratches on box", qcBy: "Rahul Kumar", qcDate: "2024-01-08 11:30", images: ["img1.jpg"] },
  { id: "3", inboundNo: "INB-2024-001235", grnNo: "GRN-002", skuCode: "SKU-003", skuDescription: "Monitor Stand", batchNo: "BATCH-003", receivedQty: 25, qcStatus: "FAILED", passedQty: 0, failedQty: 25, damageType: "Manufacturing Defect", remarks: "All units have defective base", qcBy: "Priya Sharma", qcDate: "2024-01-08 10:15", images: ["img2.jpg", "img3.jpg"] },
  { id: "4", inboundNo: "INB-2024-001236", grnNo: "GRN-003", skuCode: "SKU-004", skuDescription: "Laptop Bag", batchNo: "BATCH-004", receivedQty: 75, qcStatus: "PARTIAL", passedQty: 60, failedQty: 15, damageType: "Physical Damage", remarks: "Some bags have torn zipper", qcBy: "Amit Patel", qcDate: "2024-01-08 09:45", images: [] },
  { id: "5", inboundNo: "INB-2024-001237", grnNo: "GRN-004", skuCode: "SKU-005", skuDescription: "Webcam HD", batchNo: "BATCH-005", receivedQty: 30, qcStatus: "PENDING", passedQty: 0, failedQty: 0, damageType: "", remarks: "", qcBy: "", qcDate: "", images: [] },
];

const damageTypes = [
  "Physical Damage",
  "Packaging Damage",
  "Manufacturing Defect",
  "Wrong Product",
  "Expired Product",
  "Quality Issue",
  "Other",
];

export default function InboundQCPage() {
  const [qcItems, setQCItems] = useState<QCItem[]>(demoQCItems);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QCItem | null>(null);
  const [showQCModal, setShowQCModal] = useState(false);

  // Filter states
  const [inboundNo, setInboundNo] = useState("");
  const [grnNo, setGrnNo] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [qcStatus, setQcStatus] = useState("all");

  // QC Form State
  const [qcPassedQty, setQcPassedQty] = useState(0);
  const [qcFailedQty, setQcFailedQty] = useState(0);
  const [qcDamageType, setQcDamageType] = useState("");
  const [qcRemarks, setQcRemarks] = useState("");

  const fetchQCItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/oms/inbound/qc");
      const result = await response.json();
      if (result.success && result.data?.items) {
        setQCItems(result.data.items);
      }
    } catch (error) {
      console.error("Error fetching QC items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQC = (item: QCItem) => {
    setSelectedItem(item);
    setQcPassedQty(item.passedQty || item.receivedQty);
    setQcFailedQty(item.failedQty || 0);
    setQcDamageType(item.damageType || "");
    setQcRemarks(item.remarks || "");
    setShowQCModal(true);
  };

  const handleSaveQC = () => {
    if (!selectedItem) return;

    const status = qcFailedQty === 0 ? "PASSED" :
      qcPassedQty === 0 ? "FAILED" : "PARTIAL";

    setQCItems(qcItems.map(item =>
      item.id === selectedItem.id
        ? {
            ...item,
            passedQty: qcPassedQty,
            failedQty: qcFailedQty,
            damageType: qcDamageType,
            remarks: qcRemarks,
            qcStatus: status,
            qcBy: "Current User",
            qcDate: new Date().toLocaleString(),
          }
        : item
    ));
    setShowQCModal(false);
    setSelectedItem(null);
  };

  const handleReset = () => {
    setInboundNo("");
    setGrnNo("");
    setSkuCode("");
    setQcStatus("all");
  };

  const filteredItems = qcItems.filter((item) => {
    const matchesInbound = !inboundNo || item.inboundNo.toLowerCase().includes(inboundNo.toLowerCase());
    const matchesGrn = !grnNo || item.grnNo.toLowerCase().includes(grnNo.toLowerCase());
    const matchesSku = !skuCode || item.skuCode.toLowerCase().includes(skuCode.toLowerCase());
    const matchesStatus = qcStatus === "all" || item.qcStatus === qcStatus;
    return matchesInbound && matchesGrn && matchesSku && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASSED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Passed
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">
            <AlertTriangle className="w-3 h-3" />
            Partial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
            <ClipboardCheck className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const pendingCount = qcItems.filter(i => i.qcStatus === "PENDING").length;
  const passedCount = qcItems.filter(i => i.qcStatus === "PASSED").length;
  const failedCount = qcItems.filter(i => i.qcStatus === "FAILED").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inbound QC</h1>
          <p className="text-sm text-gray-500">Quality check for received inbound items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchQCItems}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Pending QC</p>
              <p className="text-2xl font-bold text-yellow-800">{pendingCount}</p>
            </div>
            <ClipboardCheck className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">QC Passed</p>
              <p className="text-2xl font-bold text-green-800">{passedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">QC Failed</p>
              <p className="text-2xl font-bold text-red-800">{failedCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inbound No</label>
            <input
              type="text"
              value={inboundNo}
              onChange={(e) => setInboundNo(e.target.value)}
              placeholder="Enter inbound no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">GRN No</label>
            <input
              type="text"
              value={grnNo}
              onChange={(e) => setGrnNo(e.target.value)}
              placeholder="Enter GRN no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">SKU Code</label>
            <input
              type="text"
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              placeholder="Enter SKU..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">QC Status</label>
            <select
              value={qcStatus}
              onChange={(e) => setQcStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* QC Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading QC items...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Inbound/GRN</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">SKU Details</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Batch</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Received Qty</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Passed</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Failed</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">QC Details</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-blue-600">{item.inboundNo}</div>
                      <div className="text-xs text-gray-400">{item.grnNo}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{item.skuCode}</div>
                          <div className="text-xs text-gray-400">{item.skuDescription}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.batchNo}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{item.receivedQty}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${item.passedQty > 0 ? "text-green-600" : "text-gray-400"}`}>
                        {item.passedQty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${item.failedQty > 0 ? "text-red-600" : "text-gray-400"}`}>
                        {item.failedQty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(item.qcStatus)}</td>
                    <td className="px-4 py-3">
                      {item.qcBy ? (
                        <div className="text-xs">
                          <div className="text-gray-600">{item.qcBy}</div>
                          <div className="text-gray-400">{item.qcDate}</div>
                          {item.damageType && (
                            <div className="text-red-500 mt-1">{item.damageType}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Not inspected</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartQC(item)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Start QC"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
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

      {/* QC Modal */}
      {showQCModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Quality Check - {selectedItem.skuCode}</h3>
              <button
                onClick={() => setShowQCModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">SKU:</span>
                    <span className="ml-2 font-medium">{selectedItem.skuCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Batch:</span>
                    <span className="ml-2 font-medium">{selectedItem.batchNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Received Qty:</span>
                    <span className="ml-2 font-medium">{selectedItem.receivedQty}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Description:</span>
                    <span className="ml-2">{selectedItem.skuDescription}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passed Qty *</label>
                  <input
                    type="number"
                    value={qcPassedQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setQcPassedQty(val);
                      setQcFailedQty(selectedItem.receivedQty - val);
                    }}
                    max={selectedItem.receivedQty}
                    min={0}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Failed Qty</label>
                  <input
                    type="number"
                    value={qcFailedQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setQcFailedQty(val);
                      setQcPassedQty(selectedItem.receivedQty - val);
                    }}
                    max={selectedItem.receivedQty}
                    min={0}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              </div>

              {qcFailedQty > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Damage Type *</label>
                  <select
                    value={qcDamageType}
                    onChange={(e) => setQcDamageType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  >
                    <option value="">Select damage type...</option>
                    {damageTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={qcRemarks}
                  onChange={(e) => setQcRemarks(e.target.value)}
                  placeholder="Enter QC remarks..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click or drag to upload images</p>
                  <input type="file" accept="image/*" multiple className="hidden" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowQCModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQC}
                disabled={qcFailedQty > 0 && !qcDamageType}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 inline mr-1" />
                Save QC Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
