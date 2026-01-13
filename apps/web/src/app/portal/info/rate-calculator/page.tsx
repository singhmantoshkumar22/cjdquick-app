"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, Package, MapPin, Truck, IndianRupee } from "lucide-react";
import { Button } from "@cjdquick/ui";

interface RateResult {
  courier: string;
  deliveryTime: string;
  baseCharge: number;
  fuelSurcharge: number;
  codCharge: number;
  total: number;
}

export default function RateCalculatorPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RateResult[] | null>(null);

  const [formData, setFormData] = useState({
    originPincode: "",
    destinationPincode: "",
    weight: 0.5,
    length: 10,
    width: 10,
    height: 10,
    paymentMode: "PREPAID",
    codAmount: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const baseRate = parseFloat(formData.weight.toString()) * 50 + 30;
    const codCharge = formData.paymentMode === "COD" ? 35 : 0;

    setResults([
      {
        courier: "CJD Express",
        deliveryTime: "2-3 days",
        baseCharge: baseRate,
        fuelSurcharge: Math.round(baseRate * 0.15),
        codCharge,
        total: Math.round(baseRate * 1.15 + codCharge),
      },
      {
        courier: "CJD Surface",
        deliveryTime: "4-6 days",
        baseCharge: Math.round(baseRate * 0.7),
        fuelSurcharge: Math.round(baseRate * 0.7 * 0.1),
        codCharge,
        total: Math.round(baseRate * 0.7 * 1.1 + codCharge),
      },
      {
        courier: "CJD Economy",
        deliveryTime: "5-7 days",
        baseCharge: Math.round(baseRate * 0.5),
        fuelSurcharge: Math.round(baseRate * 0.5 * 0.08),
        codCharge,
        total: Math.round(baseRate * 0.5 * 1.08 + codCharge),
      },
    ]);

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Calculator</h1>
          <p className="text-sm text-gray-500">Calculate shipping rates for your shipments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={calculateRates} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Shipment Details</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin Pincode
                </label>
                <input
                  type="text"
                  name="originPincode"
                  value={formData.originPincode}
                  onChange={handleChange}
                  maxLength={6}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="400001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Pincode
                </label>
                <input
                  type="text"
                  name="destinationPincode"
                  value={formData.destinationPincode}
                  onChange={handleChange}
                  maxLength={6}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="110001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min={0.1}
                step={0.1}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Length (cm)
                </label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PREPAID">Prepaid</option>
                <option value="COD">Cash on Delivery</option>
              </select>
            </div>

            {formData.paymentMode === "COD" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  COD Amount (Rs.)
                </label>
                <input
                  type="number"
                  name="codAmount"
                  value={formData.codAmount}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? "Calculating..." : "Calculate Rates"}
            </Button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results ? (
            <>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-gray-400" />
                Available Rates
              </h2>
              {results.map((rate, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl border p-6 ${
                    index === 0 ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"
                  }`}
                >
                  {index === 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mb-2 inline-block">
                      Recommended
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">{rate.courier}</span>
                    </div>
                    <span className="text-sm text-gray-500">{rate.deliveryTime}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Base Charge</span>
                      <span>Rs. {rate.baseCharge}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Fuel Surcharge</span>
                      <span>Rs. {rate.fuelSurcharge}</span>
                    </div>
                    {rate.codCharge > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>COD Charge</span>
                        <span>Rs. {rate.codCharge}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                      <span>Total</span>
                      <span>Rs. {rate.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Enter shipment details to calculate rates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
