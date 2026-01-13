"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  Truck,
} from "lucide-react";

interface Manifest {
  id: string;
  manifestNumber: string;
  manifestDate: string;
  transporter: string;
  location: string;
  user: string;
  orderCount: number;
  status: string;
  createdAt: string;
}

const demoManifests: Manifest[] = [
  { id: "1", manifestNumber: "MAN-2024-001234", manifestDate: "2024-01-08", transporter: "Delhivery", location: "Warehouse A", user: "Rahul Kumar", orderCount: 25, status: "CONFIRMED", createdAt: "2024-01-08 09:30" },
  { id: "2", manifestNumber: "MAN-2024-001235", manifestDate: "2024-01-08", transporter: "BlueDart", location: "Warehouse A", user: "Priya Sharma", orderCount: 18, status: "PENDING", createdAt: "2024-01-08 10:15" },
  { id: "3", manifestNumber: "MAN-2024-001236", manifestDate: "2024-01-08", transporter: "FedEx", location: "Warehouse B", user: "Amit Patel", orderCount: 12, status: "CONFIRMED", createdAt: "2024-01-08 11:00" },
  { id: "4", manifestNumber: "MAN-2024-001237", manifestDate: "2024-01-07", transporter: "Ecom Express", location: "Warehouse A", user: "Sneha Gupta", orderCount: 30, status: "CONFIRMED", createdAt: "2024-01-07 16:30" },
];

const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  CONFIRMED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
};

export default function ManifestPage() {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newManifest, setNewManifest] = useState({ transporter: "", trackingNumber: "", channel: "" });

  useEffect(() => {
    fetchManifests();
  }, []);

  const fetchManifests = async () => {
    try {
      const response = await fetch("/api/oms/wms/manifest");
      const result = await response.json();
      if (result.success && result.data?.manifests) {
        setManifests(result.data.manifests);
      } else {
        setManifests(demoManifests);
      }
    } catch (error) {
      console.error("Error fetching manifests:", error);
      setManifests(demoManifests);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManifest = async () => {
    try {
      await fetch("/api/oms/wms/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newManifest),
      });
      fetchManifests();
      setShowCreateModal(false);
      setNewManifest({ transporter: "", trackingNumber: "", channel: "" });
    } catch (error) {
      console.error("Error creating manifest:", error);
    }
  };

  const filteredManifests = manifests.filter((manifest) => {
    const matchesSearch = manifest.manifestNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || manifest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manifest</h1>
          <p className="text-sm text-gray-500">Create and manage shipping manifests for order dispatch</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Manifest
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Manifest Number</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manifest..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Manifest Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Transporter</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none">
              <option>All Transporters</option>
              <option>Delhivery</option>
              <option>BlueDart</option>
              <option>FedEx</option>
              <option>Ecom Express</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchManifests()}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Manifests Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading manifests...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Manifest Number</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Manifest Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Transporter</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Order Count</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredManifests.map((manifest) => {
                    const StatusIcon = statusColors[manifest.status]?.icon || Clock;
                    return (
                      <tr key={manifest.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-blue-600">{manifest.manifestNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{manifest.manifestDate}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">{manifest.transporter}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{manifest.location}</td>
                        <td className="px-4 py-3 text-gray-600">{manifest.user}</td>
                        <td className="px-4 py-3 text-center font-medium">{manifest.orderCount}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${statusColors[manifest.status]?.bg} ${statusColors[manifest.status]?.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {manifest.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-green-600" title="Print">
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">Showing 1-{filteredManifests.length} of {filteredManifests.length} manifests</div>
              <div className="flex items-center gap-2">
                <button className="p-1 border rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
                <button className="p-1 border rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Manifest Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Manifest</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporter *</label>
                <select
                  value={newManifest.transporter}
                  onChange={(e) => setNewManifest({ ...newManifest, transporter: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                >
                  <option value="">Select Transporter</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Ecom Express">Ecom Express</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number / Delivery No</label>
                <input
                  type="text"
                  value={newManifest.trackingNumber}
                  onChange={(e) => setNewManifest({ ...newManifest, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Scan or enter tracking number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel Type</label>
                <select
                  value={newManifest.channel}
                  onChange={(e) => setNewManifest({ ...newManifest, channel: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                >
                  <option value="">All Channels</option>
                  <option value="Website">Website</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManifest}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
