"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Printer,
  FileText,
  Search,
  Package,
  Download,
  Eye,
  QrCode,
  Barcode,
  RefreshCw,
  Plus,
  Truck,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

export default function LabelsManifestsPage() {
  const [activeTab, setActiveTab] = useState<"labels" | "manifests">("labels");
  const [awbInput, setAwbInput] = useState("");
  const [labelData, setLabelData] = useState<any>(null);
  const [manifestData, setManifestData] = useState<any>(null);
  const [error, setError] = useState("");

  // Generate labels
  const generateLabels = async (awbList: string) => {
    setError("");
    const awbs = awbList
      .split(/[\n,]/)
      .map((a) => a.trim())
      .filter((a) => a);

    if (awbs.length === 0) {
      setError("Please enter at least one AWB number");
      return;
    }

    try {
      const res = await fetch(
        `/api/labels?awbList=${encodeURIComponent(awbs.join(","))}`
      );
      const data = await res.json();

      if (data.success) {
        setLabelData(data.data);
      } else {
        setError(data.error || "Failed to generate labels");
      }
    } catch (e) {
      setError("Failed to generate labels");
    }
  };

  // Generate manifest
  const generateManifest = async (tripId: string) => {
    setError("");
    try {
      const res = await fetch(`/api/manifests?tripId=${tripId}`);
      const data = await res.json();

      if (data.success) {
        setManifestData(data.data);
      } else {
        setError(data.error || "Failed to generate manifest");
      }
    } catch (e) {
      setError("Failed to generate manifest");
    }
  };

  // Print labels
  const printLabels = async () => {
    if (!labelData?.labels?.length) return;

    const awbs = labelData.labels.map((l: any) => l.awbNumber).join(",");
    const printWindow = window.open(
      `/api/labels?awbList=${encodeURIComponent(awbs)}&format=html`,
      "_blank"
    );
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Printer className="h-7 w-7 text-cyan-600" />
            Labels & Manifests
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate shipping labels, manifests, and print documents
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "labels" ? "primary" : "outline"}
          onClick={() => setActiveTab("labels")}
          className="gap-2"
        >
          <QrCode className="h-4 w-4" />
          Shipping Labels
        </Button>
        <Button
          variant={activeTab === "manifests" ? "primary" : "outline"}
          onClick={() => setActiveTab("manifests")}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Manifests
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Labels Tab */}
      {activeTab === "labels" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-500" />
              Generate Labels
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  AWB Numbers (one per line or comma-separated)
                </label>
                <textarea
                  placeholder="CJD2024000001&#10;CJD2024000002&#10;CJD2024000003"
                  value={awbInput}
                  onChange={(e) => setAwbInput(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg font-mono text-sm"
                  rows={8}
                />
              </div>

              <Button
                onClick={() => generateLabels(awbInput)}
                className="w-full gap-2"
                disabled={!awbInput.trim()}
              >
                <Barcode className="h-4 w-4" />
                Generate Labels
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Quick Actions
              </h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Package className="h-4 w-4" />
                  Today's Pickups (Pending Labels)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Truck className="h-4 w-4" />
                  Next Trip Labels
                </Button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-gray-500" />
                Label Preview
              </h3>
              {labelData?.labels?.length > 0 && (
                <Button size="sm" onClick={printLabels} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print All ({labelData.labels.length})
                </Button>
              )}
            </div>

            {labelData?.labels?.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {labelData.labels.map((label: any) => (
                  <div
                    key={label.awbNumber}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    {/* Mini Label Preview */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-mono font-bold text-lg">
                        {label.awbNumber}
                      </div>
                      <div className="bg-black text-white px-3 py-1 font-bold rounded">
                        {label.sortCode}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">FROM</p>
                        <p className="font-medium">{label.shipper.name}</p>
                        <p className="text-gray-500">
                          {label.shipper.city} - {label.shipper.pincode}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">TO</p>
                        <p className="font-medium">{label.consignee.name}</p>
                        <p className="text-gray-500">
                          {label.consignee.city} - {label.consignee.pincode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex gap-4 text-sm">
                        <span>
                          <strong>Pcs:</strong> {label.pieces}
                        </span>
                        <span>
                          <strong>Wt:</strong> {label.weight} kg
                        </span>
                        <span>
                          <strong>{label.zoneCode}</strong>
                        </span>
                      </div>
                      {label.isCod && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                          COD: ₹{label.codAmount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p>Enter AWB numbers to generate labels</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manifests Tab */}
      {activeTab === "manifests" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Generate Manifest
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Manifest Type
                </label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option value="trip">Trip Manifest</option>
                  <option value="pickup">Pickup Manifest</option>
                  <option value="delivery">Delivery Manifest</option>
                  <option value="handover">Partner Handover Manifest</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Trip ID or AWB Numbers
                </label>
                <textarea
                  placeholder="Enter Trip ID or AWB numbers..."
                  className="w-full px-4 py-3 border rounded-lg font-mono text-sm"
                  rows={5}
                />
              </div>

              <Button className="w-full gap-2">
                <FileText className="h-4 w-4" />
                Generate Manifest
              </Button>
            </div>

            {/* Recent Manifests */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Recent Manifests
              </h4>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">MN-TRP202401{i}23</p>
                      <p className="text-xs text-gray-400">
                        Delhi → Mumbai • 45 shipments
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-gray-500" />
                Manifest Preview
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button size="sm" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p>Select a trip or enter AWBs to generate manifest</p>
            </div>
          </div>
        </div>
      )}

      {/* Label Formats Info */}
      <div className="mt-6 bg-cyan-50 rounded-xl p-5">
        <h3 className="font-semibold text-cyan-900 mb-4">Label Formats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Standard (4x6)</h4>
            <p className="text-sm text-gray-500">
              Thermal label format for standard shipments
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">A4 Sheet</h4>
            <p className="text-sm text-gray-500">
              Print multiple labels on A4 paper
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">POD Slip</h4>
            <p className="text-sm text-gray-500">
              Delivery acknowledgment slip with signature area
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">COD Label</h4>
            <p className="text-sm text-gray-500">
              Highlighted COD amount for cash collection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
