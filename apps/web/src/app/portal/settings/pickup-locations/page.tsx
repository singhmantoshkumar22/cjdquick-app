"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { Button } from "@cjdquick/ui";

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
  isDefault: boolean;
}

export default function PickupLocationsPage() {
  const [locations, setLocations] = useState<PickupLocation[]>([
    {
      id: "1",
      name: "Mumbai Warehouse",
      address: "Plot 45, MIDC Industrial Area, Andheri East",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400093",
      contactName: "Rajesh Kumar",
      contactPhone: "+91 9876543210",
      isDefault: true,
    },
    {
      id: "2",
      name: "Delhi Office",
      address: "B-12, Okhla Industrial Estate, Phase 2",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110020",
      contactName: "Amit Singh",
      contactPhone: "+91 9876543211",
      isDefault: false,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactName: "",
    contactPhone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (editingId) {
      setLocations(prev => prev.map(loc =>
        loc.id === editingId ? { ...loc, ...formData } : loc
      ));
    } else {
      setLocations(prev => [...prev, {
        id: Date.now().toString(),
        ...formData,
        isDefault: false,
      }]);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", address: "", city: "", state: "", pincode: "", contactName: "", contactPhone: "" });
  };

  const handleEdit = (loc: PickupLocation) => {
    setFormData({
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
      contactName: loc.contactName,
      contactPhone: loc.contactPhone,
    });
    setEditingId(loc.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setLocations(prev => prev.map(loc => ({
      ...loc,
      isDefault: loc.id === id,
    })));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/portal/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pickup Locations</h1>
            <p className="text-sm text-gray-500">Manage your pickup addresses</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingId ? "Edit Location" : "Add New Location"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Mumbai Warehouse"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select State</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Gujarat">Gujarat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Location</Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                    {loc.isDefault && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{loc.address}</p>
                  <p className="text-sm text-gray-600">
                    {loc.city}, {loc.state} - {loc.pincode}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Contact: {loc.contactName} ({loc.contactPhone})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!loc.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(loc.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleEdit(loc)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(loc.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
