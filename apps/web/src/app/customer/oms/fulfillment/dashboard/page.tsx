"use client";

import { useState } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Timer,
  Target,
} from "lucide-react";

interface DashboardStats {
  ordersToday: number;
  ordersPending: number;
  ordersProcessing: number;
  ordersCompleted: number;
  avgFulfillmentTime: string;
  fulfillmentRate: number;
  slaCompliance: number;
  pickAccuracy: number;
}

const demoStats: DashboardStats = {
  ordersToday: 524,
  ordersPending: 156,
  ordersProcessing: 45,
  ordersCompleted: 234,
  avgFulfillmentTime: "2.5 hrs",
  fulfillmentRate: 78.4,
  slaCompliance: 94.2,
  pickAccuracy: 99.1,
};

const hourlyData = [
  { hour: "8AM", orders: 45, completed: 42 },
  { hour: "9AM", orders: 68, completed: 65 },
  { hour: "10AM", orders: 82, completed: 78 },
  { hour: "11AM", orders: 95, completed: 88 },
  { hour: "12PM", orders: 72, completed: 70 },
  { hour: "1PM", orders: 55, completed: 52 },
  { hour: "2PM", orders: 78, completed: 74 },
  { hour: "3PM", orders: 88, completed: 82 },
];

const teamPerformance = [
  { name: "Team Alpha", orders: 145, completed: 138, rate: 95.2 },
  { name: "Team Beta", orders: 132, completed: 125, rate: 94.7 },
  { name: "Team Gamma", orders: 128, completed: 118, rate: 92.2 },
  { name: "Team Delta", orders: 119, completed: 110, rate: 92.4 },
];

export default function FulfillmentDashboardPage() {
  const [stats] = useState<DashboardStats>(demoStats);
  const [timeRange, setTimeRange] = useState("today");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fulfillment Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time fulfillment metrics and performance</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-3">{stats.ordersToday}</p>
          <p className="text-sm text-gray-500">Orders Today</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-xs text-red-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> -5%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-3">{stats.ordersPending}</p>
          <p className="text-sm text-gray-500">Pending Orders</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +8%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-3">{stats.ordersCompleted}</p>
          <p className="text-sm text-gray-500">Completed Today</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Timer className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-3">{stats.avgFulfillmentTime}</p>
          <p className="text-sm text-gray-500">Avg. Fulfillment Time</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Fulfillment Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.fulfillmentRate}%</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${stats.fulfillmentRate}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">SLA Compliance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.slaCompliance}%</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${stats.slaCompliance}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pick Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pickAccuracy}%</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: `${stats.pickAccuracy}%` }} />
          </div>
        </div>
      </div>

      {/* Hourly Trend & Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Orders */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-700">Hourly Order Volume</h2>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between h-40 gap-2">
              {hourlyData.map((data) => (
                <div key={data.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gray-100 rounded-t relative" style={{ height: `${(data.orders / 100) * 100}%` }}>
                    <div
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t"
                      style={{ height: `${(data.completed / data.orders) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{data.hour}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded" />
                <span className="text-xs text-gray-500">Total Orders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-xs text-gray-500">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Team Performance</h2>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="p-6 space-y-4">
            {teamPerformance.map((team) => (
              <div key={team.name} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{team.name}</span>
                    <span className="text-sm text-gray-500">{team.completed}/{team.orders}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${team.rate >= 95 ? 'bg-green-500' : team.rate >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${team.rate}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-medium ${team.rate >= 95 ? 'text-green-600' : team.rate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {team.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-sm font-semibold text-gray-700">Active Alerts</h2>
        </div>
        <div className="divide-y">
          <div className="px-6 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">12 orders exceeding SLA</p>
              <p className="text-sm text-gray-500">These orders need immediate attention</p>
            </div>
          </div>
          <div className="px-6 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">5 orders with inventory issues</p>
              <p className="text-sm text-gray-500">Insufficient stock for fulfillment</p>
            </div>
          </div>
          <div className="px-6 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">3 packing stations offline</p>
              <p className="text-sm text-gray-500">Stations B2, B5, C1 need attention</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
