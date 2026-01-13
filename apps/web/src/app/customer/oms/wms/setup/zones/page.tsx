"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  X,
  RefreshCw,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Zone {
  id: string;
  zoneCode: string;
  description: string;
  pickToBin: string;
  qcBin: string;
  status: "ACTIVE" | "INACTIVE";
  zoneType: "NORMAL" | "SORTATION";
  createdAt: string;
  updatedAt: string;
}

const demoZones: Zone[] = [
  { id: "1", zoneCode: "ZONE-A", description: "Main Storage Zone A", pickToBin: "BIN-A001", qcBin: "QC-BIN-001", status: "ACTIVE", zoneType: "NORMAL", createdAt: "2024-01-01", updatedAt: "2024-01-08" },
  { id: "2", zoneCode: "ZONE-B", description: "Cold Storage Zone", pickToBin: "BIN-B001", qcBin: "QC-BIN-002", status: "ACTIVE", zoneType: "NORMAL", createdAt: "2024-01-01", updatedAt: "2024-01-07" },
  { id: "3", zoneCode: "ZONE-C", description: "Electronics Zone", pickToBin: "BIN-C001", qcBin: "QC-BIN-003", status: "ACTIVE", zoneType: "NORMAL", createdAt: "2024-01-02", updatedAt: "2024-01-06" },
  { id: "4", zoneCode: "SORT-01", description: "Sortation Area 1", pickToBin: "SORT-BIN-001", qcBin: "QC-BIN-004", status: "ACTIVE", zoneType: "SORTATION", createdAt: "2024-01-03", updatedAt: "2024-01-08" },
  { id: "5", zoneCode: "ZONE-D", description: "Overflow Storage", pickToBin: "BIN-D001", qcBin: "QC-BIN-005", status: "INACTIVE", zoneType: "NORMAL", createdAt: "2024-01-04", updatedAt: "2024-01-05" },
];

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [newZone, setNewZone] = useState({ zoneCode: "", description: "", pickToBin: "", qcBin: "", status: "ACTIVE", zoneType: "NORMAL" });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await fetch("/api/oms/wms/zones");
      const result = await response.json();
      if (result.success && result.data?.zones) {
        setZones(result.data.zones);
      } else {
        setZones(demoZones);
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
      setZones(demoZones);
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/oms/wms/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newZone),
      });
      if (response.ok) {
        alert("Zone added successfully!");
        fetchZones();
        setShowAddModal(false);
        setNewZone({ zoneCode: "", description: "", pickToBin: "", qcBin: "", status: "ACTIVE", zoneType: "NORMAL" });
      } else {
        alert("Zone added (demo mode)");
        setZones([...zones, { ...newZone, id: Date.now().toString(), createdAt: new Date().toISOString().split("T")[0], updatedAt: new Date().toISOString().split("T")[0] } as Zone]);
        setShowAddModal(false);
        setNewZone({ zoneCode: "", description: "", pickToBin: "", qcBin: "", status: "ACTIVE", zoneType: "NORMAL" });
      }
    } catch (error) {
      console.error("Error adding zone:", error);
      alert("Zone added (demo mode)");
      setZones([...zones, { ...newZone, id: Date.now().toString(), createdAt: new Date().toISOString().split("T")[0], updatedAt: new Date().toISOString().split("T")[0] } as Zone]);
      setShowAddModal(false);
      setNewZone({ zoneCode: "", description: "", pickToBin: "", qcBin: "", status: "ACTIVE", zoneType: "NORMAL" });
    } finally {
      setProcessing(false);
    }
  };

  const handleEditZone = (zone: Zone) => {
    setSelectedZone(zone);
    setNewZone({
      zoneCode: zone.zoneCode,
      description: zone.description,
      pickToBin: zone.pickToBin,
      qcBin: zone.qcBin,
      status: zone.status,
      zoneType: zone.zoneType,
    });
    setShowEditModal(true);
  };

  const handleUpdateZone = async () => {
    if (!selectedZone) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/oms/wms/zones/${selectedZone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newZone),
      });
      if (response.ok) {
        alert("Zone updated successfully!");
        fetchZones();
      } else {
        alert("Zone updated (demo mode)");
        setZones(zones.map(z => z.id === selectedZone.id ? { ...z, ...newZone, updatedAt: new Date().toISOString().split("T")[0] } : z));
      }
    } catch (error) {
      console.error("Error updating zone:", error);
      alert("Zone updated (demo mode)");
      setZones(zones.map(z => z.id === selectedZone.id ? { ...z, ...newZone, updatedAt: new Date().toISOString().split("T")[0] } : z));
    } finally {
      setProcessing(false);
      setShowEditModal(false);
      setSelectedZone(null);
      setNewZone({ zoneCode: "", description: "", pickToBin: "", qcBin: "", status: "ACTIVE", zoneType: "NORMAL" });
    }
  };

  const handleViewZone = (zone: Zone) => {
    setSelectedZone(zone);
    setShowViewModal(true);
  };

  const handleToggleStatus = async (zone: Zone) => {
    const newStatus = zone.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const response = await fetch(`/api/oms/wms/zones/${zone.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        alert(`Zone ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully!`);
        fetchZones();
      } else {
        setZones(zones.map(z => z.id === zone.id ? { ...z, status: newStatus as "ACTIVE" | "INACTIVE" } : z));
      }
    } catch (error) {
      console.error("Error toggling zone status:", error);
      setZones(zones.map(z => z.id === zone.id ? { ...z, status: newStatus as "ACTIVE" | "INACTIVE" } : z));
    }
  };

  const handleDeleteZone = async (zone: Zone) => {
    if (!confirm(`Are you sure you want to delete zone ${zone.zoneCode}?`)) return;
    try {
      const response = await fetch(`/api/oms/wms/zones/${zone.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Zone deleted successfully!");
        fetchZones();
      } else {
        alert("Zone deleted (demo mode)");
        setZones(zones.filter(z => z.id !== zone.id));
      }
    } catch (error) {
      console.error("Error deleting zone:", error);
      alert("Zone deleted (demo mode)");
      setZones(zones.filter(z => z.id !== zone.id));
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const filteredZones = zones.filter((zone) => {
    const matchesSearch = zone.zoneCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || zone.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Zones</h1>
          <p className="text-sm text-gray-500">Manage warehouse zones for inventory storage and movement</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add New Zone
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Zone Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zone Code</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search zone code..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zone Type</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none">
              <option value="all">All Types</option>
              <option value="normal">Normal</option>
              <option value="sortation">Sortation</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchZones()}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Zones Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading zones...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Zone Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Pick to Bin</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">QC Bin</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Zone Type</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredZones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-blue-600">{zone.zoneCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{zone.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{zone.pickToBin}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">{zone.qcBin}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                          zone.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {zone.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {zone.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          zone.zoneType === "SORTATION" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {zone.zoneType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewZone(zone)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditZone(zone)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(zone)}
                            className={`p-1 ${zone.status === "ACTIVE" ? "text-green-500 hover:text-red-600" : "text-gray-400 hover:text-green-600"}`}
                            title={zone.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          >
                            {zone.status === "ACTIVE" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">Showing 1-{filteredZones.length} of {filteredZones.length} zones</div>
              <div className="flex items-center gap-2">
                <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
                <button className="p-1 border rounded hover:bg-gray-100">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Zone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Code *</label>
                <input
                  type="text"
                  value={newZone.zoneCode}
                  onChange={(e) => setNewZone({ ...newZone, zoneCode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter zone code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newZone.description}
                  onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pick to Bin</label>
                <input
                  type="text"
                  value={newZone.pickToBin}
                  onChange={(e) => setNewZone({ ...newZone, pickToBin: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Select bin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QC Bin</label>
                <input
                  type="text"
                  value={newZone.qcBin}
                  onChange={(e) => setNewZone({ ...newZone, qcBin: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Select QC bin"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newZone.status}
                    onChange={(e) => setNewZone({ ...newZone, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone Type</label>
                  <select
                    value={newZone.zoneType}
                    onChange={(e) => setNewZone({ ...newZone, zoneType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="SORTATION">Sortation</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleAddZone}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={processing || !newZone.zoneCode}
              >
                {processing ? "Saving..." : "Save Zone"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zone Modal */}
      {showEditModal && selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Zone - {selectedZone.zoneCode}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Code *</label>
                <input
                  type="text"
                  value={newZone.zoneCode}
                  onChange={(e) => setNewZone({ ...newZone, zoneCode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newZone.description}
                  onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pick to Bin</label>
                <input
                  type="text"
                  value={newZone.pickToBin}
                  onChange={(e) => setNewZone({ ...newZone, pickToBin: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QC Bin</label>
                <input
                  type="text"
                  value={newZone.qcBin}
                  onChange={(e) => setNewZone({ ...newZone, qcBin: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newZone.status}
                    onChange={(e) => setNewZone({ ...newZone, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone Type</label>
                  <select
                    value={newZone.zoneType}
                    onChange={(e) => setNewZone({ ...newZone, zoneType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="SORTATION">Sortation</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateZone}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={processing}
              >
                {processing ? "Updating..." : "Update Zone"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Zone Modal */}
      {showViewModal && selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Zone Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <MapPin className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-lg font-bold text-blue-700">{selectedZone.zoneCode}</p>
                  <p className="text-sm text-blue-600">{selectedZone.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Pick to Bin</p>
                  <p className="font-medium">{selectedZone.pickToBin}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">QC Bin</p>
                  <p className="font-medium">{selectedZone.qcBin}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                    selectedZone.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedZone.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {selectedZone.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Zone Type</p>
                  <span className={`px-2 py-1 text-xs rounded ${
                    selectedZone.zoneType === "SORTATION" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {selectedZone.zoneType}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-medium">{selectedZone.createdAt}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="font-medium">{selectedZone.updatedAt}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditZone(selectedZone);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
