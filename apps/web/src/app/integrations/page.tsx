"use client";

import { useState } from "react";
import {
  Database,
  RefreshCw,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Zap,
  History,
  Link2,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { Card, Button, Badge } from "@cjdquick/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ERP type icons and colors
const ERP_TYPES: Record<string, { name: string; color: string; icon: string }> = {
  SAP: { name: "SAP Business One", color: "bg-blue-500", icon: "S" },
  TALLY: { name: "Tally Prime", color: "bg-purple-500", icon: "T" },
  ZOHO_BOOKS: { name: "Zoho Books", color: "bg-green-500", icon: "Z" },
  ZOHO_INVENTORY: { name: "Zoho Inventory", color: "bg-emerald-500", icon: "Z" },
  QUICKBOOKS: { name: "QuickBooks", color: "bg-cyan-500", icon: "Q" },
  CUSTOM: { name: "Custom Integration", color: "bg-gray-500", icon: "C" },
};

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  // Fetch integrations
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ["erp-integrations"],
    queryFn: async () => {
      const res = await fetch("/api/erp/integrations");
      return res.json();
    },
  });

  // Fetch sync jobs
  const { data: syncJobsData } = useQuery({
    queryKey: ["erp-sync-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/erp/sync?limit=20");
      return res.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch("/api/erp/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: integrationId, action: "TEST_CONNECTION" }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-integrations"] });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch("/api/erp/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: integrationId, action: "TOGGLE_ACTIVE" }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-integrations"] });
    },
  });

  // Trigger sync mutation
  const triggerSyncMutation = useMutation({
    mutationFn: async (params: { integrationId: string; entityType: string }) => {
      const res = await fetch("/api/erp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: params.integrationId,
          entityType: params.entityType,
          direction: "OUTBOUND",
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-sync-jobs"] });
    },
  });

  const integrations = integrationsData?.data || [];
  const syncJobs = syncJobsData?.data?.items || [];

  const getConnectionStatusBadge = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" /> Connected
          </Badge>
        );
      case "DISCONNECTED":
        return (
          <Badge variant="default" className="gap-1">
            <XCircle className="h-3 w-3" /> Disconnected
          </Badge>
        );
      case "ERROR":
        return (
          <Badge variant="danger" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Error
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "FAILED":
        return <Badge variant="danger">Failed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="primary">In Progress</Badge>;
      case "PARTIAL":
        return <Badge variant="warning">Partial</Badge>;
      default:
        return <Badge variant="default">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ERP Integrations</h1>
          <p className="text-gray-500">
            Connect and sync with SAP, Tally, Zoho, and other ERP systems
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            Sync History
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Integrations</p>
              <p className="text-2xl font-bold">
                {integrations.filter((i: any) => i.isActive).length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Link2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Syncs Today</p>
              <p className="text-2xl font-bold">
                {syncJobsData?.data?.stats?.completed || 0}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold">
                {syncJobsData?.data?.stats?.inProgress || 0}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {syncJobsData?.data?.stats?.failed || 0}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Integrations List */}
      <Card>
        <div className="p-5 border-b">
          <h3 className="font-semibold text-gray-900">Connected Systems</h3>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading integrations...
            </div>
          ) : integrations.length === 0 ? (
            <div className="p-8 text-center">
              <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No integrations configured</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Integration
              </Button>
            </div>
          ) : (
            integrations.map((integration: any) => {
              const erpInfo = ERP_TYPES[integration.erpType] || ERP_TYPES.CUSTOM;

              return (
                <div
                  key={integration.id}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg ${erpInfo.color} flex items-center justify-center text-white font-bold text-lg`}
                      >
                        {erpInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {integration.erpName}
                          </h4>
                          {getConnectionStatusBadge(integration.connectionStatus)}
                          {!integration.isActive && (
                            <Badge variant="default">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {erpInfo.name} • {integration.syncFrequency} sync
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span>
                            Last sync:{" "}
                            {integration.lastSyncAt
                              ? new Date(
                                  integration.lastSyncAt
                                ).toLocaleString()
                              : "Never"}
                          </span>
                          <span>
                            {integration.stats?.jobsLast24h || 0} syncs today
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          testConnectionMutation.mutate(integration.id)
                        }
                        disabled={testConnectionMutation.isPending}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          triggerSyncMutation.mutate({
                            integrationId: integration.id,
                            entityType: "SHIPMENT",
                          })
                        }
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sync Now
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleActiveMutation.mutate(integration.id)
                        }
                      >
                        {integration.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIntegration(integration)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Enabled Entities */}
                  {integration.enabledEntities && (
                    <div className="mt-3 flex gap-2">
                      {(Object.entries(
                        JSON.parse(integration.enabledEntities) as Record<string, boolean>
                      ) as [string, boolean][])
                        .filter(([, enabled]) => enabled)
                        .map(([entity]) => (
                          <span
                            key={entity}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {entity}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Recent Sync Jobs */}
      <Card>
        <div className="p-5 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Sync Jobs</h3>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        <div className="divide-y">
          {syncJobs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No sync jobs yet
            </div>
          ) : (
            syncJobs.map((job: any) => (
              <div
                key={job.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Database className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {job.jobNumber}
                      </span>
                      {getSyncStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {job.entityType} • {job.direction} •{" "}
                      {job.integration?.erpName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {job.successRecords}/{job.totalRecords} records
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(job.createdAt).toLocaleString()}
                  </div>
                  {job.status === "IN_PROGRESS" && (
                    <div className="mt-1 w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${job.progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Available ERP Systems */}
      <Card>
        <div className="p-5 border-b">
          <h3 className="font-semibold text-gray-900">Available Integrations</h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(ERP_TYPES).map(([key, info]) => {
            const hasIntegration = integrations.some(
              (i: any) => i.erpType === key
            );

            return (
              <div
                key={key}
                className={`p-4 border rounded-lg text-center ${
                  hasIntegration
                    ? "bg-gray-50 border-gray-200"
                    : "hover:border-primary-500 cursor-pointer"
                }`}
                onClick={() => !hasIntegration && setShowAddModal(true)}
              >
                <div
                  className={`w-12 h-12 rounded-lg ${info.color} flex items-center justify-center text-white font-bold text-lg mx-auto mb-2`}
                >
                  {info.icon}
                </div>
                <p className="font-medium text-sm text-gray-900">{info.name}</p>
                {hasIntegration && (
                  <Badge variant="success" className="mt-2">
                    Connected
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
