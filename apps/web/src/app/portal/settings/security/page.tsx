"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Key, Smartphone, Clock, Save, Loader2 } from "lucide-react";
import { Button } from "@cjdquick/ui";

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaved(true);
    setShowPasswordForm(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setTimeout(() => setSaved(false), 3000);
  };

  const recentSessions = [
    { device: "Chrome on MacOS", location: "Mumbai, India", time: "Active now", current: true },
    { device: "Safari on iPhone", location: "Mumbai, India", time: "2 hours ago", current: false },
    { device: "Chrome on Windows", location: "Delhi, India", time: "Yesterday", current: false },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-sm text-gray-500">Manage your account security</p>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Security settings updated successfully!
        </div>
      )}

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Password</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(!showPasswordForm)}>
            Change Password
          </Button>
        </div>
        <p className="text-sm text-gray-500">Last changed 30 days ago</p>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Password
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPasswordForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Two-Factor Authentication</h2>
          </div>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            Not Enabled
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <Button variant="outline">Enable 2FA</Button>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Active Sessions</h2>
        </div>
        <div className="space-y-4">
          {recentSessions.map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{session.device}</p>
                  {session.current && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{session.location} - {session.time}</p>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 w-full">
          Sign Out All Other Sessions
        </Button>
      </div>
    </div>
  );
}
