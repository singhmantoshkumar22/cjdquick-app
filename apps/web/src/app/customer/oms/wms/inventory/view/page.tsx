"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
} from "lucide-react";

interface InventoryItem {
  id: string;
  skuCode: string;
  skuDescription: string;
  mfgSkuCode: string;
  bin: string;
  zone: string;
  invBucket: string;
  lot: string;
  totalStock: number;
  freeStock: number;
  allocatedStock: number;
  damagedStock: number;
}

const demoInventory: InventoryItem[] = [
  { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", mfgSkuCode: "MFG-001", bin: "BIN-A001", zone: "ZONE-A", invBucket: "Good", lot: "LOT-2024-001", totalStock: 150, freeStock: 120, allocatedStock: 25, damagedStock: 5 },
  { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", mfgSkuCode: "MFG-002", bin: "BIN-A002", zone: "ZONE-A", invBucket: "Good", lot: "LOT-2024-002", totalStock: 200, freeStock: 180, allocatedStock: 18, damagedStock: 2 },
  { id: "3", skuCode: "SKU-003", skuDescription: "Monitor Stand", mfgSkuCode: "MFG-003", bin: "BIN-B001", zone: "ZONE-B", invBucket: "Good", lot: "LOT-2024-003", totalStock: 75, freeStock: 60, allocatedStock: 15, damagedStock: 0 },
  { id: "4", skuCode: "SKU-004", skuDescription: "Laptop Bag", mfgSkuCode: "MFG-004", bin: "BIN-A003", zone: "ZONE-A", invBucket: "Good", lot: "LOT-2024-004", totalStock: 100, freeStock: 85, allocatedStock: 10, damagedStock: 5 },
  { id: "5", skuCode: "SKU-005", skuDescription: "Webcam HD", mfgSkuCode: "MFG-005", bin: "BIN-C001", zone: "ZONE-C", invBucket: "Good", lot: "LOT-2024-005", totalStock: 50, freeStock: 45, allocatedStock: 3, damagedStock: 2 },
];

const viewTabs = [
  { id: "sku", label: "By SKU" },
  { id: "sku_bin", label: "By SKU BIN" },
  { id: "sku_lot", label: "By SKU LOT" },
  { id: "sku_bin_lot", label: "By SKU BIN LOT" },
  { id: "sku_imei", label: "By SKU IMEI" },
  { id: "sku_unique", label: "By SKU UNIQUE NO" },
  { id: "marketplace", label: "Marketplace Inventory" },
  { id: "bom", label: "By SKU BOM" },
];

export default function InventoryViewPage() {
  const [activeTab, setActiveTab] = useState("sku");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInventory();
  }, [activeTab]);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/oms/wms/inventory?view=${activeTab}`);
      const result = await response.json();
      if (result.success && result.data?.inventory) {
        setInventory(result.data.inventory);
      } else {
        setInventory(demoInventory);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventory(demoInventory);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = inventory.map(item =>
      `${item.skuCode},${item.skuDescription},${item.bin},${item.zone},${item.totalStock},${item.freeStock},${item.allocatedStock}`
    ).join("\n");
    const header = "SKU Code,Description,Bin,Zone,Total Stock,Free Stock,Allocated\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_${activeTab}.csv`;
    a.click();
  };

  const filteredInventory = inventory.filter((item) =>
    item.skuCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.skuDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory View</h1>
          <p className="text-sm text-gray-500">View real-time inventory status across the warehouse</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex flex-wrap gap-2">
        {viewTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs rounded-lg ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">SKU Code</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">SKU Description</label>
            <input type="text" placeholder="Description..." className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          {activeTab.includes("bin") && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bin</label>
              <select className="w-full px-3 py-2 text-sm border rounded-lg">
                <option>All Bins</option>
                <option>BIN-A001</option>
                <option>BIN-A002</option>
                <option>BIN-B001</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zone</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg">
              <option>All Zones</option>
              <option>ZONE-A</option>
              <option>ZONE-B</option>
              <option>ZONE-C</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inv Bucket</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg">
              <option>All Buckets</option>
              <option>Good</option>
              <option>Damaged</option>
              <option>QC</option>
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

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading inventory...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">SKU Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    {activeTab.includes("bin") && <th className="px-4 py-3 text-left font-medium text-gray-600">Bin</th>}
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Zone</th>
                    {activeTab.includes("lot") && <th className="px-4 py-3 text-left font-medium text-gray-600">Lot</th>}
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Total Stock</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Free Stock</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Allocated</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Damaged</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-blue-600">{item.skuCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.skuDescription}</td>
                      {activeTab.includes("bin") && (
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.bin}</span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{item.zone}</span>
                      </td>
                      {activeTab.includes("lot") && (
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{item.lot}</span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center font-medium">{item.totalStock}</td>
                      <td className="px-4 py-3 text-center text-green-600 font-medium">{item.freeStock}</td>
                      <td className="px-4 py-3 text-center text-orange-600 font-medium">{item.allocatedStock}</td>
                      <td className="px-4 py-3 text-center text-red-600 font-medium">{item.damagedStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">Showing 1-{filteredInventory.length} of {filteredInventory.length} items</div>
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
