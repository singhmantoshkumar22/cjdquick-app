"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Leaf,
  TreePine,
  Truck,
  Fuel,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Download,
  Target,
  Zap,
} from "lucide-react";

interface EmissionSummary {
  totalCo2Kg: number;
  totalCo2Tons: number;
  totalDistanceKm: number;
  totalTrips: number;
  avgCo2PerKm: number;
  avgCo2PerKgCargo: number;
  treesEquivalent: number;
}

interface Comparison {
  previousPeriodCo2Kg: number;
  changePercent: number;
  isReduction: boolean;
}

interface FuelTypeEmission {
  fuelType: string;
  co2Kg: number;
  distanceKm: number;
  trips: number;
}

interface VehicleTypeEmission {
  vehicleType: string;
  co2Kg: number;
  distanceKm: number;
  trips: number;
}

interface GreenInitiative {
  id: string;
  name: string;
  description: string;
  status: string;
  targetReductionPercent: number;
}

export default function CarbonFootprintPage() {
  const [period, setPeriod] = useState("last_30_days");

  const { data: emissionsData, isLoading, refetch } = useQuery({
    queryKey: ["carbon-emissions", period],
    queryFn: async () => {
      const res = await fetch(`/api/carbon/emissions?period=${period}`);
      return res.json();
    },
  });

  const summary: EmissionSummary = emissionsData?.data?.summary || {
    totalCo2Kg: 0,
    totalCo2Tons: 0,
    totalDistanceKm: 0,
    totalTrips: 0,
    avgCo2PerKm: 0,
    avgCo2PerKgCargo: 0,
    treesEquivalent: 0,
  };

  const comparison: Comparison = emissionsData?.data?.comparison || {
    previousPeriodCo2Kg: 0,
    changePercent: 0,
    isReduction: false,
  };

  const byFuelType: FuelTypeEmission[] = emissionsData?.data?.byFuelType || [];
  const byVehicleType: VehicleTypeEmission[] = emissionsData?.data?.byVehicleType || [];
  const greenInitiatives: GreenInitiative[] = emissionsData?.data?.greenInitiatives || [];

  const fuelColors: Record<string, string> = {
    DIESEL: "bg-gray-700",
    PETROL: "bg-amber-500",
    CNG: "bg-blue-500",
    ELECTRIC: "bg-green-500",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Leaf className="h-7 w-7 text-green-600" />
            Carbon Footprint
          </h1>
          <p className="text-gray-500 mt-1">
            Sustainability tracking & green logistics (DHL GoGreen style)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="this_year">This Year</option>
          </select>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Leaf className="h-8 w-8 opacity-80" />
            {comparison.isReduction ? (
              <span className="flex items-center gap-1 text-green-100 text-sm bg-green-700/50 px-2 py-0.5 rounded-full">
                <TrendingDown className="h-4 w-4" />
                {Math.abs(comparison.changePercent)}% lower
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-100 text-sm bg-red-500/50 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-4 w-4" />
                {comparison.changePercent}% higher
              </span>
            )}
          </div>
          <p className="text-green-100 text-sm">Total CO2 Emissions</p>
          <p className="text-3xl font-bold">
            {summary.totalCo2Tons.toFixed(2)} tons
          </p>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Total Distance</p>
          <p className="text-2xl font-bold text-gray-900">
            {(summary.totalDistanceKm / 1000).toFixed(1)}k km
          </p>
          <p className="text-xs text-gray-400 mt-1">{summary.totalTrips} trips</p>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Target className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Avg CO2 per km</p>
          <p className="text-2xl font-bold text-gray-900">
            {(summary.avgCo2PerKm * 1000).toFixed(1)} g/km
          </p>
          <p className="text-xs text-gray-400 mt-1">Industry avg: 250 g/km</p>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TreePine className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Trees to Offset</p>
          <p className="text-2xl font-bold text-gray-900">
            {summary.treesEquivalent.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">trees/year to neutralize</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* By Fuel Type */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Fuel className="h-5 w-5 text-gray-500" />
            Emissions by Fuel Type
          </h2>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : byFuelType.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No emission data available
            </div>
          ) : (
            <div className="space-y-4">
              {byFuelType.map((fuel) => {
                const totalCo2 = byFuelType.reduce((sum, f) => sum + f.co2Kg, 0);
                const percentage = totalCo2 > 0 ? (fuel.co2Kg / totalCo2) * 100 : 0;

                return (
                  <div key={fuel.fuelType}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${fuelColors[fuel.fuelType] || "bg-gray-400"}`}
                        />
                        {fuel.fuelType}
                      </span>
                      <span className="text-sm text-gray-500">
                        {(fuel.co2Kg / 1000).toFixed(2)} tons ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${fuelColors[fuel.fuelType] || "bg-gray-400"} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                      <span>{fuel.trips} trips</span>
                      <span>{fuel.distanceKm.toLocaleString()} km</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Vehicle Type */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-gray-500" />
            Emissions by Vehicle Type
          </h2>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : byVehicleType.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No emission data available
            </div>
          ) : (
            <div className="space-y-4">
              {byVehicleType.map((vehicle) => {
                const totalCo2 = byVehicleType.reduce((sum, v) => sum + v.co2Kg, 0);
                const percentage = totalCo2 > 0 ? (vehicle.co2Kg / totalCo2) * 100 : 0;
                const vehicleColors: Record<string, string> = {
                  BIKE: "bg-green-500",
                  THREE_WHEELER: "bg-blue-400",
                  TEMPO: "bg-amber-500",
                  PICKUP: "bg-orange-500",
                  TRUCK: "bg-red-500",
                  TRUCK_LARGE: "bg-red-700",
                };

                return (
                  <div key={vehicle.vehicleType}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${vehicleColors[vehicle.vehicleType] || "bg-gray-400"}`}
                        />
                        {vehicle.vehicleType.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm text-gray-500">
                        {(vehicle.co2Kg / 1000).toFixed(2)} tons
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${vehicleColors[vehicle.vehicleType] || "bg-gray-400"} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Green Initiatives */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-green-500" />
          Green Initiatives
        </h2>
        {greenInitiatives.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Leaf className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No active green initiatives</p>
            <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              Start a New Initiative
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {greenInitiatives.map((initiative) => (
              <div
                key={initiative.id}
                className="border rounded-lg p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{initiative.name}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      initiative.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-700"
                        : initiative.status === "PLANNED"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {initiative.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{initiative.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">
                    Target: {initiative.targetReductionPercent}% reduction
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sustainability Score */}
      <div className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Sustainability Score</h2>
            <p className="text-green-100">
              Your fleet is performing{" "}
              <span className="font-semibold">12% better</span> than industry average
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">B+</div>
            <p className="text-green-100 text-sm mt-1">Good</p>
          </div>
        </div>
        <div className="mt-4 h-3 bg-green-700 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: "72%" }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-green-200">
          <span>D</span>
          <span>C</span>
          <span>B</span>
          <span>A</span>
          <span>A+</span>
        </div>
      </div>
    </div>
  );
}
