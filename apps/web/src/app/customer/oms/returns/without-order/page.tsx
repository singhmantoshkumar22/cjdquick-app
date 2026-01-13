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
  User,
  MapPin,
  FileQuestion,
} from "lucide-react";

interface ReturnLineItem {
  id: string;
  skuCode: string;
  skuDescription: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
  condition: string;
}

export default function ReturnWithoutOrderPage() {
  const [activeTab, setActiveTab] = useState<"create" | "customer" | "documents">("create");
  const [formData, setFormData] = useState({
    returnType: "WALK_IN",
    channel: "Manual",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    city: "",
    pincode: "",
    courierPartner: "",
    awbNo: "",
    remarks: "",
    locationCode: "",
    invoiceNo: "",
    invoiceDate: "",
  });
  const [lineItems, setLineItems] = useState<ReturnLineItem[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    skuCode: "",
    skuDescription: "",
    qty: 1,
    unitPrice: 0,
    reason: "Defective",
    condition: "Good",
  });

  const tabs = [
    { id: "create", label: "Return Details", icon: FileText },
    { id: "customer", label: "Customer Information", icon: User },
    { id: "documents", label: "Documents", icon: Upload },
  ];

  const handleAddItem = () => {
    if (newItem.skuCode && newItem.qty > 0) {
      setLineItems([
        ...lineItems,
        {
          id: Date.now().toString(),
          skuCode: newItem.skuCode,
          skuDescription: newItem.skuDescription,
          qty: newItem.qty,
          unitPrice: newItem.unitPrice,
          totalPrice: newItem.qty * newItem.unitPrice,
          reason: newItem.reason,
          condition: newItem.condition,
        },
      ]);
      setNewItem({
        skuCode: "",
        skuDescription: "",
        qty: 1,
        unitPrice: 0,
        reason: "Defective",
        condition: "Good",
      });
      setShowAddItemModal(false);
    }
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
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-orange-600" />
            Return Without Order
          </h1>
          <p className="text-sm text-gray-500">Create return for walk-in customers or items without original order</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Create Return
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
          {/* Return Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Return Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Return Type *</label>
                <select
                  value={formData.returnType}
                  onChange={(e) => setFormData({ ...formData, returnType: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="WALK_IN">Walk-in Return</option>
                  <option value="COURIER">Courier Return</option>
                  <option value="WARRANTY">Warranty Return</option>
                  <option value="EXCHANGE">Exchange</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
                <input
                  type="text"
                  value={formData.channel}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50"
                  readOnly
                />
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Original Invoice No</label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  placeholder="If available"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Courier Partner</label>
                <select
                  value={formData.courierPartner}
                  onChange={(e) => setFormData({ ...formData, courierPartner: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select (if applicable)</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="Ekart">Ekart</option>
                  <option value="DTDC">DTDC</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">AWB No</label>
                <input
                  type="text"
                  value={formData.awbNo}
                  onChange={(e) => setFormData({ ...formData, awbNo: e.target.value })}
                  placeholder="If applicable"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-sm font-semibold text-gray-700">Return Items</h2>
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
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Unit Price</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Condition</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No items added. Click &quot;Add Item&quot; to add return items.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-blue-600">{item.skuCode}</td>
                        <td className="px-4 py-3">{item.skuDescription}</td>
                        <td className="px-4 py-3 text-center">{item.qty}</td>
                        <td className="px-4 py-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{item.totalPrice.toLocaleString()}</td>
                        <td className="px-4 py-3">{item.reason}</td>
                        <td className="px-4 py-3">{item.condition}</td>
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

            {lineItems.length > 0 && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex justify-end gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Items</p>
                    <p className="text-lg font-bold text-gray-900">{lineItems.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Qty</p>
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

      {activeTab === "customer" && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
              <input
                type="text"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="Enter email (optional)"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pt-4 border-t">
            <MapPin className="w-4 h-4" />
            Address (Optional)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Pincode"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center py-12">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
            <p className="text-sm text-gray-500 mb-4">Upload original invoice, product images, or other documents</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Choose Files
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Add Return Item</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SKU Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItem.skuCode}
                    onChange={(e) => setNewItem({ ...newItem, skuCode: e.target.value })}
                    placeholder="Enter or search SKU"
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button className="p-2 border rounded-lg hover:bg-gray-50">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={newItem.skuDescription}
                  onChange={(e) => setNewItem({ ...newItem, skuDescription: e.target.value })}
                  placeholder="Product description"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({ ...newItem, qty: parseInt(e.target.value) || 0 })}
                    min="1"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price</label>
                  <input
                    type="number"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                  <select
                    value={newItem.reason}
                    onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Defective">Defective</option>
                    <option value="Wrong Item">Wrong Item</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Size Issue">Size Issue</option>
                    <option value="Not Required">Not Required</option>
                    <option value="Warranty">Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                  <select
                    value={newItem.condition}
                    onChange={(e) => setNewItem({ ...newItem, condition: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Good">Good</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Used">Used</option>
                    <option value="Sealed">Sealed</option>
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
                onClick={handleAddItem}
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
