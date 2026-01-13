"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CheckCircle,
  Edit,
} from "lucide-react";

interface ReceiptValidation {
  id: string;
  validationCode: string;
  description: string;
  condition: string;
  tolerancePercent: number;
  isActive: boolean;
  createdAt: string;
}

const demoReceipts: ReceiptValidation[] = [
  { id: "1", validationCode: "RV-QTY-CHECK", description: "Quantity match validation", condition: "QUANTITY_MATCH", tolerancePercent: 5, isActive: true, createdAt: "2024-01-01" },
  { id: "2", validationCode: "RV-EXPIRY", description: "Expiry date validation (min 6 months)", condition: "EXPIRY_DATE", tolerancePercent: 0, isActive: true, createdAt: "2024-01-01" },
  { id: "3", validationCode: "RV-DAMAGE", description: "Damage check validation", condition: "NO_DAMAGE", tolerancePercent: 2, isActive: true, createdAt: "2024-01-02" },
  { id: "4", validationCode: "RV-SKU-MATCH", description: "SKU barcode validation", condition: "SKU_BARCODE", tolerancePercent: 0, isActive: true, createdAt: "2024-01-03" },
  { id: "5", validationCode: "RV-WEIGHT", description: "Weight tolerance validation", condition: "WEIGHT_CHECK", tolerancePercent: 3, isActive: false, createdAt: "2024-01-04" },
];

export default function ReceiptValidationPage() {
  const [receipts, setReceipts] = useState<ReceiptValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await fetch("/api/oms/wms/receipt-validation");
      const result = await response.json();
      if (result.success && result.data?.receipts) {
        setReceipts(result.data.receipts);
      } else {
        setReceipts(demoReceipts);
      }
    } catch (error) {
      console.error("Error fetching receipt validations:", error);
      setReceipts(demoReceipts);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/oms/wms/receipt-validation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receipts),
      });
      if (response.ok) {
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving receipt validations:", error);
    }
  };

  const handleExport = () => {
    const csvContent = receipts.map(r =>
      `${r.validationCode},${r.description},${r.condition},${r.tolerancePercent},${r.isActive}`
    ).join("\n");
    const header = "Validation Code,Description,Condition,Tolerance %,Active\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipt_validations.csv";
    a.click();
  };

  const filteredReceipts = receipts.filter((item) =>
    item.validationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Receipt Validation</h1>
          <p className="text-sm text-gray-500">Configure inward/receiving validation conditions for Purchase Orders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Validation Code</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Condition Type</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none">
              <option value="all">All Conditions</option>
              <option value="QUANTITY_MATCH">Quantity Match</option>
              <option value="EXPIRY_DATE">Expiry Date</option>
              <option value="NO_DAMAGE">No Damage</option>
              <option value="SKU_BARCODE">SKU Barcode</option>
              <option value="WEIGHT_CHECK">Weight Check</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchReceipts()}
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

      {/* Validations Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading receipt validations...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Validation Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Condition</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Tolerance %</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredReceipts.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-blue-600">{item.validationCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.description}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {item.condition.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={item.tolerancePercent}
                            onChange={(e) => {
                              const updated = receipts.map(r =>
                                r.id === item.id ? { ...r, tolerancePercent: Number(e.target.value) } : r
                              );
                              setReceipts(updated);
                            }}
                            className="w-16 px-2 py-1 text-sm border rounded text-center"
                          />
                        ) : (
                          <span className={`font-medium ${item.tolerancePercent > 0 ? "text-orange-600" : "text-gray-500"}`}>
                            {item.tolerancePercent}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingId === item.id ? (
                          <select
                            value={item.isActive ? "active" : "inactive"}
                            onChange={(e) => {
                              const updated = receipts.map(r =>
                                r.id === item.id ? { ...r, isActive: e.target.value === "active" } : r
                              );
                              setReceipts(updated);
                            }}
                            className="px-2 py-1 text-sm border rounded"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                            item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            <CheckCircle className="w-3 h-3" />
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                          className={`p-1 ${editingId === item.id ? "text-green-600" : "text-gray-400 hover:text-blue-600"}`}
                        >
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
              <div className="text-sm text-gray-500">Showing 1-{filteredReceipts.length} of {filteredReceipts.length} validations</div>
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
