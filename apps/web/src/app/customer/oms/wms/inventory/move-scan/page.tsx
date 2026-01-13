"use client";

import { useState } from "react";
import {
  ScanLine,
  Package,
  ArrowRight,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface MoveRecord {
  id: string;
  skuCode: string;
  fromBin: string;
  toBin: string;
  quantity: number;
  movedAt: string;
  status: string;
}

const recentMoves: MoveRecord[] = [
  { id: "1", skuCode: "SKU-001", fromBin: "BIN-A001", toBin: "BIN-B001", quantity: 10, movedAt: "5 mins ago", status: "SUCCESS" },
  { id: "2", skuCode: "SKU-002", fromBin: "BIN-A002", toBin: "BIN-A003", quantity: 5, movedAt: "10 mins ago", status: "SUCCESS" },
  { id: "3", skuCode: "SKU-003", fromBin: "BIN-C001", toBin: "BIN-C002", quantity: 20, movedAt: "15 mins ago", status: "SUCCESS" },
];

export default function InventoryMoveByScanPage() {
  const [moveMethod, setMoveMethod] = useState<"scan" | "each_piece">("scan");
  const [skuCode, setSkuCode] = useState("");
  const [skuDesc, setSkuDesc] = useState("");
  const [fromBin, setFromBin] = useState("");
  const [toBin, setBin] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [availableQty, setAvailableQty] = useState<number>(0);

  const handleSkuScan = (value: string) => {
    setSkuCode(value);
    // Simulate fetching SKU details
    if (value) {
      setSkuDesc("Wireless Mouse - Black");
      setAvailableQty(100);
    }
  };

  const handleFromBinScan = (value: string) => {
    setFromBin(value);
    // Simulate fetching bin inventory
    if (value && skuCode) {
      setAvailableQty(50);
    }
  };

  const handleConfirmMove = async () => {
    if (!skuCode || !fromBin || !toBin || quantity <= 0) return;

    try {
      await fetch("/api/oms/wms/inventory-move-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuCode, fromBin, toBin, quantity, method: moveMethod }),
      });
      // Reset form
      handleReset();
    } catch (error) {
      console.error("Error moving inventory:", error);
    }
  };

  const handleReset = () => {
    setSkuCode("");
    setSkuDesc("");
    setFromBin("");
    setBin("");
    setQuantity(0);
    setAvailableQty(0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory Move by Scan</h1>
          <p className="text-sm text-gray-500">Scan SKUs and bins to move inventory</p>
        </div>
      </div>

      {/* Move Method Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setMoveMethod("scan")}
          className={`px-4 py-2 text-sm rounded-lg ${
            moveMethod === "scan" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          Inventory Move by Scan
        </button>
        <button
          onClick={() => setMoveMethod("each_piece")}
          className={`px-4 py-2 text-sm rounded-lg ${
            moveMethod === "each_piece" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          Each Piece Move
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scan Form */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">
            {moveMethod === "scan" ? "Scan & Move" : "Each Piece Move"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code *</label>
              <div className="relative">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={skuCode}
                  onChange={(e) => handleSkuScan(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Scan or enter SKU code"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU Description</label>
              <input
                type="text"
                value={skuDesc}
                readOnly
                className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50"
                placeholder="Auto-populated"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Bin *</label>
              <div className="relative">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={fromBin}
                  onChange={(e) => handleFromBinScan(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Scan or enter from bin"
                />
              </div>
              {availableQty > 0 && (
                <p className="text-xs text-gray-500 mt-1">Available in bin: {availableQty}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Bin *</label>
              <div className="relative">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={toBin}
                  onChange={(e) => setBin(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Scan or enter to bin"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              value={quantity || ""}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full md:w-1/4 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quantity"
              min="1"
              max={availableQty}
            />
          </div>

          {/* Summary */}
          {skuCode && fromBin && toBin && quantity > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Move Summary</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{skuCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-white rounded text-xs">{fromBin}</span>
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{toBin}</span>
                </div>
                <span className="font-medium">x {quantity}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleConfirmMove}
              disabled={!skuCode || !fromBin || !toBin || quantity <= 0}
              className="flex items-center gap-2 px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Confirm Move
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Recent Moves */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Moves</h2>
          <div className="space-y-3">
            {recentMoves.map((move) => (
              <div key={move.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{move.skuCode}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                    {move.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{move.fromBin}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{move.toBin}</span>
                  <span className="ml-auto">x {move.quantity}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{move.movedAt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
