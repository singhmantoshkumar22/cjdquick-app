"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Truck,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";

interface TransporterPreference {
  id: string;
  fromLocation: string;
  destinationPincode: string;
  orderType: "PREPAID" | "COD" | "ALL";
  transporter: string;
  preferenceOrder: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  status: "ACTIVE" | "INACTIVE";
}

const demoPreferences: TransporterPreference[] = [
  { id: "1", fromLocation: "Headoffice", destinationPincode: "400001", orderType: "PREPAID", transporter: "Delhivery", preferenceOrder: 1, createdBy: "Rahul Kumar", createdAt: "2024-01-01", updatedBy: "Admin", updatedAt: "2024-01-08", status: "ACTIVE" },
  { id: "2", fromLocation: "Headoffice", destinationPincode: "400001", orderType: "COD", transporter: "BlueDart", preferenceOrder: 2, createdBy: "Priya Sharma", createdAt: "2024-01-02", updatedBy: "Admin", updatedAt: "2024-01-07", status: "ACTIVE" },
  { id: "3", fromLocation: "Warehouse A", destinationPincode: "110001", orderType: "ALL", transporter: "FedEx", preferenceOrder: 1, createdBy: "Amit Patel", createdAt: "2024-01-03", updatedBy: "Amit Patel", updatedAt: "2024-01-06", status: "ACTIVE" },
  { id: "4", fromLocation: "Warehouse B", destinationPincode: "560001", orderType: "PREPAID", transporter: "Ecom Express", preferenceOrder: 1, createdBy: "Sneha Gupta", createdAt: "2024-01-04", updatedBy: "System", updatedAt: "2024-01-08", status: "INACTIVE" },
  { id: "5", fromLocation: "Headoffice", destinationPincode: "500001", orderType: "COD", transporter: "DTDC", preferenceOrder: 3, createdBy: "Vikram Singh", createdAt: "2024-01-05", updatedBy: "Admin", updatedAt: "2024-01-05", status: "ACTIVE" },
];

export default function TransporterPreferencePage() {
  const [preferences, setPreferences] = useState<TransporterPreference[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state as per document
  const [fromLocation, setFromLocation] = useState("all");
  const [destinationPincode, setDestinationPincode] = useState("");
  const [orderType, setOrderType] = useState("all");
  const [transporter, setTransporter] = useState("all");
  const [preferenceOrder, setPreferenceOrder] = useState("all");
  const [createdBy, setCreatedBy] = useState("all");
  const [updatedBy, setUpdatedBy] = useState("all");
  const [updateDate, setUpdateDate] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/oms/logistics/transporter");
      const result = await response.json();
      if (result.success && result.data?.preferences) {
        setPreferences(result.data.preferences);
      } else {
        setPreferences(demoPreferences);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      setPreferences(demoPreferences);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = filteredPreferences.map(item =>
      `${item.fromLocation},${item.destinationPincode},${item.orderType},${item.transporter},${item.preferenceOrder},${item.createdBy},${item.updatedBy},${item.updatedAt}`
    ).join("\n");
    const header = "From Location,Destination Pincode,Order Type,Transporter,Preference Order,Created By,Updated By,Update Date\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transporter_preferences.csv";
    a.click();
  };

  const handleReset = () => {
    setFromLocation("all");
    setDestinationPincode("");
    setOrderType("all");
    setTransporter("all");
    setPreferenceOrder("all");
    setCreatedBy("all");
    setUpdatedBy("all");
    setUpdateDate("");
  };

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPref, setSelectedPref] = useState<TransporterPreference | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    fromLocation: "",
    destinationPincode: "",
    orderType: "ALL" as "PREPAID" | "COD" | "ALL",
    transporter: "",
    preferenceOrder: 1,
  });

  const filteredPreferences = preferences.filter((item) => {
    const matchesFromLocation = fromLocation === "all" || item.fromLocation === fromLocation;
    const matchesPincode = !destinationPincode || item.destinationPincode.includes(destinationPincode);
    const matchesOrderType = orderType === "all" || item.orderType === orderType;
    const matchesTransporter = transporter === "all" || item.transporter === transporter;
    const matchesPrefOrder = preferenceOrder === "all" || item.preferenceOrder.toString() === preferenceOrder;
    const matchesCreatedBy = createdBy === "all" || item.createdBy === createdBy;
    const matchesUpdatedBy = updatedBy === "all" || item.updatedBy === updatedBy;
    return matchesFromLocation && matchesPincode && matchesOrderType && matchesTransporter && matchesPrefOrder && matchesCreatedBy && matchesUpdatedBy;
  });

  const handleAddPreference = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/oms/logistics/transporter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        alert("Preference added successfully!");
        setShowAddModal(false);
        fetchPreferences();
      } else {
        alert(result.error || "Failed to add preference");
      }
    } catch (error) {
      // Demo fallback
      const newPref: TransporterPreference = {
        id: Date.now().toString(),
        ...formData,
        createdBy: "Current User",
        createdAt: new Date().toISOString().split("T")[0],
        updatedBy: "Current User",
        updatedAt: new Date().toISOString().split("T")[0],
        status: "ACTIVE",
      };
      setPreferences([newPref, ...preferences]);
      setShowAddModal(false);
      alert("Preference added (demo mode)");
    } finally {
      setProcessing(false);
      setFormData({ fromLocation: "", destinationPincode: "", orderType: "ALL", transporter: "", preferenceOrder: 1 });
    }
  };

  const handleEditPreference = async () => {
    if (!selectedPref) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/oms/logistics/transporter/${selectedPref.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        alert("Preference updated successfully!");
        setShowEditModal(false);
        fetchPreferences();
      } else {
        alert(result.error || "Failed to update preference");
      }
    } catch (error) {
      // Demo fallback
      setPreferences(preferences.map(p =>
        p.id === selectedPref.id
          ? { ...p, ...formData, updatedAt: new Date().toISOString().split("T")[0], updatedBy: "Current User" }
          : p
      ));
      setShowEditModal(false);
      alert("Preference updated (demo mode)");
    } finally {
      setProcessing(false);
      setSelectedPref(null);
    }
  };

  const handleDeletePreference = async (pref: TransporterPreference) => {
    if (!confirm(`Delete preference for ${pref.transporter} to ${pref.destinationPincode}?`)) return;
    try {
      const response = await fetch(`/api/oms/logistics/transporter/${pref.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        alert("Preference deleted successfully!");
        fetchPreferences();
      } else {
        alert(result.error || "Failed to delete preference");
      }
    } catch (error) {
      // Demo fallback
      setPreferences(preferences.filter(p => p.id !== pref.id));
      alert("Preference deleted (demo mode)");
    }
  };

  const handleViewPreference = (pref: TransporterPreference) => {
    setSelectedPref(pref);
    setShowViewModal(true);
  };

  const handleOpenEdit = (pref: TransporterPreference) => {
    setSelectedPref(pref);
    setFormData({
      fromLocation: pref.fromLocation,
      destinationPincode: pref.destinationPincode,
      orderType: pref.orderType,
      transporter: pref.transporter,
      preferenceOrder: pref.preferenceOrder,
    });
    setShowEditModal(true);
  };

  const handleOpenAdd = () => {
    setFormData({ fromLocation: "", destinationPincode: "", orderType: "ALL", transporter: "", preferenceOrder: 1 });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transporter Preferences</h1>
          <p className="text-sm text-gray-500">Manage transporter preferences based on location and order type</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Preference
          </button>
        </div>
      </div>

      {/* Filters - As per document */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Location</label>
            <select
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Locations</option>
              <option value="Headoffice">Headoffice</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Destination Pincode</label>
            <input
              type="text"
              value={destinationPincode}
              onChange={(e) => setDestinationPincode(e.target.value)}
              placeholder="Enter pincode..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="PREPAID">Prepaid</option>
              <option value="COD">COD</option>
              <option value="ALL">All Order Types</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Transporter</label>
            <select
              value={transporter}
              onChange={(e) => setTransporter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Transporters</option>
              <option value="Delhivery">Delhivery</option>
              <option value="BlueDart">BlueDart</option>
              <option value="FedEx">FedEx</option>
              <option value="Ecom Express">Ecom Express</option>
              <option value="DTDC">DTDC</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Preference Order</label>
            <select
              value={preferenceOrder}
              onChange={(e) => setPreferenceOrder(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All</option>
              <option value="1">1 (Highest)</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5 (Lowest)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Created By</label>
            <select
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Users</option>
              <option value="Rahul Kumar">Rahul Kumar</option>
              <option value="Priya Sharma">Priya Sharma</option>
              <option value="Amit Patel">Amit Patel</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Record Updated By</label>
            <select
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Users</option>
              <option value="Admin">Admin</option>
              <option value="System">System</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Record Update Date</label>
            <input
              type="date"
              value={updateDate}
              onChange={(e) => setUpdateDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => fetchPreferences()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

      {/* Transporter Preferences Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading transporter preferences...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Preference</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">From Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Dest. Pincode</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Order Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Transporter</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Created By</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Updated By</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Update Date</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPreferences.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold">
                          {item.preferenceOrder}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.fromLocation}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {item.destinationPincode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          item.orderType === "PREPAID" ? "bg-purple-100 text-purple-700" :
                          item.orderType === "COD" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {item.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded">
                            <Truck className="w-3 h-3 text-gray-600" />
                          </div>
                          <span className="font-medium">{item.transporter}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.createdBy}</td>
                      <td className="px-4 py-3 text-gray-600">{item.updatedBy}</td>
                      <td className="px-4 py-3 text-gray-500">{item.updatedAt}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                          item.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {item.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewPreference(item)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePreference(item)}
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
              <div className="text-sm text-gray-500">Showing 1-{filteredPreferences.length} of {filteredPreferences.length} preferences</div>
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

      {/* Add Preference Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Transporter Preference</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
                <select
                  value={formData.fromLocation}
                  onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Location</option>
                  <option value="Headoffice">Headoffice</option>
                  <option value="Warehouse A">Warehouse A</option>
                  <option value="Warehouse B">Warehouse B</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Pincode</label>
                <input
                  type="text"
                  value={formData.destinationPincode}
                  onChange={(e) => setFormData({ ...formData, destinationPincode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter pincode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                <select
                  value={formData.orderType}
                  onChange={(e) => setFormData({ ...formData, orderType: e.target.value as "PREPAID" | "COD" | "ALL" })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="ALL">All</option>
                  <option value="PREPAID">Prepaid</option>
                  <option value="COD">COD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporter</label>
                <select
                  value={formData.transporter}
                  onChange={(e) => setFormData({ ...formData, transporter: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Transporter</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Ecom Express">Ecom Express</option>
                  <option value="DTDC">DTDC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preference Order</label>
                <select
                  value={formData.preferenceOrder}
                  onChange={(e) => setFormData({ ...formData, preferenceOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={1}>1 (Highest)</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5 (Lowest)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPreference}
                disabled={processing || !formData.fromLocation || !formData.destinationPincode || !formData.transporter}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? "Adding..." : "Add Preference"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Preference Modal */}
      {showEditModal && selectedPref && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Transporter Preference</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
                <select
                  value={formData.fromLocation}
                  onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Location</option>
                  <option value="Headoffice">Headoffice</option>
                  <option value="Warehouse A">Warehouse A</option>
                  <option value="Warehouse B">Warehouse B</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Pincode</label>
                <input
                  type="text"
                  value={formData.destinationPincode}
                  onChange={(e) => setFormData({ ...formData, destinationPincode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter pincode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                <select
                  value={formData.orderType}
                  onChange={(e) => setFormData({ ...formData, orderType: e.target.value as "PREPAID" | "COD" | "ALL" })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="ALL">All</option>
                  <option value="PREPAID">Prepaid</option>
                  <option value="COD">COD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporter</label>
                <select
                  value={formData.transporter}
                  onChange={(e) => setFormData({ ...formData, transporter: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Transporter</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Ecom Express">Ecom Express</option>
                  <option value="DTDC">DTDC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preference Order</label>
                <select
                  value={formData.preferenceOrder}
                  onChange={(e) => setFormData({ ...formData, preferenceOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={1}>1 (Highest)</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5 (Lowest)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setSelectedPref(null); }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPreference}
                disabled={processing}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Preference Modal */}
      {showViewModal && selectedPref && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Preference Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">From Location</span>
                <span className="font-medium">{selectedPref.fromLocation}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Destination Pincode</span>
                <span className="font-medium">{selectedPref.destinationPincode}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Order Type</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  selectedPref.orderType === "PREPAID" ? "bg-purple-100 text-purple-700" :
                  selectedPref.orderType === "COD" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>{selectedPref.orderType}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Transporter</span>
                <span className="font-medium">{selectedPref.transporter}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Preference Order</span>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">{selectedPref.preferenceOrder}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  selectedPref.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>{selectedPref.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Created By</span>
                <span className="font-medium">{selectedPref.createdBy}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-600">{selectedPref.updatedAt} by {selectedPref.updatedBy}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowViewModal(false); setSelectedPref(null); }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => { setShowViewModal(false); handleOpenEdit(selectedPref); }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
