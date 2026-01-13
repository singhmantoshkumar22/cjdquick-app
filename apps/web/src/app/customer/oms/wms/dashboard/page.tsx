"use client";

import { useState, useEffect } from "react";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  PackageCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface WMSStats {
  pendingGrn: number;
  pendingPutaway: number;
  pendingPick: number;
  pendingPack: number;
  pendingDispatch: number;
  todayInbound: number;
  todayOutbound: number;
  totalSkus: number;
  lowStockAlerts: number;
  cycleCountDue: number;
}

interface ActivityItem {
  id: number;
  type: string;
  reference: string;
  status: string;
  time: string;
  items: number;
}

interface ZoneItem {
  zone: string;
  capacity: number;
  skus: number;
}

interface WMSDashboardData {
  stats: WMSStats;
  recentActivity: ActivityItem[];
  zoneUtilization: ZoneItem[];
}

const demoStats: WMSStats = {
  pendingGrn: 12,
  pendingPutaway: 45,
  pendingPick: 128,
  pendingPack: 89,
  pendingDispatch: 67,
  todayInbound: 342,
  todayOutbound: 567,
  totalSkus: 3296,
  lowStockAlerts: 24,
  cycleCountDue: 156,
};

const demoRecentActivity: ActivityItem[] = [
  { id: 1, type: "GRN", reference: "GRN-2024-001234", status: "Received", time: "10 mins ago", items: 45 },
  { id: 2, type: "Putaway", reference: "PUT-2024-005678", status: "Completed", time: "25 mins ago", items: 32 },
  { id: 3, type: "Pick", reference: "PCK-2024-008912", status: "In Progress", time: "30 mins ago", items: 18 },
  { id: 4, type: "Pack", reference: "PAK-2024-003456", status: "Completed", time: "45 mins ago", items: 12 },
  { id: 5, type: "Dispatch", reference: "DSP-2024-007890", status: "Shipped", time: "1 hour ago", items: 28 },
];

const demoZoneUtilization: ZoneItem[] = [
  { zone: "Zone A", capacity: 85, skus: 450 },
  { zone: "Zone B", capacity: 72, skus: 380 },
  { zone: "Zone C", capacity: 93, skus: 520 },
  { zone: "Zone D", capacity: 45, skus: 210 },
  { zone: "Zone E", capacity: 68, skus: 340 },
];

const summaryCards = [
  { label: "Pending GRN", key: "pendingGrn", icon: ArrowDownToLine, color: "bg-blue-500" },
  { label: "Pending Putaway", key: "pendingPutaway", icon: PackageCheck, color: "bg-yellow-500" },
  { label: "Pending Pick", key: "pendingPick", icon: ClipboardCheck, color: "bg-orange-500" },
  { label: "Pending Pack", key: "pendingPack", icon: Package, color: "bg-purple-500" },
  { label: "Pending Dispatch", key: "pendingDispatch", icon: ArrowUpFromLine, color: "bg-green-500" },
];

const metricsCards = [
  { label: "Today's Inbound", key: "todayInbound", icon: ArrowDownToLine, color: "bg-cyan-500" },
  { label: "Today's Outbound", key: "todayOutbound", icon: ArrowUpFromLine, color: "bg-emerald-500" },
  { label: "Total SKUs", key: "totalSkus", icon: Package, color: "bg-indigo-500" },
  { label: "Low Stock Alerts", key: "lowStockAlerts", icon: AlertTriangle, color: "bg-red-500" },
  { label: "Cycle Count Due", key: "cycleCountDue", icon: Clock, color: "bg-amber-500" },
];

export default function WMSDashboardPage() {
  const [stats, setStats] = useState<WMSStats>(demoStats);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(demoRecentActivity);
  const [zoneUtilization, setZoneUtilization] = useState<ZoneItem[]>(demoZoneUtilization);
  const [dateRange, setDateRange] = useState("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/oms/wms?type=dashboard&dateRange=${dateRange}`);
      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data.stats || demoStats);
        setRecentActivity(result.data.recentActivity || demoRecentActivity);
        setZoneUtilization(result.data.zoneUtilization || demoZoneUtilization);
      }
    } catch (error) {
      console.error("Error fetching WMS dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">WMS Dashboard</h1>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Pending Tasks Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className={`${card.color} rounded-lg p-4 text-white relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
            >
              <div className="relative z-10">
                <p className="text-xs font-medium opacity-90">{card.label}</p>
                <p className="text-2xl font-bold">{stats[card.key as keyof WMSStats]}</p>
              </div>
              <div className="absolute right-2 bottom-2 opacity-30">
                <Icon className="w-10 h-10" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metricsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className={`${card.color} rounded-lg p-4 text-white relative overflow-hidden`}
            >
              <div className="relative z-10">
                <p className="text-xs font-medium opacity-90">{card.label}</p>
                <p className="text-2xl font-bold">{stats[card.key as keyof WMSStats].toLocaleString()}</p>
              </div>
              <div className="absolute right-2 bottom-2 opacity-30">
                <Icon className="w-10 h-10" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "GRN"
                        ? "bg-blue-100 text-blue-600"
                        : activity.type === "Putaway"
                        ? "bg-yellow-100 text-yellow-600"
                        : activity.type === "Pick"
                        ? "bg-orange-100 text-orange-600"
                        : activity.type === "Pack"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {activity.type === "GRN" && <ArrowDownToLine className="w-4 h-4" />}
                    {activity.type === "Putaway" && <PackageCheck className="w-4 h-4" />}
                    {activity.type === "Pick" && <ClipboardCheck className="w-4 h-4" />}
                    {activity.type === "Pack" && <Package className="w-4 h-4" />}
                    {activity.type === "Dispatch" && <ArrowUpFromLine className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.reference}</p>
                    <p className="text-xs text-gray-500">{activity.items} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      activity.status === "Completed" || activity.status === "Shipped"
                        ? "bg-green-100 text-green-700"
                        : activity.status === "In Progress"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {activity.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Utilization */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Zone Utilization</h3>
          <div className="space-y-4">
            {zoneUtilization.map((zone) => (
              <div key={zone.zone} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{zone.zone}</span>
                  <span className="text-gray-500">{zone.skus} SKUs ({zone.capacity}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      zone.capacity >= 90
                        ? "bg-red-500"
                        : zone.capacity >= 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${zone.capacity}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Productivity Chart */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Daily Productivity</h3>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              Inbound
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              Outbound
            </span>
          </div>
        </div>
        <div className="h-48 flex items-end justify-around gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
            const inbound = [320, 450, 380, 520, 480, 290, 150][index];
            const outbound = [450, 520, 410, 580, 620, 340, 180][index];
            const maxValue = 650;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex justify-center gap-1" style={{ height: "160px", alignItems: "flex-end" }}>
                  <div
                    className="w-5 bg-blue-500 rounded-t"
                    style={{ height: `${(inbound / maxValue) * 160}px` }}
                    title={`Inbound: ${inbound}`}
                  />
                  <div
                    className="w-5 bg-green-500 rounded-t"
                    style={{ height: `${(outbound / maxValue) * 160}px` }}
                    title={`Outbound: ${outbound}`}
                  />
                </div>
                <span className="text-xs text-gray-500">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
