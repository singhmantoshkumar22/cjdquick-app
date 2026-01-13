"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ScanLine,
  Filter,
  X,
  Save,
  FolderInput,
  MapPin,
  Layers,
} from "lucide-react";

interface PutawayItem {
  id: string;
  putawayNo: string;
  inboundNo: string;
  poNo: string;
  orderNo: string;
  putawayType: "SELECTED_INBOUND" | "CANCELLED_ORDERS";
  putawayMode: "USER_DEFINED" | "SYSTEM_GENERATED";
  status: "OPEN" | "CONFIRMED" | "PART_CONFIRMED" | "CLOSED" | "CANCELLED";
  qcStatus: string;
  skuCode: string;
  skuDescription: string;
  qtyForPutaway: number;
  putawayQty: number;
  fromBin: string;
  toBin: string;
  toZone: string;
  locationCode: string;
  createdDate: string;
  confirmedDate: string;
  createdBy: string;
  confirmedBy: string;
}

const demoPutawayItems: PutawayItem[] = [
  { id: "1", putawayNo: "PUT-2024-001234", inboundNo: "INB-2024-001234", poNo: "PO-2024-001", orderNo: "", putawayType: "SELECTED_INBOUND", putawayMode: "SYSTEM_GENERATED", status: "OPEN", qcStatus: "PASSED", skuCode: "SKU-001", skuDescription: "Wireless Mouse", qtyForPutaway: 100, putawayQty: 0, fromBin: "QC-BIN-001", toBin: "", toZone: "ZONE-A", locationCode: "Warehouse A", createdDate: "2024-01-08 10:30", confirmedDate: "", createdBy: "Rahul Kumar", confirmedBy: "" },
  { id: "2", putawayNo: "PUT-2024-001235", inboundNo: "INB-2024-001235", poNo: "PO-2024-002", orderNo: "", putawayType: "SELECTED_INBOUND", putawayMode: "USER_DEFINED", status: "CONFIRMED", qcStatus: "PASSED", skuCode: "SKU-002", skuDescription: "USB Keyboard", qtyForPutaway: 50, putawayQty: 50, fromBin: "QC-BIN-002", toBin: "BIN-A001", toZone: "ZONE-A", locationCode: "Warehouse A", createdDate: "2024-01-08 09:15", confirmedDate: "2024-01-08 11:30", createdBy: "Priya Sharma", confirmedBy: "Amit Patel" },
  { id: "3", putawayNo: "PUT-2024-001236", inboundNo: "", poNo: "", orderNo: "ORD-2024-5678", putawayType: "CANCELLED_ORDERS", putawayMode: "SYSTEM_GENERATED", status: "PART_CONFIRMED", qcStatus: "PASSED", skuCode: "SKU-003", skuDescription: "Monitor Stand", qtyForPutaway: 25, putawayQty: 15, fromBin: "PICK-BIN-001", toBin: "BIN-B002", toZone: "ZONE-B", locationCode: "Warehouse A", createdDate: "2024-01-07 14:20", confirmedDate: "", createdBy: "Amit Patel", confirmedBy: "" },
  { id: "4", putawayNo: "PUT-2024-001237", inboundNo: "INB-2024-001237", poNo: "PO-2024-003", orderNo: "", putawayType: "SELECTED_INBOUND", putawayMode: "SYSTEM_GENERATED", status: "CLOSED", qcStatus: "PASSED", skuCode: "SKU-004", skuDescription: "Laptop Bag", qtyForPutaway: 75, putawayQty: 75, fromBin: "QC-BIN-003", toBin: "BIN-A002", toZone: "ZONE-A", locationCode: "Warehouse B", createdDate: "2024-01-07 11:45", confirmedDate: "2024-01-07 16:30", createdBy: "Sneha Gupta", confirmedBy: "Vikram Singh" },
  { id: "5", putawayNo: "PUT-2024-001238", inboundNo: "", poNo: "", orderNo: "ORD-2024-5679", putawayType: "CANCELLED_ORDERS", putawayMode: "USER_DEFINED", status: "CANCELLED", qcStatus: "N/A", skuCode: "SKU-005", skuDescription: "Webcam HD", qtyForPutaway: 30, putawayQty: 0, fromBin: "PICK-BIN-002", toBin: "", toZone: "", locationCode: "Warehouse A", createdDate: "2024-01-06 09:00", confirmedDate: "", createdBy: "Rahul Kumar", confirmedBy: "" },
];

const putawayStatusOptions = [
  { value: "all", label: "All Status" },
  { value: "OPEN", label: "Open" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PART_CONFIRMED", label: "Part Confirmed" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const putawayTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "SELECTED_INBOUND", label: "Selected Inbound" },
  { value: "CANCELLED_ORDERS", label: "Cancelled Orders" },
];

export default function ManagePutawayPage() {
  const [putawayItems, setPutawayItems] = useState<PutawayItem[]>(demoPutawayItems);
  const [loading, setLoading] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPutawayModal, setShowPutawayModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PutawayItem | null>(null);

  // Filter states - Basic
  const [putawayNo, setPutawayNo] = useState("");
  const [status, setStatus] = useState("all");
  const [putawayType, setPutawayType] = useState("all");
  const [locationCode, setLocationCode] = useState("all");
  const [createdDateFrom, setCreatedDateFrom] = useState("");
  const [createdDateTo, setCreatedDateTo] = useState("");
  const [confirmedDateFrom, setConfirmedDateFrom] = useState("");
  const [confirmedDateTo, setConfirmedDateTo] = useState("");

  // Filter states - Advanced
  const [inboundNo, setInboundNo] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [poNo, setPoNo] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [fromBin, setFromBin] = useState("");
  const [toBin, setToBin] = useState("");
  const [toZone, setToZone] = useState("");

  // Create Putaway form state
  const [createType, setCreateType] = useState<"SELECTED_INBOUND" | "CANCELLED_ORDERS">("SELECTED_INBOUND");
  const [createInboundNo, setCreateInboundNo] = useState("");
  const [createPutawayMode, setCreatePutawayMode] = useState<"USER_DEFINED" | "SYSTEM_GENERATED">("SYSTEM_GENERATED");
  const [createQcStatus, setCreateQcStatus] = useState("PASSED");
  const [createPutawayBin, setCreatePutawayBin] = useState("");

  // Putaway execution state
  const [execSkuCode, setExecSkuCode] = useState("");
  const [execToBin, setExecToBin] = useState("");
  const [execQty, setExecQty] = useState(0);
  const [execSameQty, setExecSameQty] = useState(true);
  const [execMode, setExecMode] = useState<"EACH" | "BULK">("BULK");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPutawayItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/oms/miscellaneous/putaway");
      const result = await response.json();
      if (result.success && result.data?.putaways) {
        setPutawayItems(result.data.putaways);
      }
    } catch (error) {
      console.error("Error fetching putaway items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPutawayNo("");
    setStatus("all");
    setPutawayType("all");
    setLocationCode("all");
    setCreatedDateFrom("");
    setCreatedDateTo("");
    setConfirmedDateFrom("");
    setConfirmedDateTo("");
    setInboundNo("");
    setSkuCode("");
    setPoNo("");
    setOrderNo("");
    setFromBin("");
    setToBin("");
    setToZone("");
  };

  const handleExport = () => {
    const csvContent = filteredItems.map(item =>
      `${item.putawayNo},${item.inboundNo},${item.putawayType},${item.status},${item.skuCode},${item.qtyForPutaway},${item.putawayQty},${item.fromBin},${item.toBin},${item.createdDate}`
    ).join("\n");
    const header = "Putaway No,Inbound No,Type,Status,SKU,Qty for Putaway,Putaway Qty,From Bin,To Bin,Created Date\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "putaway_list.csv";
    a.click();
  };

  const handleStartPutaway = (item: PutawayItem) => {
    setSelectedItem(item);
    setExecSkuCode(item.skuCode);
    setExecToBin(item.toBin || "");
    setExecQty(item.qtyForPutaway - item.putawayQty);
    setExecSameQty(true);
    setShowPutawayModal(true);
  };

  const handleExecutePutaway = () => {
    if (!selectedItem) return;

    setPutawayItems(putawayItems.map(item =>
      item.id === selectedItem.id ? {
        ...item,
        putawayQty: item.putawayQty + execQty,
        toBin: execToBin,
        status: (item.putawayQty + execQty) >= item.qtyForPutaway ? "CONFIRMED" : "PART_CONFIRMED",
        confirmedDate: new Date().toLocaleString(),
        confirmedBy: "Current User",
      } : item
    ));
    setShowPutawayModal(false);
    setSelectedItem(null);
  };

  const handleCreatePutaway = () => {
    const newPutaway: PutawayItem = {
      id: Date.now().toString(),
      putawayNo: `PUT-2024-${String(putawayItems.length + 1).padStart(6, "0")}`,
      inboundNo: createType === "SELECTED_INBOUND" ? createInboundNo : "",
      poNo: "",
      orderNo: createType === "CANCELLED_ORDERS" ? "ORD-XXXXX" : "",
      putawayType: createType,
      putawayMode: createPutawayMode,
      status: "OPEN",
      qcStatus: createQcStatus,
      skuCode: "SKU-XXX",
      skuDescription: "Product Description",
      qtyForPutaway: 0,
      putawayQty: 0,
      fromBin: createPutawayBin,
      toBin: "",
      toZone: "",
      locationCode: "Warehouse A",
      createdDate: new Date().toLocaleString(),
      confirmedDate: "",
      createdBy: "Current User",
      confirmedBy: "",
    };
    setPutawayItems([newPutaway, ...putawayItems]);
    setShowCreateModal(false);
    resetCreateForm();
  };

  const resetCreateForm = () => {
    setCreateType("SELECTED_INBOUND");
    setCreateInboundNo("");
    setCreatePutawayMode("SYSTEM_GENERATED");
    setCreateQcStatus("PASSED");
    setCreatePutawayBin("");
  };

  const filteredItems = putawayItems.filter((item) => {
    const matchesPutawayNo = !putawayNo || item.putawayNo.toLowerCase().includes(putawayNo.toLowerCase());
    const matchesStatus = status === "all" || item.status === status;
    const matchesType = putawayType === "all" || item.putawayType === putawayType;
    const matchesLocation = locationCode === "all" || item.locationCode === locationCode;
    const matchesInbound = !inboundNo || item.inboundNo.toLowerCase().includes(inboundNo.toLowerCase());
    const matchesSku = !skuCode || item.skuCode.toLowerCase().includes(skuCode.toLowerCase());
    const matchesPo = !poNo || item.poNo.toLowerCase().includes(poNo.toLowerCase());
    const matchesOrder = !orderNo || item.orderNo.toLowerCase().includes(orderNo.toLowerCase());
    const matchesFromBin = !fromBin || item.fromBin.toLowerCase().includes(fromBin.toLowerCase());
    const matchesToBin = !toBin || item.toBin.toLowerCase().includes(toBin.toLowerCase());
    const matchesToZone = !toZone || item.toZone.toLowerCase().includes(toZone.toLowerCase());
    return matchesPutawayNo && matchesStatus && matchesType && matchesLocation && matchesInbound && matchesSku && matchesPo && matchesOrder && matchesFromBin && matchesToBin && matchesToZone;
  });

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Confirmed</span>;
      case "CLOSED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"><CheckCircle className="w-3 h-3" />Closed</span>;
      case "PART_CONFIRMED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-orange-100 text-orange-700"><Clock className="w-3 h-3" />Part Confirmed</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-100 text-red-700"><XCircle className="w-3 h-3" />Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Open</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "SELECTED_INBOUND"
      ? <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">Inbound</span>
      : <span className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700">Cancelled Order</span>;
  };

  const openCount = putawayItems.filter(i => i.status === "OPEN").length;
  const partConfirmedCount = putawayItems.filter(i => i.status === "PART_CONFIRMED").length;
  const confirmedCount = putawayItems.filter(i => i.status === "CONFIRMED" || i.status === "CLOSED").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage Putaway</h1>
          <p className="text-sm text-gray-500">View and manage putaway operations for inbound items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={fetchPutawayItems}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-600">Open</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-2">{openCount}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-orange-600">Part Confirmed</span>
          </div>
          <p className="text-2xl font-bold text-orange-800 mt-2">{partConfirmedCount}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600">Confirmed/Closed</span>
          </div>
          <p className="text-2xl font-bold text-green-800 mt-2">{confirmedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Putaway No</label>
            <input
              type="text"
              value={putawayNo}
              onChange={(e) => setPutawayNo(e.target.value)}
              placeholder="Enter putaway no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              {putawayStatusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Putaway Type</label>
            <select
              value={putawayType}
              onChange={(e) => setPutawayType(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              {putawayTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Location Code</label>
            <select
              value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Locations</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
              <option value="Headoffice">Headoffice</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Created Date From</label>
            <input
              type="date"
              value={createdDateFrom}
              onChange={(e) => setCreatedDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
        </div>

        {/* Advanced Search Fields */}
        {showAdvancedSearch && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
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
              <label className="block text-xs text-gray-500 mb-1">PO No</label>
              <input
                type="text"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                placeholder="Enter PO no..."
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
              <label className="block text-xs text-gray-500 mb-1">Confirmed Date From</label>
              <input
                type="date"
                value={confirmedDateFrom}
                onChange={(e) => setConfirmedDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From Bin</label>
              <input
                type="text"
                value={fromBin}
                onChange={(e) => setFromBin(e.target.value)}
                placeholder="Enter from bin..."
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Bin</label>
              <input
                type="text"
                value={toBin}
                onChange={(e) => setToBin(e.target.value)}
                placeholder="Enter to bin..."
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Zone</label>
              <input
                type="text"
                value={toZone}
                onChange={(e) => setToZone(e.target.value)}
                placeholder="Enter to zone..."
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
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
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 inline mr-1" />
            {showAdvancedSearch ? "Basic Search" : "Advance Search"}
          </button>
        </div>
      </div>

      {/* Putaway Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading putaway records...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Putaway Details</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Reference</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Bin Info</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FolderInput className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-blue-600">{item.putawayNo}</div>
                            <div className="text-xs text-gray-400">{item.locationCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getTypeBadge(item.putawayType)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          {item.inboundNo && <div><span className="text-gray-400">INB:</span> {item.inboundNo}</div>}
                          {item.poNo && <div><span className="text-gray-400">PO:</span> {item.poNo}</div>}
                          {item.orderNo && <div><span className="text-gray-400">Order:</span> {item.orderNo}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.skuCode}</div>
                        <div className="text-xs text-gray-400">{item.skuDescription}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm font-medium">{item.putawayQty}/{item.qtyForPutaway}</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              item.putawayQty >= item.qtyForPutaway ? "bg-green-500" :
                              item.putawayQty > 0 ? "bg-blue-500" : "bg-gray-300"
                            }`}
                            style={{ width: `${(item.putawayQty / item.qtyForPutaway) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">From:</span>
                            <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded">{item.fromBin}</span>
                          </div>
                          {item.toBin && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">To:</span>
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{item.toBin}</span>
                            </div>
                          )}
                          {item.toZone && (
                            <div className="flex items-center gap-1">
                              <Layers className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-500">{item.toZone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <div>{item.createdDate}</div>
                          <div className="text-gray-400">{item.createdBy}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {(item.status === "OPEN" || item.status === "PART_CONFIRMED") && (
                            <button
                              onClick={() => handleStartPutaway(item)}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Execute Putaway"
                            >
                              <ScanLine className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-1 text-gray-400 hover:text-purple-600" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page ? "bg-blue-600 text-white" : "border hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Putaway Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Add New Putaway</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Putaway Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCreateType("SELECTED_INBOUND")}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      createType === "SELECTED_INBOUND" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium">Selected Inbound</div>
                    <div className="text-xs text-gray-500 mt-1">For items inbound into warehouse</div>
                  </button>
                  <button
                    onClick={() => setCreateType("CANCELLED_ORDERS")}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      createType === "CANCELLED_ORDERS" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium">Cancelled Orders</div>
                    <div className="text-xs text-gray-500 mt-1">For cancelled order items to return</div>
                  </button>
                </div>
              </div>

              {createType === "SELECTED_INBOUND" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inbound No *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createInboundNo}
                      onChange={(e) => setCreateInboundNo(e.target.value)}
                      placeholder="Search inbound no..."
                      className="flex-1 px-3 py-2 text-sm border rounded-lg"
                    />
                    <button className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Only inbounds with &apos;in process&apos; bin bucket will be shown</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Putaway Mode *</label>
                <select
                  value={createPutawayMode}
                  onChange={(e) => setCreatePutawayMode(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="SYSTEM_GENERATED">System Generated - System suggests putaway bin</option>
                  <option value="USER_DEFINED">User Defined - Manually enter putaway bin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QC Status *</label>
                <select
                  value={createQcStatus}
                  onChange={(e) => setCreateQcStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Putaway Bin</label>
                <input
                  type="text"
                  value={createPutawayBin}
                  onChange={(e) => setCreatePutawayBin(e.target.value)}
                  placeholder="Enter or scan putaway bin..."
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleCreatePutaway}
                disabled={createType === "SELECTED_INBOUND" && !createInboundNo}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Create Putaway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Putaway Modal */}
      {showPutawayModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Execute Putaway - {selectedItem.putawayNo}</h3>
              <button onClick={() => setShowPutawayModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">SKU:</span> <span className="font-medium">{selectedItem.skuCode}</span></div>
                  <div><span className="text-gray-500">From Bin:</span> <span className="font-medium">{selectedItem.fromBin}</span></div>
                  <div><span className="text-gray-500">Qty for Putaway:</span> <span className="font-medium">{selectedItem.qtyForPutaway}</span></div>
                  <div><span className="text-gray-500">Already Putaway:</span> <span className="font-medium">{selectedItem.putawayQty}</span></div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Qty Setting:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExecMode("BULK")}
                    className={`px-3 py-1 text-sm rounded ${execMode === "BULK" ? "bg-blue-600 text-white" : "border"}`}
                  >
                    Bulk
                  </button>
                  <button
                    onClick={() => setExecMode("EACH")}
                    className={`px-3 py-1 text-sm rounded ${execMode === "EACH" ? "bg-blue-600 text-white" : "border"}`}
                  >
                    Each
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code *</label>
                <input
                  type="text"
                  value={execSkuCode}
                  onChange={(e) => setExecSkuCode(e.target.value)}
                  placeholder="Scan SKU code..."
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameQty"
                  checked={execSameQty}
                  onChange={(e) => {
                    setExecSameQty(e.target.checked);
                    if (e.target.checked) {
                      setExecQty(selectedItem.qtyForPutaway - selectedItem.putawayQty);
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor="sameQty" className="text-sm text-gray-700">Putaway Quantity same as Qty for Putaway</label>
              </div>

              {!execSameQty && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Putaway Qty *</label>
                  <input
                    type="number"
                    value={execQty}
                    onChange={(e) => setExecQty(parseInt(e.target.value) || 0)}
                    max={selectedItem.qtyForPutaway - selectedItem.putawayQty}
                    min={1}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Bin *</label>
                <input
                  type="text"
                  value={execToBin}
                  onChange={(e) => setExecToBin(e.target.value)}
                  placeholder="Enter or scan destination bin..."
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button onClick={() => setShowPutawayModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleExecutePutaway}
                disabled={!execToBin || !execSkuCode}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 inline mr-1" />
                Confirm Putaway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
