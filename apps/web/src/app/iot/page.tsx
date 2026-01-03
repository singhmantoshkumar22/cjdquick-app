"use client";

import { useState } from "react";
import {
  Cpu,
  Thermometer,
  Droplets,
  Battery,
  Signal,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  MapPin,
  Clock,
  Activity,
  Gauge,
  XCircle,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Card, Button, Badge } from "@cjdquick/ui";
import { useQuery } from "@tanstack/react-query";

export default function IoTDashboardPage() {
  const [activeTab, setActiveTab] = useState<"devices" | "readings" | "alerts">("devices");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  // Fetch devices
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ["iot-devices"],
    queryFn: async () => {
      const res = await fetch("/api/iot");
      return res.json();
    },
  });

  // Fetch readings
  const { data: readingsData } = useQuery({
    queryKey: ["iot-readings", selectedDevice],
    queryFn: async () => {
      const url = selectedDevice
        ? `/api/iot?type=readings&deviceId=${selectedDevice}`
        : "/api/iot?type=readings";
      const res = await fetch(url);
      return res.json();
    },
  });

  // Fetch alerts
  const { data: alertsData } = useQuery({
    queryKey: ["iot-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/iot?type=alerts");
      return res.json();
    },
  });

  const devices = devicesData?.data?.items || [];
  const summary = devicesData?.data?.summary || {};
  const readings = readingsData?.data?.items || [];
  const readingStats = readingsData?.data?.stats || null;
  const alerts = alertsData?.data?.items || [];

  const getDeviceStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="default">Inactive</Badge>;
      case "MAINTENANCE":
        return <Badge variant="warning">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getBatteryIcon = (level: number | null) => {
    if (level === null) return <Battery className="h-4 w-4 text-gray-400" />;
    if (level < 20) return <Battery className="h-4 w-4 text-red-500" />;
    if (level < 50) return <Battery className="h-4 w-4 text-amber-500" />;
    return <Battery className="h-4 w-4 text-green-500" />;
  };

  const getSignalIcon = (strength: number | null) => {
    if (strength === null || strength < 30)
      return <WifiOff className="h-4 w-4 text-gray-400" />;
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IoT Device Management</h1>
          <p className="text-gray-500">
            Monitor temperature, humidity, and cold chain compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register Device
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Devices</p>
              <p className="text-2xl font-bold">{summary.total || 0}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cpu className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.active || 0}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">
                {summary.inactive || 0}
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-amber-600">
                {summary.maintenance || 0}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Settings className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Battery</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.lowBattery || 0}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Battery className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Reading Stats */}
      {readingStats && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Recent Reading Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Thermometer className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-sm text-gray-500">Min Temp</p>
              <p className="text-lg font-bold text-blue-600">
                {readingStats.minTemp?.toFixed(1)}°C
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <Thermometer className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-sm text-gray-500">Max Temp</p>
              <p className="text-lg font-bold text-red-600">
                {readingStats.maxTemp?.toFixed(1)}°C
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Gauge className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-gray-500">Avg Temp</p>
              <p className="text-lg font-bold text-green-600">
                {readingStats.avgTemp?.toFixed(1)}°C
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Activity className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <p className="text-sm text-gray-500">Readings</p>
              <p className="text-lg font-bold">{readingStats.readingCount}</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-sm text-gray-500">Anomalies</p>
              <p className="text-lg font-bold text-amber-600">
                {readingStats.anomalyCount}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("devices")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "devices"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Devices ({devices.length})
        </button>
        <button
          onClick={() => setActiveTab("readings")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "readings"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Readings ({readings.length})
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "alerts"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Alerts ({alerts.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "devices" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.length > 0 ? (
            devices.map((device: any) => (
              <div
                key={device.id}
                onClick={() => setSelectedDevice(device.deviceId)}
                className="cursor-pointer"
              >
              <Card
                className={`p-5 hover:shadow-md transition-shadow ${
                  selectedDevice === device.deviceId
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        device.status === "ACTIVE"
                          ? "bg-green-100"
                          : device.status === "MAINTENANCE"
                            ? "bg-amber-100"
                            : "bg-gray-100"
                      }`}
                    >
                      <Cpu
                        className={`h-5 w-5 ${
                          device.status === "ACTIVE"
                            ? "text-green-600"
                            : device.status === "MAINTENANCE"
                              ? "text-amber-600"
                              : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-mono font-medium">{device.deviceId}</p>
                      <p className="text-sm text-gray-500">{device.deviceType}</p>
                    </div>
                  </div>
                  {getDeviceStatusBadge(device.status)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Manufacturer:</span>
                    <span className="font-medium">{device.manufacturer || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Model:</span>
                    <span className="font-medium">{device.model || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Assignment:</span>
                    <span className="font-medium">{device.assignmentType || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {getBatteryIcon(device.batteryLevel)}
                      <span className="text-sm">{device.batteryLevel || 0}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getSignalIcon(device.signalStrength)}
                      <span className="text-sm">{device.signalStrength || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {device.lastSeenAt
                      ? new Date(device.lastSeenAt).toLocaleTimeString()
                      : "Never"}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{device._count?.readings || 0} readings</span>
                  <span>•</span>
                  <span>{device._count?.alerts || 0} alerts</span>
                </div>
              </Card>
              </div>
            ))
          ) : (
            <Card className="col-span-full p-12 text-center">
              <Cpu className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No IoT devices</h3>
              <p className="text-gray-500 mt-1">
                Register your first IoT device to start monitoring
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Register Device
              </Button>
            </Card>
          )}
        </div>
      )}

      {activeTab === "readings" && (
        <div className="space-y-4">
          {readings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      Device
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      Temp
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      Humidity
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      Battery
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      Signal
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {readings.map((reading: any) => (
                    <tr key={reading.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {new Date(reading.recordedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {reading.device?.deviceId || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-medium ${
                            reading.isAnomaly &&
                            (reading.anomalyType === "TEMP_HIGH" ||
                              reading.anomalyType === "TEMP_LOW")
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {reading.temperature?.toFixed(1) || "-"}°C
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {reading.humidity?.toFixed(0) || "-"}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        {reading.batteryLevel || "-"}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        {reading.signalStrength || "-"}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        {reading.isAnomaly ? (
                          <Badge variant="danger">{reading.anomalyType}</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No readings</h3>
              <p className="text-gray-500 mt-1">
                Sensor readings will appear here as devices report data
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert: any) => (
              <Card
                key={alert.id}
                className={`p-5 ${
                  alert.severity === "HIGH"
                    ? "border-l-4 border-l-red-500"
                    : alert.severity === "MEDIUM"
                      ? "border-l-4 border-l-amber-500"
                      : "border-l-4 border-l-blue-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        alert.severity === "HIGH"
                          ? "bg-red-100"
                          : alert.severity === "MEDIUM"
                            ? "bg-amber-100"
                            : "bg-blue-100"
                      }`}
                    >
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          alert.severity === "HIGH"
                            ? "text-red-600"
                            : alert.severity === "MEDIUM"
                              ? "text-amber-600"
                              : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{alert.alertType}</span>
                        <Badge
                          variant={
                            alert.severity === "HIGH"
                              ? "danger"
                              : alert.severity === "MEDIUM"
                                ? "warning"
                                : "primary"
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <Badge
                          variant={
                            alert.status === "ACTIVE"
                              ? "danger"
                              : alert.status === "ACKNOWLEDGED"
                                ? "warning"
                                : "success"
                          }
                        >
                          {alert.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Device: {alert.device?.deviceId}</span>
                        <span>
                          Value: {alert.currentValue} / Threshold:{" "}
                          {alert.thresholdValue}
                        </span>
                        <span>
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {alert.status === "ACTIVE" && (
                    <Button variant="outline" size="sm">
                      Acknowledge
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No active alerts</h3>
              <p className="text-gray-500 mt-1">
                All devices are operating within normal parameters
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
