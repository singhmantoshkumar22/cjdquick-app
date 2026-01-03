"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  TrendingUp,
  Truck,
  Building2,
  Calendar,
  BarChart3,
  RefreshCw,
  Download,
  AlertTriangle,
} from "lucide-react";

interface Forecast {
  id: string;
  forecastDate: string;
  predictedShipments: number;
  predictedWeightKg: number;
  predictedRevenue: number;
  confidenceLevel: number;
  predictionLow: number;
  predictionHigh: number;
  seasonalityFactor: number;
}

interface ForecastSummary {
  totalPredictedShipments: number;
  totalPredictedWeight: number;
  totalPredictedRevenue: number;
  avgConfidence: number;
  peakDay: Forecast;
}

export default function CapacityPlanningPage() {
  const [period, setPeriod] = useState<"7" | "14" | "30">("14");
  const [forecastType, setForecastType] = useState<"OVERALL" | "HUB" | "CLIENT">("OVERALL");

  const { data: forecastData, isLoading, refetch } = useQuery({
    queryKey: ["capacity-forecast", period, forecastType],
    queryFn: async () => {
      const res = await fetch(
        `/api/capacity/forecast?days=${period}&forecastType=${forecastType}`
      );
      return res.json();
    },
  });

  const forecasts: Forecast[] = forecastData?.data?.forecasts || forecastData?.data || [];
  const summary: ForecastSummary = forecastData?.data?.summary;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-7 w-7 text-primary-600" />
            Capacity Planning
          </h1>
          <p className="text-gray-500 mt-1">
            AI-powered demand forecasting and fleet optimization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forecast Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "7" | "14" | "30")}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forecast Type
            </label>
            <select
              value={forecastType}
              onChange={(e) => setForecastType(e.target.value as "OVERALL" | "HUB" | "CLIENT")}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="OVERALL">Overall Network</option>
              <option value="HUB">By Hub</option>
              <option value="CLIENT">By Client</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Predicted Shipments</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.totalPredictedShipments.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Predicted Weight</p>
                <p className="text-xl font-bold text-gray-900">
                  {(summary.totalPredictedWeight / 1000).toFixed(1)} tons
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Predicted Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  Rs. {(summary.totalPredictedRevenue / 100000).toFixed(1)}L
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Confidence</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.avgConfidence.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Chart Placeholder */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          Demand Forecast Trend
        </h2>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : forecasts.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No forecast data available
          </div>
        ) : (
          <div className="h-64 flex items-end gap-2 px-4">
            {forecasts.slice(0, 14).map((forecast, idx) => {
              const maxShipments = Math.max(...forecasts.map((f) => f.predictedShipments));
              const height = (forecast.predictedShipments / maxShipments) * 100;
              const date = new Date(forecast.forecastDate);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative group">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isWeekend ? "bg-amber-400" : "bg-primary-500"
                      } hover:opacity-80`}
                      style={{ height: `${height * 2}px` }}
                    />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {forecast.predictedShipments} shipments
                      <br />
                      Confidence: {forecast.confidenceLevel.toFixed(0)}%
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary-500 rounded" />
            Weekday
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-400 rounded" />
            Weekend
          </span>
        </div>
      </div>

      {/* Fleet & Hub Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hub Capacity */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            Hub Capacity Status
          </h2>
          <div className="space-y-4">
            {[
              { name: "Mumbai Hub", utilization: 78, capacity: 500 },
              { name: "Delhi Hub", utilization: 85, capacity: 450 },
              { name: "Bangalore Hub", utilization: 62, capacity: 350 },
              { name: "Chennai Hub", utilization: 91, capacity: 300 },
            ].map((hub) => (
              <div key={hub.name} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{hub.name}</span>
                    <span className={`text-sm ${hub.utilization > 85 ? "text-red-600" : "text-gray-500"}`}>
                      {hub.utilization}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        hub.utilization > 85
                          ? "bg-red-500"
                          : hub.utilization > 70
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${hub.utilization}%` }}
                    />
                  </div>
                </div>
                {hub.utilization > 85 && (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Capacity */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-gray-500" />
            Fleet Availability
          </h2>
          <div className="space-y-4">
            {[
              { type: "Bikes", available: 45, total: 60 },
              { type: "Tempo", available: 12, total: 20 },
              { type: "Pickup", available: 8, total: 15 },
              { type: "Trucks", available: 5, total: 10 },
            ].map((vehicle) => {
              const utilization = ((vehicle.total - vehicle.available) / vehicle.total) * 100;
              return (
                <div key={vehicle.type} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{vehicle.type}</span>
                      <span className="text-sm text-gray-500">
                        {vehicle.available}/{vehicle.total} available
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${utilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forecast Details Table */}
      <div className="bg-white rounded-lg border mt-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Detailed Forecast</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Predicted</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Range</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Seasonality</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {forecasts.map((forecast) => {
                const date = new Date(forecast.forecastDate);
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <tr key={forecast.id} className={isWeekend ? "bg-amber-50" : ""}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{days[date.getDay()]}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {forecast.predictedShipments}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">
                      {forecast.predictionLow} - {forecast.predictionHigh}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">
                      {forecast.predictedWeightKg.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">
                      Rs. {forecast.predictedRevenue.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          forecast.confidenceLevel >= 80
                            ? "bg-green-100 text-green-700"
                            : forecast.confidenceLevel >= 60
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {forecast.confidenceLevel.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">
                      {forecast.seasonalityFactor.toFixed(2)}x
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
