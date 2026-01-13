"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Globe,
  Clock,
  DollarSign,
  Bell,
  Mail,
  Phone,
  Building2,
} from "lucide-react";

interface GeneralSettings {
  company: {
    name: string;
    legalName: string;
    gstin: string;
    pan: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  regional: {
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    orderCreated: boolean;
    orderShipped: boolean;
    returnRequested: boolean;
    lowStock: boolean;
    dailyDigest: boolean;
  };
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings>({
    company: {
      name: "CJD Retail Pvt Ltd",
      legalName: "CJD Retail Private Limited",
      gstin: "27AABCC1234D1ZE",
      pan: "AABCC1234D",
      address: "123 Business Park, Sector 18",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122015",
      country: "India",
    },
    regional: {
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      currency: "INR",
      language: "en",
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      orderCreated: true,
      orderShipped: true,
      returnRequested: true,
      lowStock: true,
      dailyDigest: false,
    },
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"company" | "regional" | "notifications">("company");

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/oms/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
          <p className="text-gray-600">Company information and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("company")}
          className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 ${
            activeTab === "company"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company Info
        </button>
        <button
          onClick={() => setActiveTab("regional")}
          className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 ${
            activeTab === "regional"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Globe className="w-4 h-4" />
          Regional
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 ${
            activeTab === "notifications"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>
      </div>

      {/* Company Tab */}
      {activeTab === "company" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={settings.company.name}
                onChange={(e) => setSettings({
                  ...settings,
                  company: { ...settings.company, name: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
              <input
                type="text"
                value={settings.company.legalName}
                onChange={(e) => setSettings({
                  ...settings,
                  company: { ...settings.company, legalName: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={settings.company.gstin}
                onChange={(e) => setSettings({
                  ...settings,
                  company: { ...settings.company, gstin: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
              <input
                type="text"
                value={settings.company.pan}
                onChange={(e) => setSettings({
                  ...settings,
                  company: { ...settings.company, pan: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={settings.company.address}
                onChange={(e) => setSettings({
                  ...settings,
                  company: { ...settings.company, address: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={settings.company.city}
                onChange={(e) => setSettings({
                  ...settings,
                  company: { ...settings.company, city: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={settings.company.state}
                onChange={(e) => setSettings({
                  ...settings,
                  company: { ...settings.company, state: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                value={settings.company.pincode}
                onChange={(e) => setSettings({
                  ...settings,
                  company: { ...settings.company, pincode: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={settings.company.country}
                onChange={(e) => setSettings({
                  ...settings,
                  company: { ...settings.company, country: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Regional Tab */}
      {activeTab === "regional" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={settings.regional.timezone}
                onChange={(e) => setSettings({
                  ...settings,
                  regional: { ...settings.regional, timezone: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select
                value={settings.regional.dateFormat}
                onChange={(e) => setSettings({
                  ...settings,
                  regional: { ...settings.regional, dateFormat: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={settings.regional.currency}
                onChange={(e) => setSettings({
                  ...settings,
                  regional: { ...settings.regional, currency: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={settings.regional.language}
                onChange={(e) => setSettings({
                  ...settings,
                  regional: { ...settings.regional, language: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Notification Channels</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">Email Notifications</span>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailEnabled: !settings.notifications.emailEnabled }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications.emailEnabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.notifications.emailEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">SMS Alerts</span>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smsEnabled: !settings.notifications.smsEnabled }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications.smsEnabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.notifications.smsEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <hr />

            <div>
              <h3 className="font-medium text-gray-900 mb-4">Notification Events</h3>
              <div className="space-y-4">
                {[
                  { key: "orderCreated", label: "New Order Created" },
                  { key: "orderShipped", label: "Order Shipped" },
                  { key: "returnRequested", label: "Return Requested" },
                  { key: "lowStock", label: "Low Stock Alert" },
                  { key: "dailyDigest", label: "Daily Summary Digest" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-gray-700">{item.label}</span>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          [item.key]: !settings.notifications[item.key as keyof typeof settings.notifications]
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications[item.key as keyof typeof settings.notifications] ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications[item.key as keyof typeof settings.notifications] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
