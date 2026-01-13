"use client";

import { useState, useEffect } from "react";
import {
  Search,
  PackageOpen,
  Package,
  CheckCircle,
  Scan,
  Printer,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react";

interface PackingItem {
  id: string;
  orderNo: string;
  skuCode: string;
  skuDescription: string;
  qty: number;
  packedQty: number;
  binLocation: string;
  status: "PENDING" | "IN_PROGRESS" | "PACKED";
}

interface OrderDetails {
  orderNo: string;
  channel: string;
  customerName: string;
  city: string;
}

interface StationStats {
  ordersPacked: number;
  itemsPacked: number;
  avgPackTime: string;
  accuracy: number;
}

const demoPackingItems: PackingItem[] = [
  { id: "1", orderNo: "ORD-2024-005678", skuCode: "SKU-001", skuDescription: "Wireless Mouse - Black", qty: 2, packedQty: 0, binLocation: "BIN-A001", status: "PENDING" },
  { id: "2", orderNo: "ORD-2024-005678", skuCode: "SKU-002", skuDescription: "USB Keyboard - Mechanical", qty: 1, packedQty: 0, binLocation: "BIN-A002", status: "PENDING" },
  { id: "3", orderNo: "ORD-2024-005678", skuCode: "SKU-003", skuDescription: "Monitor Stand - Adjustable", qty: 1, packedQty: 0, binLocation: "BIN-B001", status: "PENDING" },
];

export default function PackingStationPage() {
  const [scanInput, setScanInput] = useState("");
  const [orderSearchInput, setOrderSearchInput] = useState("");
  const [currentOrder, setCurrentOrder] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [packingQueue, setPackingQueue] = useState<string[]>([]);
  const [stationStats, setStationStats] = useState<StationStats>({
    ordersPacked: 45,
    itemsPacked: 128,
    avgPackTime: "2.5 min",
    accuracy: 99.2,
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedStation, setSelectedStation] = useState("Station A1");

  const totalItems = packingItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPacked = packingItems.reduce((sum, item) => sum + item.packedQty, 0);

  useEffect(() => {
    fetchPackingQueue();
    fetchStationStats();
  }, []);

  const fetchPackingQueue = async () => {
    try {
      const response = await fetch("/api/oms/fulfillment/packing/queue");
      const result = await response.json();
      if (result.success) {
        setPackingQueue(result.data.orders || []);
      } else {
        setPackingQueue(["ORD-2024-005679", "ORD-2024-005680", "ORD-2024-005681", "ORD-2024-005682"]);
      }
    } catch (error) {
      setPackingQueue(["ORD-2024-005679", "ORD-2024-005680", "ORD-2024-005681", "ORD-2024-005682"]);
    }
  };

  const fetchStationStats = async () => {
    try {
      const response = await fetch(`/api/oms/fulfillment/packing/stats?station=${selectedStation}`);
      const result = await response.json();
      if (result.success && result.data) {
        setStationStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching station stats:", error);
    }
  };

  const loadOrder = async (orderNo: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/oms/fulfillment/packing/order?orderNo=${orderNo}`);
      const result = await response.json();
      if (result.success) {
        setCurrentOrder(orderNo);
        setOrderDetails(result.data.orderDetails);
        setPackingItems(result.data.items || []);
      } else {
        // Demo fallback
        setCurrentOrder(orderNo);
        setOrderDetails({ orderNo, channel: "Amazon", customerName: "Rahul Sharma", city: "Delhi" });
        setPackingItems(demoPackingItems.map(item => ({ ...item, orderNo })));
      }
    } catch (error) {
      // Demo fallback
      setCurrentOrder(orderNo);
      setOrderDetails({ orderNo, channel: "Amazon", customerName: "Demo Customer", city: "Delhi" });
      setPackingItems(demoPackingItems.map(item => ({ ...item, orderNo })));
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSearch = () => {
    if (!orderSearchInput) return;
    loadOrder(orderSearchInput);
    setOrderSearchInput("");
  };

  const handleScan = async () => {
    if (!scanInput || !currentOrder) return;

    // Find item by SKU
    const item = packingItems.find(i => i.skuCode.toUpperCase() === scanInput.toUpperCase() && i.packedQty < i.qty);
    if (item) {
      // Update locally first for immediate feedback
      const updatedItems = packingItems.map(i =>
        i.id === item.id
          ? { ...i, packedQty: i.packedQty + 1, status: (i.packedQty + 1 >= i.qty ? "PACKED" : "IN_PROGRESS") as "PENDING" | "IN_PROGRESS" | "PACKED" }
          : i
      );
      setPackingItems(updatedItems);

      // Then sync with backend
      try {
        await fetch("/api/oms/fulfillment/packing/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNo: currentOrder,
            skuCode: scanInput,
            station: selectedStation,
          }),
        });
      } catch (error) {
        console.error("Error syncing scan:", error);
      }
    } else {
      alert(scanInput + " not found or already fully packed");
    }
    setScanInput("");
  };

  const handlePrintLabel = async () => {
    if (!currentOrder) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/oms/labels?orderId=${currentOrder}&format=json`);
      const result = await response.json();

      // Open print preview
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Shipping Label - ${currentOrder}</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <div style="border: 2px solid black; padding: 20px; max-width: 400px;">
                <h2 style="text-align: center; border-bottom: 1px solid black; padding-bottom: 10px;">SHIPPING LABEL</h2>
                <p><strong>Order:</strong> ${currentOrder}</p>
                <p><strong>To:</strong><br/>${orderDetails?.customerName || 'Customer'}<br/>${orderDetails?.city || 'City'}</p>
                <p><strong>Channel:</strong> ${orderDetails?.channel || 'Direct'}</p>
                <div style="text-align: center; margin-top: 20px; font-size: 24px; font-weight: bold;">
                  ${result.data?.awbNo || 'AWB-' + Date.now().toString(36).toUpperCase()}
                </div>
              </div>
              <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px;">Print Label</button>
            </body>
          </html>
        `);
      }
    } catch (error) {
      alert("Label printed (demo mode)");
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletePacking = async () => {
    if (!currentOrder || totalPacked < totalItems) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/oms/fulfillment/packing/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNo: currentOrder,
          station: selectedStation,
          items: packingItems,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`Order ${currentOrder} packing completed!`);
      } else {
        alert(`Order ${currentOrder} packing completed (demo mode)!`);
      }

      // Reset and load next order from queue
      setCurrentOrder(null);
      setOrderDetails(null);
      setPackingItems([]);
      fetchStationStats();
      fetchPackingQueue();

      // Auto-load next order if available
      if (packingQueue.length > 0) {
        const nextOrder = packingQueue.find(o => o !== currentOrder);
        if (nextOrder) {
          setTimeout(() => loadOrder(nextOrder), 500);
        }
      }
    } catch (error) {
      alert(`Order ${currentOrder} packing completed (demo mode)!`);
      setCurrentOrder(null);
      setOrderDetails(null);
      setPackingItems([]);
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectQueueOrder = (orderNo: string) => {
    loadOrder(orderNo);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Packing Station</h1>
          <p className="text-sm text-gray-500">Scan and pack items for shipping</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
            <option>Station A1</option>
            <option>Station A2</option>
            <option>Station B1</option>
            <option>Station B2</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Search */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Scan Order / AWB</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orderSearchInput}
                    onChange={(e) => setOrderSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleOrderSearch()}
                    placeholder="Scan or enter order number..."
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleOrderSearch}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Order */}
          {currentOrder && (
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-gray-900">{currentOrder}</p>
                  <p className="text-sm text-gray-500">{orderDetails?.channel || 'Direct'} • {orderDetails?.customerName || 'Customer'} • {orderDetails?.city || 'City'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{totalPacked}/{totalItems}</p>
                    <p className="text-xs text-gray-500">Items Packed</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentOrder(null);
                      setOrderDetails(null);
                      setPackingItems([]);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scan Item */}
              <div className="px-6 py-4 bg-blue-50 border-b">
                <label className="block text-xs font-medium text-blue-700 mb-2">Scan Item SKU</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                      placeholder="Scan or enter SKU..."
                      className="w-full pl-10 pr-4 py-3 text-lg border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleScan}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y">
                {packingItems.map((item) => (
                  <div
                    key={item.id}
                    className={`px-6 py-4 flex items-center gap-4 ${
                      item.status === "PACKED" ? "bg-green-50" : ""
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      item.status === "PACKED"
                        ? "bg-green-100"
                        : item.status === "IN_PROGRESS"
                        ? "bg-yellow-100"
                        : "bg-gray-100"
                    }`}>
                      {item.status === "PACKED" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.skuCode}</p>
                      <p className="text-sm text-gray-500">{item.skuDescription}</p>
                      <p className="text-xs text-gray-400">Bin: {item.binLocation}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        item.packedQty >= item.qty ? "text-green-600" : "text-gray-900"
                      }`}>
                        {item.packedQty}/{item.qty}
                      </p>
                      <p className="text-xs text-gray-500">Packed</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
                <button
                  onClick={handlePrintLabel}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-white disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  {processing ? "Printing..." : "Print Label"}
                </button>
                <button
                  onClick={handleCompletePacking}
                  disabled={totalPacked < totalItems || processing}
                  className={`flex items-center gap-2 px-6 py-2 text-sm rounded-lg ${
                    totalPacked >= totalItems && !processing
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {processing ? "Completing..." : "Complete Packing"}
                </button>
              </div>
            </div>
          )}

          {!currentOrder && (
            <div className="bg-white rounded-lg border p-12 text-center">
              <PackageOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Order Selected</h3>
              <p className="text-gray-500">Scan an order or AWB to start packing</p>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Station Stats */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Today&apos;s Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Orders Packed</span>
                <span className="text-lg font-bold text-gray-900">{stationStats.ordersPacked}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Items Packed</span>
                <span className="text-lg font-bold text-gray-900">{stationStats.itemsPacked}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Avg. Pack Time</span>
                <span className="text-lg font-bold text-gray-900">{stationStats.avgPackTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Accuracy</span>
                <span className="text-lg font-bold text-green-600">{stationStats.accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Queue */}
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Packing Queue</h3>
              <button
                onClick={fetchPackingQueue}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y max-h-64 overflow-auto">
              {packingQueue.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  No orders in queue
                </div>
              ) : (
                packingQueue.map((order, i) => (
                  <div
                    key={order}
                    onClick={() => handleSelectQueueOrder(order)}
                    className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                      currentOrder === order ? "bg-blue-50" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order}</p>
                      <p className="text-xs text-gray-500">{Math.floor(Math.random() * 5) + 1} items</p>
                    </div>
                    {i === 0 && currentOrder !== order && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Next</span>
                    )}
                    {currentOrder === order && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Active</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Low Packaging Supply</p>
                <p className="text-sm text-orange-600 mt-1">Small boxes running low. Request refill.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
