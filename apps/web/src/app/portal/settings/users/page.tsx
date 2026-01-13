"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Plus, Edit2, Trash2, Mail, Shield } from "lucide-react";
import { Button } from "@cjdquick/ui";

interface User {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "OPERATIONS" | "VIEWER";
  status: "ACTIVE" | "INVITED" | "INACTIVE";
  lastLogin: string | null;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  OWNER: { label: "Owner", color: "bg-purple-100 text-purple-700" },
  ADMIN: { label: "Admin", color: "bg-blue-100 text-blue-700" },
  OPERATIONS: { label: "Operations", color: "bg-green-100 text-green-700" },
  VIEWER: { label: "Viewer", color: "bg-gray-100 text-gray-700" },
};

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Demo User",
      email: "demo@client.com",
      role: "OWNER",
      status: "ACTIVE",
      lastLogin: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Amit Sharma",
      email: "amit@client.com",
      role: "ADMIN",
      status: "ACTIVE",
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      name: "Priya Singh",
      email: "priya@client.com",
      role: "OPERATIONS",
      status: "ACTIVE",
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      name: "Rahul Kumar",
      email: "rahul@client.com",
      role: "VIEWER",
      status: "INVITED",
      lastLogin: null,
    },
  ]);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ email: "", role: "OPERATIONS" });

  const handleInvite = () => {
    setUsers(prev => [...prev, {
      id: Date.now().toString(),
      name: inviteData.email.split("@")[0],
      email: inviteData.email,
      role: inviteData.role as User["role"],
      status: "INVITED",
      lastLogin: null,
    }]);
    setShowInviteForm(false);
    setInviteData({ email: "", role: "OPERATIONS" });
  };

  const handleRemove = (id: string) => {
    if (confirm("Are you sure you want to remove this user?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/portal/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-sm text-gray-500">Manage who has access to your account</p>
          </div>
        </div>
        <Button onClick={() => setShowInviteForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Roles Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Role Permissions</p>
            <div className="text-sm text-blue-700 mt-1 space-y-1">
              <p><strong>Owner:</strong> Full access including billing and user management</p>
              <p><strong>Admin:</strong> Manage orders, pickups, and view reports</p>
              <p><strong>Operations:</strong> Create and manage orders and pickups</p>
              <p><strong>Viewer:</strong> View-only access to orders and reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Invite New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@company.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={inviteData.role}
                onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ADMIN">Admin</option>
                <option value="OPERATIONS">Operations</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowInviteForm(false)}>Cancel</Button>
            <Button onClick={handleInvite} className="gap-2">
              <Mail className="h-4 w-4" />
              Send Invite
            </Button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">User</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Role</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Last Login</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleLabels[user.role].color}`}>
                    {roleLabels[user.role].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                    user.status === "INVITED" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                </td>
                <td className="px-6 py-4 text-right">
                  {user.role !== "OWNER" && (
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(user.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
