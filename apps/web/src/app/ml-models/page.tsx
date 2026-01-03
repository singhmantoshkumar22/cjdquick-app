"use client";

import { useState } from "react";
import {
  Brain,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Play,
  Pause,
  BarChart3,
  LineChart,
  Target,
  Zap,
  Database,
} from "lucide-react";
import { Card, Button, Badge } from "@cjdquick/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function MLModelsPage() {
  const [activeTab, setActiveTab] = useState<"models" | "training" | "forecasts">("models");
  const queryClient = useQueryClient();

  // Fetch models
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ["ml-models"],
    queryFn: async () => {
      const res = await fetch("/api/ml-models");
      return res.json();
    },
  });

  // Fetch training jobs
  const { data: trainingData } = useQuery({
    queryKey: ["ml-training-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/ml-models?type=training-jobs");
      return res.json();
    },
  });

  // Fetch forecasts
  const { data: forecastsData } = useQuery({
    queryKey: ["ml-forecasts"],
    queryFn: async () => {
      const res = await fetch("/api/ml-models?type=forecasts");
      return res.json();
    },
  });

  const models = modelsData?.data?.items || [];
  const summary = modelsData?.data?.summary || {};
  const trainingJobs = trainingData?.data?.items || [];
  const forecasts = forecastsData?.data?.items || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "TRAINING":
        return <Badge variant="warning">Training</Badge>;
      case "DRAFT":
        return <Badge variant="default">Draft</Badge>;
      case "ARCHIVED":
        return <Badge variant="default">Archived</Badge>;
      case "RUNNING":
        return <Badge variant="primary">Running</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "FAILED":
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case "DEMAND_FORECAST":
        return <LineChart className="h-5 w-5" />;
      case "ROUTE_OPTIMIZATION":
        return <Target className="h-5 w-5" />;
      case "ETA_PREDICTION":
        return <Clock className="h-5 w-5" />;
      case "ANOMALY_DETECTION":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ML Model Registry</h1>
          <p className="text-gray-500">
            Demand forecasting, route optimization, and predictive analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register Model
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Models</p>
              <p className="text-2xl font-bold">{summary.total || 0}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
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
              <p className="text-sm text-gray-500">Training</p>
              <p className="text-2xl font-bold text-amber-600">
                {summary.training || 0}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Demand Models</p>
              <p className="text-2xl font-bold">
                {summary.byType?.demandForecast || 0}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <LineChart className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ETA Models</p>
              <p className="text-2xl font-bold">
                {summary.byType?.etaPrediction || 0}
              </p>
            </div>
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Clock className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("models")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "models"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Models ({models.length})
        </button>
        <button
          onClick={() => setActiveTab("training")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "training"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Training Jobs ({trainingJobs.length})
        </button>
        <button
          onClick={() => setActiveTab("forecasts")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "forecasts"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Forecasts ({forecasts.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "models" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.length > 0 ? (
            models.map((model: any) => (
              <Card key={model.id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        model.status === "ACTIVE"
                          ? "bg-green-100"
                          : model.status === "TRAINING"
                            ? "bg-amber-100"
                            : "bg-gray-100"
                      }`}
                    >
                      {getModelTypeIcon(model.modelType)}
                    </div>
                    <div>
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-gray-500">v{model.version}</p>
                    </div>
                  </div>
                  {getStatusBadge(model.status)}
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {model.description || "No description"}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Type:</span>{" "}
                    <span className="font-medium">{model.modelType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Framework:</span>{" "}
                    <span className="font-medium">{model.framework || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Accuracy:</span>{" "}
                    <span className="font-medium text-green-600">
                      {model.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">MAPE:</span>{" "}
                    <span className="font-medium">
                      {model.mape ? `${model.mape.toFixed(2)}%` : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    {model._count?.trainingJobs || 0} training jobs
                  </div>
                  <div className="flex gap-2">
                    {model.status === "ACTIVE" && (
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Forecast
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Train
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-full p-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No ML models</h3>
              <p className="text-gray-500 mt-1">
                Register your first ML model to start making predictions
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Register Model
              </Button>
            </Card>
          )}
        </div>
      )}

      {activeTab === "training" && (
        <div className="space-y-4">
          {trainingJobs.length > 0 ? (
            trainingJobs.map((job: any) => (
              <Card key={job.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        job.status === "RUNNING"
                          ? "bg-blue-100"
                          : job.status === "COMPLETED"
                            ? "bg-green-100"
                            : job.status === "FAILED"
                              ? "bg-red-100"
                              : "bg-gray-100"
                      }`}
                    >
                      {job.status === "RUNNING" ? (
                        <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                      ) : (
                        <Database className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {job.model?.name || "Unknown Model"}
                        </span>
                        {getStatusBadge(job.status)}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {job.jobType} • {job.sampleSize || "N/A"} samples
                      </p>
                      {job.status === "COMPLETED" && (
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Accuracy:</span>{" "}
                            <span className="font-medium text-green-600">
                              {job.accuracy ? `${(job.accuracy * 100).toFixed(1)}%` : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">F1 Score:</span>{" "}
                            <span className="font-medium">
                              {job.f1Score?.toFixed(3) || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">MAPE:</span>{" "}
                            <span className="font-medium">
                              {job.mape?.toFixed(2) || "N/A"}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">RMSE:</span>{" "}
                            <span className="font-medium">
                              {job.rmse?.toFixed(2) || "N/A"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-500">Started</div>
                    <div className="font-medium">
                      {job.startedAt
                        ? new Date(job.startedAt).toLocaleString()
                        : "N/A"}
                    </div>
                    {job.completedAt && (
                      <>
                        <div className="text-gray-500 mt-2">Completed</div>
                        <div className="font-medium">
                          {new Date(job.completedAt).toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No training jobs</h3>
              <p className="text-gray-500 mt-1">
                Start training a model to see jobs here
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "forecasts" && (
        <div className="space-y-4">
          {forecasts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      Hub/Route
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      Predicted Shipments
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      Predicted Weight
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      Confidence
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      Model Version
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {forecasts.map((forecast: any) => (
                    <tr key={forecast.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {new Date(forecast.forecastDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{forecast.forecastType}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {forecast.hubId || forecast.routeId || "Network-wide"}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {forecast.predictedShipments}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {forecast.predictedWeight?.toLocaleString()} kg
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-medium ${
                            forecast.confidenceLevel > 0.9
                              ? "text-green-600"
                              : forecast.confidenceLevel > 0.8
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {(forecast.confidenceLevel * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {forecast.modelVersion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No forecasts</h3>
              <p className="text-gray-500 mt-1">
                Generate forecasts using active ML models
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
