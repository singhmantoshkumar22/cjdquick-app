"use client";

import { useState } from "react";
import {
  Bot,
  Battery,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Play,
  Pause,
  Square,
  Wrench,
  Zap,
  Clock,
  Package,
  ArrowRight,
  Settings,
  Navigation,
  AlertTriangle,
} from "lucide-react";
import { Card, Button, Badge } from "@cjdquick/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function RoboticsPage() {
  const [activeTab, setActiveTab] = useState<"robots" | "tasks" | "maintenance">("robots");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch robots
  const { data: robotsData, isLoading: robotsLoading } = useQuery({
    queryKey: ["robots", selectedWarehouse],
    queryFn: async () => {
      const url = selectedWarehouse
        ? `/api/robotics?warehouseId=${selectedWarehouse}`
        : "/api/robotics";
      const res = await fetch(url);
      return res.json();
    },
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ["robot-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/robotics?type=tasks");
      return res.json();
    },
  });

  // Fetch maintenance
  const { data: maintenanceData } = useQuery({
    queryKey: ["robot-maintenance"],
    queryFn: async () => {
      const res = await fetch("/api/robotics?type=maintenance");
      return res.json();
    },
  });

  const robots = robotsData?.data?.items || [];
  const summary = robotsData?.data?.summary || {};
  const tasks = tasksData?.data?.items || [];
  const maintenance = maintenanceData?.data?.items || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "IDLE":
        return <Badge variant="default">Idle</Badge>;
      case "CHARGING":
        return <Badge variant="primary">Charging</Badge>;
      case "MAINTENANCE":
        return <Badge variant="warning">Maintenance</Badge>;
      case "ERROR":
        return <Badge variant="danger">Error</Badge>;
      case "ASSIGNED":
        return <Badge variant="primary">Assigned</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="warning">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "FAILED":
        return <Badge variant="danger">Failed</Badge>;
      case "SCHEDULED":
        return <Badge variant="default">Scheduled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRobotTypeIcon = (type: string) => {
    switch (type) {
      case "AGV":
        return <Navigation className="h-5 w-5" />;
      case "AMR":
        return <Bot className="h-5 w-5" />;
      case "SORTING_ARM":
        return <Package className="h-5 w-5" />;
      case "PICKING_ROBOT":
        return <Activity className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  const getBatteryColor = (level: number | null) => {
    if (level === null) return "text-gray-400";
    if (level < 20) return "text-red-500";
    if (level < 50) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Robotics</h1>
          <p className="text-gray-500">
            AGV, AMR, and robotic system management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register Robot
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Fleet Size</p>
              <p className="text-2xl font-bold">{summary.total || 0}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-5 w-5 text-blue-600" />
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
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Idle</p>
              <p className="text-2xl font-bold text-gray-600">
                {summary.idle || 0}
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Pause className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Charging</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.charging || 0}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
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
              <Wrench className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Error</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.error || 0}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Fleet Utilization */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Fleet Overview</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              Avg Battery: <span className="font-medium text-green-600">
                {summary.avgBattery?.toFixed(0) || 0}%
              </span>
            </span>
            <span className="text-gray-500">
              AGV: <span className="font-medium">{summary.byType?.agv || 0}</span>
            </span>
            <span className="text-gray-500">
              AMR: <span className="font-medium">{summary.byType?.amr || 0}</span>
            </span>
            <span className="text-gray-500">
              Sorting: <span className="font-medium">{summary.byType?.sortingArm || 0}</span>
            </span>
            <span className="text-gray-500">
              Picking: <span className="font-medium">{summary.byType?.pickingRobot || 0}</span>
            </span>
          </div>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
          {summary.total > 0 && (
            <>
              <div
                className="bg-green-500 h-full"
                style={{ width: `${((summary.active || 0) / summary.total) * 100}%` }}
                title={`Active: ${summary.active}`}
              />
              <div
                className="bg-gray-400 h-full"
                style={{ width: `${((summary.idle || 0) / summary.total) * 100}%` }}
                title={`Idle: ${summary.idle}`}
              />
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${((summary.charging || 0) / summary.total) * 100}%` }}
                title={`Charging: ${summary.charging}`}
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${((summary.maintenance || 0) / summary.total) * 100}%` }}
                title={`Maintenance: ${summary.maintenance}`}
              />
              <div
                className="bg-red-500 h-full"
                style={{ width: `${((summary.error || 0) / summary.total) * 100}%` }}
                title={`Error: ${summary.error}`}
              />
            </>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" /> Active
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-400 rounded" /> Idle
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" /> Charging
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded" /> Maintenance
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" /> Error
          </span>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("robots")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "robots"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Robots ({robots.length})
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "tasks"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "maintenance"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Maintenance ({maintenance.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "robots" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {robots.length > 0 ? (
            robots.map((robot: any) => (
              <Card key={robot.id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        robot.status === "ACTIVE"
                          ? "bg-green-100"
                          : robot.status === "CHARGING"
                            ? "bg-blue-100"
                            : robot.status === "ERROR"
                              ? "bg-red-100"
                              : "bg-gray-100"
                      }`}
                    >
                      {getRobotTypeIcon(robot.robotType)}
                    </div>
                    <div>
                      <h3 className="font-medium">{robot.name || robot.robotId}</h3>
                      <p className="text-sm text-gray-500">{robot.robotType}</p>
                    </div>
                  </div>
                  {getStatusBadge(robot.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Model:</span>{" "}
                    <span className="font-medium">{robot.model || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Manufacturer:</span>{" "}
                    <span className="font-medium">{robot.manufacturer || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Payload:</span>{" "}
                    <span className="font-medium">{robot.maxPayloadKg || 0} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tasks:</span>{" "}
                    <span className="font-medium">{robot.tasksCompleted || 0}</span>
                  </div>
                </div>

                {robot.status === "ERROR" && robot.errorMessage && (
                  <div className="p-2 bg-red-50 rounded-lg mb-4 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {robot.errorMessage}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Battery className={`h-4 w-4 ${getBatteryColor(robot.batteryLevel)}`} />
                      <span className="text-sm">{robot.batteryLevel || 0}%</span>
                    </div>
                    {robot.currentX && robot.currentY && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        ({robot.currentX}, {robot.currentY})
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {robot.status === "IDLE" && (
                      <Button variant="ghost" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {robot.status === "ACTIVE" && (
                      <Button variant="ghost" size="sm">
                        <Square className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-full p-12 text-center">
              <Bot className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No robots registered</h3>
              <p className="text-gray-500 mt-1">
                Register your first robot to start automating warehouse operations
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Register Robot
              </Button>
            </Card>
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task: any) => (
              <Card key={task.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        task.status === "IN_PROGRESS"
                          ? "bg-blue-100"
                          : task.status === "COMPLETED"
                            ? "bg-green-100"
                            : task.status === "FAILED"
                              ? "bg-red-100"
                              : "bg-gray-100"
                      }`}
                    >
                      <Package className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{task.taskType}</span>
                        {getStatusBadge(task.status)}
                        <Badge
                          variant={
                            task.priority === "HIGH"
                              ? "danger"
                              : task.priority === "URGENT"
                                ? "warning"
                                : "default"
                          }
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span>{task.sourceLocationCode || "Source"}</span>
                        <ArrowRight className="h-4 w-4" />
                        <span>{task.targetLocationCode || "Target"}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Robot:</span>{" "}
                          <span className="font-medium">
                            {task.robot?.name || task.robot?.robotId || "Unassigned"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Item:</span>{" "}
                          <span className="font-medium">
                            {task.itemSku || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Qty:</span>{" "}
                          <span className="font-medium">
                            {task.itemQuantity || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {task.progress !== null && (
                      <div className="mb-2">
                        <div className="text-sm font-medium">{task.progress}%</div>
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {task.assignedAt && (
                        <>
                          Assigned: {new Date(task.assignedAt).toLocaleTimeString()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No tasks</h3>
              <p className="text-gray-500 mt-1">
                Robot tasks will appear here when assigned
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="space-y-4">
          {maintenance.length > 0 ? (
            maintenance.map((record: any) => (
              <Card key={record.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        record.status === "COMPLETED"
                          ? "bg-green-100"
                          : record.status === "IN_PROGRESS"
                            ? "bg-blue-100"
                            : "bg-amber-100"
                      }`}
                    >
                      <Wrench className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{record.maintenanceType}</span>
                        {getStatusBadge(record.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {record.description || "No description"}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Robot:</span>{" "}
                          <span className="font-medium">
                            {record.robot?.name || record.robot?.robotId || "Unknown"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Technician:</span>{" "}
                          <span className="font-medium">
                            {record.technicianAssigned || "Unassigned"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>{" "}
                          <span className="font-medium">
                            {record.estimatedDurationMin || 0} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(record.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">Scheduled</div>
                    {record.completedAt && (
                      <div className="mt-2">
                        <div className="text-sm text-green-600">
                          {new Date(record.completedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No maintenance records</h3>
              <p className="text-gray-500 mt-1">
                Scheduled maintenance will appear here
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
