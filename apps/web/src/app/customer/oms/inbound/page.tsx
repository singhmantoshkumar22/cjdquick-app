"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  ClipboardCheck,
  ArrowDownToLine,
  Ship,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  ChevronRight,
} from "lucide-react";

interface InboundSummary {
  totalPending: number;
  todayReceived: number;
  qcPending: number;
  stoPending: number;
  returnsPending: number;
  totalInTransit: number;
}

const demoSummary: InboundSummary = {
  totalPending: 24,
  todayReceived: 12,
  qcPending: 8,
  stoPending: 5,
  returnsPending: 15,
  totalInTransit: 7,
};

const quickActions = [
  { id: "enquiry", label: "Inbound Enquiry", icon: Search, href: "/customer/oms/inbound/enquiry", color: "bg-blue-500" },
  { id: "create", label: "Create Inbound", icon: Plus, href: "/customer/oms/inbound/create", color: "bg-green-500" },
  { id: "realtime", label: "Real Time", icon: RefreshCw, href: "/customer/oms/inbound/realtime", color: "bg-purple-500" },
  { id: "qc", label: "Inbound QC", icon: ClipboardCheck, href: "/customer/oms/inbound/qc", color: "bg-orange-500" },
  { id: "direct", label: "Direct Inbound", icon: ArrowDownToLine, href: "/customer/oms/inbound/direct", color: "bg-cyan-500" },
  { id: "sto", label: "STO Inbound", icon: Ship, href: "/customer/oms/inbound/sto", color: "bg-teal-500" },
  { id: "return", label: "Return Inbound", icon: RotateCcw, href: "/customer/oms/inbound/return", color: "bg-pink-500" },
];

const recentInbounds = [
  { id: "1", inboundNo: "INB-2024-001245", type: "WITH_ASN", vendor: "ABC Suppliers", status: "RECEIVING", qty: 250, time: "10 mins ago" },
  { id: "2", inboundNo: "INB-2024-001244", type: "STO", vendor: "Internal Transfer", status: "QC_PENDING", qty: 500, time: "25 mins ago" },
  { id: "3", inboundNo: "INB-2024-001243", type: "RETURN", vendor: "Customer Return", status: "PENDING", qty: 15, time: "1 hour ago" },
  { id: "4", inboundNo: "INB-2024-001242", type: "DIRECT", vendor: "XYZ Trading", status: "COMPLETED", qty: 100, time: "2 hours ago" },
  { id: "5", inboundNo: "INB-2024-001241", type: "WITH_PO", vendor: "Metro Distributors", status: "COMPLETED", qty: 350, time: "3 hours ago" },
];

interface RecentInbound {
  id: string;
  inboundNo: string;
  type: string;
  vendor: string;
  status: string;
  qty: number;
  time: string;
}

export default function InboundDashboardPage() {
  const [summary, setSummary] = useState<InboundSummary>(demoSummary);
  const [inbounds, setInbounds] = useState<RecentInbound[]>(recentInbounds);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
    fetchRecentInbounds();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/oms/inbound/summary");
      const result = await response.json();
      if (result.success && result.data) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error("Error fetching inbound summary:", error);
    }
  };

  const fetchRecentInbounds = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/oms/inbound?limit=5");
      const result = await response.json();
      if (result.success && result.data?.inbounds) {
        setInbounds(result.data.inbounds);
      }
    } catch (error) {
      console.error("Error fetching recent inbounds:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Completed</span>;
      case "RECEIVING":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700"><Package className="w-3 h-3" />Receiving</span>;
      case "QC_PENDING":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700"><AlertTriangle className="w-3 h-3" />QC Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Pending</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      WITH_ASN: "bg-purple-100 text-purple-700",
      DIRECT: "bg-cyan-100 text-cyan-700",
      WITH_PO: "bg-indigo-100 text-indigo-700",
      STO: "bg-teal-100 text-teal-700",
      RETURN: "bg-pink-100 text-pink-700",
    };
    const labels: Record<string, string> = {
      WITH_ASN: "ASN",
      DIRECT: "Direct",
      WITH_PO: "PO",
      STO: "STO",
      RETURN: "Return",
    };
    return <span className={`px-2 py-0.5 text-xs rounded ${colors[type] || "bg-gray-100 text-gray-700"}`}>{labels[type] || type}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Inbound Management</h1>
        <p className="text-sm text-gray-500">Manage all inbound operations - receiving, QC, and putaway</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-xs text-yellow-600">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-2">{summary.totalPending}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-xs text-green-600">Today Received</span>
          </div>
          <p className="text-2xl font-bold text-green-800 mt-2">{summary.todayReceived}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-orange-600">QC Pending</span>
          </div>
          <p className="text-2xl font-bold text-orange-800 mt-2">{summary.qcPending}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-blue-600">In Transit</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">{summary.totalInTransit}</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-teal-600" />
            <span className="text-xs text-teal-600">STO Pending</span>
          </div>
          <p className="text-2xl font-bold text-teal-800 mt-2">{summary.stoPending}</p>
        </div>
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-pink-600" />
            <span className="text-xs text-pink-600">Returns</span>
          </div>
          <p className="text-2xl font-bold text-pink-800 mt-2">{summary.returnsPending}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.id}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`p-3 rounded-full ${action.color} text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Inbounds */}
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-sm font-semibold text-gray-700">Recent Inbounds</h2>
          <Link
            href="/customer/oms/inbound/enquiry"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-600">Inbound No</th>
                <th className="px-6 py-3 text-center font-medium text-gray-600">Type</th>
                <th className="px-6 py-3 text-left font-medium text-gray-600">Vendor</th>
                <th className="px-6 py-3 text-center font-medium text-gray-600">Qty</th>
                <th className="px-6 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-6 py-3 text-right font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : inbounds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No recent inbounds found
                  </td>
                </tr>
              ) : (
                inbounds.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Link href={`/customer/oms/inbound/enquiry?id=${item.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {item.inboundNo}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-center">{getTypeBadge(item.type)}</td>
                    <td className="px-6 py-3 text-gray-600">{item.vendor}</td>
                    <td className="px-6 py-3 text-center font-medium">{item.qty}</td>
                    <td className="px-6 py-3 text-center">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-3 text-right text-gray-400">{item.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
