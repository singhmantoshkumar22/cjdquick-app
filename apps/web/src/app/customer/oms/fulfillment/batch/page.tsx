"use client";

import { useState } from "react";
import {
  Boxes,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

interface BatchJob {
  id: string;
  batchNo: string;
  batchType: "PICKING" | "PACKING" | "SHIPPING";
  ordersCount: number;
  itemsCount: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PAUSED" | "FAILED";
  progress: number;
  assignedTo: string;
  startedAt: string;
  completedAt: string;
  estimatedTime: string;
}

const demoBatches: BatchJob[] = [
  { id: "1", batchNo: "BATCH-2024-001", batchType: "PICKING", ordersCount: 25, itemsCount: 78, status: "IN_PROGRESS", progress: 65, assignedTo: "Team Alpha", startedAt: "2024-01-08 09:00", completedAt: "", estimatedTime: "45 min" },
  { id: "2", batchNo: "BATCH-2024-002", batchType: "PACKING", ordersCount: 18, itemsCount: 42, status: "PENDING", progress: 0, assignedTo: "Team Beta", startedAt: "", completedAt: "", estimatedTime: "30 min" },
  { id: "3", batchNo: "BATCH-2024-003", batchType: "SHIPPING", ordersCount: 32, itemsCount: 32, status: "COMPLETED", progress: 100, assignedTo: "Team Gamma", startedAt: "2024-01-08 08:00", completedAt: "2024-01-08 09:15", estimatedTime: "-" },
  { id: "4", batchNo: "BATCH-2024-004", batchType: "PICKING", ordersCount: 15, itemsCount: 45, status: "PAUSED", progress: 40, assignedTo: "Team Delta", startedAt: "2024-01-08 08:30", completedAt: "", estimatedTime: "25 min" },
  { id: "5", batchNo: "BATCH-2024-005", batchType: "PACKING", ordersCount: 20, itemsCount: 55, status: "FAILED", progress: 85, assignedTo: "Team Alpha", startedAt: "2024-01-08 07:30", completedAt: "", estimatedTime: "-" },
];

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: "bg-gray-100", text: "text-gray-700", icon: Clock },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", icon: RefreshCw },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  PAUSED: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Pause },
  FAILED: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle },
};

const typeColors: Record<string, string> = {
  PICKING: "bg-purple-100 text-purple-700",
  PACKING: "bg-cyan-100 text-cyan-700",
  SHIPPING: "bg-orange-100 text-orange-700",
};

export default function BatchProcessingPage() {
  const [batches, setBatches] = useState<BatchJob[]>(demoBatches);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "All Batches", count: 5 },
    { id: "in_progress", label: "In Progress", count: 1 },
    { id: "pending", label: "Pending", count: 1 },
    { id: "completed", label: "Completed", count: 1 },
    { id: "paused", label: "Paused", count: 1 },
    { id: "failed", label: "Failed", count: 1 },
  ];

  const handleStartBatch = (batchId: string) => {
    console.log("Starting batch:", batchId);
  };

  const handlePauseBatch = (batchId: string) => {
    console.log("Pausing batch:", batchId);
  };

  const handleResumeBatch = (batchId: string) => {
    console.log("Resuming batch:", batchId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Batch Processing</h1>
          <p className="text-sm text-gray-500">Create and manage batch fulfillment jobs</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Batch
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">5</p>
          <p className="text-sm text-gray-500">Total Batches</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">1</p>
          <p className="text-sm text-blue-600">In Progress</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700">1</p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-700">1</p>
          <p className="text-sm text-green-600">Completed</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-red-700">2</p>
          <p className="text-sm text-red-600">Needs Attention</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              activeFilter === filter.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {filter.label}
            <span className="ml-1 text-xs opacity-75">({filter.count})</span>
          </button>
        ))}
      </div>

      {/* Batch Cards */}
      <div className="space-y-4">
        {batches.map((batch) => {
          const StatusIcon = statusColors[batch.status]?.icon || Clock;
          return (
            <div key={batch.id} className="bg-white rounded-lg border overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${typeColors[batch.batchType]}`}>
                      <Boxes className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{batch.batchNo}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded ${typeColors[batch.batchType]}`}>
                          {batch.batchType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {batch.ordersCount} orders • {batch.itemsCount} items • {batch.assignedTo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full ${statusColors[batch.status]?.bg} ${statusColors[batch.status]?.text}`}>
                      <StatusIcon className="w-4 h-4" />
                      {batch.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{batch.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        batch.status === "COMPLETED"
                          ? "bg-green-500"
                          : batch.status === "FAILED"
                          ? "bg-red-500"
                          : batch.status === "PAUSED"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${batch.progress}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-6 text-sm">
                    {batch.startedAt && (
                      <div>
                        <span className="text-gray-500">Started:</span>{" "}
                        <span className="text-gray-700">{batch.startedAt}</span>
                      </div>
                    )}
                    {batch.completedAt && (
                      <div>
                        <span className="text-gray-500">Completed:</span>{" "}
                        <span className="text-gray-700">{batch.completedAt}</span>
                      </div>
                    )}
                    {batch.status !== "COMPLETED" && batch.estimatedTime !== "-" && (
                      <div>
                        <span className="text-gray-500">Est. Time:</span>{" "}
                        <span className="text-gray-700">{batch.estimatedTime}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    {batch.status === "PENDING" && (
                      <button
                        onClick={() => handleStartBatch(batch.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Play className="w-4 h-4" />
                        Start
                      </button>
                    )}
                    {batch.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handlePauseBatch(batch.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                    )}
                    {batch.status === "PAUSED" && (
                      <button
                        onClick={() => handleResumeBatch(batch.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4" />
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Create New Batch</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Type</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="PICKING">Picking Batch</option>
                  <option value="PACKING">Packing Batch</option>
                  <option value="SHIPPING">Shipping Batch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="alpha">Team Alpha</option>
                  <option value="beta">Team Beta</option>
                  <option value="gamma">Team Gamma</option>
                  <option value="delta">Team Delta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Selection</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="auto">Auto Select (Pending Orders)</option>
                  <option value="priority">Priority Orders First</option>
                  <option value="sla">SLA At Risk First</option>
                  <option value="manual">Manual Selection</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Orders</label>
                <input
                  type="number"
                  defaultValue={25}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
