"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Filter,
} from "lucide-react";

interface MoveHistory {
  id: string;
  skuCode: string;
  skuDescription: string;
  moveDate: string;
  siteLocation: string;
  moveQty: number;
  fromZone: string;
  toZone: string;
  fromBin: string;
  toBin: string;
  putawayNumber: string;
  movedBy: string;
}

const demoMoveHistory: MoveHistory[] = [
  { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", moveDate: "2024-01-08 10:30", siteLocation: "Warehouse A", moveQty: 25, fromZone: "ZONE-A", toZone: "ZONE-B", fromBin: "BIN-A001", toBin: "BIN-B001", putawayNumber: "PUT-001", movedBy: "Rahul Kumar" },
  { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", moveDate: "2024-01-08 11:15", siteLocation: "Warehouse A", moveQty: 15, fromZone: "ZONE-B", toZone: "ZONE-A", fromBin: "BIN-B002", toBin: "BIN-A002", putawayNumber: "PUT-002", movedBy: "Priya Sharma" },
  { id: "3", skuCode: "SKU-003", skuDescription: "Monitor Stand", moveDate: "2024-01-07 14:20", siteLocation: "Warehouse B", moveQty: 10, fromZone: "ZONE-C", toZone: "ZONE-D", fromBin: "BIN-C001", toBin: "BIN-D001", putawayNumber: "PUT-003", movedBy: "Amit Patel" },
  { id: "4", skuCode: "SKU-004", skuDescription: "Laptop Bag", moveDate: "2024-01-07 16:45", siteLocation: "Warehouse A", moveQty: 50, fromZone: "QC", toZone: "ZONE-A", fromBin: "QC-BIN-001", toBin: "BIN-A003", putawayNumber: "PUT-004", movedBy: "System" },
];

export default function InventoryMoveHistoryPage() {
  const [history, setHistory] = useState<MoveHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/oms/wms/inventory-move-history");
      const result = await response.json();
      if (result.success && result.data?.history) {
        setHistory(result.data.history);
      } else {
        setHistory(demoMoveHistory);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      setHistory(demoMoveHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = history.map(item =>
      `${item.skuCode},${item.moveDate},${item.moveQty},${item.fromZone},${item.toZone},${item.fromBin},${item.toBin},${item.movedBy}`
    ).join("\n");
    const header = "SKU Code,Move Date,Quantity,From Zone,To Zone,From Bin,To Bin,Moved By\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_move_history.csv";
    a.click();
  };

  const filteredHistory = history.filter((item) =>
    item.skuCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.skuDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory Move History</h1>
          <p className="text-sm text-gray-500">View history of inventory movements between zones and bins</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add New Move
          </button>
        </div>
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
            <label className="block text-xs text-gray-500 mb-1">Move Date</label>
            <input type="date" className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Site Location</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg">
              <option>All Locations</option>
              <option>Warehouse A</option>
              <option>Warehouse B</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Zone</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg">
              <option>All Zones</option>
              <option>ZONE-A</option>
              <option>ZONE-B</option>
              <option>ZONE-C</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Zone</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg">
              <option>All Zones</option>
              <option>ZONE-A</option>
              <option>ZONE-B</option>
              <option>ZONE-C</option>
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
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Style Code</label>
              <input type="text" placeholder="Style code..." className="w-full px-3 py-2 text-sm border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Putaway Number</label>
              <input type="text" placeholder="Putaway no..." className="w-full px-3 py-2 text-sm border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From Bin</label>
              <input type="text" placeholder="From bin..." className="w-full px-3 py-2 text-sm border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Bin</label>
              <input type="text" placeholder="To bin..." className="w-full px-3 py-2 text-sm border rounded-lg" />
            </div>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading move history...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">SKU Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Move Date</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Zone Movement</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Bin Movement</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Moved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-600">{item.skuCode}</td>
                      <td className="px-4 py-3 text-gray-600">{item.skuDescription}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.moveDate}</td>
                      <td className="px-4 py-3 text-center font-medium">{item.moveQty}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.fromZone}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{item.toZone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.fromBin}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{item.toBin}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.movedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">Showing 1-{filteredHistory.length} of {filteredHistory.length} records</div>
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
