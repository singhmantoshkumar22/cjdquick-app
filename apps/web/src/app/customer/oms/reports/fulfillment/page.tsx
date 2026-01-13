"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

interface FulfillmentReportData {
  summary: {
    totalOrders: number;
    fulfilledOrders: number;
    fulfillmentRate: number;
    avgFulfillmentTime: string;
    slaCompliance: number;
    pickAccuracy: number;
    packAccuracy: number;
    shipOnTime: number;
  };
  byStage: Array<{ stage: string; count: number; avgTime: string; efficiency: number }>;
  slaBreakdown: Array<{ status: string; count: number; percentage: number; color: string }>;
  teamPerformance: Array<{
    team: string;
    ordersProcessed: number;
    accuracy: number;
    avgTime: string;
    efficiency: number;
  }>;
  hourlyThroughput: Array<{ hour: string; picked: number; packed: number; shipped: number }>;
  bottlenecks: Array<{ stage: string; waitTime: string; ordersAffected: number; severity: string }>;
}

export default function FulfillmentReportsPage() {
  const [data, setData] = useState<FulfillmentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [location, setLocation] = useState("all");

  useEffect(() => {
    fetchFulfillmentData();
  }, [dateRange, location]);

  const fetchFulfillmentData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/oms/reports/fulfillment?dateRange=${dateRange}&location=${location}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching fulfillment data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fulfillment Reports</h1>
          <p className="text-gray-600">SLA compliance, accuracy, and throughput analysis</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">All Locations</option>
            <option value="WH-DELHI">WH-DELHI</option>
            <option value="WH-MUMBAI">WH-MUMBAI</option>
            <option value="WH-BANGALORE">WH-BANGALORE</option>
          </select>
          <button
            onClick={fetchFulfillmentData}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!data) return;
              const csvContent = [
                ["Fulfillment Report - " + dateRange].join(","),
                [""],
                ["Summary"].join(","),
                ["Total Orders", data.summary.totalOrders].join(","),
                ["Fulfilled Orders", data.summary.fulfilledOrders].join(","),
                ["Fulfillment Rate", data.summary.fulfillmentRate + "%"].join(","),
                ["Avg Fulfillment Time", data.summary.avgFulfillmentTime].join(","),
                ["SLA Compliance", data.summary.slaCompliance + "%"].join(","),
                ["Pick Accuracy", data.summary.pickAccuracy + "%"].join(","),
                ["Pack Accuracy", data.summary.packAccuracy + "%"].join(","),
                ["Ship On Time", data.summary.shipOnTime + "%"].join(","),
                [""],
                ["Stage", "Count", "Avg Time", "Efficiency"].join(","),
                ...data.byStage.map(s => [s.stage, s.count, s.avgTime, s.efficiency + "%"].join(",")),
                [""],
                ["Team", "Orders Processed", "Accuracy", "Avg Time", "Efficiency"].join(","),
                ...data.teamPerformance.map(t => [t.team, t.ordersProcessed, t.accuracy + "%", t.avgTime, t.efficiency + "%"].join(",")),
              ].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `fulfillment-report-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{data.summary.totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600">Fulfilled</p>
              <p className="text-xl font-bold text-green-600">{data.summary.fulfilledOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600">Fulfillment Rate</p>
              <p className="text-xl font-bold text-gray-900">{data.summary.fulfillmentRate}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600">Avg Time</p>
              <p className="text-xl font-bold text-gray-900">{data.summary.avgFulfillmentTime}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600">SLA Compliance</p>
              <p className="text-xl font-bold text-blue-600">{data.summary.slaCompliance}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600">Pick Accuracy</p>
              <p className="text-xl font-bold text-gray-900">{data.summary.pickAccuracy}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600">Pack Accuracy</p>
              <p className="text-xl font-bold text-gray-900">{data.summary.packAccuracy}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600">Ship On Time</p>
              <p className="text-xl font-bold text-gray-900">{data.summary.shipOnTime}%</p>
            </div>
          </div>

          {/* SLA & Stage Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">SLA Breakdown</h3>
              <div className="space-y-4">
                {data.slaBreakdown.map((item) => (
                  <div key={item.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.status}</span>
                      <span className="font-medium">{item.count} orders ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Stage Performance</h3>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.byStage.map((stage) => (
                    <tr key={stage.stage} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{stage.stage}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{stage.count}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{stage.avgTime}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-sm font-medium ${
                            stage.efficiency >= 90
                              ? "text-green-600"
                              : stage.efficiency >= 80
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {stage.efficiency}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Team Performance</h3>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders Processed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.teamPerformance.map((team) => (
                  <tr key={team.team} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{team.team}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{team.ordersProcessed}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{team.accuracy}%</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{team.avgTime}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              team.efficiency >= 90
                                ? "bg-green-500"
                                : team.efficiency >= 80
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${team.efficiency}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{team.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottlenecks */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Identified Bottlenecks</h3>
            </div>
            <div className="p-4">
              {data.bottlenecks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p>No bottlenecks identified. Operations running smoothly!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.bottlenecks.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        item.severity === "high"
                          ? "bg-red-50 border-red-500"
                          : item.severity === "medium"
                          ? "bg-yellow-50 border-yellow-500"
                          : "bg-blue-50 border-blue-500"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{item.stage}</p>
                          <p className="text-sm text-gray-600">
                            Wait time: {item.waitTime} | {item.ordersAffected} orders affected
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            item.severity === "high"
                              ? "bg-red-100 text-red-800"
                              : item.severity === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
