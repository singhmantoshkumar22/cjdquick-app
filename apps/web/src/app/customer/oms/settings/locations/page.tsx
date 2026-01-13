"use client";

import { useState, useEffect } from "react";
import {
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Package,
  X,
} from "lucide-react";

interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  capacity: number;
  currentStock: number;
  status: string;
  manager: string;
}

export default function LocationSettingsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/oms/settings/locations");
      const result = await response.json();
      if (result.success) {
        setLocations(result.data.locations || getDemoLocations());
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocations(getDemoLocations());
    } finally {
      setLoading(false);
    }
  };

  const getDemoLocations = (): Location[] => [
    { id: "1", code: "WH-DELHI", name: "Delhi Warehouse", type: "WAREHOUSE", address: "Plot 45, Industrial Area Phase 2", city: "Delhi", state: "Delhi", pincode: "110037", phone: "+91 11 2345 6789", email: "delhi@cjd.com", capacity: 50000, currentStock: 38500, status: "ACTIVE", manager: "Rahul Sharma" },
    { id: "2", code: "WH-MUMBAI", name: "Mumbai Distribution Center", type: "DISTRIBUTION_CENTER", address: "Unit 12, Bhiwandi Industrial Estate", city: "Mumbai", state: "Maharashtra", pincode: "421302", phone: "+91 22 3456 7890", email: "mumbai@cjd.com", capacity: 75000, currentStock: 52000, status: "ACTIVE", manager: "Priya Patel" },
    { id: "3", code: "WH-BANGALORE", name: "Bangalore Fulfillment Hub", type: "FULFILLMENT_CENTER", address: "Survey No. 78, Electronic City", city: "Bangalore", state: "Karnataka", pincode: "560100", phone: "+91 80 4567 8901", email: "bangalore@cjd.com", capacity: 40000, currentStock: 28000, status: "ACTIVE", manager: "Amit Kumar" },
    { id: "4", code: "WH-CHENNAI", name: "Chennai Warehouse", type: "WAREHOUSE", address: "Block C, Sriperumbudur Industrial Park", city: "Chennai", state: "Tamil Nadu", pincode: "602105", phone: "+91 44 5678 9012", email: "chennai@cjd.com", capacity: 30000, currentStock: 18500, status: "ACTIVE", manager: "Sneha Gupta" },
    { id: "5", code: "STORE-001", name: "Delhi Retail Store", type: "RETAIL_STORE", address: "123 Connaught Place", city: "Delhi", state: "Delhi", pincode: "110001", phone: "+91 11 6789 0123", email: "store001@cjd.com", capacity: 5000, currentStock: 3200, status: "ACTIVE", manager: "Vikram Singh" },
  ];

  const filteredLocations = locations.filter((location) => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || location.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const locationTypes = ["WAREHOUSE", "DISTRIBUTION_CENTER", "FULFILLMENT_CENTER", "RETAIL_STORE"];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Settings</h1>
          <p className="text-gray-600">Manage warehouses, stores, and fulfillment centers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="all">All Types</option>
          {locationTypes.map((type) => (
            <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))
        ) : filteredLocations.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No locations found
          </div>
        ) : (
          filteredLocations.map((location) => (
            <div key={location.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      location.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {location.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{location.code}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {location.type.replace(/_/g, " ")}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-600">
                    {location.address}, {location.city}, {location.state} - {location.pincode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{location.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{location.email}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Capacity Utilization</span>
                  <span className="font-medium">
                    {Math.round((location.currentStock / location.capacity) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (location.currentStock / location.capacity) > 0.9
                        ? "bg-red-500"
                        : (location.currentStock / location.capacity) > 0.7
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${(location.currentStock / location.capacity) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {location.currentStock.toLocaleString()} / {location.capacity.toLocaleString()} units
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Manager: {location.manager}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingLocation(location)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingLocation) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingLocation ? "Edit Location" : "Add New Location"}
              </h2>
              <button
                onClick={() => { setShowAddModal(false); setEditingLocation(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Code *</label>
                <input
                  type="text"
                  defaultValue={editingLocation?.code}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="e.g., WH-DELHI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
                <input
                  type="text"
                  defaultValue={editingLocation?.name}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Enter location name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  defaultValue={editingLocation?.type}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {locationTypes.map((type) => (
                    <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  defaultValue={editingLocation?.capacity}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Enter capacity"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  defaultValue={editingLocation?.address}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  defaultValue={editingLocation?.city}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  defaultValue={editingLocation?.state}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  defaultValue={editingLocation?.pincode}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                <select
                  defaultValue={editingLocation?.manager}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option>Rahul Sharma</option>
                  <option>Priya Patel</option>
                  <option>Amit Kumar</option>
                  <option>Sneha Gupta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  defaultValue={editingLocation?.phone}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={editingLocation?.email}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setEditingLocation(null); }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingLocation ? "Update Location" : "Add Location"}
              </button>
              <button
                onClick={() => { setShowAddModal(false); setEditingLocation(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
