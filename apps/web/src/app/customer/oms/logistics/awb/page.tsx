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
  FileBarChart,
  Truck,
  Package,
  CheckCircle,
  X,
} from "lucide-react";

interface AWBItem {
  id: string;
  awbNo: string;
  siteLocation: string;
  transporter: string;
  orderType: "PREPAID" | "COD";
  status: "FREE" | "ISSUED";
  courierType: "FORWARD" | "REVERSE";
  createdAt: string;
  createdBy: string;
}

const demoAWBs: AWBItem[] = [
  { id: "1", awbNo: "AWB-2024-001234", siteLocation: "Headoffice", transporter: "Delhivery", orderType: "PREPAID", status: "FREE", courierType: "FORWARD", createdAt: "2024-01-08 10:30", createdBy: "Rahul Kumar" },
  { id: "2", awbNo: "AWB-2024-001235", siteLocation: "Headoffice", transporter: "BlueDart", orderType: "COD", status: "ISSUED", courierType: "FORWARD", createdAt: "2024-01-08 09:15", createdBy: "Priya Sharma" },
  { id: "3", awbNo: "AWB-2024-001236", siteLocation: "Warehouse A", transporter: "FedEx", orderType: "PREPAID", status: "FREE", courierType: "REVERSE", createdAt: "2024-01-07 14:20", createdBy: "Amit Patel" },
  { id: "4", awbNo: "AWB-2024-001237", siteLocation: "Warehouse B", transporter: "Ecom Express", orderType: "COD", status: "FREE", courierType: "FORWARD", createdAt: "2024-01-08 11:45", createdBy: "Sneha Gupta" },
  { id: "5", awbNo: "AWB-2024-001238", siteLocation: "Headoffice", transporter: "DTDC", orderType: "PREPAID", status: "ISSUED", courierType: "REVERSE", createdAt: "2024-01-06 16:00", createdBy: "Vikram Singh" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  FREE: { bg: "bg-green-100", text: "text-green-700" },
  ISSUED: { bg: "bg-blue-100", text: "text-blue-700" },
};

const courierTypeColors: Record<string, { bg: string; text: string }> = {
  FORWARD: { bg: "bg-cyan-100", text: "text-cyan-700" },
  REVERSE: { bg: "bg-orange-100", text: "text-orange-700" },
};

const summaryStats = [
  { label: "Total AWB", value: "8,934", color: "bg-blue-500", icon: FileBarChart },
  { label: "Free", value: "5,234", color: "bg-green-500", icon: CheckCircle },
  { label: "Issued", value: "3,700", color: "bg-orange-500", icon: Truck },
  { label: "Forward", value: "7,500", color: "bg-cyan-500", icon: Package },
];

export default function ManageAWBPage() {
  const [awbs, setAWBs] = useState<AWBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [siteLocation, setSiteLocation] = useState("all");
  const [transporter, setTransporter] = useState("all");
  const [orderType, setOrderType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courierType, setCourierType] = useState("all");
  const [selectedAWBs, setSelectedAWBs] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add AWB form state
  const [newAWB, setNewAWB] = useState({
    siteLocation: "Headoffice",
    transporter: "",
    orderType: "PREPAID",
    status: "FREE",
    addType: "single",
    awbNo: "",
    awbStart: "",
    awbEnd: "",
  });

  useEffect(() => {
    fetchAWBs();
  }, []);

  const fetchAWBs = async () => {
    try {
      const response = await fetch("/api/oms/logistics/awb");
      const result = await response.json();
      if (result.success && result.data?.awbs) {
        setAWBs(result.data.awbs);
      } else {
        setAWBs(demoAWBs);
      }
    } catch (error) {
      console.error("Error fetching AWBs:", error);
      setAWBs(demoAWBs);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAWB = async () => {
    if (!newAWB.transporter) return;
    if (newAWB.addType === "single" && !newAWB.awbNo) return;
    if (newAWB.addType === "series" && (!newAWB.awbStart || !newAWB.awbEnd)) return;

    try {
      await fetch("/api/oms/logistics/awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAWB),
      });
      setShowAddModal(false);
      setNewAWB({
        siteLocation: "Headoffice",
        transporter: "",
        orderType: "PREPAID",
        status: "FREE",
        addType: "single",
        awbNo: "",
        awbStart: "",
        awbEnd: "",
      });
      fetchAWBs();
    } catch (error) {
      console.error("Error adding AWB:", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAWBs.length === 0) return;
    try {
      await fetch("/api/oms/logistics/awb", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedAWBs }),
      });
      setSelectedAWBs([]);
      fetchAWBs();
    } catch (error) {
      console.error("Error deleting AWBs:", error);
    }
  };

  const handleExport = () => {
    const csvContent = filteredAWBs.map(item =>
      `${item.awbNo},${item.siteLocation},${item.transporter},${item.orderType},${item.status},${item.courierType},${item.createdAt}`
    ).join("\n");
    const header = "AWB No,Site Location,Transporter,Order Type,Status,Courier Type,Created At\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "awb_list.csv";
    a.click();
  };

  const handleReset = () => {
    setSearchQuery("");
    setSiteLocation("all");
    setTransporter("all");
    setOrderType("all");
    setStatusFilter("all");
    setCourierType("all");
  };

  const filteredAWBs = awbs.filter((item) => {
    const matchesSearch = item.awbNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSite = siteLocation === "all" || item.siteLocation === siteLocation;
    const matchesTransporter = transporter === "all" || item.transporter === transporter;
    const matchesOrderType = orderType === "all" || item.orderType === orderType;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCourierType = courierType === "all" || item.courierType === courierType;
    return matchesSearch && matchesSite && matchesTransporter && matchesOrderType && matchesStatus && matchesCourierType;
  });

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.color} rounded-lg p-4 text-white relative overflow-hidden`}
            >
              <div className="relative z-10">
                <p className="text-xs font-medium opacity-90">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className="absolute right-2 bottom-2 opacity-30">
                <Icon className="w-10 h-10" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage AWB</h1>
          <p className="text-sm text-gray-500">Search and manage AWB numbers for offline transporters</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {selectedAWBs.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedAWBs.length})
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Filters - As per document */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Site Location</label>
            <select
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Locations</option>
              <option value="Headoffice">Headoffice</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
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
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="FREE">Free</option>
              <option value="ISSUED">Issued</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Courier Type</label>
            <select
              value={courierType}
              onChange={(e) => setCourierType(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="FORWARD">Forward</option>
              <option value="REVERSE">Reverse</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">AWB No.</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AWB..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => fetchAWBs()}
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

      {/* AWB Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading AWBs...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedAWBs.length === filteredAWBs.length && filteredAWBs.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAWBs(filteredAWBs.map(a => a.id));
                          } else {
                            setSelectedAWBs([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">AWB No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Site Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Transporter</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Order Type</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Courier Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Created At</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAWBs.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedAWBs.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAWBs([...selectedAWBs, item.id]);
                            } else {
                              setSelectedAWBs(selectedAWBs.filter(id => id !== item.id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-600">{item.awbNo}</td>
                      <td className="px-4 py-3 text-gray-600">{item.siteLocation}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {item.transporter}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          item.orderType === "PREPAID" ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {item.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${statusColors[item.status]?.bg} ${statusColors[item.status]?.text}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${courierTypeColors[item.courierType]?.bg} ${courierTypeColors[item.courierType]?.text}`}>
                          {item.courierType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.createdAt}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-green-600" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600" title="Delete">
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
              <div className="text-sm text-gray-500">Showing 1-{filteredAWBs.length} of {filteredAWBs.length} AWBs</div>
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

      {/* Add AWB Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New AWB</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
                <select
                  value={newAWB.siteLocation}
                  onChange={(e) => setNewAWB({ ...newAWB, siteLocation: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="Headoffice">Headoffice</option>
                  <option value="Warehouse A">Warehouse A</option>
                  <option value="Warehouse B">Warehouse B</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporter *</label>
                <select
                  value={newAWB.transporter}
                  onChange={(e) => setNewAWB({ ...newAWB, transporter: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select Transporter</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Ecom Express">Ecom Express</option>
                  <option value="DTDC">DTDC</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                  <select
                    value={newAWB.orderType}
                    onChange={(e) => setNewAWB({ ...newAWB, orderType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  >
                    <option value="PREPAID">Prepaid</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newAWB.status}
                    onChange={(e) => setNewAWB({ ...newAWB, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  >
                    <option value="FREE">Free</option>
                    <option value="ISSUED">Issued</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AWB Entry Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="addType"
                      value="single"
                      checked={newAWB.addType === "single"}
                      onChange={(e) => setNewAWB({ ...newAWB, addType: e.target.value })}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Add Single AWB</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="addType"
                      value="series"
                      checked={newAWB.addType === "series"}
                      onChange={(e) => setNewAWB({ ...newAWB, addType: e.target.value })}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Add AWB Series</span>
                  </label>
                </div>
              </div>

              {newAWB.addType === "single" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AWB Number *</label>
                  <input
                    type="text"
                    value={newAWB.awbNo}
                    onChange={(e) => setNewAWB({ ...newAWB, awbNo: e.target.value })}
                    placeholder="Enter AWB number"
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AWB Start *</label>
                    <input
                      type="text"
                      value={newAWB.awbStart}
                      onChange={(e) => setNewAWB({ ...newAWB, awbStart: e.target.value })}
                      placeholder="Start number"
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AWB End *</label>
                    <input
                      type="text"
                      value={newAWB.awbEnd}
                      onChange={(e) => setNewAWB({ ...newAWB, awbEnd: e.target.value })}
                      placeholder="End number"
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAWB}
                disabled={!newAWB.transporter || (newAWB.addType === "single" ? !newAWB.awbNo : !newAWB.awbStart || !newAWB.awbEnd)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add AWB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
