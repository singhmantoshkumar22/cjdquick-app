"use client";

import { useState } from "react";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface BulkUpload {
  id: string;
  fileName: string;
  event: string;
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
}

const demoUploads: BulkUpload[] = [
  { id: "1", fileName: "bulk_pack_jan08.csv", event: "BULK_PACK", totalRecords: 150, successRecords: 148, failedRecords: 2, uploadedBy: "Rahul Kumar", uploadedAt: "2024-01-08 09:30", status: "COMPLETED" },
  { id: "2", fileName: "bulk_ship_jan08.csv", event: "BULK_SHIP", totalRecords: 200, successRecords: 195, failedRecords: 5, uploadedBy: "Priya Sharma", uploadedAt: "2024-01-08 10:15", status: "COMPLETED" },
  { id: "3", fileName: "bulk_pack_jan07.csv", event: "BULK_PACK", totalRecords: 100, successRecords: 50, failedRecords: 0, uploadedBy: "Amit Patel", uploadedAt: "2024-01-07 16:30", status: "PROCESSING" },
];

const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  PROCESSING: { bg: "bg-blue-100", text: "text-blue-700", icon: RefreshCw },
  FAILED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
};

export default function BulkOrderShipmentPage() {
  const [selectedEvent, setSelectedEvent] = useState("BULK_PACK");
  const [dragActive, setDragActive] = useState(false);
  const [uploads] = useState<BulkUpload[]>(demoUploads);

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
    // Handle file upload
  };

  const handleDownloadTemplate = () => {
    // Download template based on selected event
    const templateName = selectedEvent === "BULK_PACK" ? "bulk_pack_template.csv" : "bulk_ship_template.csv";
    const csvContent = selectedEvent === "BULK_PACK"
      ? "order_number,delivery_no,tracking_no,boxes,weight\n"
      : "order_number,delivery_no,tracking_no,transporter,ship_date\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateName;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bulk Order Shipment</h1>
          <p className="text-sm text-gray-500">Import bulk data for packing and shipping orders</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upload Form */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Upload File</h2>

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Event *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="event"
                  value="BULK_PACK"
                  checked={selectedEvent === "BULK_PACK"}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Bulk Pack</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="event"
                  value="BULK_SHIP"
                  checked={selectedEvent === "BULK_SHIP"}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Bulk Ship</span>
              </label>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Instructions:</h3>
            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li>Choose the event: Bulk Pack or Bulk Ship</li>
              <li>Download the template file</li>
              <li>Enter the data in the template without changing column headers</li>
              <li>Upload the completed CSV file</li>
            </ol>
          </div>

          {/* Download Template */}
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Download {selectedEvent === "BULK_PACK" ? "Bulk Pack" : "Bulk Ship"} Template
          </button>

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
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Recent Uploads</h2>
          <div className="space-y-3">
            {uploads.slice(0, 3).map((upload) => {
              const StatusIcon = statusColors[upload.status]?.icon || Clock;
              return (
                <div key={upload.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{upload.fileName}</p>
                    <p className="text-xs text-gray-500">{upload.event.replace(/_/g, " ")}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                          statusColors[upload.status]?.bg
                        } ${statusColors[upload.status]?.text}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {upload.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {upload.successRecords}/{upload.totalRecords} success
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
                <th className="px-4 py-3 text-center font-medium text-gray-600">Event</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Success</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Failed</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Uploaded By</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {uploads.map((upload) => {
                const StatusIcon = statusColors[upload.status]?.icon || Clock;
                return (
                  <tr key={upload.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{upload.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${
                        upload.event === "BULK_PACK" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                      }`}>
                        {upload.event.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{upload.totalRecords}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{upload.successRecords}</td>
                    <td className="px-4 py-3 text-center text-red-600 font-medium">{upload.failedRecords}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{upload.uploadedBy}</p>
                      <p className="text-xs text-gray-500">{upload.uploadedAt}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${statusColors[upload.status]?.bg} ${statusColors[upload.status]?.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {upload.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {upload.failedRecords > 0 && (
                        <button className="p-1 text-gray-400 hover:text-red-600" title="Download Failed Records">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">Showing 1-{uploads.length} of {uploads.length} uploads</div>
          <div className="flex items-center gap-2">
            <button className="p-1 border rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
            <button className="p-1 border rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
