"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Target,
  TrendingUp,
  XCircle,
  Zap,
  ArrowLeft,
} from "lucide-react";

interface AIAction {
  id: string;
  entityType: string;
  entityId: string;
  actionType: string;
  actionDetails: Record<string, unknown>;
  status: string;
  confidence: number | null;
  processingTime: number | null;
  errorMessage: string | null;
  createdAt: string;
  ndr: {
    id: string;
    ndrCode: string;
    status: string;
  } | null;
}

interface AIStats {
  actionTypes: Record<string, number>;
  statuses: Record<string, number>;
  entityTypes: Record<string, number>;
  averageConfidence: number;
  averageProcessingTime: number;
  todayStats: {
    total: number;
    successful: number;
    successRate: number;
  };
}

export default function ClientAIActionsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [actions, setActions] = useState<AIAction[]>([]);
  const [stats, setStats] = useState<AIStats>({
    actionTypes: {},
    statuses: {},
    entityTypes: {},
    averageConfidence: 0,
    averageProcessingTime: 0,
    todayStats: { total: 0, successful: 0, successRate: 0 },
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (entityTypeFilter) params.set("entityType", entityTypeFilter);
      if (actionTypeFilter) params.set("actionType", actionTypeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/v1/ai-actions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
        setTotal(data.total || 0);
        setStats(data.stats || {
          actionTypes: {},
          statuses: {},
          entityTypes: {},
          averageConfidence: 0,
          averageProcessingTime: 0,
          todayStats: { total: 0, successful: 0, successRate: 0 },
        });
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch AI actions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActions, 30000);
    return () => clearInterval(interval);
  }, [page, entityTypeFilter, actionTypeFilter, statusFilter]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "AUTO_CLASSIFY":
        return <Brain className="h-4 w-4 text-purple-500" />;
      case "AUTO_OUTREACH":
        return <Zap className="h-4 w-4 text-amber-500" />;
      case "AUTO_RESOLVE":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "SENTIMENT_ANALYSIS":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "PRIORITY_UPDATE":
        return <Target className="h-4 w-4 text-orange-500" />;
      case "ESCALATION":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "PREDICTION":
        return <TrendingUp className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SUCCESS: "bg-green-100 text-green-700",
      FAILED: "bg-red-100 text-red-700",
      PENDING: "bg-amber-100 text-amber-700",
      SKIPPED: "bg-gray-100 text-gray-700",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  const formatProcessingTime = (time: number | null) => {
    if (time === null) return "-";
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

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
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Bot className="h-7 w-7" />
              AI Actions Dashboard
            </h1>
            <p className="text-gray-500">
              Monitor AI-driven automation for your orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchActions}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white rounded-lg border border-l-4 border-l-blue-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Today's Actions</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{stats.todayStats.total}</div>
          <p className="text-xs text-gray-500">AI decisions made</p>
        </div>

        <div className="bg-white rounded-lg border border-l-4 border-l-green-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Successful</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.todayStats.successful}</div>
          <p className="text-xs text-gray-500">
            {stats.todayStats.successRate.toFixed(1)}% success rate
          </p>
        </div>

        <div className="bg-white rounded-lg border border-l-4 border-l-purple-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Confidence</span>
            <Brain className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">
            {(stats.averageConfidence * 100).toFixed(1)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${stats.averageConfidence * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-l-4 border-l-amber-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Response</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">
            {formatProcessingTime(stats.averageProcessingTime)}
          </div>
          <p className="text-xs text-gray-500">Processing time</p>
        </div>

        <div className="bg-white rounded-lg border border-l-4 border-l-indigo-500 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Actions</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-gray-500">All time</p>
        </div>
      </div>

      {/* Action Type Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">Action Types</h3>
          <p className="text-sm text-gray-500 mb-4">Distribution of AI actions by type</p>
          <div className="space-y-3">
            {Object.entries(stats.actionTypes).map(([type, count]) => {
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div
                  key={type}
                  className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                    actionTypeFilter === type ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setActionTypeFilter(actionTypeFilter === type ? "" : type)}
                >
                  {getActionIcon(type)}
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{type.replace(/_/g, " ")}</span>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.actionTypes).length === 0 && (
              <p className="text-center text-gray-500 py-4">No action types recorded</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">Entity Types</h3>
          <p className="text-sm text-gray-500 mb-4">AI actions by entity type</p>
          <div className="space-y-3">
            {Object.entries(stats.entityTypes).map(([type, count]) => {
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div
                  key={type}
                  className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                    entityTypeFilter === type ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setEntityTypeFilter(entityTypeFilter === type ? "" : type)}
                >
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-bold">{type.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{type}</span>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.entityTypes).length === 0 && (
              <p className="text-center text-gray-500 py-4">No entity types recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions Table */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Action Log</h3>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Entities</option>
            <option value="NDR">NDR</option>
            <option value="Order">Order</option>
            <option value="ProactiveCommunication">Communication</option>
          </select>
          <select
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="AUTO_CLASSIFY">Auto Classify</option>
            <option value="AUTO_OUTREACH">Auto Outreach</option>
            <option value="AUTO_RESOLVE">Auto Resolve</option>
            <option value="SENTIMENT_ANALYSIS">Sentiment Analysis</option>
            <option value="PRIORITY_UPDATE">Priority Update</option>
            <option value="ESCALATION">Escalation</option>
            <option value="PREDICTION">Prediction</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
            <option value="SKIPPED">Skipped</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="p-3 font-medium">Time</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Entity</th>
                <th className="p-3 font-medium">Details</th>
                <th className="p-3 font-medium">Confidence</th>
                <th className="p-3 font-medium">Processing</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              ) : actions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No AI actions found</p>
                  </td>
                </tr>
              ) : (
                actions.map((action) => (
                  <tr key={action.id} className="border-b last:border-0">
                    <td className="p-3 text-sm">
                      {new Date(action.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getActionIcon(action.actionType)}
                        <span className="text-sm font-medium">
                          {action.actionType.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 rounded">
                          {action.entityType}
                        </span>
                        {action.ndr && (
                          <div className="text-xs text-gray-500 mt-1">
                            {action.ndr.ndrCode}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 max-w-[200px]">
                      <p className="text-xs text-gray-500 truncate">
                        {JSON.stringify(action.actionDetails).slice(0, 50)}...
                      </p>
                    </td>
                    <td className="p-3">
                      {action.confidence !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${action.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{Math.round(action.confidence * 100)}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">
                      {formatProcessingTime(action.processingTime)}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(action.status)}
                      {action.errorMessage && (
                        <p className="text-xs text-red-500 mt-1 truncate max-w-[100px]" title={action.errorMessage}>
                          {action.errorMessage}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * 50) + 1} - {Math.min(page * 50, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page * 50 >= total}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
