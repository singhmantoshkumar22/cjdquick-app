"use client";

import { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  PieChart,
  FileSpreadsheet,
  RotateCcw,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface ReportSummary {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  fulfillmentRate: number;
  returnRate: number;
  topChannel: string;
}

interface RecentReport {
  id: string;
  name: string;
  type: string;
  generatedBy: string;
  date: string;
  fileUrl?: string;
}

const demoSummary: ReportSummary = {
  totalOrders: 1245,
  totalRevenue: 4567000,
  avgOrderValue: 3667,
  fulfillmentRate: 94.5,
  returnRate: 4.2,
  topChannel: "Amazon",
};

const demoRecentReports: RecentReport[] = [
  { id: "1", name: "Daily Sales Summary - Jan 7", type: "Sales", generatedBy: "Auto-generated", date: "2024-01-08 06:00" },
  { id: "2", name: "Weekly Inventory Report", type: "Inventory", generatedBy: "Rahul S.", date: "2024-01-07 18:30" },
  { id: "3", name: "Monthly Fulfillment Analysis", type: "Fulfillment", generatedBy: "System", date: "2024-01-01 00:00" },
];

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary>(demoSummary);
  const [recentReports, setRecentReports] = useState<RecentReport[]>(demoRecentReports);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState("last7days");

  useEffect(() => {
    fetchSummary();
    fetchRecentReports();
  }, [dateRange]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/oms/reports?dateRange=${dateRange}`);
      const result = await response.json();
      if (result.success && result.data) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error("Error fetching report summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const response = await fetch("/api/oms/reports/recent");
      const result = await response.json();
      if (result.success && result.data) {
        setRecentReports(result.data);
      }
    } catch (error) {
      console.error("Error fetching recent reports:", error);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/oms/reports/export?dateRange=${dateRange}`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success && result.data?.url) {
        window.open(result.data.url, "_blank");
      } else {
        // Demo fallback - generate CSV
        const csvContent = `Report Summary - ${dateRange}\n\nMetric,Value\nTotal Orders,${summary.totalOrders}\nTotal Revenue,${summary.totalRevenue}\nAvg Order Value,${summary.avgOrderValue}\nFulfillment Rate,${summary.fulfillmentRate}%\nReturn Rate,${summary.returnRate}%\nTop Channel,${summary.topChannel}`;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reports_summary_${dateRange}.csv`;
        a.click();
        alert("Report exported successfully (demo mode)");
      }
    } catch (error) {
      // Demo fallback
      const csvContent = `Report Summary - ${dateRange}\n\nMetric,Value\nTotal Orders,${summary.totalOrders}\nTotal Revenue,${summary.totalRevenue}\nAvg Order Value,${summary.avgOrderValue}\nFulfillment Rate,${summary.fulfillmentRate}%\nReturn Rate,${summary.returnRate}%\nTop Channel,${summary.topChannel}`;
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reports_summary_${dateRange}.csv`;
      a.click();
      alert("Report exported successfully (demo mode)");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadReport = async (report: RecentReport) => {
    try {
      const response = await fetch(`/api/oms/reports/${report.id}/download`);
      const result = await response.json();
      if (result.success && result.data?.url) {
        window.open(result.data.url, "_blank");
      } else {
        // Demo fallback
        alert(`Downloading: ${report.name} (demo mode)`);
      }
    } catch (error) {
      alert(`Downloading: ${report.name} (demo mode)`);
    }
  };

  const quickReports = [
    {
      title: "Sales Reports",
      description: "Revenue, orders, and channel performance",
      icon: TrendingUp,
      href: "/customer/oms/reports/sales",
      color: "bg-blue-500",
    },
    {
      title: "Inventory Reports",
      description: "Stock levels, movements, and aging",
      icon: BarChart2,
      href: "/customer/oms/reports/inventory",
      color: "bg-green-500",
    },
    {
      title: "Fulfillment Reports",
      description: "SLA compliance, pick accuracy, throughput",
      icon: PieChart,
      href: "/customer/oms/reports/fulfillment",
      color: "bg-purple-500",
    },
    {
      title: "Returns Reports",
      description: "Return rates, reasons, and processing time",
      icon: RotateCcw,
      href: "/customer/oms/reports/returns",
      color: "bg-orange-500",
    },
    {
      title: "Custom Reports",
      description: "Build your own reports with custom filters",
      icon: FileSpreadsheet,
      href: "/customer/oms/reports/custom",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and insights for your business</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
          <button
            onClick={handleExportAll}
            disabled={exporting}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${exporting ? "animate-pulse" : ""}`} />
            {exporting ? "Exporting..." : "Export All"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalOrders.toLocaleString()}</p>
            <div className="flex items-center text-green-600 text-sm mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>12.5%</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{(summary.totalRevenue / 100000).toFixed(1)}L</p>
            <div className="flex items-center text-green-600 text-sm mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>8.3%</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Avg Order Value</p>
            <p className="text-2xl font-bold text-gray-900">₹{summary.avgOrderValue.toLocaleString()}</p>
            <div className="flex items-center text-red-600 text-sm mt-1">
              <ArrowDownRight className="w-4 h-4" />
              <span>2.1%</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Fulfillment Rate</p>
            <p className="text-2xl font-bold text-gray-900">{summary.fulfillmentRate}%</p>
            <div className="flex items-center text-green-600 text-sm mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>1.2%</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Return Rate</p>
            <p className="text-2xl font-bold text-gray-900">{summary.returnRate}%</p>
            <div className="flex items-center text-green-600 text-sm mt-1">
              <ArrowDownRight className="w-4 h-4" />
              <span>0.5%</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Top Channel</p>
            <p className="text-2xl font-bold text-gray-900">{summary.topChannel}</p>
            <p className="text-sm text-gray-500 mt-1">45% of orders</p>
          </div>
        </div>
      )}

      {/* Quick Access Reports */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {quickReports.map((report) => (
          <a
            key={report.title}
            href={report.href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className={`${report.color} p-3 rounded-lg text-white`}>
                <report.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {report.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Recent Reports */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recently Generated Reports</h2>
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentReports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No recent reports found
                </td>
              </tr>
            ) : (
              recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{report.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{report.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{report.generatedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{report.date}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDownloadReport(report)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
