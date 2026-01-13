"use client";

import { useState } from "react";
import {
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  FileText,
  Package,
  Settings,
  Paperclip,
  Download,
  Eye,
  Search,
} from "lucide-react";

interface InboundLine {
  id: string;
  skuCode: string;
  skuDescription: string;
  uom: string;
  expectedQty: number;
  receivedQty: number;
  damagedQty: number;
  batchNo: string;
  expiryDate: string;
  mfgDate: string;
  mrp: number;
  rate: number;
}

interface UserDefinedField {
  id: string;
  fieldName: string;
  fieldValue: string;
  fieldType: "text" | "number" | "date" | "dropdown";
}

interface AttachedDocument {
  id: string;
  documentName: string;
  documentType: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
}

const demoLines: InboundLine[] = [
  { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", uom: "PCS", expectedQty: 100, receivedQty: 0, damagedQty: 0, batchNo: "BATCH-001", expiryDate: "2025-12-31", mfgDate: "2024-01-01", mrp: 599, rate: 450 },
  { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", uom: "PCS", expectedQty: 50, receivedQty: 0, damagedQty: 0, batchNo: "BATCH-002", expiryDate: "2025-12-31", mfgDate: "2024-01-01", mrp: 899, rate: 650 },
];

const demoUDFs: UserDefinedField[] = [
  { id: "1", fieldName: "Custom Field 1", fieldValue: "", fieldType: "text" },
  { id: "2", fieldName: "Priority Level", fieldValue: "High", fieldType: "dropdown" },
  { id: "3", fieldName: "Expected Delivery", fieldValue: "2024-01-15", fieldType: "date" },
];

const demoDocuments: AttachedDocument[] = [
  { id: "1", documentName: "Invoice_INV001234.pdf", documentType: "Invoice", uploadedAt: "2024-01-08 10:30", uploadedBy: "Rahul Kumar", fileSize: "245 KB" },
  { id: "2", documentName: "PO_2024001.pdf", documentType: "Purchase Order", uploadedAt: "2024-01-08 09:15", uploadedBy: "Priya Sharma", fileSize: "180 KB" },
];

export default function InboundCreateEditPage() {
  const [activeTab, setActiveTab] = useState<"create" | "udf" | "documents" | "import">("create");

  // Inbound Header State
  const [inboundNo, setInboundNo] = useState("");
  const [inboundType, setInboundType] = useState("WITH_PO");
  const [poNo, setPoNo] = useState("");
  const [vendor, setVendor] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [inboundLocation, setInboundLocation] = useState("Warehouse A");
  const [expectedDate, setExpectedDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // Line Items State
  const [lines, setLines] = useState<InboundLine[]>(demoLines);
  const [udfs, setUdfs] = useState<UserDefinedField[]>(demoUDFs);
  const [documents, setDocuments] = useState<AttachedDocument[]>(demoDocuments);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleAddLine = () => {
    const newLine: InboundLine = {
      id: Date.now().toString(),
      skuCode: "",
      skuDescription: "",
      uom: "PCS",
      expectedQty: 0,
      receivedQty: 0,
      damagedQty: 0,
      batchNo: "",
      expiryDate: "",
      mfgDate: "",
      mrp: 0,
      rate: 0,
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id));
  };

  const handleLineChange = (id: string, field: keyof InboundLine, value: string | number) => {
    setLines(lines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleAddUDF = () => {
    const newUDF: UserDefinedField = {
      id: Date.now().toString(),
      fieldName: "",
      fieldValue: "",
      fieldType: "text",
    };
    setUdfs([...udfs, newUDF]);
  };

  const handleUDFChange = (id: string, field: keyof UserDefinedField, value: string) => {
    setUdfs(udfs.map(udf =>
      udf.id === id ? { ...udf, [field]: value } : udf
    ));
  };

  const handleSave = async () => {
    // Save inbound logic
    console.log("Saving inbound:", {
      header: { inboundNo, inboundType, poNo, vendor, invoiceNo, invoiceDate, inboundLocation, expectedDate, remarks },
      lines,
      udfs,
    });
    alert("Inbound saved successfully!");
  };

  const tabs = [
    { id: "create", label: "Inbound Create/Edit", icon: Package },
    { id: "udf", label: "User Defined Fields", icon: Settings },
    { id: "documents", label: "Attached Documents", icon: Paperclip },
    { id: "import", label: "Import", icon: Upload },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inbound Create/Edit</h1>
          <p className="text-sm text-gray-500">Create or edit inbound records with line items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab 1: Inbound Create/Edit */}
          {activeTab === "create" && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Inbound Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Inbound No</label>
                    <input
                      type="text"
                      value={inboundNo}
                      onChange={(e) => setInboundNo(e.target.value)}
                      placeholder="Auto-generated"
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Inbound Type *</label>
                    <select
                      value={inboundType}
                      onChange={(e) => setInboundType(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      <option value="WITH_ASN">With ASN</option>
                      <option value="DIRECT">Direct Inbound</option>
                      <option value="WITH_GATE_PASS">With Gate Pass</option>
                      <option value="WITH_PO">With PO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">PO No</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={poNo}
                        onChange={(e) => setPoNo(e.target.value)}
                        placeholder="Enter PO no..."
                        className="flex-1 px-3 py-2 text-sm border rounded-lg"
                      />
                      <button className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Expected Date</label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    />
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
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Line Items</h3>
                  <button
                    onClick={handleAddLine}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">SKU Code</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">UOM</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">Expected Qty</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">Batch No</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">Expiry Date</th>
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
                            <input
                              type="text"
                              value={line.skuCode}
                              onChange={(e) => handleLineChange(line.id, "skuCode", e.target.value)}
                              placeholder="Enter SKU"
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={line.skuDescription}
                              onChange={(e) => handleLineChange(line.id, "skuDescription", e.target.value)}
                              placeholder="Description"
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={line.uom}
                              onChange={(e) => handleLineChange(line.id, "uom", e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded"
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
                              value={line.expectedQty}
                              onChange={(e) => handleLineChange(line.id, "expectedQty", parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm border rounded text-center"
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
                              className="w-20 px-2 py-1 text-sm border rounded text-center"
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
                <div className="mt-4 flex justify-end text-sm">
                  <div className="bg-gray-50 px-4 py-2 rounded-lg">
                    <span className="text-gray-500">Total Lines:</span>
                    <span className="ml-2 font-semibold">{lines.length}</span>
                    <span className="mx-4 text-gray-300">|</span>
                    <span className="text-gray-500">Total Qty:</span>
                    <span className="ml-2 font-semibold">{lines.reduce((sum, l) => sum + l.expectedQty, 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: User Defined Fields */}
          {activeTab === "udf" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">User Defined Fields</h3>
                <button
                  onClick={handleAddUDF}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Field
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {udfs.map((udf) => (
                  <div key={udf.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="text"
                        value={udf.fieldName}
                        onChange={(e) => handleUDFChange(udf.id, "fieldName", e.target.value)}
                        placeholder="Field Name"
                        className="text-sm font-medium text-gray-700 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                      />
                      <select
                        value={udf.fieldType}
                        onChange={(e) => handleUDFChange(udf.id, "fieldType", e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                    </div>
                    {udf.fieldType === "date" ? (
                      <input
                        type="date"
                        value={udf.fieldValue}
                        onChange={(e) => handleUDFChange(udf.id, "fieldValue", e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                      />
                    ) : udf.fieldType === "dropdown" ? (
                      <select
                        value={udf.fieldValue}
                        onChange={(e) => handleUDFChange(udf.id, "fieldValue", e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                      >
                        <option value="">Select...</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    ) : (
                      <input
                        type={udf.fieldType}
                        value={udf.fieldValue}
                        onChange={(e) => handleUDFChange(udf.id, "fieldValue", e.target.value)}
                        placeholder="Enter value..."
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Attached Documents */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Attached Documents</h3>
                <label className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload Document
                  <input type="file" className="hidden" />
                </label>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Document Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Uploaded At</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Uploaded By</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">Size</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500" />
                            <span className="font-medium">{doc.documentName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{doc.documentType}</td>
                        <td className="px-4 py-3 text-gray-500">{doc.uploadedAt}</td>
                        <td className="px-4 py-3 text-gray-600">{doc.uploadedBy}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{doc.fileSize}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-green-600" title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Import */}
          {activeTab === "import" && (
            <div className="space-y-6">
              <div className="bg-gray-50 border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Import Inbound Data</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload Excel or CSV file to import inbound line items
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Select File
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {importFile && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{importFile.name}</span>
                    <button
                      onClick={() => setImportFile(null)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
                {importFile && (
                  <button className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Upload className="w-4 h-4" />
                    Import Data
                  </button>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Import Instructions</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Download the template file and fill in the required data</li>
                  <li>Supported formats: Excel (.xlsx, .xls) and CSV (.csv)</li>
                  <li>SKU Code is mandatory for each line item</li>
                  <li>Quantity must be a positive number</li>
                  <li>Date format should be YYYY-MM-DD</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
