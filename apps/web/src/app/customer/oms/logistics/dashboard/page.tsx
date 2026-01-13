"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Route,
  MapPin,
  FileBarChart,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Eye,
} from "lucide-react";

interface LogisticsStats {
  activeShipments: number;
  pendingPickup: number;
  inTransit: number;
  delivered: number;
  rto: number;
  totalAwb: number;
  activeTransporters: number;
  servicePincodes: number;
  pendingInbound: number;
  completedInbound: number;
}

const demoStats: LogisticsStats = {
  activeShipments: 1245,
  pendingPickup: 89,
  inTransit: 567,
  delivered: 3421,
  rto: 156,
  totalAwb: 8934,
  activeTransporters: 24,
  servicePincodes: 12500,
  pendingInbound: 45,
  completedInbound: 234,
};

const summaryCards = [
  { label: "Active Shipments", key: "activeShipments", icon: Package, color: "bg-blue-500" },
  { label: "Pending Pickup", key: "pendingPickup", icon: Clock, color: "bg-yellow-500" },
  { label: "In Transit", key: "inTransit", icon: Truck, color: "bg-orange-500" },
  { label: "Delivered", key: "delivered", icon: CheckCircle, color: "bg-green-500" },
  { label: "RTO", key: "rto", icon: AlertTriangle, color: "bg-red-500" },
];

const metricsCards = [
  { label: "Total AWB", key: "totalAwb", icon: FileBarChart, color: "bg-indigo-500" },
  { label: "Active Transporters", key: "activeTransporters", icon: Truck, color: "bg-cyan-500" },
  { label: "Service Pincodes", key: "servicePincodes", icon: MapPin, color: "bg-purple-500" },
  { label: "Pending Inbound", key: "pendingInbound", icon: ArrowDownToLine, color: "bg-amber-500" },
  { label: "Completed Inbound", key: "completedInbound", icon: ArrowUpFromLine, color: "bg-emerald-500" },
];

const recentShipments = [
  { id: 1, awb: "AWB-2024-001234", carrier: "Delhivery", destination: "Mumbai", status: "In Transit", eta: "Jan 9" },
  { id: 2, awb: "AWB-2024-001235", carrier: "BlueDart", destination: "Delhi", status: "Out for Delivery", eta: "Jan 8" },
  { id: 3, awb: "AWB-2024-001236", carrier: "FedEx", destination: "Bangalore", status: "Pending Pickup", eta: "Jan 10" },
  { id: 4, awb: "AWB-2024-001237", carrier: "Ecom Express", destination: "Chennai", status: "Delivered", eta: "Jan 7" },
  { id: 5, awb: "AWB-2024-001238", carrier: "DTDC", destination: "Hyderabad", status: "In Transit", eta: "Jan 9" },
];

const transporterPerformance = [
  { name: "Delhivery", deliveries: 1245, onTime: 92, rating: 4.5 },
  { name: "BlueDart", deliveries: 987, onTime: 89, rating: 4.3 },
  { name: "FedEx", deliveries: 654, onTime: 95, rating: 4.7 },
  { name: "Ecom Express", deliveries: 432, onTime: 87, rating: 4.1 },
  { name: "DTDC", deliveries: 321, onTime: 85, rating: 4.0 },
];

interface Shipment {
  id: number;
  awb: string;
  carrier: string;
  destination: string;
  status: string;
  eta: string;
}

interface TransporterPerf {
  name: string;
  deliveries: number;
  onTime: number;
  rating: number;
}

export default function LogisticsDashboardPage() {
  const [stats, setStats] = useState<LogisticsStats>(demoStats);
  const [shipments, setShipments] = useState<Shipment[]>(recentShipments);
  const [transporters, setTransporters] = useState<TransporterPerf[]>(transporterPerformance);
  const [dateRange, setDateRange] = useState("today");
  const [loading, setLoading] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, shipmentsRes, transportersRes] = await Promise.all([
        fetch(`/api/oms/logistics/stats?range=${dateRange}`),
        fetch(`/api/oms/logistics/shipments?range=${dateRange}&limit=5`),
        fetch(`/api/oms/logistics/transporters/performance?range=${dateRange}`),
      ]);

      const statsResult = await statsRes.json();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      const shipmentsResult = await shipmentsRes.json();
      if (shipmentsResult.success && shipmentsResult.data) {
        setShipments(shipmentsResult.data);
      }

      const transportersResult = await transportersRes.json();
      if (transportersResult.success && transportersResult.data) {
        setTransporters(transportersResult.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Logistics Dashboard</h1>
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

      {/* Shipment Status Summary */}
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
                <p className="text-2xl font-bold">{stats[card.key as keyof LogisticsStats].toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{stats[card.key as keyof LogisticsStats].toLocaleString()}</p>
              </div>
              <div className="absolute right-2 bottom-2 opacity-30">
                <Icon className="w-10 h-10" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Shipments & Transporter Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Shipments */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Recent Shipments</h3>
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => handleViewShipment(shipment)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-blue-600">{shipment.awb}</p>
                    <p className="text-xs text-gray-500">{shipment.carrier} → {shipment.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        shipment.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : shipment.status === "In Transit"
                          ? "bg-blue-100 text-blue-700"
                          : shipment.status === "Out for Delivery"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {shipment.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">ETA: {shipment.eta}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewShipment(shipment); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transporter Performance */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Transporter Performance</h3>
          <div className="space-y-4">
            {transporters.map((transporter) => (
              <div key={transporter.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{transporter.name}</span>
                  <span className="text-gray-500">
                    {transporter.deliveries} deliveries | {transporter.onTime}% on-time
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        transporter.onTime >= 90
                          ? "bg-green-500"
                          : transporter.onTime >= 85
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${transporter.onTime}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    ⭐ {transporter.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Trend Chart */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Delivery Trend (Last 7 Days)</h3>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              Delivered
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              RTO
            </span>
          </div>
        </div>
        <div className="h-48 flex items-end justify-around gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
            const delivered = [450, 520, 480, 560, 620, 380, 210][index];
            const rto = [25, 32, 28, 35, 42, 22, 15][index];
            const maxValue = 700;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex justify-center gap-1" style={{ height: "160px", alignItems: "flex-end" }}>
                  <div
                    className="w-5 bg-green-500 rounded-t"
                    style={{ height: `${(delivered / maxValue) * 160}px` }}
                    title={`Delivered: ${delivered}`}
                  />
                  <div
                    className="w-5 bg-red-500 rounded-t"
                    style={{ height: `${(rto / maxValue) * 160}px` }}
                    title={`RTO: ${rto}`}
                  />
                </div>
                <span className="text-xs text-gray-500">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipment View Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Shipment Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">AWB Number</span>
                <span className="font-medium text-blue-600">{selectedShipment.awb}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Carrier</span>
                <span className="font-medium">{selectedShipment.carrier}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Destination</span>
                <span className="font-medium">{selectedShipment.destination}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  selectedShipment.status === "Delivered"
                    ? "bg-green-100 text-green-700"
                    : selectedShipment.status === "In Transit"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>{selectedShipment.status}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">ETA</span>
                <span className="font-medium">{selectedShipment.eta}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.open(`/customer/oms/logistics/awb?awb=${selectedShipment.awb}`, "_blank");
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Track Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
