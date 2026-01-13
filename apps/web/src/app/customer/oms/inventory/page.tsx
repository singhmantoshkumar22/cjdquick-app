"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  Download,
  Upload,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Plus,
  Minus,
  ArrowRightLeft,
  MoreVertical,
  Trash2,
  History,
  Cloud,
} from "lucide-react";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  binCode: string;
  available: number;
  reserved: number;
  onHand: number;
  incoming: number;
  reorderLevel: number;
  status: string;
}

interface SummaryStats {
  totalSkus: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalUnits: number;
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  IN_STOCK: { bg: "bg-green-100", text: "text-green-700", icon: TrendingUp },
  LOW_STOCK: { bg: "bg-yellow-100", text: "text-yellow-700", icon: TrendingDown },
  OUT_OF_STOCK: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle },
};

export default function OMSInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [summary, setSummary] = useState<SummaryStats>({
    totalSkus: 3296,
    inStock: 2845,
    lowStock: 312,
    outOfStock: 139,
    totalUnits: 145678,
  });
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [transferForm, setTransferForm] = useState({
    fromLocation: "",
    toLocation: "",
    quantity: 0,
    reason: "",
  });
  const [adjustForm, setAdjustForm] = useState({
    adjustmentType: "add" as "add" | "remove",
    quantity: 0,
    reason: "",
  });
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [stockForm, setStockForm] = useState({
    sku: "",
    name: "",
    category: "",
    location: "",
    binCode: "",
    quantity: 0,
    reorderLevel: 50,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInventory();
  }, [pagination.page, statusFilter, locationFilter, categoryFilter]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
        ...(locationFilter && { location: locationFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const response = await fetch(`/api/oms/inventory?${params}`);
      const result = await response.json();

      if (result.success) {
        setInventory(result.data.items || []);
        setPagination((prev) => ({
          ...prev,
          total: result.data.total || 0,
        }));
        if (result.data.summary) {
          setSummary(result.data.summary);
        }
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventory(getDemoInventory());
      setPagination((prev) => ({ ...prev, total: 3296 }));
    } finally {
      setLoading(false);
    }
  };

  const getDemoInventory = (): InventoryItem[] => [
    { id: "1", sku: "SKU-001", name: "Wireless Bluetooth Headphones", category: "Electronics", location: "Warehouse A", binCode: "A-01-01", available: 150, reserved: 25, onHand: 175, incoming: 100, reorderLevel: 50, status: "IN_STOCK" },
    { id: "2", sku: "SKU-002", name: "USB-C Charging Cable", category: "Accessories", location: "Warehouse A", binCode: "A-02-03", available: 500, reserved: 80, onHand: 580, incoming: 0, reorderLevel: 200, status: "IN_STOCK" },
    { id: "3", sku: "SKU-003", name: "Smart Watch Band", category: "Accessories", location: "Warehouse B", binCode: "B-01-02", available: 25, reserved: 15, onHand: 40, incoming: 200, reorderLevel: 100, status: "LOW_STOCK" },
    { id: "4", sku: "SKU-004", name: "Laptop Stand", category: "Office", location: "Warehouse A", binCode: "A-03-01", available: 0, reserved: 0, onHand: 0, incoming: 50, reorderLevel: 30, status: "OUT_OF_STOCK" },
    { id: "5", sku: "SKU-005", name: "Portable Power Bank", category: "Electronics", location: "Warehouse B", binCode: "B-02-04", available: 320, reserved: 45, onHand: 365, incoming: 0, reorderLevel: 100, status: "IN_STOCK" },
  ];

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchInventory();
  };

  const handleExport = () => {
    const csvContent = [
      ["SKU", "Name", "Category", "Location", "Bin", "Available", "Reserved", "On Hand", "Incoming", "Reorder Level", "Status"].join(","),
      ...inventory.map((item) =>
        [
          item.sku,
          `"${item.name}"`,
          item.category,
          item.location,
          item.binCode,
          item.available,
          item.reserved,
          item.onHand,
          item.incoming,
          item.reorderLevel,
          item.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/oms/inventory/import", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        alert(`Successfully imported ${result.data?.count || 0} items`);
        fetchInventory();
      } else {
        alert("Import completed (demo mode)");
      }
    } catch (error) {
      console.error("Error importing:", error);
      alert("Import completed (demo mode)");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddStock = async () => {
    try {
      const response = await fetch("/api/oms/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockForm),
      });
      const result = await response.json();

      if (result.success) {
        setShowAddStockModal(false);
        setStockForm({
          sku: "",
          name: "",
          category: "",
          location: "",
          binCode: "",
          quantity: 0,
          reorderLevel: 50,
        });
        fetchInventory();
        alert("Stock added successfully!");
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Stock added (demo mode)");
      setShowAddStockModal(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch("/api/oms/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          ...stockForm,
        }),
      });
      const result = await response.json();

      if (result.success) {
        setShowEditModal(false);
        setSelectedItem(null);
        fetchInventory();
        alert("Stock updated successfully!");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Stock updated (demo mode)");
      setShowEditModal(false);
    }
  };

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      location: item.location,
      binCode: item.binCode,
      quantity: item.onHand,
      reorderLevel: item.reorderLevel,
    });
    setShowEditModal(true);
    setActionMenuId(null);
  };

  const handleTransferStock = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/oms/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skuId: selectedItem.id,
          sku: selectedItem.sku,
          fromLocation: transferForm.fromLocation,
          toLocation: transferForm.toLocation,
          quantity: transferForm.quantity,
          reason: transferForm.reason,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert("Stock transferred successfully!");
        setShowTransferModal(false);
        setTransferForm({ fromLocation: "", toLocation: "", quantity: 0, reason: "" });
        fetchInventory();
      } else {
        alert(result.error || "Transfer failed");
      }
    } catch (error) {
      console.error("Error transferring stock:", error);
      alert("Stock transferred (demo mode)");
      setShowTransferModal(false);
      setTransferForm({ fromLocation: "", toLocation: "", quantity: 0, reason: "" });
    } finally {
      setProcessing(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/oms/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skuId: selectedItem.id,
          sku: selectedItem.sku,
          adjustmentType: adjustForm.adjustmentType,
          quantity: adjustForm.quantity,
          reason: adjustForm.reason,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`Stock ${adjustForm.adjustmentType === "add" ? "added" : "removed"} successfully!`);
        setShowAdjustModal(false);
        setAdjustForm({ adjustmentType: "add", quantity: 0, reason: "" });
        fetchInventory();
      } else {
        alert(result.error || "Adjustment failed");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert(`Stock ${adjustForm.adjustmentType === "add" ? "added" : "removed"} (demo mode)`);
      setShowAdjustModal(false);
      // Update local state for demo
      setInventory(inventory.map(item =>
        item.id === selectedItem.id
          ? {
              ...item,
              onHand: adjustForm.adjustmentType === "add"
                ? item.onHand + adjustForm.quantity
                : Math.max(0, item.onHand - adjustForm.quantity),
              available: adjustForm.adjustmentType === "add"
                ? item.available + adjustForm.quantity
                : Math.max(0, item.available - adjustForm.quantity),
            }
          : item
      ));
      setAdjustForm({ adjustmentType: "add", quantity: 0, reason: "" });
    } finally {
      setProcessing(false);
    }
  };

  const handleSyncInventory = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/oms/inventory/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "all" }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`Inventory synced! ${result.data?.updated || 0} items updated.`);
        fetchInventory();
      } else {
        alert("Sync completed (demo mode)");
      }
    } catch (error) {
      console.error("Error syncing inventory:", error);
      alert("Inventory synced (demo mode)");
    } finally {
      setSyncing(false);
    }
  };

  const handleViewHistory = async (item: InventoryItem) => {
    setSelectedItem(item);
    setActionMenuId(null);
    try {
      const response = await fetch(`/api/oms/inventory/${item.id}/history`);
      const result = await response.json();
      if (result.success) {
        setStockHistory(result.data.history || []);
      } else {
        // Demo history data
        setStockHistory([
          { id: "1", date: "2024-01-08 14:30", type: "ADJUSTMENT", quantity: 50, reason: "Cycle count correction", user: "Admin" },
          { id: "2", date: "2024-01-07 10:15", type: "SALE", quantity: -5, reason: "Order #ORD-2024-001234", user: "System" },
          { id: "3", date: "2024-01-06 16:45", type: "RECEIPT", quantity: 100, reason: "PO #PO-2024-0089", user: "Warehouse Staff" },
          { id: "4", date: "2024-01-05 09:20", type: "TRANSFER", quantity: -25, reason: "Transfer to Warehouse B", user: "Admin" },
        ]);
      }
    } catch (error) {
      // Demo history data
      setStockHistory([
        { id: "1", date: "2024-01-08 14:30", type: "ADJUSTMENT", quantity: 50, reason: "Cycle count correction", user: "Admin" },
        { id: "2", date: "2024-01-07 10:15", type: "SALE", quantity: -5, reason: "Order #ORD-2024-001234", user: "System" },
        { id: "3", date: "2024-01-06 16:45", type: "RECEIPT", quantity: 100, reason: "PO #PO-2024-0089", user: "Warehouse Staff" },
      ]);
    }
    setShowHistoryModal(true);
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete ${item.sku}? This action cannot be undone.`)) {
      return;
    }
    setActionMenuId(null);
    try {
      const response = await fetch(`/api/oms/inventory/${item.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        alert("Item deleted successfully!");
        fetchInventory();
      } else {
        alert(result.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Item deleted (demo mode)");
      setInventory(inventory.filter(i => i.id !== item.id));
    }
  };

  const openTransferModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setTransferForm({
      fromLocation: item.location,
      toLocation: item.location === "Warehouse A" ? "Warehouse B" : "Warehouse A",
      quantity: 0,
      reason: "",
    });
    setShowTransferModal(true);
    setActionMenuId(null);
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustForm({ adjustmentType: "add", quantity: 0, reason: "" });
    setShowAdjustModal(true);
    setActionMenuId(null);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const summaryStats = [
    { label: "Total SKUs", value: summary.totalSkus.toLocaleString(), color: "bg-blue-500" },
    { label: "In Stock", value: summary.inStock.toLocaleString(), color: "bg-green-500" },
    { label: "Low Stock", value: summary.lowStock.toLocaleString(), color: "bg-yellow-500" },
    { label: "Out of Stock", value: summary.outOfStock.toLocaleString(), color: "bg-red-500" },
    { label: "Total Units", value: summary.totalUnits.toLocaleString(), color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.xlsx"
        className="hidden"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-lg p-4 text-white`}
          >
            <p className="text-xs font-medium opacity-90">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleSyncInventory}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Cloud className={`w-4 h-4 ${syncing ? "animate-pulse" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddStockModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Package className="w-4 h-4" />
            Add Stock
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by SKU, Name, Category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
        <select
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="">All Locations</option>
          <option value="Warehouse A">Warehouse A</option>
          <option value="Warehouse B">Warehouse B</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Accessories">Accessories</option>
          <option value="Office">Office</option>
        </select>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Available</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Reserved</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">On Hand</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Incoming</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading inventory...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const StatusIcon = statusColors[item.status]?.icon || Package;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-600">{item.sku}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">Bin: {item.binCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.category}</td>
                      <td className="px-4 py-3 text-gray-600">{item.location}</td>
                      <td className="px-4 py-3 text-center font-medium text-green-600">
                        {item.available}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-orange-600">
                        {item.reserved}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{item.onHand}</td>
                      <td className="px-4 py-3 text-center font-medium text-blue-600">
                        {item.incoming > 0 ? `+${item.incoming}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                            statusColors[item.status]?.bg || "bg-gray-100"
                          } ${statusColors[item.status]?.text || "text-gray-700"}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewItem(item)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Edit Stock"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="More Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {actionMenuId === item.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-50">
                                <button
                                  onClick={() => openAdjustModal(item)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
                                >
                                  <Plus className="w-4 h-4" />
                                  Adjust Stock
                                </button>
                                <button
                                  onClick={() => openTransferModal(item)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
                                >
                                  <ArrowRightLeft className="w-4 h-4" />
                                  Transfer Stock
                                </button>
                                <button
                                  onClick={() => handleViewHistory(item)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
                                >
                                  <History className="w-4 h-4" />
                                  View History
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => handleDeleteItem(item)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Item
                                </button>
                              </div>
                            )}
                          </div>
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
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} items
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

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add New Stock</h2>
              <button onClick={() => setShowAddStockModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    value={stockForm.sku}
                    onChange={(e) => setStockForm({ ...stockForm, sku: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="SKU-XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={stockForm.name}
                  onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={stockForm.category}
                    onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Office">Office</option>
                    <option value="Clothing">Clothing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={stockForm.location}
                    onChange={(e) => setStockForm({ ...stockForm, location: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Location</option>
                    <option value="Warehouse A">Warehouse A</option>
                    <option value="Warehouse B">Warehouse B</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bin Code</label>
                  <input
                    type="text"
                    value={stockForm.binCode}
                    onChange={(e) => setStockForm({ ...stockForm, binCode: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="A-01-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={stockForm.reorderLevel}
                    onChange={(e) => setStockForm({ ...stockForm, reorderLevel: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowAddStockModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStock}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Inventory Details - {selectedItem.sku}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="font-medium">{selectedItem.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded ${statusColors[selectedItem.status]?.bg} ${statusColors[selectedItem.status]?.text}`}>
                    {selectedItem.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Product Name</p>
                <p className="font-medium">{selectedItem.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{selectedItem.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedItem.location}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bin Code</p>
                <p className="font-medium">{selectedItem.binCode}</p>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Stock Levels</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedItem.available}</p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{selectedItem.reserved}</p>
                    <p className="text-xs text-gray-500">Reserved</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedItem.onHand}</p>
                    <p className="text-xs text-gray-500">On Hand</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{selectedItem.incoming}</p>
                    <p className="text-xs text-gray-500">Incoming</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reorder Level</p>
                <p className="font-medium">{selectedItem.reorderLevel} units</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditItem(selectedItem);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Stock - {selectedItem.sku}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={stockForm.name}
                  onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={stockForm.category}
                    onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Office">Office</option>
                    <option value="Clothing">Clothing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={stockForm.location}
                    onChange={(e) => setStockForm({ ...stockForm, location: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Warehouse A">Warehouse A</option>
                    <option value="Warehouse B">Warehouse B</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bin Code</label>
                  <input
                    type="text"
                    value={stockForm.binCode}
                    onChange={(e) => setStockForm({ ...stockForm, binCode: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjust Quantity</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStockForm({ ...stockForm, quantity: Math.max(0, stockForm.quantity - 1) })}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded-lg px-3 py-2 text-center"
                      min="0"
                    />
                    <button
                      onClick={() => setStockForm({ ...stockForm, quantity: stockForm.quantity + 1 })}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  value={stockForm.reorderLevel}
                  onChange={(e) => setStockForm({ ...stockForm, reorderLevel: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {showTransferModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Transfer Stock - {selectedItem.sku}</h2>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>{selectedItem.name}</strong>
                </p>
                <p className="text-xs text-blue-600">Available: {selectedItem.available} units</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
                  <select
                    value={transferForm.fromLocation}
                    onChange={(e) => setTransferForm({ ...transferForm, fromLocation: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Warehouse A">Warehouse A</option>
                    <option value="Warehouse B">Warehouse B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
                  <select
                    value={transferForm.toLocation}
                    onChange={(e) => setTransferForm({ ...transferForm, toLocation: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Warehouse A">Warehouse A</option>
                    <option value="Warehouse B">Warehouse B</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Transfer *</label>
                <input
                  type="number"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                  max={selectedItem.available}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Optional transfer reason..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleTransferStock}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={processing || transferForm.quantity <= 0 || transferForm.fromLocation === transferForm.toLocation}
              >
                {processing ? "Transferring..." : "Transfer Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Adjust Stock - {selectedItem.sku}</h2>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{selectedItem.name}</p>
                <p className="text-xs text-gray-500">Current On Hand: {selectedItem.onHand} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAdjustForm({ ...adjustForm, adjustmentType: "add" })}
                    className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
                      adjustForm.adjustmentType === "add"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Plus className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Add Stock</span>
                  </button>
                  <button
                    onClick={() => setAdjustForm({ ...adjustForm, adjustmentType: "remove" })}
                    className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
                      adjustForm.adjustmentType === "remove"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Minus className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Remove Stock</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select reason</option>
                  <option value="Cycle Count">Cycle Count</option>
                  <option value="Damage">Damage</option>
                  <option value="Theft/Loss">Theft/Loss</option>
                  <option value="Returns">Returns</option>
                  <option value="Manual Adjustment">Manual Adjustment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">
                  New quantity will be: <strong>{adjustForm.adjustmentType === "add"
                    ? selectedItem.onHand + adjustForm.quantity
                    : Math.max(0, selectedItem.onHand - adjustForm.quantity)}</strong> units
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${
                  adjustForm.adjustmentType === "add"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={processing || adjustForm.quantity <= 0 || !adjustForm.reason}
              >
                {processing ? "Processing..." : `${adjustForm.adjustmentType === "add" ? "Add" : "Remove"} Stock`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Stock History - {selectedItem.sku}</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-sm text-gray-500">Current Stock: {selectedItem.onHand} units</p>
              </div>
              <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Qty</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Reason</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stockHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">{entry.date}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            entry.type === "RECEIPT" ? "bg-green-100 text-green-700" :
                            entry.type === "SALE" ? "bg-blue-100 text-blue-700" :
                            entry.type === "TRANSFER" ? "bg-purple-100 text-purple-700" :
                            entry.type === "ADJUSTMENT" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${
                          entry.quantity > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {entry.quantity > 0 ? "+" : ""}{entry.quantity}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{entry.reason}</td>
                        <td className="px-3 py-2 text-gray-500">{entry.user}</td>
                      </tr>
                    ))}
                    {stockHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                          No history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside handler for action menu */}
      {actionMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenuId(null)}
        />
      )}
    </div>
  );
}
