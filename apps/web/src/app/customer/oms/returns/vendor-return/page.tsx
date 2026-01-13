"use client";

import { useState } from "react";
import {
  Save,
  X,
  Plus,
  Trash2,
  Search,
  Building2,
  Package,
  FileText,
  Upload,
  CheckCircle,
} from "lucide-react";

interface RTVLineItem {
  id: string;
  skuCode: string;
  skuDescription: string;
  batchNo: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
  binLocation: string;
}

const demoLineItems: RTVLineItem[] = [
  { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", batchNo: "BATCH-001", qty: 10, unitPrice: 500, totalPrice: 5000, reason: "Defective", binLocation: "BIN-A001" },
  { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", batchNo: "BATCH-002", qty: 5, unitPrice: 800, totalPrice: 4000, reason: "Damaged", binLocation: "BIN-A002" },
];

export default function VendorReturnCreatePage() {
  const [activeTab, setActiveTab] = useState<"create" | "documents" | "history">("create");
  const [formData, setFormData] = useState({
    vendorCode: "",
    vendorName: "",
    rtvType: "DEFECTIVE",
    locationCode: "",
    remarks: "",
    referenceNo: "",
  });
  const [lineItems, setLineItems] = useState<RTVLineItem[]>(demoLineItems);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showVendorSearch, setShowVendorSearch] = useState(false);

  const tabs = [
    { id: "create", label: "RTV Create/Edit", icon: FileText },
    { id: "documents", label: "Attached Documents", icon: Upload },
    { id: "history", label: "History", icon: FileText },
  ];

  const handleAddItem = () => {
    setShowAddItemModal(true);
  };

  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const totalValue = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQty = lineItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendor Return Create/Edit</h1>
          <p className="text-sm text-gray-500">Create or edit Return to Vendor (RTV) records</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Save RTV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "create" && (
        <div className="space-y-4">
          {/* Header Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">RTV Header Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.vendorCode}
                    onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                    placeholder="Enter or search vendor"
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setShowVendorSearch(true)}
                    className="p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  placeholder="Auto-populated"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">RTV Type *</label>
                <select
                  value={formData.rtvType}
                  onChange={(e) => setFormData({ ...formData, rtvType: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="DEFECTIVE">Defective</option>
                  <option value="EXCESS">Excess Stock</option>
                  <option value="EXPIRY">Near Expiry</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location *</label>
                <select
                  value={formData.locationCode}
                  onChange={(e) => setFormData({ ...formData, locationCode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Location</option>
                  <option value="WH-DELHI">WH-DELHI</option>
                  <option value="WH-MUMBAI">WH-MUMBAI</option>
                  <option value="WH-BANGALORE">WH-BANGALORE</option>
                  <option value="WH-CHENNAI">WH-CHENNAI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reference No</label>
                <input
                  type="text"
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                  placeholder="Enter reference number"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Enter remarks"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-sm font-semibold text-gray-700">Line Items</h2>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">SKU Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Batch No</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Unit Price</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Bin</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No items added. Click &quot;Add Item&quot; to add line items.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-blue-600">{item.skuCode}</td>
                        <td className="px-4 py-3">{item.skuDescription}</td>
                        <td className="px-4 py-3">{item.batchNo}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 0;
                              setLineItems(
                                lineItems.map((li) =>
                                  li.id === item.id
                                    ? { ...li, qty: newQty, totalPrice: newQty * li.unitPrice }
                                    : li
                                )
                              );
                            }}
                            className="w-20 px-2 py-1 text-sm text-center border rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{item.totalPrice.toLocaleString()}</td>
                        <td className="px-4 py-3">{item.reason}</td>
                        <td className="px-4 py-3 text-xs">{item.binLocation}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex justify-end gap-8">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Items</p>
                  <p className="text-lg font-bold text-gray-900">{lineItems.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="text-lg font-bold text-gray-900">{totalQty}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Value</p>
                  <p className="text-lg font-bold text-blue-600">₹{totalValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center py-12">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
            <p className="text-sm text-gray-500 mb-4">Drag and drop files here or click to browse</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Choose Files
            </button>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No history available for new RTV</p>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Add Item to RTV</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU Code *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter SKU Code"
                      className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button className="p-2 border rounded-lg hover:bg-gray-50">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Batch No</label>
                  <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Select Batch</option>
                    <option value="BATCH-001">BATCH-001</option>
                    <option value="BATCH-002">BATCH-002</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                  <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Select Reason</option>
                    <option value="Defective">Defective</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Expiry">Near Expiry</option>
                    <option value="Excess">Excess Stock</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
