"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Search, CheckCircle, XCircle, Truck, Clock } from "lucide-react";
import { Button } from "@cjdquick/ui";

interface ServiceabilityResult {
  pincode: string;
  city: string;
  state: string;
  serviceable: boolean;
  services: {
    name: string;
    available: boolean;
    deliveryDays: string;
    codAvailable: boolean;
  }[];
}

export default function ServiceabilityPage() {
  const [loading, setLoading] = useState(false);
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<ServiceabilityResult | null>(null);
  const [error, setError] = useState("");

  const checkServiceability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    setLoading(true);
    setError("");

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // Demo data - most pincodes are serviceable
    const isServiceable = !["999999", "000000"].includes(pincode);

    if (isServiceable) {
      setResult({
        pincode,
        city: pincode.startsWith("11") ? "New Delhi" :
              pincode.startsWith("40") ? "Mumbai" :
              pincode.startsWith("56") ? "Bangalore" :
              pincode.startsWith("60") ? "Chennai" : "Sample City",
        state: pincode.startsWith("11") ? "Delhi" :
               pincode.startsWith("40") ? "Maharashtra" :
               pincode.startsWith("56") ? "Karnataka" :
               pincode.startsWith("60") ? "Tamil Nadu" : "Sample State",
        serviceable: true,
        services: [
          {
            name: "CJD Express",
            available: true,
            deliveryDays: "1-2 days",
            codAvailable: true,
          },
          {
            name: "CJD Standard",
            available: true,
            deliveryDays: "3-4 days",
            codAvailable: true,
          },
          {
            name: "CJD Surface",
            available: true,
            deliveryDays: "5-7 days",
            codAvailable: true,
          },
          {
            name: "CJD Economy",
            available: pincode.startsWith("11") || pincode.startsWith("40"),
            deliveryDays: "7-10 days",
            codAvailable: false,
          },
        ],
      });
    } else {
      setResult({
        pincode,
        city: "Unknown",
        state: "Unknown",
        serviceable: false,
        services: [],
      });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pincode Serviceability</h1>
          <p className="text-sm text-gray-500">Check if we deliver to a pincode</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={checkServiceability} className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter Pincode
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit pincode"
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="gap-2">
              <Search className="h-4 w-4" />
              {loading ? "Checking..." : "Check"}
            </Button>
          </div>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className={`rounded-xl border p-6 ${
            result.serviceable
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-center gap-4">
              {result.serviceable ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : (
                <XCircle className="h-10 w-10 text-red-500" />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {result.serviceable ? "Serviceable" : "Not Serviceable"}
                </h2>
                <p className="text-gray-600">
                  {result.serviceable
                    ? `We deliver to ${result.city}, ${result.state} (${result.pincode})`
                    : `Sorry, we don't deliver to pincode ${result.pincode} yet`}
                </p>
              </div>
            </div>
          </div>

          {/* Services */}
          {result.serviceable && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-gray-400" />
                Available Services
              </h2>
              <div className="space-y-4">
                {result.services.map((service, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      service.available ? "bg-gray-50" : "bg-gray-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {service.available ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{service.deliveryDays}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {service.available ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.codAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {service.codAvailable ? "COD Available" : "Prepaid Only"}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                          Not Available
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Service Coverage</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>We cover 19,000+ pincodes across India</li>
          <li>Metro cities have same-day and next-day delivery options</li>
          <li>COD is available in 15,000+ pincodes</li>
          <li>Contact support for special delivery requirements</li>
        </ul>
      </div>
    </div>
  );
}
