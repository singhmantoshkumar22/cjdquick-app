"use client";

import { useState } from "react";
import {
  Save,
  X,
  Plus,
  Trash2,
  Search,
  Package,
  FileText,
  Upload,
  ArrowLeftRight,
  Truck,
  MapPin,
} from "lucide-react";

interface STOLineItem {
  id: string;
  skuCode: string;
  skuDescription: string;
  availableQty: number;
  transferQty: number;
  unitPrice: number;
  totalPrice: number;
  batchNo: string;
  binLocation: string;
}

const demoLineItems: STOLineItem[] = [
  { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", availableQty: 500, transferQty: 100, unitPrice: 500, totalPrice: 50000, batchNo: "BATCH-001", binLocation: "BIN-A001" },
  { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", availableQty: 300, transferQty: 50, unitPrice: 800, totalPrice: 40000, batchNo: "BATCH-002", binLocation: "BIN-A002" },
];

export default function STOOrderCreatePage() {
  const [activeTab, setActiveTab] = useState<"create" | "documents" | "history">("create");
  const [formData, setFormData] = useState({
    stoType: "WAREHOUSE_TO_WAREHOUSE",
    sourceLocation: "",
    destinationLocation: "",
    priority: "NORMAL",
    expectedDate: "",
    transporterName: "",
    vehicleNo: "",
    driverName: "",
    driverPhone: "",
    remarks: "",
  });
  const [lineItems, setLineItems] = useState<STOLineItem[]>(demoLineItems);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  const tabs = [
    { id: "create", label: "STO Create/Edit", icon: FileText },
    { id: "documents", label: "Documents", icon: Upload },
    { id: "history", label: "History", icon: FileText },
  ];

  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const totalValue = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQty = lineItems.reduce((sum, item) => sum + item.transferQty, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-green-600" />
            STO Order Create/Edit
          </h1>
          <p className="text-sm text-gray-500">Create or edit Stock Transfer Orders between locations</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Submit for Approval
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
          {/* Transfer Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Transfer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">STO Type *</label>
                <select
                  value={formData.stoType}
                  onChange={(e) => setFormData({ ...formData, stoType: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="WAREHOUSE_TO_WAREHOUSE">Warehouse to Warehouse</option>
                  <option value="WAREHOUSE_TO_STORE">Warehouse to Store</option>
                  <option value="STORE_TO_WAREHOUSE">Store to Warehouse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Source Location *</label>
                <select
                  value={formData.sourceLocation}
                  onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Source</option>
                  <option value="WH-DELHI">WH-DELHI</option>
                  <option value="WH-MUMBAI">WH-MUMBAI</option>
                  <option value="WH-BANGALORE">WH-BANGALORE</option>
                  <option value="WH-CHENNAI">WH-CHENNAI</option>
                  <option value="WH-KOLKATA">WH-KOLKATA</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Destination Location *</label>
                <select
                  value={formData.destinationLocation}
                  onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Destination</option>
                  <option value="WH-DELHI">WH-DELHI</option>
                  <option value="WH-MUMBAI">WH-MUMBAI</option>
                  <option value="WH-BANGALORE">WH-BANGALORE</option>
                  <option value="WH-CHENNAI">WH-CHENNAI</option>
                  <option value="WH-KOLKATA">WH-KOLKATA</option>
                  <option value="STORE-PUNE-01">STORE-PUNE-01</option>
                  <option value="STORE-HYD-01">STORE-HYD-01</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Enter any remarks"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Transport Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Transport Information (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transporter</label>
                <select
                  value={formData.transporterName}
                  onChange={(e) => setFormData({ ...formData, transporterName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Transporter</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="Ekart">Ekart</option>
                  <option value="DTDC">DTDC</option>
                  <option value="Self">Self Transport</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle No</label>
                <input
                  type="text"
                  value={formData.vehicleNo}
                  onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                  placeholder="Enter vehicle number"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Driver Name</label>
                <input
                  type="text"
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  placeholder="Enter driver name"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Driver Phone</label>
                <input
                  type="text"
                  value={formData.driverPhone}
                  onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                  placeholder="Enter driver phone"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-sm font-semibold text-gray-700">Transfer Items</h2>
              <button
                onClick={() => setShowAddItemModal(true)}
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
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Available</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Transfer Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Unit Price</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Batch</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Bin</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No items added. Click &quot;Add Item&quot; to add transfer items.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-blue-600">{item.skuCode}</td>
                        <td className="px-4 py-3">{item.skuDescription}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{item.availableQty}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.transferQty}
                            max={item.availableQty}
                            onChange={(e) => {
                              const newQty = Math.min(parseInt(e.target.value) || 0, item.availableQty);
                              setLineItems(
                                lineItems.map((li) =>
                                  li.id === item.id
                                    ? { ...li, transferQty: newQty, totalPrice: newQty * li.unitPrice }
                                    : li
                                )
                              );
                            }}
                            className="w-20 px-2 py-1 text-sm text-center border rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{item.totalPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">{item.batchNo}</td>
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
            {lineItems.length > 0 && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex justify-end gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total SKUs</p>
                    <p className="text-lg font-bold text-gray-900">{lineItems.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Transfer Qty</p>
                    <p className="text-lg font-bold text-gray-900">{totalQty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-lg font-bold text-blue-600">₹{totalValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center py-12">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
            <p className="text-sm text-gray-500 mb-4">Upload invoices, packing lists, or other documents</p>
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
            <p>No history available for new STO</p>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Add Item to STO</h3>
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
                      placeholder="Enter or search SKU"
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
                    <option value="BATCH-001">BATCH-001 (Qty: 500)</option>
                    <option value="BATCH-002">BATCH-002 (Qty: 300)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Available Qty</label>
                  <input
                    type="text"
                    value="500"
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Transfer Qty *</label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
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
