"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Card, Button, Badge } from "@cjdquick/ui";

interface UploadResult {
  created: number;
  failed: number;
  errors: { row: number; error: string }[];
  orders: { id: string; orderNumber: string; customerName: string }[];
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

async function fetchWarehouses(): Promise<{ success: boolean; data: Warehouse[] }> {
  const res = await fetch("/api/client/facilities?status=active");
  return res.json();
}

const CSV_COLUMNS = [
  { name: "customer_name", required: true, description: "Customer full name" },
  { name: "customer_phone", required: true, description: "10-digit phone number" },
  { name: "customer_email", required: false, description: "Customer email" },
  { name: "delivery_address", required: true, description: "Full delivery address" },
  { name: "delivery_pincode", required: true, description: "6-digit pincode" },
  { name: "delivery_city", required: false, description: "City name" },
  { name: "delivery_state", required: false, description: "State name" },
  { name: "weight_kg", required: true, description: "Package weight in kg" },
  { name: "length_cm", required: false, description: "Package length in cm" },
  { name: "width_cm", required: false, description: "Package width in cm" },
  { name: "height_cm", required: false, description: "Package height in cm" },
  { name: "item_description", required: true, description: "Description of items" },
  { name: "item_value", required: false, description: "Declared value in INR" },
  { name: "item_quantity", required: false, description: "Number of items" },
  { name: "item_sku", required: false, description: "Product SKU code" },
  { name: "payment_mode", required: false, description: "PREPAID or COD" },
  { name: "cod_amount", required: false, description: "COD amount (if COD)" },
  { name: "client_order_id", required: false, description: "Your reference ID" },
  { name: "notes", required: false, description: "Special instructions" },
];

export default function BulkUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [parseError, setParseError] = useState<string>("");

  const { data: warehousesData } = useQuery({
    queryKey: ["client-warehouses"],
    queryFn: fetchWarehouses,
  });

  const warehouses = warehousesData?.data || [];

  const downloadTemplate = () => {
    const headers = CSV_COLUMNS.map((col) => col.name).join(",");
    const sampleRow = [
      "John Doe",
      "9876543210",
      "john@example.com",
      "123 Main Street",
      "110001",
      "Delhi",
      "Delhi",
      "0.5",
      "20",
      "15",
      "10",
      "T-Shirt Cotton Blue",
      "999",
      "1",
      "SKU001",
      "PREPAID",
      "",
      "MY-ORDER-001",
      "Handle with care",
    ].join(",");
    const csvContent = `${headers}\n${sampleRow}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cjdquick_bulk_order_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || "";
        // Convert to proper field names
        switch (header) {
          case "customer_name":
            row.customerName = value;
            break;
          case "customer_phone":
            row.customerPhone = value;
            break;
          case "customer_email":
            row.customerEmail = value || undefined;
            break;
          case "delivery_address":
            row.deliveryAddress = value;
            break;
          case "delivery_pincode":
            row.deliveryPincode = value;
            break;
          case "delivery_city":
            row.deliveryCity = value || undefined;
            break;
          case "delivery_state":
            row.deliveryState = value || undefined;
            break;
          case "weight_kg":
            row.weightKg = parseFloat(value) || 0;
            break;
          case "length_cm":
            row.lengthCm = parseFloat(value) || undefined;
            break;
          case "width_cm":
            row.widthCm = parseFloat(value) || undefined;
            break;
          case "height_cm":
            row.heightCm = parseFloat(value) || undefined;
            break;
          case "item_description":
            row.itemDescription = value;
            break;
          case "item_value":
            row.itemValue = parseFloat(value) || undefined;
            break;
          case "item_quantity":
            row.itemQuantity = parseInt(value) || undefined;
            break;
          case "item_sku":
            row.itemSku = value || undefined;
            break;
          case "payment_mode":
            row.paymentMode = value.toUpperCase() === "COD" ? "COD" : "PREPAID";
            break;
          case "cod_amount":
            row.codAmount = parseFloat(value) || undefined;
            break;
          case "client_order_id":
            row.clientOrderId = value || undefined;
            break;
          case "notes":
            row.notes = value || undefined;
            break;
        }
      });

      if (selectedWarehouse) {
        row.warehouseId = selectedWarehouse;
      }

      data.push(row);
    }

    return data;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError("");
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        setParsedData(data);
      } catch (error: any) {
        setParseError(error.message);
        setParsedData([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const res = await fetch("/api/client/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: parsedData }),
      });
      const data = await res.json();

      if (data.success) {
        setUploadResult(data.data);
      } else {
        setParseError(data.error || "Upload failed");
      }
    } catch (error) {
      setParseError("Upload failed. Please try again.");
    }

    setIsUploading(false);
  };

  const resetForm = () => {
    setFile(null);
    setParsedData([]);
    setUploadResult(null);
    setParseError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/client/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bulk Order Upload</h1>
          <p className="text-sm text-gray-500">Upload multiple orders via CSV file</p>
        </div>
      </div>

      {/* Success Result */}
      {uploadResult && uploadResult.created > 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">
                Upload Successful!
              </h3>
              <p className="text-green-700 mt-1">
                {uploadResult.created} orders created successfully
                {uploadResult.failed > 0 && `, ${uploadResult.failed} failed`}
              </p>
              <div className="mt-4 flex gap-3">
                <Link href="/client/orders">
                  <Button>View Orders</Button>
                </Link>
                <Button variant="outline" onClick={resetForm}>
                  Upload More
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Errors from upload */}
      {uploadResult && uploadResult.errors.length > 0 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {uploadResult.errors.length} rows failed
          </h3>
          <div className="mt-4 max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-red-800">
                  <th className="pb-2">Row</th>
                  <th className="pb-2">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-200">
                {uploadResult.errors.map((err, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-4 font-medium">{err.row}</td>
                    <td className="py-2 text-red-700">{err.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Upload Form */}
      {!uploadResult?.created && (
        <>
          {/* Step 1: Select Warehouse */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 1: Select Pickup Location (Optional)
            </h2>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a warehouse...</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </Card>

          {/* Step 2: Download Template */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 2: Download Template
            </h2>
            <p className="text-gray-600 mb-4">
              Download the CSV template, fill in your order details, and upload.
            </p>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>

            {/* Column Reference */}
            <div className="mt-6">
              <button
                onClick={() =>
                  document.getElementById("column-help")?.classList.toggle("hidden")
                }
                className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <HelpCircle className="h-4 w-4" />
                View column reference
              </button>
              <div id="column-help" className="hidden mt-4">
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Column</th>
                      <th className="px-3 py-2 text-left">Required</th>
                      <th className="px-3 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {CSV_COLUMNS.map((col) => (
                      <tr key={col.name}>
                        <td className="px-3 py-2 font-mono text-xs">{col.name}</td>
                        <td className="px-3 py-2">
                          {col.required ? (
                            <Badge variant="danger" size="sm">Required</Badge>
                          ) : (
                            <Badge variant="default" size="sm">Optional</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{col.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Step 3: Upload File */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 3: Upload CSV File
            </h2>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                file ? "border-primary-300 bg-primary-50" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />

              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="h-10 w-10 text-primary-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {parsedData.length} orders found
                      </p>
                    </div>
                    <button
                      onClick={resetForm}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-4 text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    CSV files only, max 500 orders
                  </p>
                </label>
              )}
            </div>

            {parseError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertTriangle className="h-5 w-5 inline mr-2" />
                {parseError}
              </div>
            )}
          </Card>

          {/* Preview & Submit */}
          {parsedData.length > 0 && !parseError && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Step 4: Review & Upload
              </h2>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden mb-6">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Customer</th>
                        <th className="px-3 py-2 text-left">Phone</th>
                        <th className="px-3 py-2 text-left">City</th>
                        <th className="px-3 py-2 text-left">Weight</th>
                        <th className="px-3 py-2 text-left">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedData.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2">{row.customerName}</td>
                          <td className="px-3 py-2">{row.customerPhone}</td>
                          <td className="px-3 py-2">{row.deliveryCity || row.deliveryPincode}</td>
                          <td className="px-3 py-2">{row.weightKg} kg</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={row.paymentMode === "COD" ? "warning" : "info"}
                              size="sm"
                            >
                              {row.paymentMode}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 10 && (
                  <div className="px-3 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                    ... and {parsedData.length - 10} more orders
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {parsedData.length} Orders
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
