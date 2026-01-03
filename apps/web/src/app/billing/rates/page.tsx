"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Building2,
  Package,
  Percent,
  IndianRupee,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

// Fetch rate cards
async function fetchRateCards(clientId?: string) {
  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);
  params.set("isActive", "true");

  const res = await fetch(`/api/billing/rate-cards?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch rate cards");
  return res.json();
}

// Fetch clients
async function fetchClients() {
  const res = await fetch("/api/clients?pageSize=100");
  if (!res.ok) throw new Error("Failed to fetch clients");
  return res.json();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function RateManagementPage() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: clientsData } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: rateCardsData, isLoading, refetch } = useQuery({
    queryKey: ["rate-cards", selectedClient],
    queryFn: () => fetchRateCards(selectedClient),
  });

  const clients = clientsData?.data?.clients || [];
  const rateCards = rateCardsData?.data?.rateCards || [];

  const defaultZones = [
    { zoneName: "Local", zoneCode: "LOCAL", baseRatePerKg: 25, additionalPerKg: 20, expectedTatDays: 1 },
    { zoneName: "Regional", zoneCode: "REGIONAL", baseRatePerKg: 35, additionalPerKg: 28, expectedTatDays: 2 },
    { zoneName: "Metro", zoneCode: "METRO", baseRatePerKg: 45, additionalPerKg: 35, expectedTatDays: 3 },
    { zoneName: "Rest of India", zoneCode: "ROI", baseRatePerKg: 55, additionalPerKg: 45, expectedTatDays: 5 },
    { zoneName: "Special/Remote", zoneCode: "SPECIAL", baseRatePerKg: 75, additionalPerKg: 60, expectedTatDays: 7 },
  ];

  const defaultWeightSlabs = [
    { fromWeight: 0, toWeight: 0.5, ratePerKg: 0, flatRate: 35 },
    { fromWeight: 0.5, toWeight: 1, ratePerKg: 0, flatRate: 50 },
    { fromWeight: 1, toWeight: 5, ratePerKg: 45, flatRate: null },
    { fromWeight: 5, toWeight: 10, ratePerKg: 40, flatRate: null },
    { fromWeight: 10, toWeight: 50, ratePerKg: 35, flatRate: null },
    { fromWeight: 50, toWeight: 1000, ratePerKg: 30, flatRate: null },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="h-7 w-7 text-purple-600" />
            Rate Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure client-specific pricing and rate cards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" />
            New Rate Card
          </Button>
        </div>
      </div>

      {/* Client Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <Building2 className="h-5 w-5 text-gray-400" />
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="flex-1 text-sm border rounded-lg px-3 py-2"
          >
            <option value="">All Clients</option>
            {clients.map((client: any) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rate Cards Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
            Loading rate cards...
          </div>
        ) : rateCards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No rate cards found</p>
            <p className="text-sm text-gray-400 mt-1">
              Create a rate card to start billing clients
            </p>
            <Button size="sm" className="mt-4 gap-2" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4" />
              Create Rate Card
            </Button>
          </div>
        ) : (
          rateCards.map((card: any) => (
            <div key={card.id} className="bg-white rounded-xl shadow-sm border">
              {/* Card Header */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      card.isActive ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      <Package className={`h-5 w-5 ${card.isActive ? "text-green-600" : "text-gray-500"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{card.name}</h3>
                      <p className="text-sm text-gray-500">{card.clientName}</p>
                    </div>
                    {card.isActive && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Base Rate</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(card.baseFreightPerKg)}/kg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Min Freight</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(card.minFreight)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">COD Charge</p>
                      <p className="font-semibold text-gray-900">{card.codChargePercent}%</p>
                    </div>
                    {expandedCard === card.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedCard === card.id && (
                <div className="border-t p-5 space-y-6">
                  {/* Charges Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Fuel Surcharge</p>
                      <p className="font-semibold text-gray-900">{card.fuelSurchargePercent}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Handling/Shipment</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(card.handlingChargePerShipment)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">RTO Charge</p>
                      <p className="font-semibold text-gray-900">{card.rtoChargePercent}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">GST</p>
                      <p className="font-semibold text-gray-900">{card.gstPercent}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Billing Cycle</p>
                      <p className="font-semibold text-gray-900">{card.billingCycle}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Payment Terms</p>
                      <p className="font-semibold text-gray-900">{card.paymentTermsDays} days</p>
                    </div>
                  </div>

                  {/* Zone Rates */}
                  {card.zoneRates?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Zone-wise Rates</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2">Zone</th>
                              <th className="text-right px-4 py-2">Base Rate/kg</th>
                              <th className="text-right px-4 py-2">Additional/kg</th>
                              <th className="text-right px-4 py-2">Min Weight</th>
                              <th className="text-right px-4 py-2">TAT (Days)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {card.zoneRates.map((zone: any) => (
                              <tr key={zone.id}>
                                <td className="px-4 py-2 font-medium">{zone.zoneName}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(zone.baseRatePerKg)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(zone.additionalPerKg)}</td>
                                <td className="px-4 py-2 text-right">{zone.minWeight} kg</td>
                                <td className="px-4 py-2 text-right">{zone.expectedTatDays}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Weight Slabs */}
                  {card.weightSlabs?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Weight Slabs</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2">Weight Range</th>
                              <th className="text-right px-4 py-2">Rate/kg</th>
                              <th className="text-right px-4 py-2">Flat Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {card.weightSlabs.map((slab: any) => (
                              <tr key={slab.id}>
                                <td className="px-4 py-2 font-medium">
                                  {slab.fromWeight} - {slab.toWeight} kg
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {slab.ratePerKg ? formatCurrency(slab.ratePerKg) : "-"}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {slab.flatRate ? formatCurrency(slab.flatRate) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                      Deactivate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Reference */}
      <div className="mt-8 bg-purple-50 rounded-xl p-5">
        <h3 className="font-semibold text-purple-900 mb-4">Standard Rate Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-purple-800 mb-2">Default Zone Rates</h4>
            <div className="space-y-1 text-sm">
              {defaultZones.map((zone) => (
                <div key={zone.zoneCode} className="flex justify-between">
                  <span className="text-purple-700">{zone.zoneName}</span>
                  <span className="text-purple-900 font-medium">{formatCurrency(zone.baseRatePerKg)}/kg</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-purple-800 mb-2">Standard Charges</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">COD Charge</span>
                <span className="text-purple-900 font-medium">2% (min ₹20)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Fuel Surcharge</span>
                <span className="text-purple-900 font-medium">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">RTO Charge</span>
                <span className="text-purple-900 font-medium">100% of forward</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">GST</span>
                <span className="text-purple-900 font-medium">18%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
