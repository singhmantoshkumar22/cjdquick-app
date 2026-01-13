"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  RefreshCw,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  FileText,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Eye,
} from "lucide-react";

interface InboundRealTimeItem {
  id: string;
  inboundNo: string;
  inboundType: "WITH_ASN" | "DIRECT" | "WITH_GATE_PASS" | "WITH_PO";
  referenceNo: string;
  vendor: string;
  location: string;
  expectedQty: number;
  receivedQty: number;
  pendingQty: number;
  status: "WAITING" | "RECEIVING" | "QC_PENDING" | "COMPLETED";
  vehicleNo: string;
  driverName: string;
  arrivalTime: string;
  dock: string;
  currentActivity: string;
}

const demoRealTimeData: InboundRealTimeItem[] = [
  { id: "1", inboundNo: "INB-2024-001234", inboundType: "WITH_ASN", referenceNo: "ASN-001234", vendor: "ABC Suppliers", location: "Warehouse A", expectedQty: 500, receivedQty: 250, pendingQty: 250, status: "RECEIVING", vehicleNo: "MH-12-AB-1234", driverName: "Rajesh Kumar", arrivalTime: "10:30 AM", dock: "Dock 1", currentActivity: "Unloading in progress" },
  { id: "2", inboundNo: "INB-2024-001235", inboundType: "WITH_PO", referenceNo: "PO-2024-0056", vendor: "XYZ Trading", location: "Warehouse A", expectedQty: 200, receivedQty: 200, pendingQty: 0, status: "QC_PENDING", vehicleNo: "MH-12-CD-5678", driverName: "Suresh Singh", arrivalTime: "09:15 AM", dock: "Dock 2", currentActivity: "Awaiting QC inspection" },
  { id: "3", inboundNo: "INB-2024-001236", inboundType: "DIRECT", referenceNo: "DR-001236", vendor: "Quick Supplies", location: "Warehouse B", expectedQty: 100, receivedQty: 0, pendingQty: 100, status: "WAITING", vehicleNo: "MH-04-EF-9012", driverName: "Amit Patel", arrivalTime: "11:00 AM", dock: "-", currentActivity: "Vehicle waiting at gate" },
  { id: "4", inboundNo: "INB-2024-001237", inboundType: "WITH_GATE_PASS", referenceNo: "GP-2024-0089", vendor: "Metro Distributors", location: "Warehouse A", expectedQty: 350, receivedQty: 350, pendingQty: 0, status: "COMPLETED", vehicleNo: "MH-12-GH-3456", driverName: "Vikram Yadav", arrivalTime: "08:00 AM", dock: "Dock 3", currentActivity: "Completed - Ready for putaway" },
];

const inboundTypeLabels: Record<string, string> = {
  WITH_ASN: "With ASN",
  DIRECT: "Direct",
  WITH_GATE_PASS: "Gate Pass",
  WITH_PO: "With PO",
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  WAITING: { label: "Waiting", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  RECEIVING: { label: "Receiving", color: "bg-blue-100 text-blue-700", icon: Package },
  QC_PENDING: { label: "QC Pending", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
};

export default function InboundRealTimePage() {
  const [activeType, setActiveType] = useState<"all" | "WITH_ASN" | "DIRECT" | "WITH_GATE_PASS" | "WITH_PO">("all");
  const [inbounds, setInbounds] = useState<InboundRealTimeItem[]>(demoRealTimeData);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchRealTimeData();
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchRealTimeData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/oms/inbound/realtime");
      const result = await response.json();
      if (result.success && result.data?.inbounds) {
        setInbounds(result.data.inbounds);
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching real-time data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInbounds = inbounds.filter((item) => {
    const matchesType = activeType === "all" || item.inboundType === activeType;
    const matchesSearch = !searchTerm ||
      item.inboundNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesLocation = locationFilter === "all" || item.location === locationFilter;
    return matchesType && matchesSearch && matchesStatus && matchesLocation;
  });

  const getTypeCount = (type: string) => {
    if (type === "all") return inbounds.length;
    return inbounds.filter(i => i.inboundType === type).length;
  };

  const getStatusSummary = () => {
    return {
      waiting: inbounds.filter(i => i.status === "WAITING").length,
      receiving: inbounds.filter(i => i.status === "RECEIVING").length,
      qcPending: inbounds.filter(i => i.status === "QC_PENDING").length,
      completed: inbounds.filter(i => i.status === "COMPLETED").length,
    };
  };

  const summary = getStatusSummary();

  const inboundTypes = [
    { id: "all", label: "All Inbounds" },
    { id: "WITH_ASN", label: "With ASN" },
    { id: "DIRECT", label: "Direct Inbound" },
    { id: "WITH_GATE_PASS", label: "With Gate Pass" },
    { id: "WITH_PO", label: "With PO" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inbound Real Time</h1>
          <p className="text-sm text-gray-500">
            Monitor live inbound activities - Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg ${
              autoRefresh ? "bg-green-50 border-green-300 text-green-700" : "hover:bg-gray-50"
            }`}
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
          <button
            onClick={fetchRealTimeData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Waiting</span>
          </div>
          <div className="text-2xl font-bold text-yellow-800 mt-2">{summary.waiting}</div>
          <div className="text-xs text-yellow-600 mt-1">Vehicles at gate</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Receiving</span>
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-2">{summary.receiving}</div>
          <div className="text-xs text-blue-600 mt-1">Unloading in progress</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">QC Pending</span>
          </div>
          <div className="text-2xl font-bold text-orange-800 mt-2">{summary.qcPending}</div>
          <div className="text-xs text-orange-600 mt-1">Awaiting inspection</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Completed</span>
          </div>
          <div className="text-2xl font-bold text-green-800 mt-2">{summary.completed}</div>
          <div className="text-xs text-green-600 mt-1">Ready for putaway</div>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex overflow-x-auto">
            {inboundTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id as typeof activeType)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeType === type.id
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {type.label}
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeType === type.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {getTypeCount(type.id)}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search inbound, reference, vendor..."
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="WAITING">Waiting</option>
              <option value="RECEIVING">Receiving</option>
              <option value="QC_PENDING">QC Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Locations</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
            </select>
          </div>
        </div>

        {/* Real-Time Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Inbound Details</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reference</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vendor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vehicle Info</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Progress</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Activity</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInbounds.map((item) => {
                const StatusIcon = statusConfig[item.status].icon;
                const progress = Math.round((item.receivedQty / item.expectedQty) * 100);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="font-medium text-blue-600">{item.inboundNo}</span>
                          <div className="text-xs text-gray-400">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                              {inboundTypeLabels[item.inboundType]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.referenceNo}</div>
                      <div className="text-xs text-gray-400">{item.location}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.vendor}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{item.vehicleNo}</div>
                          <div className="text-xs text-gray-400">{item.driverName} | {item.arrivalTime}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{item.receivedQty}/{item.expectedQty}</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progress === 100 ? "bg-green-500" :
                              progress > 0 ? "bg-blue-500" : "bg-gray-300"
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${statusConfig[item.status].color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[item.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.dock !== "-" && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                            {item.dock}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{item.currentActivity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600" title="Start Receiving">
                          <ScanLine className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-purple-600" title="Print GRN">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInbounds.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No inbound activities found for the selected filters
          </div>
        )}
      </div>
    </div>
  );
}
