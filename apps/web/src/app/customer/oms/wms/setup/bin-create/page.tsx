"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Package } from "lucide-react";

export default function BinCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    siteLocation: "Warehouse A",
    binCode: "",
    binType: "RACK",
    binFlag: "",
    isActive: true,
    zone: "",
    aisle: "",
    sequenceNo: "",
    xCoordinate: "",
    yCoordinate: "",
    zCoordinate: "",
    commingleItem: false,
    commingleLot: false,
    defaultInbound: false,
    defaultReturn: false,
    cubeCapacity: "",
    weightCapacity: "",
    length: "",
    width: "",
    height: "",
    looseId: "",
    approxUnits: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/oms/wms/bins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        router.push("/customer/oms/wms/setup/bin-enquiry");
      }
    } catch (error) {
      console.error("Error creating bin:", error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bin Create/Edit</h1>
          <p className="text-sm text-gray-500">Create or edit bin details for warehouse storage</p>
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
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save Bin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bin Details Section */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Bin Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Location *</label>
              <select
                value={formData.siteLocation}
                onChange={(e) => handleChange("siteLocation", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Warehouse A</option>
                <option>Warehouse B</option>
                <option>Warehouse C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BIN Code *</label>
              <input
                type="text"
                value={formData.binCode}
                onChange={(e) => handleChange("binCode", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter unique bin code"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BIN Type *</label>
              <select
                value={formData.binType}
                onChange={(e) => handleChange("binType", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="RACK">Rack</option>
                <option value="FLOOR">Floor</option>
                <option value="COLD_STORAGE">Cold Storage</option>
                <option value="QC">QC Bin</option>
                <option value="STAGING">Staging</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BIN Flag *</label>
              <input
                type="text"
                value={formData.binFlag}
                onChange={(e) => handleChange("binFlag", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bin flag"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone *</label>
              <select
                value={formData.zone}
                onChange={(e) => handleChange("zone", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Zone</option>
                <option value="ZONE-A">Zone A</option>
                <option value="ZONE-B">Zone B</option>
                <option value="ZONE-C">Zone C</option>
                <option value="ZONE-D">Zone D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aisle</label>
              <input
                type="text"
                value={formData.aisle}
                onChange={(e) => handleChange("aisle", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter aisle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sequence No</label>
              <input
                type="number"
                value={formData.sequenceNo}
                onChange={(e) => handleChange("sequenceNo", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sequence number"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  className="rounded"
                />
                Is Active
              </label>
            </div>
          </div>
        </div>

        {/* Bin Coordinates Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Bin Coordinates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">X Coordinate</label>
              <input
                type="number"
                value={formData.xCoordinate}
                onChange={(e) => handleChange("xCoordinate", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="X position"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Y Coordinate</label>
              <input
                type="number"
                value={formData.yCoordinate}
                onChange={(e) => handleChange("yCoordinate", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Y position"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Z Coordinate</label>
              <input
                type="number"
                value={formData.zCoordinate}
                onChange={(e) => handleChange("zCoordinate", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Z position"
              />
            </div>
          </div>
        </div>

        {/* Other Details Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Other Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.commingleItem}
                onChange={(e) => handleChange("commingleItem", e.target.checked)}
                className="rounded"
              />
              Commingle Item
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.commingleLot}
                onChange={(e) => handleChange("commingleLot", e.target.checked)}
                className="rounded"
              />
              Commingle Lot
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.defaultInbound}
                onChange={(e) => handleChange("defaultInbound", e.target.checked)}
                className="rounded"
              />
              Default Bin for Inbound
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.defaultReturn}
                onChange={(e) => handleChange("defaultReturn", e.target.checked)}
                className="rounded"
              />
              Default Bin for Return
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cube Capacity</label>
              <input
                type="number"
                value={formData.cubeCapacity}
                onChange={(e) => handleChange("cubeCapacity", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cube capacity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight Capacity</label>
              <input
                type="number"
                value={formData.weightCapacity}
                onChange={(e) => handleChange("weightCapacity", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Weight capacity (kg)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loose ID</label>
              <input
                type="text"
                value={formData.looseId}
                onChange={(e) => handleChange("looseId", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Loose ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approx. No of Units</label>
              <input
                type="number"
                value={formData.approxUnits}
                onChange={(e) => handleChange("approxUnits", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Approximate units"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
              <input
                type="number"
                value={formData.length}
                onChange={(e) => handleChange("length", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Length"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
              <input
                type="number"
                value={formData.width}
                onChange={(e) => handleChange("width", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Width"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => handleChange("height", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Height"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
