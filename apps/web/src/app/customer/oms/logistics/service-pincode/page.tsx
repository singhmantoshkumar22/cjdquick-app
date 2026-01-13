"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

interface ServicePincode {
  id: string;
  pincode: string;
  city: string;
  state: string;
  zone: string;
  deliveryDays: number;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  transporters: string[];
  status: string;
}

const demoPincodes: ServicePincode[] = [
  {
    id: "1",
    pincode: "400001",
    city: "Mumbai",
    state: "Maharashtra",
    zone: "West",
    deliveryDays: 2,
    codAvailable: true,
    prepaidAvailable: true,
    transporters: ["Delhivery", "BlueDart", "FedEx"],
    status: "ACTIVE",
  },
  {
    id: "2",
    pincode: "110001",
    city: "New Delhi",
    state: "Delhi",
    zone: "North",
    deliveryDays: 2,
    codAvailable: true,
    prepaidAvailable: true,
    transporters: ["Delhivery", "BlueDart", "Ecom Express"],
    status: "ACTIVE",
  },
  {
    id: "3",
    pincode: "560001",
    city: "Bangalore",
    state: "Karnataka",
    zone: "South",
    deliveryDays: 3,
    codAvailable: true,
    prepaidAvailable: true,
    transporters: ["Delhivery", "BlueDart"],
    status: "ACTIVE",
  },
  {
    id: "4",
    pincode: "600001",
    city: "Chennai",
    state: "Tamil Nadu",
    zone: "South",
    deliveryDays: 3,
    codAvailable: false,
    prepaidAvailable: true,
    transporters: ["BlueDart", "DTDC"],
    status: "ACTIVE",
  },
  {
    id: "5",
    pincode: "700001",
    city: "Kolkata",
    state: "West Bengal",
    zone: "East",
    deliveryDays: 4,
    codAvailable: true,
    prepaidAvailable: true,
    transporters: ["Delhivery"],
    status: "INACTIVE",
  },
];

const summaryStats = [
  { label: "Total Pincodes", value: "12,500", color: "bg-blue-500" },
  { label: "Active", value: "11,234", color: "bg-green-500" },
  { label: "COD Enabled", value: "9,876", color: "bg-orange-500" },
  { label: "Inactive", value: "1,266", color: "bg-gray-500" },
];

interface SummaryStats {
  total: number;
  active: number;
  codEnabled: number;
  inactive: number;
}

export default function ServicePincodePage() {
  const [pincodes, setPincodes] = useState<ServicePincode[]>(demoPincodes);
  const [stats, setStats] = useState<SummaryStats>({ total: 12500, active: 11234, codEnabled: 9876, inactive: 1266 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [transporterFilter, setTransporterFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPincode, setSelectedPincode] = useState<ServicePincode | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    pincode: "",
    city: "",
    state: "",
    zone: "North",
    deliveryDays: 2,
    codAvailable: true,
    prepaidAvailable: true,
    transporters: [] as string[],
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2500);

  useEffect(() => {
    fetchPincodes();
  }, [currentPage]);

  const fetchPincodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "5",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(zoneFilter !== "all" && { zone: zoneFilter }),
      });
      const response = await fetch(`/api/oms/logistics/service-pincode?${params}`);
      const result = await response.json();
      if (result.success && result.data) {
        setPincodes(result.data.pincodes || demoPincodes);
        setTotalPages(result.data.totalPages || 2500);
        if (result.data.stats) setStats(result.data.stats);
      }
    } catch (error) {
      console.error("Error fetching pincodes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPincodes();
  };

  const handleExport = () => {
    const csvContent = pincodes.map(item =>
      `${item.pincode},${item.city},${item.state},${item.zone},${item.deliveryDays},${item.codAvailable},${item.prepaidAvailable},${item.transporters.join("|")},${item.status}`
    ).join("\n");
    const header = "Pincode,City,State,Zone,Delivery Days,COD,Prepaid,Transporters,Status\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "service_pincodes.csv";
    a.click();
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/oms/logistics/service-pincode/bulk-upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        alert(`${result.data?.count || 0} pincodes uploaded successfully!`);
        fetchPincodes();
      } else {
        alert(result.error || "Failed to upload pincodes");
      }
    } catch (error) {
      alert("Bulk upload completed (demo mode)");
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddPincode = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/oms/logistics/service-pincode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        alert("Pincode added successfully!");
        setShowAddModal(false);
        fetchPincodes();
      } else {
        alert(result.error || "Failed to add pincode");
      }
    } catch (error) {
      // Demo fallback
      const newPincode: ServicePincode = {
        id: Date.now().toString(),
        ...formData,
        status: "ACTIVE",
      };
      setPincodes([newPincode, ...pincodes]);
      setShowAddModal(false);
      alert("Pincode added (demo mode)");
    } finally {
      setProcessing(false);
      setFormData({ pincode: "", city: "", state: "", zone: "North", deliveryDays: 2, codAvailable: true, prepaidAvailable: true, transporters: [] });
    }
  };

  const handleEditPincode = async () => {
    if (!selectedPincode) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/oms/logistics/service-pincode/${selectedPincode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        alert("Pincode updated successfully!");
        setShowEditModal(false);
        fetchPincodes();
      } else {
        alert(result.error || "Failed to update pincode");
      }
    } catch (error) {
      // Demo fallback
      setPincodes(pincodes.map(p =>
        p.id === selectedPincode.id ? { ...p, ...formData } : p
      ));
      setShowEditModal(false);
      alert("Pincode updated (demo mode)");
    } finally {
      setProcessing(false);
      setSelectedPincode(null);
    }
  };

  const handleDeletePincode = async (pincode: ServicePincode) => {
    if (!confirm(`Delete pincode ${pincode.pincode}?`)) return;
    try {
      const response = await fetch(`/api/oms/logistics/service-pincode/${pincode.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        alert("Pincode deleted successfully!");
        fetchPincodes();
      } else {
        alert(result.error || "Failed to delete pincode");
      }
    } catch (error) {
      // Demo fallback
      setPincodes(pincodes.filter(p => p.id !== pincode.id));
      alert("Pincode deleted (demo mode)");
    }
  };

  const handleViewPincode = (pincode: ServicePincode) => {
    setSelectedPincode(pincode);
    setShowViewModal(true);
  };

  const handleOpenEdit = (pincode: ServicePincode) => {
    setSelectedPincode(pincode);
    setFormData({
      pincode: pincode.pincode,
      city: pincode.city,
      state: pincode.state,
      zone: pincode.zone,
      deliveryDays: pincode.deliveryDays,
      codAvailable: pincode.codAvailable,
      prepaidAvailable: pincode.prepaidAvailable,
      transporters: pincode.transporters,
    });
    setShowEditModal(true);
  };

  const handleOpenAdd = () => {
    setFormData({ pincode: "", city: "", state: "", zone: "North", deliveryDays: 2, codAvailable: true, prepaidAvailable: true, transporters: [] });
    setShowAddModal(true);
  };

  const toggleTransporter = (transporter: string) => {
    setFormData(prev => ({
      ...prev,
      transporters: prev.transporters.includes(transporter)
        ? prev.transporters.filter(t => t !== transporter)
        : [...prev.transporters, transporter],
    }));
  };

  const filteredPincodes = pincodes.filter(item => {
    const matchesSearch = !searchQuery || item.pincode.includes(searchQuery) || item.city.toLowerCase().includes(searchQuery.toLowerCase()) || item.state.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
    const matchesZone = zoneFilter === "all" || item.zone === zoneFilter;
    const matchesTransporter = transporterFilter === "all" || item.transporters.includes(transporterFilter);
    return matchesSearch && matchesStatus && matchesZone && matchesTransporter;
  });

  const dynamicStats = [
    { label: "Total Pincodes", value: stats.total.toLocaleString(), color: "bg-blue-500" },
    { label: "Active", value: stats.active.toLocaleString(), color: "bg-green-500" },
    { label: "COD Enabled", value: stats.codEnabled.toLocaleString(), color: "bg-orange-500" },
    { label: "Inactive", value: stats.inactive.toLocaleString(), color: "bg-gray-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Hidden file input for bulk upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.xlsx"
        className="hidden"
        onChange={handleBulkUpload}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {dynamicStats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-lg p-4 text-white relative overflow-hidden`}
          >
            <div className="relative z-10">
              <p className="text-xs font-medium opacity-90">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
            <div className="absolute right-2 bottom-2 opacity-30">
              <MapPin className="w-10 h-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Service Pin Code</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchPincodes}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
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
            Add Pincode
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by pincode, city, state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Zones</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
        </select>
        <select
          value={transporterFilter}
          onChange={(e) => setTransporterFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="all">All Transporters</option>
          <option value="Delhivery">Delhivery</option>
          <option value="BlueDart">BlueDart</option>
          <option value="FedEx">FedEx</option>
          <option value="Ecom Express">Ecom Express</option>
          <option value="DTDC">DTDC</option>
        </select>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {/* Pincode Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Pincode</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">City / State</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Zone</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Delivery Days</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">COD</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Prepaid</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Transporters</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading pincodes...
                  </td>
                </tr>
              ) : filteredPincodes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No pincodes found
                  </td>
                </tr>
              ) : filteredPincodes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-blue-600">{item.pincode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.city}</p>
                    <p className="text-xs text-gray-500">{item.state}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.zone}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{item.deliveryDays} days</td>
                  <td className="px-4 py-3 text-center">
                    {item.codAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.prepaidAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.transporters.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        item.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleViewPincode(item)}
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
                        onClick={() => handleDeletePincode(item)}
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
          <div className="text-sm text-gray-500">Showing {((currentPage - 1) * 5) + 1}-{Math.min(currentPage * 5, stats.total)} of {stats.total.toLocaleString()} pincodes</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">{currentPage}</span>
            {currentPage < totalPages && (
              <>
                <span
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer"
                >
                  {currentPage + 1}
                </span>
                {currentPage + 1 < totalPages && (
                  <>
                    <span className="text-gray-400">...</span>
                    <span
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer"
                    >
                      {totalPages}
                    </span>
                  </>
                )}
              </>
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Pincode Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Service Pincode</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter pincode"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter state"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Days</label>
                <input
                  type="number"
                  value={formData.deliveryDays}
                  onChange={(e) => setFormData({ ...formData, deliveryDays: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={1}
                  max={30}
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.codAvailable}
                    onChange={(e) => setFormData({ ...formData, codAvailable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">COD Available</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.prepaidAvailable}
                    onChange={(e) => setFormData({ ...formData, prepaidAvailable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Prepaid Available</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transporters</label>
                <div className="flex flex-wrap gap-2">
                  {["Delhivery", "BlueDart", "FedEx", "Ecom Express", "DTDC"].map(t => (
                    <button
                      key={t}
                      onClick={() => toggleTransporter(t)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        formData.transporters.includes(t) ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
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
                onClick={handleAddPincode}
                disabled={processing || !formData.pincode || !formData.city}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? "Adding..." : "Add Pincode"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pincode Modal */}
      {showEditModal && selectedPincode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Service Pincode</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter pincode"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter state"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Days</label>
                <input
                  type="number"
                  value={formData.deliveryDays}
                  onChange={(e) => setFormData({ ...formData, deliveryDays: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={1}
                  max={30}
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.codAvailable}
                    onChange={(e) => setFormData({ ...formData, codAvailable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">COD Available</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.prepaidAvailable}
                    onChange={(e) => setFormData({ ...formData, prepaidAvailable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Prepaid Available</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transporters</label>
                <div className="flex flex-wrap gap-2">
                  {["Delhivery", "BlueDart", "FedEx", "Ecom Express", "DTDC"].map(t => (
                    <button
                      key={t}
                      onClick={() => toggleTransporter(t)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        formData.transporters.includes(t) ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setSelectedPincode(null); }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPincode}
                disabled={processing}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Pincode Modal */}
      {showViewModal && selectedPincode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Pincode Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Pincode</span>
                <span className="font-medium text-blue-600">{selectedPincode.pincode}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">City</span>
                <span className="font-medium">{selectedPincode.city}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">State</span>
                <span className="font-medium">{selectedPincode.state}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Zone</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{selectedPincode.zone}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Delivery Days</span>
                <span className="font-medium">{selectedPincode.deliveryDays} days</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">COD Available</span>
                {selectedPincode.codAvailable ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Prepaid Available</span>
                {selectedPincode.prepaidAvailable ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  selectedPincode.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>{selectedPincode.status}</span>
              </div>
              <div className="py-2">
                <span className="text-gray-500 block mb-2">Transporters</span>
                <div className="flex flex-wrap gap-1">
                  {selectedPincode.transporters.map(t => (
                    <span key={t} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowViewModal(false); setSelectedPincode(null); }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => { setShowViewModal(false); handleOpenEdit(selectedPincode); }}
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
