"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Plus,
  AlertTriangle,
  Zap,
  IndianRupee,
  TrendingUp,
  Edit,
  Trash2,
  TestTube,
  Settings,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

// Fetch notifications summary
async function fetchNotificationsSummary(period: string) {
  const res = await fetch(`/api/notifications?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

// Fetch templates
async function fetchTemplates() {
  const res = await fetch("/api/notifications/templates?isActive=true");
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "SMS":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "WHATSAPP":
      return <Smartphone className="h-4 w-4 text-green-500" />;
    case "EMAIL":
      return <Mail className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    SENT: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-green-100 text-green-700",
    READ: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-red-100 text-red-700",
    BOUNCED: "bg-orange-100 text-orange-700",
  };
  return styles[status] || "bg-gray-100 text-gray-700";
}

// Test send notification
async function testSendNotification(templateCode: string, phone: string) {
  const res = await fetch("/api/notifications/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      templateCode,
      recipientPhone: phone,
      variables: {
        awb: "TEST123456",
        consignee_name: "Test Customer",
        destination: "Test City",
        tracking_url: "https://track.cjdquick.com/track?awb=TEST123456",
      },
    }),
  });
  return res.json();
}

// Create template
async function createTemplate(data: any) {
  const res = await fetch("/api/notifications/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

const EVENT_LABELS: Record<string, { label: string; emoji: string }> = {
  SHIPMENT_BOOKED: { label: "Shipment Booked", emoji: "📦" },
  PICKUP_SCHEDULED: { label: "Pickup Scheduled", emoji: "📅" },
  PICKED_UP: { label: "Picked Up", emoji: "🚚" },
  IN_TRANSIT: { label: "In Transit", emoji: "🛣️" },
  AT_HUB: { label: "At Hub", emoji: "🏢" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", emoji: "🏃" },
  DELIVERED: { label: "Delivered", emoji: "✅" },
  DELIVERY_FAILED: { label: "Delivery Failed", emoji: "❌" },
  RTO_INITIATED: { label: "RTO Initiated", emoji: "↩️" },
  NDR_CREATED: { label: "NDR Created", emoji: "⚠️" },
  COD_COLLECTED: { label: "COD Collected", emoji: "💰" },
};

export default function NotificationsPage() {
  const [period, setPeriod] = useState("7");
  const [activeTab, setActiveTab] = useState<"overview" | "templates" | "logs">("overview");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testingTemplate, setTestingTemplate] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ["notifications-summary", period],
    queryFn: () => fetchNotificationsSummary(period),
    refetchInterval: 30000,
  });

  const { data: templatesData, refetch: refetchTemplates } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: fetchTemplates,
  });

  const testMutation = useMutation({
    mutationFn: ({ code, phone }: { code: string; phone: string }) =>
      testSendNotification(code, phone),
    onSuccess: (data) => {
      if (data.success) {
        alert("Test notification sent successfully!");
      } else {
        alert("Failed: " + data.error);
      }
      setTestingTemplate(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      refetchTemplates();
      setShowTemplateModal(false);
    },
  });

  const summary = summaryData?.data;
  const kpis = summary?.kpis || {};
  const templates = templatesData?.data?.templates || [];

  // Group templates by event
  const templatesByEvent: Record<string, any[]> = {};
  templates.forEach((t: any) => {
    if (!templatesByEvent[t.triggerEvent]) {
      templatesByEvent[t.triggerEvent] = [];
    }
    templatesByEvent[t.triggerEvent].push(t);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-7 w-7 text-orange-600" />
            Automated Communications
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage notification templates, track deliveries, and monitor communication health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetchSummary()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowTemplateModal(true)}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "overview" ? "primary" : "outline"}
          onClick={() => setActiveTab("overview")}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Overview
        </Button>
        <Button
          variant={activeTab === "templates" ? "primary" : "outline"}
          onClick={() => setActiveTab("templates")}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Templates ({templates.length})
        </Button>
        <Button
          variant={activeTab === "logs" ? "primary" : "outline"}
          onClick={() => setActiveTab("logs")}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Message Logs
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Sent */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {kpis.totalSent || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Last {period} days</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Delivery Rate */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delivery Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {kpis.deliveryRate || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.deliveredCount || 0} delivered
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Queue Status */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Queue Status</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {kpis.queuePending || 0}
              </p>
              <p className="text-xs text-red-500 mt-1">
                {kpis.queueFailed || 0} failed
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Est. Cost */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Est. Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{kpis.estimatedCost || "0.00"}
              </p>
              <p className="text-xs text-gray-400 mt-1">SMS + WhatsApp</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Channels & Templates Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Channel Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-500" />
            Channel Breakdown
          </h3>
          <div className="space-y-4">
            {summary?.channels?.length > 0 ? (
              summary.channels.map((channel: any) => {
                const percentage = kpis.totalSent > 0
                  ? ((channel.count / kpis.totalSent) * 100).toFixed(1)
                  : 0;
                return (
                  <div key={channel.channel}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        {getChannelIcon(channel.channel)}
                        {channel.channel}
                      </span>
                      <span className="font-medium">{channel.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          channel.channel === "SMS"
                            ? "bg-blue-500"
                            : channel.channel === "WHATSAPP"
                              ? "bg-green-500"
                              : "bg-purple-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Active Templates */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            Active Templates ({kpis.activeTemplates || 0})
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {templates.length > 0 ? (
              templates.slice(0, 8).map((template: any) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {getChannelIcon(template.channel)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.triggerEvent}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{template.recipientType}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No templates configured</p>
                <Button size="sm" className="mt-2 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hourly Volume Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-500" />
          24-Hour Volume
        </h3>
        <div className="flex items-end gap-1 h-32">
          {summary?.hourlyVolume?.map((hour: any) => {
            const maxCount = Math.max(...(summary.hourlyVolume?.map((h: any) => h.count) || [1]));
            const height = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;
            return (
              <div
                key={hour.hour}
                className="flex-1 flex flex-col items-center"
                title={`${hour.hour}:00 - ${hour.count} notifications`}
              >
                <div
                  className="w-full bg-blue-500 rounded-t transition-all"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <span className="text-xs text-gray-400 mt-1">
                  {hour.hour % 6 === 0 ? `${hour.hour}h` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Notifications</h3>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
          <div className="col-span-1">Channel</div>
          <div className="col-span-2">Template</div>
          <div className="col-span-2">Recipient</div>
          <div className="col-span-2">AWB</div>
          <div className="col-span-2">Sent At</div>
          <div className="col-span-3">Status</div>
        </div>

        {/* Rows */}
        <div className="divide-y">
          {summary?.recentLogs?.length > 0 ? (
            summary.recentLogs.map((log: any) => (
              <div
                key={log.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 items-center"
              >
                <div className="col-span-1">{getChannelIcon(log.channel)}</div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-900">{log.templateCode || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">
                    {log.recipientPhone || log.recipientEmail || "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-blue-600">{log.awbNumber || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">{formatDate(log.sentAt)}</p>
                </div>
                <div className="col-span-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                      log.status
                    )}`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">No notifications sent yet</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-orange-50 rounded-xl p-5">
        <h3 className="font-semibold text-orange-900 mb-4">Quick Setup</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Default Templates</h4>
            <p className="text-sm text-gray-500 mb-3">
              Set up standard notifications for shipment lifecycle events
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("templates")}>
              Configure
            </Button>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">SMS - MSG91</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Transactional SMS with DLT compliance for India
            </p>
            <p className="text-xs text-gray-400">Set MSG91_AUTH_KEY in env</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-900">WhatsApp - Gupshup</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              WhatsApp Business API with template messages
            </p>
            <p className="text-xs text-gray-400">Set GUPSHUP_API_KEY in env</p>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          {/* Event Grid */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Notification Events</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(EVENT_LABELS).map(([event, { label, emoji }]) => {
                const eventTemplates = templatesByEvent[event] || [];
                const activeCount = eventTemplates.filter((t: any) => t.isActive).length;
                return (
                  <div key={event} className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl mb-2">{emoji}</div>
                    <p className="font-medium text-sm text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-1">{activeCount} active</p>
                    <div className="flex justify-center gap-1 mt-2">
                      {eventTemplates.some((t: any) => t.channel === "SMS") && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" title="SMS" />
                      )}
                      {eventTemplates.some((t: any) => t.channel === "WHATSAPP") && (
                        <span className="w-2 h-2 rounded-full bg-green-500" title="WhatsApp" />
                      )}
                      {eventTemplates.some((t: any) => t.channel === "EMAIL") && (
                        <span className="w-2 h-2 rounded-full bg-purple-500" title="Email" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Templates List by Event */}
          {Object.entries(templatesByEvent).map(([event, eventTemplates]) => (
            <div key={event} className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b bg-gray-50 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{EVENT_LABELS[event]?.emoji || "📋"}</span>
                  <h3 className="font-semibold text-gray-900">{EVENT_LABELS[event]?.label || event}</h3>
                  <span className="text-xs text-gray-400">({eventTemplates.length})</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowTemplateModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="divide-y">
                {eventTemplates.map((template: any) => (
                  <div key={template.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        template.channel === "SMS" ? "bg-blue-100" :
                        template.channel === "WHATSAPP" ? "bg-green-100" : "bg-purple-100"
                      }`}>
                        {getChannelIcon(template.channel)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{template.name}</p>
                          <span className="text-xs text-gray-400 font-mono">{template.code}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{template.body}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">To: {template.recipientType}</span>
                          {template.delayMinutes > 0 && (
                            <span className="text-xs text-gray-400">Delay: {template.delayMinutes}m</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        template.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTestingTemplate(template.code)}
                        title="Test send"
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(templatesByEvent).length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No notification templates configured</p>
              <Button size="sm" className="gap-2" onClick={() => setShowTemplateModal(true)}>
                <Plus className="h-4 w-4" />
                Create First Template
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Message Logs</h3>
            <Button variant="outline" size="sm" onClick={() => refetchSummary()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
            <div className="col-span-1">Channel</div>
            <div className="col-span-2">Template</div>
            <div className="col-span-2">Recipient</div>
            <div className="col-span-2">AWB</div>
            <div className="col-span-2">Sent At</div>
            <div className="col-span-3">Status</div>
          </div>

          {/* Rows */}
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {summary?.recentLogs?.length > 0 ? (
              summary.recentLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 items-center"
                >
                  <div className="col-span-1">{getChannelIcon(log.channel)}</div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{log.templateCode || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">
                      {log.recipientPhone || log.recipientEmail || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-blue-600">{log.awbNumber || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">{formatDate(log.sentAt)}</p>
                  </div>
                  <div className="col-span-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No message logs found</div>
            )}
          </div>
        </div>
      )}

      {/* Test Send Modal */}
      {testingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Test Send: {testingTemplate}</h3>
              <Button variant="ghost" size="sm" onClick={() => setTestingTemplate(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-1">Enter your phone number to receive test message</p>
              </div>
              <Button
                className="w-full"
                disabled={!testPhone || testMutation.isPending}
                onClick={() => testMutation.mutate({ code: testingTemplate, phone: testPhone })}
              >
                {testMutation.isPending ? "Sending..." : "Send Test Message"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          onClose={() => setShowTemplateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

// Template Modal Component
function TemplateModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    channel: "SMS",
    triggerEvent: "SHIPMENT_BOOKED",
    recipientType: "CONSIGNEE",
    body: "",
    delayMinutes: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-lg">Create Notification Template</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Template Code</label>
              <input
                type="text"
                required
                placeholder="e.g., SMS_BOOKED_CONSIGNEE"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                type="text"
                required
                placeholder="Booking Confirmation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Channel</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Trigger Event</label>
              <select
                value={formData.triggerEvent}
                onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {Object.entries(EVENT_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Recipient</label>
              <select
                value={formData.recipientType}
                onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="CONSIGNEE">Consignee</option>
                <option value="SHIPPER">Shipper</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Message Body</label>
            <textarea
              required
              rows={4}
              placeholder="Dear {{consignee_name}}, your shipment {{awb}} has been booked. Track: {{tracking_url}}"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Variables: {"{{awb}}, {{consignee_name}}, {{destination}}, {{tracking_url}}, {{expected_delivery}}"}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Delay (minutes)</label>
            <input
              type="number"
              min={0}
              value={formData.delayMinutes}
              onChange={(e) => setFormData({ ...formData, delayMinutes: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-400 mt-1">0 = Send immediately, or set delay in minutes</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
