"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Truck,
  Calendar,
  Clock,
  Package,
  Scale,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Card, Button, Input } from "@cjdquick/ui";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
  isActive: boolean;
}

async function fetchWarehouses(): Promise<{ success: boolean; data: Warehouse[] }> {
  const res = await fetch("/api/client/facilities?status=active");
  return res.json();
}

async function createPickup(data: any): Promise<{ success: boolean; data: any }> {
  const res = await fetch("/api/client/pickups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create pickup");
  return res.json();
}

const TIME_SLOTS = [
  { start: "09:00", end: "12:00", label: "Morning (9 AM - 12 PM)" },
  { start: "12:00", end: "15:00", label: "Afternoon (12 PM - 3 PM)" },
  { start: "15:00", end: "18:00", label: "Evening (3 PM - 6 PM)" },
  { start: "18:00", end: "21:00", label: "Night (6 PM - 9 PM)" },
];

export default function SchedulePickupPage() {
  const router = useRouter();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [requestedDate, setRequestedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null);
  const [expectedAwbs, setExpectedAwbs] = useState<string>("");
  const [expectedWeight, setExpectedWeight] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: warehousesData, isLoading: loadingWarehouses } = useQuery({
    queryKey: ["client-warehouses"],
    queryFn: fetchWarehouses,
  });

  const createMutation = useMutation({
    mutationFn: createPickup,
    onSuccess: (data) => {
      router.push(`/client/pickups/${data.data.id}`);
    },
  });

  const warehouses = warehousesData?.data || [];
  const selectedWarehouseData = warehouses.find((w) => w.id === selectedWarehouse);

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWarehouse || !requestedDate) {
      alert("Please select a warehouse and pickup date");
      return;
    }

    const timeSlot = selectedTimeSlot !== null ? TIME_SLOTS[selectedTimeSlot] : null;

    createMutation.mutate({
      warehouseId: selectedWarehouse,
      requestedDate,
      timeSlotStart: timeSlot?.start,
      timeSlotEnd: timeSlot?.end,
      expectedAwbs: expectedAwbs ? parseInt(expectedAwbs) : 0,
      expectedWeight: expectedWeight ? parseFloat(expectedWeight) : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/client/pickups">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Schedule Pickup</h1>
          <p className="text-sm text-gray-500">Request a new pickup from your facility</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Warehouse */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Pickup Location
          </h2>

          {loadingWarehouses ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No facilities added yet</p>
              <Link href="/client/facilities">
                <Button variant="outline" className="mt-4">
                  Add Facility
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map((warehouse) => (
                <button
                  key={warehouse.id}
                  type="button"
                  onClick={() => setSelectedWarehouse(warehouse.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedWarehouse === warehouse.id
                      ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-900">{warehouse.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{warehouse.code}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {warehouse.address}, {warehouse.city} - {warehouse.pincode}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Contact: {warehouse.contactName} ({warehouse.contactPhone})
                  </p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Schedule Date & Time */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Date & Time
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="requestedDate" className="block text-sm font-medium text-gray-700">Pickup Date *</label>
              <Input
                id="requestedDate"
                type="date"
                min={minDate}
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Time Slot</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {TIME_SLOTS.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedTimeSlot(index)}
                    className={`p-3 border rounded-lg text-sm transition-all flex items-center gap-2 ${
                      selectedTimeSlot === index
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Package Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Expected Packages (Optional)
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expectedAwbs" className="block text-sm font-medium text-gray-700">Expected AWBs</label>
              <Input
                id="expectedAwbs"
                type="number"
                min="0"
                placeholder="e.g., 50"
                value={expectedAwbs}
                onChange={(e) => setExpectedAwbs(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="expectedWeight" className="block text-sm font-medium text-gray-700">Expected Weight (kg)</label>
              <div className="relative mt-1">
                <Input
                  id="expectedWeight"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g., 100"
                  value={expectedWeight}
                  onChange={(e) => setExpectedWeight(e.target.value)}
                />
                <Scale className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any special instructions for the pickup agent..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </Card>

        {/* Summary */}
        {selectedWarehouse && requestedDate && (
          <Card className="p-6 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pickup Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="font-medium">{selectedWarehouseData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">
                  {new Date(requestedDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {selectedTimeSlot !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Time Slot</span>
                  <span className="font-medium">{TIME_SLOTS[selectedTimeSlot].label}</span>
                </div>
              )}
              {expectedAwbs && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expected AWBs</span>
                  <span className="font-medium">{expectedAwbs}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/client/pickups">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!selectedWarehouse || !requestedDate || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Schedule Pickup
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
