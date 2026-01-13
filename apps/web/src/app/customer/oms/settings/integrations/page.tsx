"use client";

import { useState, useEffect } from "react";
import {
  Plug,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: string;
  category: string;
  status: string;
  lastSync: string;
  description: string;
  logo: string;
  config: Record<string, string>;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/oms/settings/integrations");
      const result = await response.json();
      if (result.success) {
        setIntegrations(result.data.integrations || getDemoIntegrations());
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
      setIntegrations(getDemoIntegrations());
    } finally {
      setLoading(false);
    }
  };

  const getDemoIntegrations = (): Integration[] => [
    { id: "1", name: "Amazon Seller Central", type: "MARKETPLACE", category: "Marketplaces", status: "CONNECTED", lastSync: "2024-01-08 14:30", description: "Sync orders and inventory with Amazon India", logo: "🛒", config: { sellerId: "A1234567890", marketplaceId: "A21TJRUUN4KGV" } },
    { id: "2", name: "Flipkart Seller Hub", type: "MARKETPLACE", category: "Marketplaces", status: "CONNECTED", lastSync: "2024-01-08 14:25", description: "Manage Flipkart orders and fulfillment", logo: "🛍️", config: { sellerId: "FK123456" } },
    { id: "3", name: "Shopify", type: "MARKETPLACE", category: "Marketplaces", status: "CONNECTED", lastSync: "2024-01-08 14:20", description: "D2C website order management", logo: "🏪", config: { storeName: "cjd-store" } },
    { id: "4", name: "Delhivery", type: "SHIPPING", category: "Shipping Carriers", status: "CONNECTED", lastSync: "2024-01-08 14:15", description: "Shipping and logistics integration", logo: "🚚", config: { clientId: "DEL123" } },
    { id: "5", name: "BlueDart", type: "SHIPPING", category: "Shipping Carriers", status: "CONNECTED", lastSync: "2024-01-08 14:10", description: "Premium courier service", logo: "📦", config: { apiKey: "BD***" } },
    { id: "6", name: "Ekart", type: "SHIPPING", category: "Shipping Carriers", status: "ERROR", lastSync: "2024-01-07 18:00", description: "Flipkart logistics partner", logo: "🚛", config: { partnerId: "EK456" } },
    { id: "7", name: "Razorpay", type: "PAYMENT", category: "Payment Gateways", status: "CONNECTED", lastSync: "2024-01-08 14:00", description: "Payment processing and settlements", logo: "💳", config: { merchantId: "RZP123" } },
    { id: "8", name: "Tally", type: "ACCOUNTING", category: "Accounting", status: "DISCONNECTED", lastSync: "-", description: "Accounting and invoicing sync", logo: "📊", config: {} },
    { id: "9", name: "Google Analytics", type: "ANALYTICS", category: "Analytics", status: "CONNECTED", lastSync: "2024-01-08 14:30", description: "Website and conversion tracking", logo: "📈", config: { propertyId: "GA-123456" } },
  ];

  const categories = ["Marketplaces", "Shipping Carriers", "Payment Gateways", "Accounting", "Analytics"];

  const filteredIntegrations = integrations.filter((integration) => {
    return categoryFilter === "all" || integration.category === categoryFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONNECTED": return "text-green-600";
      case "ERROR": return "text-red-600";
      case "DISCONNECTED": return "text-gray-400";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONNECTED": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "ERROR": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "DISCONNECTED": return <XCircle className="w-5 h-5 text-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Connect marketplaces, carriers, and payment systems</p>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            categoryFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({integrations.length})
        </button>
        {categories.map((category) => {
          const count = integrations.filter((i) => i.category === category).length;
          return (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                categoryFilter === category ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category} ({count})
            </button>
          );
        })}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Connected</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {integrations.filter((i) => i.status === "CONNECTED").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600">Error</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {integrations.filter((i) => i.status === "ERROR").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Disconnected</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {integrations.filter((i) => i.status === "DISCONNECTED").length}
          </p>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))
        ) : filteredIntegrations.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No integrations found
          </div>
        ) : (
          filteredIntegrations.map((integration) => (
            <div key={integration.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.logo}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <span className="text-xs text-gray-500">{integration.category}</span>
                  </div>
                </div>
                {getStatusIcon(integration.status)}
              </div>

              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              {integration.status !== "DISCONNECTED" && (
                <div className="text-sm text-gray-500 mb-4">
                  Last sync: {integration.lastSync}
                </div>
              )}

              <div className="flex gap-2">
                {integration.status === "CONNECTED" && (
                  <>
                    <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">
                      <RefreshCw className="w-4 h-4" />
                      Sync
                    </button>
                    <button
                      onClick={() => setSelectedIntegration(integration)}
                      className="flex items-center justify-center gap-2 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </>
                )}
                {integration.status === "ERROR" && (
                  <button className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 text-sm">
                    <RefreshCw className="w-4 h-4" />
                    Reconnect
                  </button>
                )}
                {integration.status === "DISCONNECTED" && (
                  <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                    <Plug className="w-4 h-4" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Config Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedIntegration.logo}</span>
                <h2 className="text-lg font-semibold text-gray-900">{selectedIntegration.name}</h2>
              </div>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700">Connected and syncing</span>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Configuration</h3>
                {Object.entries(selectedIntegration.config).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{key}</span>
                    <span className="font-mono text-gray-900">{value}</span>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Sync Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Auto-sync orders</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sync inventory</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sync frequency</span>
                    <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                      <option>Every 15 minutes</option>
                      <option>Every 30 minutes</option>
                      <option>Every hour</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
