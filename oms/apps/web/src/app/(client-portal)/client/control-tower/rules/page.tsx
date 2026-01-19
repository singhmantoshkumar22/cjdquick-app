"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  RefreshCw,
  ArrowLeft,
  Package,
  Truck,
  AlertTriangle,
  RotateCcw,
  Database,
  Clock,
  CheckCircle,
  Settings2,
  History,
  Info,
} from "lucide-react";

interface DetectionRule {
  id: string;
  name: string;
  description: string | null;
  ruleCode: string;
  ruleType: string;
  entityType: string;
  conditions: {
    field: string;
    operator: string;
    value: string | number | string[];
    logicalOperator?: string;
  }[];
  severityRules: Record<string, number>;
  severityField: string;
  severityUnit: string;
  defaultSeverity: string;
  defaultPriority: number;
  aiActionEnabled: boolean;
  aiActionType: string | null;
  autoResolveEnabled: boolean;
  isActive: boolean;
  isGlobal: boolean;
  lastExecutedAt: string | null;
  executionCount: number;
  exceptionsCreated: number;
  createdAt: string;
  updatedAt: string;
}

interface SchedulerInfo {
  lastScan: string | null;
  status: string;
  lastResult: {
    rulesExecuted: number;
    exceptionsCreated: number;
    exceptionsUpdated: number;
    autoResolved: number;
  };
}

// Entity type icons
const entityIcons: Record<string, React.ElementType> = {
  Order: Package,
  Delivery: Truck,
  NDR: AlertTriangle,
  Return: RotateCcw,
  Inventory: Database,
};

export default function ClientRulesViewerPage() {
  const router = useRouter();

  // State
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rules" | "history">("rules");

  // Filter state
  const [filterEntity, setFilterEntity] = useState<string>("all");

  // Scheduler status
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerInfo | null>(null);

  // Fetch rules
  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterEntity !== "all") params.set("entityType", filterEntity);
      // Only show active rules for clients
      params.set("isActive", "true");

      const response = await fetch(`/api/v1/detection-rules?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterEntity]);

  // Fetch scheduler status
  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/control-tower/dashboard");
      if (response.ok) {
        const data = await response.json();
        setSchedulerStatus(data.scheduler);
      }
    } catch (error) {
      console.error("Failed to fetch scheduler status:", error);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchSchedulerStatus();
  }, [fetchRules, fetchSchedulerStatus]);

  const entityTypes = ["Order", "Delivery", "NDR", "Return", "Inventory"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/client/control-tower")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detection Rules</h1>
            <p className="text-gray-500">
              View active detection rules monitoring your orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchRules(); fetchSchedulerStatus(); }}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Scheduler Status */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-indigo-700">Detection Engine Active</span>
            </div>
            <span className="text-indigo-600 text-sm">Auto-runs every 15 minutes</span>
          </div>
          {schedulerStatus?.lastScan && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-indigo-500">
                Last scan: {new Date(schedulerStatus.lastScan).toLocaleTimeString()}
              </span>
              <span className="px-2 py-1 bg-white rounded text-xs text-indigo-700">
                {schedulerStatus.lastResult?.rulesExecuted || 0} rules executed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">About Detection Rules</p>
            <p className="text-sm text-blue-700 mt-1">
              These rules automatically monitor your orders for issues like stuck orders, SLA breaches,
              carrier delays, and NDR escalations. When a rule condition is met, an exception is created
              and may trigger automated AI actions to help resolve the issue.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("rules")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "rules"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Active Rules
            </div>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Execution History
            </div>
          </button>
        </div>
      </div>

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Filter by Entity:</span>
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Entities</option>
                {entityTypes.map(et => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rules Table */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Configured Rules</h2>
              <p className="text-sm text-gray-500">
                {rules.length} active rule{rules.length !== 1 ? "s" : ""} monitoring your orders
              </p>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Settings2 className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium">No rules configured</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    No detection rules are currently active for your account
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 font-medium">Rule</th>
                        <th className="pb-3 font-medium">Entity</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Conditions</th>
                        <th className="pb-3 font-medium">AI Action</th>
                        <th className="pb-3 font-medium">Executions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => {
                        const EntityIcon = entityIcons[rule.entityType] || Package;
                        return (
                          <tr key={rule.id} className="border-b last:border-0">
                            <td className="py-3">
                              <div>
                                <p className="font-medium">{rule.name}</p>
                                <p className="text-xs text-gray-500">{rule.ruleCode}</p>
                                {rule.description && (
                                  <p className="text-xs text-gray-400 mt-1">{rule.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100">
                                <EntityIcon className="h-3 w-3" />
                                {rule.entityType}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {rule.ruleType.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-sm text-gray-600">
                                {rule.conditions.length} condition{rule.conditions.length !== 1 ? "s" : ""}
                              </span>
                            </td>
                            <td className="py-3">
                              {rule.aiActionEnabled ? (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                  {rule.aiActionType?.replace(/_/g, " ") || "Enabled"}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">None</span>
                              )}
                            </td>
                            <td className="py-3">
                              <div className="text-sm">
                                <span className="font-medium">{rule.executionCount}</span>
                                <span className="text-gray-500"> runs</span>
                                {rule.exceptionsCreated > 0 && (
                                  <span className="text-orange-600 ml-2">
                                    ({rule.exceptionsCreated} exceptions)
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Execution History</h2>
            <p className="text-sm text-gray-500">
              Track how each rule has performed over time
            </p>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Rule</th>
                    <th className="pb-3 font-medium">Last Executed</th>
                    <th className="pb-3 font-medium">Total Runs</th>
                    <th className="pb-3 font-medium">Exceptions Created</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-xs text-gray-500">{rule.ruleCode}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        {rule.lastExecutedAt ? (
                          <div className="text-sm">
                            <p>{format(new Date(rule.lastExecutedAt), "dd MMM yyyy")}</p>
                            <p className="text-gray-500">{format(new Date(rule.lastExecutedAt), "HH:mm:ss")}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="font-medium">{rule.executionCount}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rule.exceptionsCreated > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {rule.exceptionsCreated}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rule.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {rule.isActive ? "Active" : "Paused"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
