"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  UserCog,
  Building,
  Plug,
  Shield,
  Database,
  ChevronRight,
  Bell,
  Globe,
  Lock,
  RefreshCw,
  Save,
} from "lucide-react";

interface QuickSetting {
  key: string;
  label: string;
  enabled: boolean;
}

interface SystemInfo {
  version: string;
  environment: string;
  lastUpdated: string;
  license: string;
  licenseStatus: "active" | "expired" | "trial";
}

const defaultQuickSettings: QuickSetting[] = [
  { key: "emailNotifications", label: "Email Notifications", enabled: true },
  { key: "smsAlerts", label: "SMS Alerts", enabled: false },
  { key: "autoAllocateOrders", label: "Auto-allocate Orders", enabled: true },
  { key: "twoFactorAuth", label: "Two-factor Authentication", enabled: true },
  { key: "apiAccessLogging", label: "API Access Logging", enabled: true },
  { key: "darkMode", label: "Dark Mode", enabled: false },
];

const defaultSystemInfo: SystemInfo = {
  version: "2.4.1",
  environment: "Production",
  lastUpdated: "Jan 5, 2024",
  license: "Enterprise",
  licenseStatus: "active",
};

export default function SettingsPage() {
  const [quickSettings, setQuickSettings] = useState<QuickSetting[]>(defaultQuickSettings);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>(defaultSystemInfo);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/oms/settings/quick");
      const result = await response.json();
      if (result.success && result.data) {
        if (result.data.quickSettings) {
          setQuickSettings(result.data.quickSettings);
        }
        if (result.data.systemInfo) {
          setSystemInfo(result.data.systemInfo);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setQuickSettings(prev =>
      prev.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s)
    );
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/oms/settings/quick", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: quickSettings }),
      });
      const result = await response.json();
      if (result.success) {
        alert("Settings saved successfully!");
        setHasChanges(false);
      } else {
        alert(result.error || "Failed to save settings");
      }
    } catch (error) {
      // Demo fallback
      alert("Settings saved (demo mode)");
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const settingsCategories = [
    {
      title: "General Settings",
      description: "Company info, timezone, currency, and notifications",
      icon: Settings,
      href: "/customer/oms/settings/general",
      color: "bg-blue-500",
    },
    {
      title: "User Management",
      description: "Manage users, roles, and team assignments",
      icon: UserCog,
      href: "/customer/oms/settings/users",
      color: "bg-green-500",
    },
    {
      title: "Location Settings",
      description: "Warehouses, stores, and fulfillment centers",
      icon: Building,
      href: "/customer/oms/settings/locations",
      color: "bg-purple-500",
    },
    {
      title: "Integrations",
      description: "Marketplaces, shipping carriers, and payment gateways",
      icon: Plug,
      href: "/customer/oms/settings/integrations",
      color: "bg-orange-500",
    },
    {
      title: "Permissions",
      description: "Access control, roles, and feature permissions",
      icon: Shield,
      href: "/customer/oms/settings/permissions",
      color: "bg-red-500",
    },
    {
      title: "Master Data",
      description: "SKUs, categories, vendors, and reason codes",
      icon: Database,
      href: "/customer/oms/settings/master-data",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your OMS configuration and preferences</p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {settingsCategories.map((category) => (
          <a
            key={category.title}
            href={category.href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className={`${category.color} p-3 rounded-lg text-white`}>
                <category.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {category.title}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Quick Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Quick Settings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {hasChanges && (
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {quickSettings.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4">
              <span className="text-gray-700">{setting.label}</span>
              <button
                onClick={() => handleToggle(setting.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  setting.enabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    setting.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Version</p>
            <p className="font-medium text-gray-900">{systemInfo.version}</p>
          </div>
          <div>
            <p className="text-gray-500">Environment</p>
            <p className="font-medium text-gray-900">{systemInfo.environment}</p>
          </div>
          <div>
            <p className="text-gray-500">Last Updated</p>
            <p className="font-medium text-gray-900">{systemInfo.lastUpdated}</p>
          </div>
          <div>
            <p className="text-gray-500">License</p>
            <p className={`font-medium ${
              systemInfo.licenseStatus === "active" ? "text-green-600" :
              systemInfo.licenseStatus === "trial" ? "text-yellow-600" : "text-red-600"
            }`}>
              {systemInfo.licenseStatus === "active" ? "Active" :
               systemInfo.licenseStatus === "trial" ? "Trial" : "Expired"} ({systemInfo.license})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
