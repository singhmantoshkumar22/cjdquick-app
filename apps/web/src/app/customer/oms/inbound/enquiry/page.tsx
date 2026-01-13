"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Printer,
  FileText,
  RefreshCw,
} from "lucide-react";

interface InboundItem {
  id: string;
  inboundNo: string;
  stoNo: string;
  asnNo: string;
  poNo: string;
  grnNo: string;
  grnDate: string;
  inboundType: "WITH_ASN" | "DIRECT" | "WITH_GATE_PASS" | "WITH_PO" | "STO" | "RETURN";
  invoiceNo: string;
  vendor: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  inboundLocation: string;
  totalQty: number;
  receivedQty: number;
  createdAt: string;
  createdBy: string;
}

const demoInbounds: InboundItem[] = [
  { id: "1", inboundNo: "INB-2024-001234", stoNo: "STO-001", asnNo: "ASN-001", poNo: "PO-2024-001", grnNo: "GRN-001", grnDate: "2024-01-08", inboundType: "WITH_ASN", invoiceNo: "INV-001234", vendor: "ABC Suppliers", status: "COMPLETED", inboundLocation: "Warehouse A", totalQty: 100, receivedQty: 100, createdAt: "2024-01-08 10:30", createdBy: "Rahul Kumar" },
  { id: "2", inboundNo: "INB-2024-001235", stoNo: "", asnNo: "", poNo: "PO-2024-002", grnNo: "GRN-002", grnDate: "2024-01-08", inboundType: "WITH_PO", invoiceNo: "INV-001235", vendor: "XYZ Trading", status: "IN_PROGRESS", inboundLocation: "Warehouse A", totalQty: 250, receivedQty: 150, createdAt: "2024-01-08 09:15", createdBy: "Priya Sharma" },
  { id: "3", inboundNo: "INB-2024-001236", stoNo: "STO-002", asnNo: "", poNo: "", grnNo: "GRN-003", grnDate: "2024-01-07", inboundType: "STO", invoiceNo: "", vendor: "Internal Transfer", status: "COMPLETED", inboundLocation: "Warehouse B", totalQty: 500, receivedQty: 500, createdAt: "2024-01-07 14:20", createdBy: "Amit Patel" },
  { id: "4", inboundNo: "INB-2024-001237", stoNo: "", asnNo: "", poNo: "", grnNo: "GRN-004", grnDate: "2024-01-08", inboundType: "DIRECT", invoiceNo: "INV-001237", vendor: "Quick Supplies", status: "PENDING", inboundLocation: "Warehouse A", totalQty: 75, receivedQty: 0, createdAt: "2024-01-08 11:45", createdBy: "Sneha Gupta" },
  { id: "5", inboundNo: "INB-2024-001238", stoNo: "", asnNo: "", poNo: "", grnNo: "GRN-005", grnDate: "2024-01-07", inboundType: "RETURN", invoiceNo: "", vendor: "Customer Return", status: "IN_PROGRESS", inboundLocation: "Warehouse A", totalQty: 25, receivedQty: 15, createdAt: "2024-01-07 16:30", createdBy: "Vikram Singh" },
  { id: "6", inboundNo: "INB-2024-001239", stoNo: "", asnNo: "ASN-002", poNo: "PO-2024-003", grnNo: "", grnDate: "", inboundType: "WITH_ASN", invoiceNo: "INV-001239", vendor: "Metro Distributors", status: "PENDING", inboundLocation: "Warehouse B", totalQty: 300, receivedQty: 0, createdAt: "2024-01-08 08:00", createdBy: "Neha Verma" },
];

const inboundTypeLabels: Record<string, string> = {
  WITH_ASN: "With ASN",
  DIRECT: "Direct Inbound",
  WITH_GATE_PASS: "With Gate Pass",
  WITH_PO: "With PO",
  STO: "STO Inbound",
  RETURN: "Return Inbound",
};

export default function InboundEnquiryPage() {
  const [inbounds, setInbounds] = useState<InboundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Filter states as per document
  const [inboundNo, setInboundNo] = useState("");
  const [stoNo, setStoNo] = useState("");
  const [asnNo, setAsnNo] = useState("");
  const [poNo, setPoNo] = useState("");
  const [grnNo, setGrnNo] = useState("");
  const [grnDateFrom, setGrnDateFrom] = useState("");
  const [grnDateTo, setGrnDateTo] = useState("");
  const [inboundType, setInboundType] = useState("all");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [vendor, setVendor] = useState("all");
  const [status, setStatus] = useState("all");
  const [inboundLocation, setInboundLocation] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchInbounds();
  }, []);

  const fetchInbounds = async () => {
    try {
      const response = await fetch("/api/oms/inbound/enquiry");
      const result = await response.json();
      if (result.success && result.data?.inbounds) {
        setInbounds(result.data.inbounds);
      } else {
        setInbounds(demoInbounds);
      }
    } catch (error) {
      console.error("Error fetching inbounds:", error);
      setInbounds(demoInbounds);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInboundNo("");
    setStoNo("");
    setAsnNo("");
    setPoNo("");
    setGrnNo("");
    setGrnDateFrom("");
    setGrnDateTo("");
    setInboundType("all");
    setInvoiceNo("");
    setVendor("all");
    setStatus("all");
    setInboundLocation("all");
  };

  const handleExport = () => {
    const csvContent = filteredInbounds.map(item =>
      `${item.inboundNo},${item.stoNo},${item.asnNo},${item.poNo},${item.grnNo},${item.grnDate},${item.inboundType},${item.invoiceNo},${item.vendor},${item.status},${item.inboundLocation},${item.totalQty},${item.receivedQty}`
    ).join("\n");
    const header = "Inbound No,STO No,ASN No,PO No,GRN No,GRN Date,Inbound Type,Invoice No,Vendor,Status,Location,Total Qty,Received Qty\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inbound_enquiry.csv";
    a.click();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredInbounds.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredInbounds = inbounds.filter((item) => {
    const matchesInboundNo = !inboundNo || item.inboundNo.toLowerCase().includes(inboundNo.toLowerCase());
    const matchesStoNo = !stoNo || item.stoNo.toLowerCase().includes(stoNo.toLowerCase());
    const matchesAsnNo = !asnNo || item.asnNo.toLowerCase().includes(asnNo.toLowerCase());
    const matchesPoNo = !poNo || item.poNo.toLowerCase().includes(poNo.toLowerCase());
    const matchesGrnNo = !grnNo || item.grnNo.toLowerCase().includes(grnNo.toLowerCase());
    const matchesInboundType = inboundType === "all" || item.inboundType === inboundType;
    const matchesInvoiceNo = !invoiceNo || item.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase());
    const matchesVendor = vendor === "all" || item.vendor === vendor;
    const matchesStatus = status === "all" || item.status === status;
    const matchesLocation = inboundLocation === "all" || item.inboundLocation === inboundLocation;
    return matchesInboundNo && matchesStoNo && matchesAsnNo && matchesPoNo && matchesGrnNo && matchesInboundType && matchesInvoiceNo && matchesVendor && matchesStatus && matchesLocation;
  });

  const paginatedInbounds = filteredInbounds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInbounds.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      WITH_ASN: "bg-purple-100 text-purple-700",
      DIRECT: "bg-orange-100 text-orange-700",
      WITH_GATE_PASS: "bg-cyan-100 text-cyan-700",
      WITH_PO: "bg-indigo-100 text-indigo-700",
      STO: "bg-teal-100 text-teal-700",
      RETURN: "bg-pink-100 text-pink-700",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[type] || "bg-gray-100 text-gray-700"}`}>
        {inboundTypeLabels[type] || type}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inbound Enquiry</h1>
          <p className="text-sm text-gray-500">Search and view all inbound records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={fetchInbounds}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters - As per document */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inbound No</label>
            <input
              type="text"
              value={inboundNo}
              onChange={(e) => setInboundNo(e.target.value)}
              placeholder="Enter inbound no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">STO No</label>
            <input
              type="text"
              value={stoNo}
              onChange={(e) => setStoNo(e.target.value)}
              placeholder="Enter STO no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ASN No</label>
            <input
              type="text"
              value={asnNo}
              onChange={(e) => setAsnNo(e.target.value)}
              placeholder="Enter ASN no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">PO No</label>
            <input
              type="text"
              value={poNo}
              onChange={(e) => setPoNo(e.target.value)}
              placeholder="Enter PO no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">GRN No</label>
            <input
              type="text"
              value={grnNo}
              onChange={(e) => setGrnNo(e.target.value)}
              placeholder="Enter GRN no..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">GRN Date From</label>
            <input
              type="date"
              value={grnDateFrom}
              onChange={(e) => setGrnDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">GRN Date To</label>
            <input
              type="date"
              value={grnDateTo}
              onChange={(e) => setGrnDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inbound Type</label>
            <select
              value={inboundType}
              onChange={(e) => setInboundType(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="WITH_ASN">With ASN</option>
              <option value="DIRECT">Direct Inbound</option>
              <option value="WITH_GATE_PASS">With Gate Pass</option>
              <option value="WITH_PO">With PO</option>
              <option value="STO">STO Inbound</option>
              <option value="RETURN">Return Inbound</option>
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
            <label className="block text-xs text-gray-500 mb-1">Vendor</label>
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Vendors</option>
              <option value="ABC Suppliers">ABC Suppliers</option>
              <option value="XYZ Trading">XYZ Trading</option>
              <option value="Quick Supplies">Quick Supplies</option>
              <option value="Metro Distributors">Metro Distributors</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inbound Location</label>
            <select
              value={inboundLocation}
              onChange={(e) => setInboundLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Locations</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
              <option value="Headoffice">Headoffice</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => fetchInbounds()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Search className="w-4 h-4 inline mr-1" />
            Search
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Inbound Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading inbound records...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredInbounds.length && filteredInbounds.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Inbound No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">PO/STO/ASN</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">GRN No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Vendor</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedInbounds.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-blue-600">{item.inboundNo}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{item.createdAt}</div>
                      </td>
                      <td className="px-4 py-3">{getTypeBadge(item.inboundType)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          {item.poNo && <div><span className="text-gray-400">PO:</span> {item.poNo}</div>}
                          {item.stoNo && <div><span className="text-gray-400">STO:</span> {item.stoNo}</div>}
                          {item.asnNo && <div><span className="text-gray-400">ASN:</span> {item.asnNo}</div>}
                          {!item.poNo && !item.stoNo && !item.asnNo && <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.grnNo ? (
                          <div>
                            <span className="font-medium">{item.grnNo}</span>
                            <div className="text-xs text-gray-400">{item.grnDate}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.invoiceNo || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.vendor}</td>
                      <td className="px-4 py-3 text-gray-600">{item.inboundLocation}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm font-medium">{item.receivedQty}/{item.totalQty}</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              item.receivedQty === item.totalQty ? "bg-green-500" :
                              item.receivedQty > 0 ? "bg-blue-500" : "bg-gray-300"
                            }`}
                            style={{ width: `${(item.receivedQty / item.totalQty) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-green-600" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-purple-600" title="Print GRN">
                            <FileText className="w-4 h-4" />
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

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredInbounds.length)} of {filteredInbounds.length} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page ? "bg-blue-600 text-white" : "border hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
