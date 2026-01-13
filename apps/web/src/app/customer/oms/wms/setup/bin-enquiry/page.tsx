"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";

interface Bin {
  id: string;
  binCode: string;
  location: string;
  zone: string;
  binBucket: string;
  binType: string;
  approxUnits: number;
  commingleLot: boolean;
  commingleItem: boolean;
  isActive: boolean;
  defaultInbound: boolean;
  defaultReturn: boolean;
  aisle: string;
  quantity: number;
}

const demoBins: Bin[] = [
  { id: "1", binCode: "BIN-A001", location: "Warehouse A", zone: "ZONE-A", binBucket: "Good", binType: "RACK", approxUnits: 100, commingleLot: true, commingleItem: false, isActive: true, defaultInbound: true, defaultReturn: false, aisle: "A1", quantity: 85 },
  { id: "2", binCode: "BIN-A002", location: "Warehouse A", zone: "ZONE-A", binBucket: "Good", binType: "RACK", approxUnits: 100, commingleLot: true, commingleItem: true, isActive: true, defaultInbound: false, defaultReturn: false, aisle: "A1", quantity: 62 },
  { id: "3", binCode: "BIN-B001", location: "Warehouse A", zone: "ZONE-B", binBucket: "Cold", binType: "COLD_STORAGE", approxUnits: 50, commingleLot: false, commingleItem: false, isActive: true, defaultInbound: false, defaultReturn: false, aisle: "B1", quantity: 45 },
  { id: "4", binCode: "QC-BIN-001", location: "Warehouse A", zone: "ZONE-A", binBucket: "QC", binType: "QC", approxUnits: 200, commingleLot: true, commingleItem: true, isActive: true, defaultInbound: false, defaultReturn: false, aisle: "QC", quantity: 120 },
  { id: "5", binCode: "BIN-D001", location: "Warehouse B", zone: "ZONE-D", binBucket: "Damaged", binType: "RACK", approxUnits: 80, commingleLot: false, commingleItem: false, isActive: false, defaultInbound: false, defaultReturn: true, aisle: "D1", quantity: 15 },
];

export default function BinEnquiryPage() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchBins();
  }, []);

  const fetchBins = async () => {
    try {
      const response = await fetch("/api/oms/wms/bins");
      const result = await response.json();
      if (result.success && result.data?.bins) {
        setBins(result.data.bins);
      } else {
        setBins(demoBins);
      }
    } catch (error) {
      console.error("Error fetching bins:", error);
      setBins(demoBins);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export functionality
    const csvContent = bins.map(bin =>
      `${bin.binCode},${bin.location},${bin.zone},${bin.binBucket},${bin.binType},${bin.approxUnits},${bin.isActive}`
    ).join("\n");
    const header = "Bin Code,Location,Zone,Bin Bucket,Bin Type,Approx Units,Active\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bins_export.csv";
    a.click();
  };

  const filteredBins = bins.filter((bin) => {
    const matchesSearch = bin.binCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = zoneFilter === "all" || bin.zone === zoneFilter;
    return matchesSearch && matchesZone;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bin Enquiry</h1>
          <p className="text-sm text-gray-500">Search and view bin details in the warehouse</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Location</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none">
              <option>All Locations</option>
              <option>Warehouse A</option>
              <option>Warehouse B</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bin Code</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bin code..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zone</label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
            >
              <option value="all">All Zones</option>
              <option value="ZONE-A">Zone A</option>
              <option value="ZONE-B">Zone B</option>
              <option value="ZONE-C">Zone C</option>
              <option value="ZONE-D">Zone D</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bin Bucket</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none">
              <option>All Buckets</option>
              <option>Good</option>
              <option>Cold</option>
              <option>QC</option>
              <option>Damaged</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchBins()}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button
              onClick={() => { setSearchQuery(""); setZoneFilter("all"); }}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Advanced Search Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <Filter className="w-3 h-3" />
          {showAdvanced ? "Hide" : "Show"} Advanced Search
        </button>

        {/* Advanced Search Fields */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bin Type</label>
              <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none">
                <option>All Types</option>
                <option>RACK</option>
                <option>COLD_STORAGE</option>
                <option>QC</option>
                <option>FLOOR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
              <input
                type="number"
                placeholder="Min quantity"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Aisle</label>
              <input
                type="text"
                placeholder="Aisle"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                Default Bin for Inbound
              </label>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                Default Bin for Return
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bins Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading bins...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Bin Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Zone</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Bin Bucket</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Bin Type</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Approx Units</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Quantity</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Commingle Lot</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Commingle Item</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBins.map((bin) => (
                    <tr key={bin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-blue-600">{bin.binCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{bin.location}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{bin.zone}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          bin.binBucket === "Good" ? "bg-green-100 text-green-700" :
                          bin.binBucket === "Cold" ? "bg-blue-100 text-blue-700" :
                          bin.binBucket === "QC" ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {bin.binBucket}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{bin.binType}</td>
                      <td className="px-4 py-3 text-center font-medium">{bin.approxUnits}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">{bin.quantity}</span>
                        <span className="text-gray-400 text-xs"> / {bin.approxUnits}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {bin.commingleLot ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {bin.commingleItem ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                          bin.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {bin.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">Showing 1-{filteredBins.length} of {filteredBins.length} bins</div>
              <div className="flex items-center gap-2">
                <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
                <button className="p-1 border rounded hover:bg-gray-100">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
