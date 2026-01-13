"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Package, ArrowRight } from "lucide-react";

interface MoveItem {
  skuCode: string;
  skuDesc: string;
  fromBin: string;
  toBin: string;
  quantity: number;
  availableQty: number;
}

export default function InventoryMovePage() {
  const router = useRouter();
  const [moveItems, setMoveItems] = useState<MoveItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    skuCode: "",
    skuDesc: "",
    fromBin: "",
    toBin: "",
    quantity: 0,
  });

  const handleAddItem = () => {
    if (!currentItem.skuCode || !currentItem.fromBin || !currentItem.toBin || currentItem.quantity <= 0) {
      return;
    }

    setMoveItems([
      ...moveItems,
      {
        ...currentItem,
        availableQty: 100, // This would come from API
      },
    ]);

    setCurrentItem({
      skuCode: "",
      skuDesc: "",
      fromBin: "",
      toBin: "",
      quantity: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    setMoveItems(moveItems.filter((_, i) => i !== index));
  };

  const handleConfirmMove = async () => {
    if (moveItems.length === 0) return;

    try {
      await fetch("/api/oms/wms/inventory-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: moveItems }),
      });
      router.push("/customer/oms/wms/inventory/move-history");
    } catch (error) {
      console.error("Error moving inventory:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory Move</h1>
          <p className="text-sm text-gray-500">Move inventory from one bin to another</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleConfirmMove}
            disabled={moveItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Confirm Move
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Add Item to Move</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code *</label>
            <input
              type="text"
              value={currentItem.skuCode}
              onChange={(e) => setCurrentItem({ ...currentItem, skuCode: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter SKU code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU Description</label>
            <input
              type="text"
              value={currentItem.skuDesc}
              onChange={(e) => setCurrentItem({ ...currentItem, skuDesc: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg"
              placeholder="Description"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Bin *</label>
            <select
              value={currentItem.fromBin}
              onChange={(e) => setCurrentItem({ ...currentItem, fromBin: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="">Select Bin</option>
              <option value="BIN-A001">BIN-A001</option>
              <option value="BIN-A002">BIN-A002</option>
              <option value="BIN-B001">BIN-B001</option>
              <option value="BIN-C001">BIN-C001</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Bin *</label>
            <select
              value={currentItem.toBin}
              onChange={(e) => setCurrentItem({ ...currentItem, toBin: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="">Select Bin</option>
              <option value="BIN-A001">BIN-A001</option>
              <option value="BIN-A002">BIN-A002</option>
              <option value="BIN-B001">BIN-B001</option>
              <option value="BIN-C001">BIN-C001</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={currentItem.quantity || ""}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                className="flex-1 px-3 py-2 text-sm border rounded-lg"
                placeholder="Qty"
                min="1"
              />
              <button
                onClick={handleAddItem}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Move Items List */}
      {moveItems.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Items to Move ({moveItems.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">SKU Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">From Bin</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">To Bin</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Quantity</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {moveItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-blue-600">{item.skuCode}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.skuDesc || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.fromBin}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{item.toBin}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {moveItems.length === 0 && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-500 mb-2">No items added yet</h3>
          <p className="text-sm text-gray-400">Add items above to start the inventory move process</p>
        </div>
      )}
    </div>
  );
}
