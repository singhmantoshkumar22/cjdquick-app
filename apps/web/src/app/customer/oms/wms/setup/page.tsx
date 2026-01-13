"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Grid3X3,
  Tag,
  Settings,
} from "lucide-react";

interface Zone {
  id: string;
  code: string;
  name: string;
  warehouse: string;
  binCount: number;
  type: string;
  status: string;
}

interface Bin {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  level: string;
  capacity: number;
  currentStock: number;
  status: string;
}

const demoZones: Zone[] = [
  { id: "1", code: "ZONE-A", name: "Zone A - Electronics", warehouse: "Warehouse A", binCount: 250, type: "STORAGE", status: "ACTIVE" },
  { id: "2", code: "ZONE-B", name: "Zone B - Accessories", warehouse: "Warehouse A", binCount: 180, type: "STORAGE", status: "ACTIVE" },
  { id: "3", code: "ZONE-C", name: "Zone C - Bulk Storage", warehouse: "Warehouse B", binCount: 320, type: "BULK", status: "ACTIVE" },
  { id: "4", code: "RECV", name: "Receiving Area", warehouse: "Warehouse A", binCount: 20, type: "RECEIVING", status: "ACTIVE" },
  { id: "5", code: "SHIP", name: "Shipping Area", warehouse: "Warehouse A", binCount: 15, type: "SHIPPING", status: "ACTIVE" },
];

const demoBins: Bin[] = [
  { id: "1", code: "A-01-01", zone: "Zone A", aisle: "A", rack: "01", level: "01", capacity: 100, currentStock: 85, status: "ACTIVE" },
  { id: "2", code: "A-01-02", zone: "Zone A", aisle: "A", rack: "01", level: "02", capacity: 100, currentStock: 92, status: "ACTIVE" },
  { id: "3", code: "A-02-01", zone: "Zone A", aisle: "A", rack: "02", level: "01", capacity: 100, currentStock: 45, status: "ACTIVE" },
  { id: "4", code: "B-01-01", zone: "Zone B", aisle: "B", rack: "01", level: "01", capacity: 80, currentStock: 78, status: "ACTIVE" },
  { id: "5", code: "B-01-02", zone: "Zone B", aisle: "B", rack: "01", level: "02", capacity: 80, currentStock: 0, status: "BLOCKED" },
];

const tabs = [
  { id: "zones", label: "Zones", icon: MapPin, count: 12 },
  { id: "bins", label: "Bins", icon: Grid3X3, count: 785 },
  { id: "lottables", label: "Lottables", icon: Tag, count: 8 },
];

export default function WMSSetupPage() {
  const [activeTab, setActiveTab] = useState("zones");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-600" />
          <h1 className="text-xl font-bold text-gray-900">WMS Setup</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Zones Tab */}
      {activeTab === "zones" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search zones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
              <option>All Warehouses</option>
              <option>Warehouse A</option>
              <option>Warehouse B</option>
            </select>
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Zone
            </button>
          </div>

          {/* Zones Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Warehouse</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Bins</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {demoZones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{zone.code}</td>
                    <td className="px-4 py-3">{zone.name}</td>
                    <td className="px-4 py-3 text-gray-600">{zone.warehouse}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {zone.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{zone.binCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${
                        zone.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {zone.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bins Tab */}
      {activeTab === "bins" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
              <option>All Zones</option>
              <option>Zone A</option>
              <option>Zone B</option>
              <option>Zone C</option>
            </select>
            <select className="px-3 py-2 text-sm border rounded-lg focus:outline-none">
              <option>All Status</option>
              <option>Active</option>
              <option>Blocked</option>
            </select>
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Bin
            </button>
          </div>

          {/* Bins Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Bin Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Zone</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Aisle</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Rack</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Level</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Capacity</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Utilization</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {demoBins.map((bin) => {
                  const utilization = Math.round((bin.currentStock / bin.capacity) * 100);
                  return (
                    <tr key={bin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-600">{bin.code}</td>
                      <td className="px-4 py-3 text-gray-600">{bin.zone}</td>
                      <td className="px-4 py-3 text-center">{bin.aisle}</td>
                      <td className="px-4 py-3 text-center">{bin.rack}</td>
                      <td className="px-4 py-3 text-center">{bin.level}</td>
                      <td className="px-4 py-3 text-center">{bin.capacity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                utilization >= 90
                                  ? "bg-red-500"
                                  : utilization >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10">{utilization}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          bin.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {bin.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">Showing 1-5 of 785 bins</div>
              <div className="flex items-center gap-2">
                <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
                <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">2</span>
                <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">3</span>
                <span className="text-gray-400">...</span>
                <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">157</span>
                <button className="p-1 border rounded hover:bg-gray-100">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lottables Tab */}
      {activeTab === "lottables" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search lottables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Lottable
            </button>
          </div>

          {/* Lottables Info */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Lottable Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Lottables are custom attributes that can be tracked at the inventory level.
              Common examples include Batch Number, Expiry Date, Manufacturing Date, Serial Number, etc.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Batch Number", type: "Text", required: true, enabled: true },
                { name: "Expiry Date", type: "Date", required: true, enabled: true },
                { name: "Manufacturing Date", type: "Date", required: false, enabled: true },
                { name: "Serial Number", type: "Text", required: false, enabled: false },
                { name: "Lot Number", type: "Text", required: false, enabled: true },
                { name: "Color", type: "Text", required: false, enabled: true },
                { name: "Size", type: "Text", required: false, enabled: true },
                { name: "Custom Field 1", type: "Text", required: false, enabled: false },
              ].map((lottable, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    lottable.enabled ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{lottable.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      lottable.enabled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {lottable.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Type: {lottable.type}</span>
                    {lottable.required && (
                      <span className="text-red-500">* Required</span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button className="text-xs text-gray-500 hover:underline">
                      {lottable.enabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
