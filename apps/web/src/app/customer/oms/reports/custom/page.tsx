"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Plus,
  Play,
  Save,
  Trash2,
  Calendar,
  Filter,
  Settings,
  Eye,
} from "lucide-react";

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  columns: string[];
  filters: Array<{ field: string; operator: string; value: string }>;
  groupBy: string;
  sortBy: string;
  sortOrder: string;
  schedule: string;
  lastRun: string;
  createdBy: string;
}

export default function CustomReportsPage() {
  const [activeTab, setActiveTab] = useState<"builder" | "saved">("saved");
  const [showBuilder, setShowBuilder] = useState(false);
  const [savedReports] = useState<ReportConfig[]>([
    {
      id: "1",
      name: "Weekly Sales by Channel",
      description: "Weekly revenue breakdown by sales channel",
      dataSource: "orders",
      columns: ["channel", "orderCount", "revenue", "aov"],
      filters: [{ field: "status", operator: "equals", value: "COMPLETED" }],
      groupBy: "channel",
      sortBy: "revenue",
      sortOrder: "desc",
      schedule: "Weekly",
      lastRun: "2024-01-07 09:00",
      createdBy: "Admin",
    },
    {
      id: "2",
      name: "Low Stock Alert Report",
      description: "SKUs below reorder point",
      dataSource: "inventory",
      columns: ["sku", "name", "currentStock", "reorderPoint", "supplier"],
      filters: [{ field: "stockStatus", operator: "equals", value: "LOW" }],
      groupBy: "",
      sortBy: "currentStock",
      sortOrder: "asc",
      schedule: "Daily",
      lastRun: "2024-01-08 06:00",
      createdBy: "Inventory Team",
    },
    {
      id: "3",
      name: "Return Analysis by Reason",
      description: "Monthly return breakdown by reason code",
      dataSource: "returns",
      columns: ["reason", "count", "refundAmount", "restockRate"],
      filters: [],
      groupBy: "reason",
      sortBy: "count",
      sortOrder: "desc",
      schedule: "Monthly",
      lastRun: "2024-01-01 00:00",
      createdBy: "Operations",
    },
    {
      id: "4",
      name: "Fulfillment SLA Breach Report",
      description: "Orders that breached SLA targets",
      dataSource: "fulfillment",
      columns: ["orderNo", "channel", "promisedDate", "actualDate", "breachHours"],
      filters: [{ field: "slaStatus", operator: "equals", value: "BREACHED" }],
      groupBy: "",
      sortBy: "breachHours",
      sortOrder: "desc",
      schedule: "Daily",
      lastRun: "2024-01-08 06:00",
      createdBy: "Quality Team",
    },
  ]);

  const [newReport, setNewReport] = useState({
    name: "",
    description: "",
    dataSource: "orders",
    columns: [] as string[],
    dateRange: "last7days",
  });

  const dataSources = [
    { value: "orders", label: "Orders", columns: ["orderNo", "channel", "customerName", "status", "revenue", "items", "orderDate"] },
    { value: "inventory", label: "Inventory", columns: ["sku", "name", "category", "currentStock", "reservedStock", "location", "value"] },
    { value: "fulfillment", label: "Fulfillment", columns: ["orderNo", "status", "assignedTeam", "pickTime", "packTime", "shipTime", "slaStatus"] },
    { value: "returns", label: "Returns", columns: ["returnNo", "orderNo", "reason", "status", "refundAmount", "processingTime"] },
    { value: "customers", label: "Customers", columns: ["customerId", "name", "email", "totalOrders", "totalSpend", "lastOrderDate"] },
  ];

  const getColumnsForDataSource = () => {
    const source = dataSources.find((ds) => ds.value === newReport.dataSource);
    return source?.columns || [];
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Reports</h1>
          <p className="text-gray-600">Build and schedule your own reports</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("saved")}
          className={`pb-3 px-1 text-sm font-medium ${
            activeTab === "saved"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Saved Reports ({savedReports.length})
        </button>
        <button
          onClick={() => setActiveTab("builder")}
          className={`pb-3 px-1 text-sm font-medium ${
            activeTab === "builder"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Report Builder
        </button>
      </div>

      {activeTab === "saved" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedReports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {report.dataSource}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {report.columns.slice(0, 4).map((col) => (
                  <span key={col} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {col}
                  </span>
                ))}
                {report.columns.length > 4 && (
                  <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                    +{report.columns.length - 4} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Schedule: {report.schedule}</span>
                <span>Last run: {report.lastRun}</span>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                  <Play className="w-4 h-4" />
                  Run Now
                </button>
                <button className="flex items-center justify-center gap-2 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center gap-2 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center gap-2 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "builder" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Report Builder</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
              <input
                type="text"
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Enter report name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
              <select
                value={newReport.dataSource}
                onChange={(e) => setNewReport({ ...newReport, dataSource: e.target.value, columns: [] })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                {dataSources.map((ds) => (
                  <option key={ds.value} value={ds.value}>{ds.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newReport.description}
                onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows={2}
                placeholder="Describe what this report shows"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Columns</label>
              <div className="flex flex-wrap gap-2">
                {getColumnsForDataSource().map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      const columns = newReport.columns.includes(col)
                        ? newReport.columns.filter((c) => c !== col)
                        : [...newReport.columns, col];
                      setNewReport({ ...newReport, columns });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      newReport.columns.includes(col)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={newReport.dateRange}
                onChange={(e) => setNewReport({ ...newReport, dateRange: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Play className="w-4 h-4" />
              Run Report
            </button>
            <button className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
              <Save className="w-4 h-4" />
              Save Report
            </button>
            <button className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      )}

      {/* Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create New Report</h2>
              <button onClick={() => setShowBuilder(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Weekly Channel Performance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={2}
                  placeholder="What does this report show?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Source *</label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option>Orders</option>
                  <option>Inventory</option>
                  <option>Fulfillment</option>
                  <option>Returns</option>
                  <option>Customers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option>Manual (Run on demand)</option>
                  <option>Daily at 6:00 AM</option>
                  <option>Weekly on Monday</option>
                  <option>Monthly on 1st</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBuilder(false)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Report
              </button>
              <button
                onClick={() => setShowBuilder(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
