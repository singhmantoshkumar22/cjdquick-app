"use client";

import { useState } from "react";
import {
  BarChart3,
  PieChart,
  LineChart,
  Database,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Link as LinkIcon,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Settings,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Card, Button, Badge } from "@cjdquick/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function BIIntegrationPage() {
  const [activeTab, setActiveTab] = useState<"connections" | "datasets" | "reports">("connections");
  const queryClient = useQueryClient();

  // Fetch connections
  const { data: connectionsData, isLoading: connectionsLoading } = useQuery({
    queryKey: ["bi-connections"],
    queryFn: async () => {
      const res = await fetch("/api/bi");
      return res.json();
    },
  });

  // Fetch datasets
  const { data: datasetsData } = useQuery({
    queryKey: ["bi-datasets"],
    queryFn: async () => {
      const res = await fetch("/api/bi?type=datasets");
      return res.json();
    },
  });

  // Fetch reports
  const { data: reportsData } = useQuery({
    queryKey: ["bi-reports"],
    queryFn: async () => {
      const res = await fetch("/api/bi?type=reports");
      return res.json();
    },
  });

  const connections = connectionsData?.data?.items || [];
  const summary = connectionsData?.data?.summary || {};
  const datasets = datasetsData?.data?.items || [];
  const reports = reportsData?.data?.items || [];

  const getToolIcon = (toolType: string) => {
    switch (toolType) {
      case "POWER_BI":
        return <BarChart3 className="h-5 w-5 text-yellow-600" />;
      case "TABLEAU":
        return <PieChart className="h-5 w-5 text-blue-600" />;
      case "METABASE":
        return <LineChart className="h-5 w-5 text-purple-600" />;
      case "LOOKER":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-600" />;
    }
  };

  const getToolBgColor = (toolType: string) => {
    switch (toolType) {
      case "POWER_BI":
        return "bg-yellow-100";
      case "TABLEAU":
        return "bg-blue-100";
      case "METABASE":
        return "bg-purple-100";
      case "LOOKER":
        return "bg-green-100";
      default:
        return "bg-gray-100";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="default">Inactive</Badge>;
      case "ERROR":
        return <Badge variant="danger">Error</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BI Tool Integration</h1>
          <p className="text-gray-500">
            Connect Power BI, Tableau, Metabase, and other BI tools
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Connections</p>
              <p className="text-2xl font-bold">{summary.total || 0}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <LinkIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.active || 0}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Power BI</p>
              <p className="text-2xl font-bold text-yellow-600">
                {summary.byTool?.powerBI || 0}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tableau</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.byTool?.tableau || 0}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Metabase</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary.byTool?.metabase || 0}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <LineChart className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("connections")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "connections"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Connections ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab("datasets")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "datasets"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Datasets ({datasets.length})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "reports"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Reports ({reports.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "connections" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.length > 0 ? (
            connections.map((connection: any) => (
              <Card key={connection.id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getToolBgColor(connection.toolType)}`}>
                      {getToolIcon(connection.toolType)}
                    </div>
                    <div>
                      <h3 className="font-medium">{connection.name}</h3>
                      <p className="text-sm text-gray-500">{connection.toolType}</p>
                    </div>
                  </div>
                  {getStatusBadge(connection.status)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Workspace:</span>
                    <span className="font-medium">
                      {connection.workspaceId || "Default"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Datasets:</span>
                    <span className="font-medium">
                      {connection._count?.datasets || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Reports:</span>
                    <span className="font-medium">
                      {connection._count?.reports || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Refresh:</span>
                    <span className="font-medium">
                      {connection.refreshSchedule || "Manual"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    {connection.lastSyncAt ? (
                      <>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(connection.lastSyncAt).toLocaleString()}
                      </>
                    ) : (
                      "Never synced"
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Zap className="h-4 w-4 mr-1" />
                      Sync
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-full p-12 text-center">
              <LinkIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No BI connections</h3>
              <p className="text-gray-500 mt-1">
                Connect your first BI tool to start syncing data
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </Card>
          )}
        </div>
      )}

      {activeTab === "datasets" && (
        <div className="space-y-4">
          {datasets.length > 0 ? (
            datasets.map((dataset: any) => (
              <Card key={dataset.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{dataset.name}</span>
                        {getStatusBadge(dataset.status)}
                        <Badge variant="default">{dataset.dataType}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {dataset.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          <FileSpreadsheet className="h-4 w-4 inline mr-1" />
                          {dataset.lastRowCount?.toLocaleString() || 0} rows
                        </span>
                        <span>
                          <Clock className="h-4 w-4 inline mr-1" />
                          Refresh: {dataset.refreshInterval || "Manual"}
                        </span>
                        <span>
                          Tool: {dataset.connection?.toolType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Last refreshed</div>
                    <div className="font-medium">
                      {dataset.lastRefreshed
                        ? new Date(dataset.lastRefreshed).toLocaleString()
                        : "Never"}
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <Database className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No datasets</h3>
              <p className="text-gray-500 mt-1">
                Create datasets to sync data with your BI tools
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.length > 0 ? (
            reports.map((report: any) => (
              <Card key={report.id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{report.name}</h3>
                      <p className="text-sm text-gray-500">{report.reportType}</p>
                    </div>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {report.description || "No description"}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Dataset:</span>
                    <span className="font-medium">
                      {report.dataset?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Schedule:</span>
                    <span className="font-medium">
                      {report.schedule || "On-demand"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    {report.lastRefreshed ? (
                      <>
                        Last: {new Date(report.lastRefreshed).toLocaleDateString()}
                      </>
                    ) : (
                      "Never refreshed"
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-full p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No reports</h3>
              <p className="text-gray-500 mt-1">
                Create reports from your datasets to visualize data
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
