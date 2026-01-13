"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle,
} from "lucide-react";

interface LottableValidation {
  id: string;
  lottableValCode: string;
  description: string;
  validationType: string;
  isActive: boolean;
  createdAt: string;
}

const demoLottables: LottableValidation[] = [
  { id: "1", lottableValCode: "FIFO", description: "First In First Out - Oldest stock dispatched first", validationType: "DATE_BASED", isActive: true, createdAt: "2024-01-01" },
  { id: "2", lottableValCode: "LIFO", description: "Last In First Out - Newest stock dispatched first", validationType: "DATE_BASED", isActive: true, createdAt: "2024-01-01" },
  { id: "3", lottableValCode: "FEFO", description: "First Expiry First Out - Based on expiry date", validationType: "EXPIRY_BASED", isActive: true, createdAt: "2024-01-02" },
  { id: "4", lottableValCode: "BATCH-01", description: "Batch validation for perishables", validationType: "BATCH_BASED", isActive: true, createdAt: "2024-01-03" },
  { id: "5", lottableValCode: "LOT-MFG", description: "Manufacturing lot validation", validationType: "MANUFACTURING", isActive: false, createdAt: "2024-01-04" },
];

export default function LottableValidationPage() {
  const [lottables, setLottables] = useState<LottableValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLottable, setNewLottable] = useState({ lottableValCode: "", description: "", validationType: "DATE_BASED" });

  useEffect(() => {
    fetchLottables();
  }, []);

  const fetchLottables = async () => {
    try {
      const response = await fetch("/api/oms/wms/lottables");
      const result = await response.json();
      if (result.success && result.data?.lottables) {
        setLottables(result.data.lottables);
      } else {
        setLottables(demoLottables);
      }
    } catch (error) {
      console.error("Error fetching lottables:", error);
      setLottables(demoLottables);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLottable = async () => {
    try {
      const response = await fetch("/api/oms/wms/lottables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLottable),
      });
      if (response.ok) {
        fetchLottables();
        setShowAddModal(false);
        setNewLottable({ lottableValCode: "", description: "", validationType: "DATE_BASED" });
      }
    } catch (error) {
      console.error("Error adding lottable:", error);
    }
  };

  const filteredLottables = lottables.filter((item) =>
    item.lottableValCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lottable Validation</h1>
          <p className="text-sm text-gray-500">Manage lot parameters and batch validations (FIFO, LIFO, FEFO)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Lottable Val Code</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input
              type="text"
              placeholder="Search by description..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchLottables()}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Lottables Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading lottable validations...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Lottable Val Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Validation Type</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Created At</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLottables.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-blue-600">{item.lottableValCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.description}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {item.validationType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                          item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          <CheckCircle className="w-3 h-3" />
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{item.createdAt}</td>
                      <td className="px-4 py-3 text-center">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">Showing 1-{filteredLottables.length} of {filteredLottables.length} validations</div>
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

      {/* Add Lottable Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Lottable Validation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lottable Val Code *</label>
                <input
                  type="text"
                  value={newLottable.lottableValCode}
                  onChange={(e) => setNewLottable({ ...newLottable, lottableValCode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., FIFO, LIFO, FEFO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newLottable.description}
                  onChange={(e) => setNewLottable({ ...newLottable, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validation Type</label>
                <select
                  value={newLottable.validationType}
                  onChange={(e) => setNewLottable({ ...newLottable, validationType: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                >
                  <option value="DATE_BASED">Date Based</option>
                  <option value="EXPIRY_BASED">Expiry Based</option>
                  <option value="BATCH_BASED">Batch Based</option>
                  <option value="MANUFACTURING">Manufacturing</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLottable}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
