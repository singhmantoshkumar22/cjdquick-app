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
  Truck,
} from "lucide-react";

interface ReturnLineItem {
  id: string;
  skuCode: string;
  skuDescription: string;
  orderedQty: number;
  returnQty: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
  condition: string;
}

const demoLineItems: ReturnLineItem[] = [
  { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", orderedQty: 2, returnQty: 1, unitPrice: 500, totalPrice: 500, reason: "Defective", condition: "Damaged" },
  { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", orderedQty: 1, returnQty: 1, unitPrice: 800, totalPrice: 800, reason: "Wrong Item", condition: "Good" },
];

export default function ReturnCreatePage() {
  const [activeTab, setActiveTab] = useState<"create" | "customer" | "documents" | "history">("create");
  const [formData, setFormData] = useState({
    orderNo: "",
    channel: "",
    returnType: "CUSTOMER_RETURN",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupAddress: "",
    pickupCity: "",
    pickupPincode: "",
    courierPartner: "",
    awbNo: "",
    remarks: "",
    locationCode: "",
  });
  const [lineItems, setLineItems] = useState<ReturnLineItem[]>(demoLineItems);
  const [showOrderSearch, setShowOrderSearch] = useState(false);

  const tabs = [
    { id: "create", label: "Return Create/Edit", icon: FileText },
    { id: "customer", label: "Customer Details", icon: User },
    { id: "documents", label: "Documents", icon: Upload },
    { id: "history", label: "History", icon: FileText },
  ];

  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const totalValue = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQty = lineItems.reduce((sum, item) => sum + item.returnQty, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Return Create/Edit</h1>
          <p className="text-sm text-gray-500">Create or edit customer return requests</p>
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
            Submit Return
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
          {/* Order Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Order No *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.orderNo}
                    onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                    placeholder="Enter or search order"
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setShowOrderSearch(true)}
                    className="p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
                <input
                  type="text"
                  value={formData.channel}
                  placeholder="Auto-populated"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Return Type *</label>
                <select
                  value={formData.returnType}
                  onChange={(e) => setFormData({ ...formData, returnType: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CUSTOMER_RETURN">Customer Return</option>
                  <option value="RTO">RTO</option>
                  <option value="EXCHANGE">Exchange</option>
                  <option value="REFUND">Refund</option>
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
            </div>
          </div>

          {/* Logistics Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Logistics Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Courier Partner</label>
                <select
                  value={formData.courierPartner}
                  onChange={(e) => setFormData({ ...formData, courierPartner: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Courier</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="Ekart">Ekart</option>
                  <option value="DTDC">DTDC</option>
                  <option value="Xpressbees">Xpressbees</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">AWB No</label>
                <input
                  type="text"
                  value={formData.awbNo}
                  onChange={(e) => setFormData({ ...formData, awbNo: e.target.value })}
                  placeholder="Enter AWB No"
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
              <h2 className="text-sm font-semibold text-gray-700">Return Items</h2>
              <span className="text-xs text-gray-500">Items from order will be auto-populated</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">SKU Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Ordered Qty</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Return Qty</th>
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
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        Search for an order to load items
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-blue-600">{item.skuCode}</td>
                        <td className="px-4 py-3">{item.skuDescription}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{item.orderedQty}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.returnQty}
                            max={item.orderedQty}
                            onChange={(e) => {
                              const newQty = Math.min(parseInt(e.target.value) || 0, item.orderedQty);
                              setLineItems(
                                lineItems.map((li) =>
                                  li.id === item.id
                                    ? { ...li, returnQty: newQty, totalPrice: newQty * li.unitPrice }
                                    : li
                                )
                              );
                            }}
                            className="w-20 px-2 py-1 text-sm text-center border rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{item.totalPrice.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <select
                            value={item.reason}
                            onChange={(e) => {
                              setLineItems(
                                lineItems.map((li) =>
                                  li.id === item.id ? { ...li, reason: e.target.value } : li
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-xs border rounded"
                          >
                            <option value="Defective">Defective</option>
                            <option value="Wrong Item">Wrong Item</option>
                            <option value="Size Issue">Size Issue</option>
                            <option value="Damaged">Damaged</option>
                            <option value="Not Required">Not Required</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.condition}
                            onChange={(e) => {
                              setLineItems(
                                lineItems.map((li) =>
                                  li.id === item.id ? { ...li, condition: e.target.value } : li
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-xs border rounded"
                          >
                            <option value="Good">Good</option>
                            <option value="Damaged">Damaged</option>
                            <option value="Used">Used</option>
                            <option value="Sealed">Sealed</option>
                          </select>
                        </td>
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
                  <p className="text-xs text-gray-500">Total Return Qty</p>
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

      {activeTab === "customer" && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Customer name"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="text"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="Phone number"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="Email address"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pt-4 border-t">
            <MapPin className="w-4 h-4" />
            Pickup Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <textarea
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                placeholder="Full pickup address"
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input
                type="text"
                value={formData.pickupCity}
                onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pickupPincode}
                onChange={(e) => setFormData({ ...formData, pickupPincode: e.target.value })}
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
            <p className="text-sm text-gray-500 mb-4">Upload images, invoices, or other supporting documents</p>
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
            <p>No history available for new return</p>
          </div>
        </div>
      )}
    </div>
  );
}
