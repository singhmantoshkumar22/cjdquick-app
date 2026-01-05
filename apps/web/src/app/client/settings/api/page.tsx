"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Key,
  Webhook,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from "@cjdquick/ui";

interface ApiKeyData {
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  webhookUrl: string | null;
}

async function fetchApiSettings(): Promise<{ success: boolean; data: ApiKeyData }> {
  const res = await fetch("/api/client/api-key");
  return res.json();
}

async function generateApiKey(): Promise<{ success: boolean; data: { apiKey: string } }> {
  const res = await fetch("/api/client/api-key", { method: "POST" });
  return res.json();
}

async function revokeApiKey(): Promise<{ success: boolean }> {
  const res = await fetch("/api/client/api-key", { method: "DELETE" });
  return res.json();
}

async function updateWebhook(webhookUrl: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/client/api-key", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webhookUrl }),
  });
  return res.json();
}

export default function ApiSettingsPage() {
  const queryClient = useQueryClient();
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["client-api-settings"],
    queryFn: fetchApiSettings,
  });

  useEffect(() => {
    if (data?.data?.webhookUrl) {
      setWebhookUrl(data.data.webhookUrl);
    }
  }, [data]);

  const generateMutation = useMutation({
    mutationFn: generateApiKey,
    onSuccess: (data) => {
      if (data.success) {
        setNewApiKey(data.data.apiKey);
        queryClient.invalidateQueries({ queryKey: ["client-api-settings"] });
      }
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      setNewApiKey(null);
      queryClient.invalidateQueries({ queryKey: ["client-api-settings"] });
    },
  });

  const webhookMutation = useMutation({
    mutationFn: updateWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-api-settings"] });
    },
  });

  const apiSettings = data?.data;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/client/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">API Integration</h1>
          <p className="text-sm text-gray-500">Manage API keys and webhook configuration</p>
        </div>
      </div>

      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary-600" />
            API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Use your API key to authenticate requests to the CJDQuick API. Keep your API key secure and never share it publicly.
          </p>

          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : newApiKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Store your API key securely</p>
                    <p className="text-sm text-amber-700 mt-1">
                      This is the only time you will see your complete API key. Copy it now and store it securely.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={newApiKey}
                    readOnly
                    className="w-full px-4 py-2 pr-20 font-mono text-sm bg-gray-50 border rounded-lg"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(newApiKey)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {isCopied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setNewApiKey(null)}
              >
                Done - I've saved my key
              </Button>
            </div>
          ) : apiSettings?.hasApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Current API Key</p>
                  <p className="font-mono text-sm">{apiSettings.apiKeyPreview}</p>
                </div>
                <Badge variant="success" size="sm">Active</Badge>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Are you sure you want to regenerate your API key? The old key will stop working immediately.")) {
                      generateMutation.mutate();
                    }
                  }}
                  disabled={generateMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                  Regenerate Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Are you sure you want to revoke your API key? All API access will stop immediately.")) {
                      revokeMutation.mutate();
                    }
                  }}
                  disabled={revokeMutation.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke Key
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <Key className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2 text-gray-600">No API key generated</p>
              </div>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary-600" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Configure a webhook URL to receive real-time notifications about order status changes, pickups, and other events.
          </p>

          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">Webhook URL</label>
            <div className="flex gap-2 mt-1">
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => webhookMutation.mutate(webhookUrl)}
                disabled={webhookMutation.isPending}
              >
                {webhookMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {apiSettings?.webhookUrl && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Webhook configured</span>
            </div>
          )}

          {/* Webhook Events */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Webhook Events</h4>
            <p className="text-sm text-gray-600 mb-4">
              When enabled, your webhook will receive the following events:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "order.created",
                "order.manifested",
                "order.picked",
                "order.in_transit",
                "order.out_for_delivery",
                "order.delivered",
                "order.rto",
                "pickup.scheduled",
                "pickup.completed",
                "ndr.created",
              ].map((event) => (
                <div
                  key={event}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded text-sm font-mono"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {event}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Learn how to integrate with the CJDQuick API to automate your shipping operations.
          </p>
          <div className="flex gap-3">
            <Button variant="outline">
              View API Docs
            </Button>
            <Button variant="outline">
              Download Postman Collection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
