"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Clock, Package, Save, Loader2 } from "lucide-react";
import { Button } from "@cjdquick/ui";

export default function NewPickupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    pickupDate: "",
    timeSlot: "10:00-14:00",
    pickupLocation: "",
    expectedPackages: 1,
    totalWeight: 1,
    specialInstructions: "",
    contactName: "",
    contactPhone: "",
  });

  // Demo pickup locations
  const pickupLocations = [
    { id: "loc1", name: "Mumbai Warehouse", address: "Plot 45, MIDC Industrial Area, Andheri East, Mumbai - 400093" },
    { id: "loc2", name: "Delhi Office", address: "B-12, Okhla Industrial Estate, Phase 2, New Delhi - 110020" },
    { id: "loc3", name: "Bangalore Hub", address: "No. 234, Electronic City Phase 1, Bangalore - 560100" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("portal_token");

    try {
      const response = await fetch("/api/portal/pickups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickupDate: formData.pickupDate,
          timeSlot: formData.timeSlot,
          pickupLocationId: formData.pickupLocation,
          expectedPackages: parseInt(formData.expectedPackages.toString()),
          totalWeight: parseFloat(formData.totalWeight.toString()),
          specialInstructions: formData.specialInstructions,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/portal/pickups");
      } else {
        setError(data.error || "Failed to schedule pickup");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedLocation = pickupLocations.find(l => l.id === formData.pickupLocation);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/portal/pickups">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Pickup</h1>
          <p className="text-sm text-gray-500">Request a pickup from your warehouse</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pickup Location */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Pickup Location</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Pickup Address <span className="text-red-500">*</span>
            </label>
            <select
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a location</option>
              {pickupLocations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>

            {selectedLocation && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{selectedLocation.address}</p>
              </div>
            )}

            <Link href="/portal/settings/pickup-locations" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              + Add new pickup location
            </Link>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Schedule</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Slot <span className="text-red-500">*</span>
              </label>
              <select
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="09:00-12:00">9:00 AM - 12:00 PM</option>
                <option value="10:00-14:00">10:00 AM - 2:00 PM</option>
                <option value="14:00-18:00">2:00 PM - 6:00 PM</option>
                <option value="16:00-20:00">4:00 PM - 8:00 PM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Package Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Packages <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="expectedPackages"
                value={formData.expectedPackages}
                onChange={handleChange}
                min={1}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="totalWeight"
                value={formData.totalWeight}
                onChange={handleChange}
                min={0.1}
                step={0.1}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special handling instructions..."
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Contact for Pickup</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Person to contact at pickup"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10-digit mobile number"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/portal/pickups">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Schedule Pickup
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
