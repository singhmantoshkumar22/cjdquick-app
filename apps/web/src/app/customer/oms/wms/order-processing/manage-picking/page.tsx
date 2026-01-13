"use client";

import { useState } from "react";
import {
  ScanLine,
  Package,
  CheckCircle,
  ClipboardList,
  Truck,
  Save,
  Image,
} from "lucide-react";

interface ProcessedOrder {
  id: string;
  picklistNumber: string;
  orderNumber: string;
  deliveryNo: string;
  skuCode: string;
  quantity: number;
  pickedQty: number;
  status: string;
  pickedAt: string;
}

const recentProcessed: ProcessedOrder[] = [
  { id: "1", picklistNumber: "PCK-2024-001234", orderNumber: "ORD-2024-001234", deliveryNo: "DEL-001", skuCode: "SKU-001", quantity: 2, pickedQty: 2, status: "PACKED", pickedAt: "10 mins ago" },
  { id: "2", picklistNumber: "PCK-2024-001234", orderNumber: "ORD-2024-001235", deliveryNo: "DEL-002", skuCode: "SKU-002", quantity: 1, pickedQty: 1, status: "PACKED", pickedAt: "15 mins ago" },
  { id: "3", picklistNumber: "PCK-2024-001233", orderNumber: "ORD-2024-001233", deliveryNo: "DEL-003", skuCode: "SKU-003", quantity: 3, pickedQty: 3, status: "PACKED", pickedAt: "25 mins ago" },
];

export default function ManagePickingPage() {
  const [pickingMethod, setPickingMethod] = useState<"sku" | "order">("sku");
  const [picklistNumber, setPicklistNumber] = useState("");
  const [scannedPicklist, setScannedPicklist] = useState<any>(null);

  // Pack form state
  const [transporter, setTransporter] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [boxes, setBoxes] = useState(1);
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [height, setHeight] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const handleScanPicklist = () => {
    if (!picklistNumber) return;

    // Simulate scanning result
    setScannedPicklist({
      picklistNumber: picklistNumber,
      orderNumber: "ORD-2024-001240",
      deliveryNo: "DEL-2024-001240",
      items: [
        { skuCode: "SKU-001", productName: "Wireless Mouse", quantity: 2, bin: "BIN-A001" },
        { skuCode: "SKU-002", productName: "USB Keyboard", quantity: 1, bin: "BIN-A002" },
      ],
    });
  };

  const handleConfirmPacking = async () => {
    try {
      await fetch("/api/oms/wms/picking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          picklistNumber,
          transporter,
          trackingNo,
          boxes,
          weight,
          dimensions: { length, breadth, height },
          shippingAddress,
        }),
      });
      // Reset form
      setPicklistNumber("");
      setScannedPicklist(null);
      setTransporter("");
      setTrackingNo("");
      setBoxes(1);
      setWeight("");
    } catch (error) {
      console.error("Error confirming packing:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage Picking</h1>
          <p className="text-sm text-gray-500">Scan picklist and pack orders for shipment</p>
        </div>
      </div>

      {/* Picking Method Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setPickingMethod("sku")}
          className={`px-4 py-2 text-sm rounded-lg ${
            pickingMethod === "sku" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          By SKU
        </button>
        <button
          onClick={() => setPickingMethod("order")}
          className={`px-4 py-2 text-sm rounded-lg ${
            pickingMethod === "order" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          By ORDER
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scan Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Scan Picklist */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Scan Picklist</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={picklistNumber}
                  onChange={(e) => setPicklistNumber(e.target.value)}
                  placeholder="Scan or enter picklist number..."
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && handleScanPicklist()}
                />
              </div>
              <button
                onClick={handleScanPicklist}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Scan
              </button>
            </div>
          </div>

          {/* Scanned Picklist Details */}
          {scannedPicklist && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Packing Details</h2>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {scannedPicklist.picklistNumber}
                </span>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Order</label>
                  <p className="font-medium">{scannedPicklist.orderNumber}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Delivery No</label>
                  <p className="font-medium">{scannedPicklist.deliveryNo}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-medium mb-2">Items to Pick</h3>
                <div className="space-y-2">
                  {scannedPicklist.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{item.skuCode}</p>
                          <p className="text-xs text-gray-500">{item.productName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Qty: {item.quantity}</p>
                        <p className="text-xs text-gray-500">Bin: {item.bin}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Packing Form */}
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transporter *</label>
                    <select
                      value={transporter}
                      onChange={(e) => setTransporter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      <option value="">Select Transporter</option>
                      <option value="Delhivery">Delhivery</option>
                      <option value="BlueDart">BlueDart</option>
                      <option value="FedEx">FedEx</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking No</label>
                    <input
                      type="text"
                      value={trackingNo}
                      onChange={(e) => setTrackingNo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      placeholder="Auto-generated or enter"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No of Boxes</label>
                    <input
                      type="number"
                      value={boxes}
                      onChange={(e) => setBoxes(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      step="0.1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">L x B x H (cm)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        placeholder="L"
                        className="flex-1 px-3 py-2 text-sm border rounded-lg"
                      />
                      <input
                        type="number"
                        value={breadth}
                        onChange={(e) => setBreadth(e.target.value)}
                        placeholder="B"
                        className="flex-1 px-3 py-2 text-sm border rounded-lg"
                      />
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="H"
                        className="flex-1 px-3 py-2 text-sm border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    rows={2}
                    placeholder="Enter shipping address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
                      <Image className="w-4 h-4" />
                      Choose Image
                    </button>
                    <span className="text-xs text-gray-500">Optional</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmPacking}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm Packing
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Last 20 Processed Orders</h2>
          <div className="space-y-3">
            {recentProcessed.map((order) => (
              <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{order.orderNumber}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{order.skuCode}</span>
                  <span>Qty: {order.pickedQty}/{order.quantity}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{order.pickedAt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
