"use client";

import { useState } from "react";
import { Download, FileText, Calendar, BarChart2, TrendingUp, Package, DollarSign, Clock } from "lucide-react";
import { Button } from "@cjdquick/ui";

const reports = [
  { id: "shipment", name: "Shipment Report", description: "All shipments with tracking status", icon: Package },
  { id: "delivery", name: "Delivery Performance", description: "Delivery success rates and TAT analysis", icon: TrendingUp },
  { id: "ndr", name: "NDR Report", description: "Non-delivery reports and resolution status", icon: Clock },
  { id: "cod", name: "COD Report", description: "COD collection and remittance details", icon: DollarSign },
  { id: "billing", name: "Billing Summary", description: "Invoice and payment history", icon: FileText },
  { id: "rto", name: "RTO Report", description: "Return to origin analysis", icon: BarChart2 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("last7days");
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = async (reportId: string) => {
    setGenerating(reportId);
    const token = localStorage.getItem("portal_token");
    const serviceType = localStorage.getItem("portal_service_type") || "B2B";

    try {
      const res = await fetch(`/api/portal/reports/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportType: reportId, dateRange, serviceType }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportId}-report-${Date.now()}.csv`;
        a.click();
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and download detailed reports</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="today">Today</option>
          <option value="last7days">Last 7 Days</option>
          <option value="last30days">Last 30 Days</option>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => handleGenerate(report.id)}
                    disabled={generating === report.id}
                  >
                    <Download className="h-4 w-4" />
                    {generating === report.id ? "Generating..." : "Download"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Scheduled Reports</h2>
          <Button variant="outline" size="sm">Schedule New</Button>
        </div>
        <div className="p-6 text-center text-gray-500">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No scheduled reports</h3>
          <p className="text-sm">Set up automated reports to be delivered to your email</p>
        </div>
      </div>
    </div>
  );
}
