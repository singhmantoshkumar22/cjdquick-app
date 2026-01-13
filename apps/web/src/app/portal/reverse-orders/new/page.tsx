"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, User, MapPin, Save, Loader2, Search } from "lucide-react";
import { Button } from "@cjdquick/ui";

export default function NewReverseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchAwb, setSearchAwb] = useState("");
  const [originalOrder, setOriginalOrder] = useState<{
    orderNumber: string;
    awbNumber: string;
    customerName: string;
    customerPhone: string;
    address: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    returnType: "CUSTOMER_RETURN",
    reason: "",
    pickupDate: "",
    pickupTime: "10:00-14:00",
    specialInstructions: "",
    // Pickup Address (customer's location)
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleSearchOrder = async () => {
    if (!searchAwb) return;

    // Simulate finding original order
    setOriginalOrder({
      orderNumber: "ORD-B2B-001234",
      awbNumber: searchAwb,
      customerName: "Rahul Sharma",
      customerPhone: "+91 9876543210",
      address: "123, Green Valley Apartments, Sector 45, Gurugram, Haryana - 122003",
    });

    // Pre-fill pickup address from original order
    setFormData(prev => ({
      ...prev,
      addressLine1: "123, Green Valley Apartments",
      addressLine2: "Sector 45",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122003",
    }));
  };

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
      const response = await fetch("/api/portal/reverse-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalAwb: searchAwb,
          returnType: formData.returnType,
          reason: formData.reason,
          pickupDate: formData.pickupDate,
          pickupTime: formData.pickupTime,
          specialInstructions: formData.specialInstructions,
          pickupAddress: {
            line1: formData.addressLine1,
            line2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/portal/reverse-orders");
      } else {
        setError(data.error || "Failed to create reverse order");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/portal/reverse-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Reverse Order</h1>
          <p className="text-sm text-gray-500">Schedule a return pickup from customer</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search Original Order */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Find Original Order</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={searchAwb}
            onChange={(e) => setSearchAwb(e.target.value)}
            placeholder="Enter AWB Number or Order ID"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="button" onClick={handleSearchOrder} className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>

        {originalOrder && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-medium">{originalOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">AWB Number</p>
                <p className="font-medium">{originalOrder.awbNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{originalOrder.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{originalOrder.customerPhone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-medium">{originalOrder.address}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {originalOrder && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Return Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Return Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="returnType"
                  value={formData.returnType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CUSTOMER_RETURN">Customer Return</option>
                  <option value="EXCHANGE">Exchange</option>
                  <option value="REFUND">Refund</option>
                  <option value="DAMAGED">Damaged Product</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Reason</option>
                  <option value="WRONG_PRODUCT">Wrong Product Delivered</option>
                  <option value="DEFECTIVE">Defective/Damaged Product</option>
                  <option value="SIZE_ISSUE">Size/Fit Issue</option>
                  <option value="NOT_AS_DESCRIBED">Not as Described</option>
                  <option value="CHANGED_MIND">Changed Mind</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Pickup Date <span className="text-red-500">*</span>
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
                  Pickup Time Slot
                </label>
                <select
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10:00-14:00">10:00 AM - 2:00 PM</option>
                  <option value="14:00-18:00">2:00 PM - 6:00 PM</option>
                  <option value="18:00-21:00">6:00 PM - 9:00 PM</option>
                </select>
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
                  placeholder="Any special instructions for pickup..."
                />
              </div>
            </div>
          </div>

          {/* Pickup Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Pickup Address</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select State</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/portal/reverse-orders">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Reverse Order
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
