"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Key, Copy, RefreshCw, Eye, EyeOff, Code, ExternalLink } from "lucide-react";
import { Button } from "@cjdquick/ui";

export default function ApiSettingsPage() {
  const [showKey, setShowKey] = useState(false);
  const [apiKey] = useState("pk_live_3bNymxDih79B2M3nIOHkdrnVS5Rrmv6huDBcbGo03jQ48dYSVm6WgS8h20WhVwbl");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateKey = () => {
    if (confirm("Are you sure you want to regenerate your API key? This will invalidate the current key.")) {
      // Simulate key regeneration
      alert("New API key generated! Please update your integrations.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Settings</h1>
          <p className="text-sm text-gray-500">Manage your API credentials and integrations</p>
        </div>
      </div>

      {/* API Key */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">API Key</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Use this API key to authenticate your requests. Keep it secure and never share it publicly.
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm">
            {showKey ? apiKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••"}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowKey(!showKey)}>
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {copied && (
          <p className="text-sm text-green-600 mt-2">Copied to clipboard!</p>
        )}

        <div className="mt-4">
          <Button variant="outline" onClick={regenerateKey} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Regenerate Key
          </Button>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Webhooks</h2>
          </div>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Receive real-time notifications when events happen in your account.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Order Status Updates</p>
              <p className="text-sm text-gray-500">https://yoursite.com/webhooks/orders</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Delivery Notifications</p>
              <p className="text-sm text-gray-500">https://yoursite.com/webhooks/delivery</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">API Documentation</h2>
        <p className="text-sm text-gray-600 mb-4">
          Learn how to integrate with our API to automate your shipping operations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="#"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">Getting Started</p>
              <p className="text-sm text-gray-500">Quick start guide</p>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
          <a
            href="#"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">API Reference</p>
              <p className="text-sm text-gray-500">Complete API documentation</p>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
          <a
            href="#"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">SDKs & Libraries</p>
              <p className="text-sm text-gray-500">Official client libraries</p>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
          <a
            href="#"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">Postman Collection</p>
              <p className="text-sm text-gray-500">Import and test API</p>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
