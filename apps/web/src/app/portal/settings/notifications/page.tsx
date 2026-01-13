"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Mail, MessageSquare, Save, Loader2 } from "lucide-react";
import { Button } from "@cjdquick/ui";

export default function NotificationsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    emailOrderUpdates: true,
    emailDeliveryConfirmation: true,
    emailNdrAlerts: true,
    emailRemittanceUpdates: true,
    emailWeeklyDigest: false,
    smsOrderUpdates: false,
    smsDeliveryConfirmation: true,
    smsNdrAlerts: true,
  });

  const handleChange = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-sm text-gray-500">Manage how you receive alerts</p>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Notification preferences saved!
        </div>
      )}

      {/* Email Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Email Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "emailOrderUpdates", label: "Order Status Updates", description: "Get notified when order status changes" },
            { key: "emailDeliveryConfirmation", label: "Delivery Confirmations", description: "Receive confirmation when orders are delivered" },
            { key: "emailNdrAlerts", label: "NDR & Exception Alerts", description: "Get alerted about delivery issues requiring action" },
            { key: "emailRemittanceUpdates", label: "Remittance Updates", description: "Notifications about COD remittance processing" },
            { key: "emailWeeklyDigest", label: "Weekly Performance Digest", description: "Summary of your weekly shipping performance" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings[item.key as keyof typeof settings]}
                  onChange={() => handleChange(item.key)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  settings[item.key as keyof typeof settings] ? "bg-blue-600" : "bg-gray-200"
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1 ${
                    settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-1"
                  }`} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">SMS Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "smsOrderUpdates", label: "Order Status Updates", description: "SMS alerts for order status changes" },
            { key: "smsDeliveryConfirmation", label: "Delivery Confirmations", description: "SMS when orders are delivered" },
            { key: "smsNdrAlerts", label: "NDR & Exception Alerts", description: "Urgent SMS for delivery issues" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings[item.key as keyof typeof settings]}
                  onChange={() => handleChange(item.key)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  settings[item.key as keyof typeof settings] ? "bg-blue-600" : "bg-gray-200"
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1 ${
                    settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-1"
                  }`} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
