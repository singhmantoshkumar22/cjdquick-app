"use client";

import { useState } from "react";
import {
  Save,
  X,
  Plus,
  Trash2,
  Search,
  Package,
  Truck,
  User,
  MapPin,
  Calendar,
  FileText,
  ScanLine,
} from "lucide-react";

interface DirectInboundLine {
  id: string;
  skuCode: string;
  skuDescription: string;
  uom: string;
  receivedQty: number;
  batchNo: string;
  expiryDate: string;
  mfgDate: string;
  mrp: number;
  rate: number;
  serialNo: string;
}

const initialLines: DirectInboundLine[] = [];

export default function DirectInboundPage() {
  // Header State
  const [vendor, setVendor] = useState("");
  const [asnNo, setAsnNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [inboundLocation, setInboundLocation] = useState("Warehouse A");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverContact, setDriverContact] = useState("");
  const [remarks, setRemarks] = useState("");

  // Line Items State
  const [lines, setLines] = useState<DirectInboundLine[]>(initialLines);
  const [skuSearch, setSkuSearch] = useState("");

  const handleAddLine = () => {
    const newLine: DirectInboundLine = {
      id: Date.now().toString(),
      skuCode: "",
      skuDescription: "",
      uom: "PCS",
      receivedQty: 0,
      batchNo: "",
      expiryDate: "",
      mfgDate: "",
      mrp: 0,
      rate: 0,
      serialNo: "",
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id));
  };

  const handleLineChange = (id: string, field: keyof DirectInboundLine, value: string | number) => {
    setLines(lines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleSkuLookup = (lineId: string, skuCode: string) => {
    // Simulate SKU lookup
    const demoSkus: Record<string, { description: string; uom: string; mrp: number }> = {
      "SKU-001": { description: "Wireless Mouse", uom: "PCS", mrp: 599 },
      "SKU-002": { description: "USB Keyboard", uom: "PCS", mrp: 899 },
      "SKU-003": { description: "Monitor Stand", uom: "PCS", mrp: 1299 },
      "SKU-004": { description: "Laptop Bag", uom: "PCS", mrp: 1499 },
    };

    if (demoSkus[skuCode]) {
      setLines(lines.map(line =>
        line.id === lineId ? {
          ...line,
          skuCode,
          skuDescription: demoSkus[skuCode].description,
          uom: demoSkus[skuCode].uom,
          mrp: demoSkus[skuCode].mrp,
        } : line
      ));
    }
  };

  const handleSave = async () => {
    if (!vendor) {
      alert("Please select a vendor");
      return;
    }
    if (lines.length === 0) {
      alert("Please add at least one line item");
      return;
    }

    console.log("Saving direct inbound:", {
      header: { vendor, asnNo, invoiceNo, invoiceDate, inboundLocation, vehicleNo, driverName, driverContact, remarks },
      lines,
    });
    alert("Direct inbound saved successfully!");
  };

  const handleSaveAndReceive = async () => {
    await handleSave();
    // Navigate to receiving or trigger receiving process
  };

  const totalQty = lines.reduce((sum, line) => sum + line.receivedQty, 0);
  const totalValue = lines.reduce((sum, line) => sum + (line.receivedQty * line.rate), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Direct Inbound</h1>
          <p className="text-sm text-gray-500">Create inbound without PO - by Vendor or ASN</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleSaveAndReceive}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <ScanLine className="w-4 h-4" />
            Save & Receive
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>

      {/* Inbound Header Form */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Inbound Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vendor Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 border-b pb-2">
              <User className="w-4 h-4" />
              Vendor Information
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vendor *</label>
              <select
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              >
                <option value="">Select Vendor</option>
                <option value="ABC Suppliers">ABC Suppliers</option>
                <option value="XYZ Trading">XYZ Trading</option>
                <option value="Quick Supplies">Quick Supplies</option>
                <option value="Metro Distributors">Metro Distributors</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ASN No (Optional)</label>
              <input
                type="text"
                value={asnNo}
                onChange={(e) => setAsnNo(e.target.value)}
                placeholder="Enter ASN no..."
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>

          {/* Invoice Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 border-b pb-2">
              <FileText className="w-4 h-4" />
              Invoice Details
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Invoice No</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="Enter invoice no..."
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Inbound Location *</label>
              <select
                value={inboundLocation}
                onChange={(e) => setInboundLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              >
                <option value="Warehouse A">Warehouse A</option>
                <option value="Warehouse B">Warehouse B</option>
                <option value="Headoffice">Headoffice</option>
              </select>
            </div>
          </div>

          {/* Vehicle Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 border-b pb-2">
              <Truck className="w-4 h-4" />
              Vehicle Information
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vehicle No</label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="e.g., MH-12-AB-1234"
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name..."
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Driver Contact</label>
              <input
                type="text"
                value={driverContact}
                onChange={(e) => setDriverContact(e.target.value)}
                placeholder="Enter contact no..."
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs text-gray-500 mb-1">Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks..."
            rows={2}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          />
        </div>
      </div>

      {/* Line Items Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Line Items
          </h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
              <ScanLine className="w-4 h-4" />
              Scan Barcode
            </button>
            <button
              onClick={handleAddLine}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Line
            </button>
          </div>
        </div>

        {lines.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No line items added yet</p>
            <button
              onClick={handleAddLine}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add your first item
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">SKU Code</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">UOM</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Qty</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Batch No</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Expiry</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">MRP</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Rate</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((line, index) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={line.skuCode}
                            onChange={(e) => handleLineChange(line.id, "skuCode", e.target.value)}
                            onBlur={(e) => handleSkuLookup(line.id, e.target.value)}
                            placeholder="Enter/Scan SKU"
                            className="w-28 px-2 py-1 text-sm border rounded"
                          />
                          <button
                            onClick={() => handleSkuLookup(line.id, line.skuCode)}
                            className="p-1 border rounded hover:bg-gray-100"
                          >
                            <Search className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={line.skuDescription}
                          onChange={(e) => handleLineChange(line.id, "skuDescription", e.target.value)}
                          placeholder="Description"
                          className="w-full px-2 py-1 text-sm border rounded bg-gray-50"
                          readOnly
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={line.uom}
                          onChange={(e) => handleLineChange(line.id, "uom", e.target.value)}
                          className="w-16 px-2 py-1 text-sm border rounded"
                        >
                          <option value="PCS">PCS</option>
                          <option value="BOX">BOX</option>
                          <option value="CTN">CTN</option>
                          <option value="KG">KG</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={line.receivedQty}
                          onChange={(e) => handleLineChange(line.id, "receivedQty", parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm border rounded text-center"
                          min={0}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={line.batchNo}
                          onChange={(e) => handleLineChange(line.id, "batchNo", e.target.value)}
                          placeholder="Batch"
                          className="w-24 px-2 py-1 text-sm border rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={line.expiryDate}
                          onChange={(e) => handleLineChange(line.id, "expiryDate", e.target.value)}
                          className="w-32 px-2 py-1 text-sm border rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={line.mrp}
                          onChange={(e) => handleLineChange(line.id, "mrp", parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm border rounded text-center bg-gray-50"
                          readOnly
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={line.rate}
                          onChange={(e) => handleLineChange(line.id, "rate", parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm border rounded text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleRemoveLine(line.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 flex justify-end">
              <div className="bg-gray-50 px-6 py-3 rounded-lg">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <span className="text-gray-500">Total Lines:</span>
                  <span className="font-semibold text-right">{lines.length}</span>
                  <span className="text-gray-500">Total Qty:</span>
                  <span className="font-semibold text-right">{totalQty}</span>
                  <span className="text-gray-500">Total Value:</span>
                  <span className="font-semibold text-right">₹{totalValue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
