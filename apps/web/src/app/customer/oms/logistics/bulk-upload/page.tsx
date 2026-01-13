"use client";

import { useState } from "react";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
} from "lucide-react";

interface BulkUpload {
  id: string;
  fileName: string;
  uploadType: string;
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
}

const demoBulkUploads: BulkUpload[] = [
  {
    id: "1",
    fileName: "awb_data_jan_08.xlsx",
    uploadType: "AWB Update",
    totalRecords: 500,
    successRecords: 498,
    failedRecords: 2,
    uploadedBy: "Rahul Kumar",
    uploadedAt: "2024-01-08 09:30",
    status: "COMPLETED",
  },
  {
    id: "2",
    fileName: "pincode_update.csv",
    uploadType: "Service Pincode",
    totalRecords: 1200,
    successRecords: 800,
    failedRecords: 0,
    uploadedBy: "Priya Sharma",
    uploadedAt: "2024-01-08 10:15",
    status: "PROCESSING",
  },
  {
    id: "3",
    fileName: "transporter_rates.xlsx",
    uploadType: "Rate Card",
    totalRecords: 350,
    successRecords: 0,
    failedRecords: 0,
    uploadedBy: "Amit Patel",
    uploadedAt: "2024-01-08 11:00",
    status: "PENDING",
  },
  {
    id: "4",
    fileName: "inventory_update.csv",
    uploadType: "Inventory",
    totalRecords: 800,
    successRecords: 0,
    failedRecords: 800,
    uploadedBy: "Sneha Gupta",
    uploadedAt: "2024-01-07 16:30",
    status: "FAILED",
  },
];

const statusColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  PROCESSING: { bg: "bg-blue-100", text: "text-blue-700", icon: RefreshCw },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
  FAILED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

const uploadTypes = [
  { label: "AWB Update", description: "Bulk update AWB status and tracking" },
  { label: "Service Pincode", description: "Add or update service pincodes" },
  { label: "Rate Card", description: "Upload transporter rate cards" },
  { label: "Inventory", description: "Bulk inventory adjustments" },
  { label: "Manifest", description: "Bulk manifest creation" },
];

const summaryStats = [
  { label: "Total Uploads", value: "245", color: "bg-blue-500", icon: Upload },
  { label: "Processing", value: "8", color: "bg-orange-500", icon: RefreshCw },
  { label: "Completed", value: "230", color: "bg-green-500", icon: CheckCircle },
  { label: "Failed", value: "7", color: "bg-red-500", icon: AlertCircle },
];

export default function BulkUploadPage() {
  const [selectedType, setSelectedType] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.color} rounded-lg p-4 text-white relative overflow-hidden`}
            >
              <div className="relative z-10">
                <p className="text-xs font-medium opacity-90">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className="absolute right-2 bottom-2 opacity-30">
                <Icon className="w-10 h-10" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Bulk Upload</h1>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upload Form */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Upload File</h2>

          {/* Upload Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select upload type...</option>
              {uploadTypes.map((type) => (
                <option key={type.label} value={type.label}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-xs text-gray-400">Supports: CSV, XLSX (Max 10MB)</p>
            <input type="file" className="hidden" accept=".csv,.xlsx,.xls" />
            <button className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Choose File
            </button>
          </div>

          {/* Download Templates */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <span className="text-sm text-gray-600">Download Templates:</span>
            {uploadTypes.slice(0, 3).map((type) => (
              <button
                key={type.label}
                className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
              >
                <Download className="w-3 h-3" />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          <div className="space-y-3">
            {demoBulkUploads.slice(0, 3).map((upload) => {
              const StatusIcon = statusColors[upload.status]?.icon || Clock;
              return (
                <div key={upload.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{upload.fileName}</p>
                    <p className="text-xs text-gray-500">{upload.uploadType}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                          statusColors[upload.status]?.bg
                        } ${statusColors[upload.status]?.text}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {upload.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload History Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Upload History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">File Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Upload Type</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Success</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Failed</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Uploaded By</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoBulkUploads.map((upload) => {
                const StatusIcon = statusColors[upload.status]?.icon || Clock;
                return (
                  <tr key={upload.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{upload.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{upload.uploadType}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{upload.totalRecords}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">
                      {upload.successRecords}
                    </td>
                    <td className="px-4 py-3 text-center text-red-600 font-medium">
                      {upload.failedRecords}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{upload.uploadedBy}</p>
                      <p className="text-xs text-gray-500">{upload.uploadedAt}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                          statusColors[upload.status]?.bg
                        } ${statusColors[upload.status]?.text}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {upload.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        {upload.failedRecords > 0 && (
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">Showing 1-4 of 245 uploads</div>
          <div className="flex items-center gap-2">
            <button className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
            <span className="px-3 py-1 text-sm hover:bg-gray-100 rounded cursor-pointer">2</span>
            <button className="p-1 border rounded hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
