"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Users,
  Lock,
  Unlock,
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: Record<string, boolean>;
  isSystem: boolean;
}

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/oms/settings/permissions");
      const result = await response.json();
      if (result.success) {
        setRoles(result.data.roles || getDemoRoles());
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles(getDemoRoles());
    } finally {
      setLoading(false);
    }
  };

  const getDemoRoles = (): Role[] => [
    {
      id: "1",
      name: "Admin",
      description: "Full system access with all permissions",
      userCount: 3,
      isSystem: true,
      permissions: {
        "orders.view": true, "orders.create": true, "orders.edit": true, "orders.delete": true,
        "inventory.view": true, "inventory.create": true, "inventory.edit": true, "inventory.delete": true,
        "fulfillment.view": true, "fulfillment.create": true, "fulfillment.edit": true,
        "returns.view": true, "returns.create": true, "returns.edit": true, "returns.approve": true,
        "reports.view": true, "reports.export": true,
        "settings.view": true, "settings.edit": true,
        "users.view": true, "users.create": true, "users.edit": true, "users.delete": true,
      },
    },
    {
      id: "2",
      name: "Manager",
      description: "Operational management with limited admin access",
      userCount: 8,
      isSystem: true,
      permissions: {
        "orders.view": true, "orders.create": true, "orders.edit": true, "orders.delete": false,
        "inventory.view": true, "inventory.create": true, "inventory.edit": true, "inventory.delete": false,
        "fulfillment.view": true, "fulfillment.create": true, "fulfillment.edit": true,
        "returns.view": true, "returns.create": true, "returns.edit": true, "returns.approve": true,
        "reports.view": true, "reports.export": true,
        "settings.view": true, "settings.edit": false,
        "users.view": true, "users.create": false, "users.edit": false, "users.delete": false,
      },
    },
    {
      id: "3",
      name: "Operator",
      description: "Day-to-day operations - picking, packing, shipping",
      userCount: 25,
      isSystem: true,
      permissions: {
        "orders.view": true, "orders.create": false, "orders.edit": false, "orders.delete": false,
        "inventory.view": true, "inventory.create": false, "inventory.edit": false, "inventory.delete": false,
        "fulfillment.view": true, "fulfillment.create": true, "fulfillment.edit": true,
        "returns.view": true, "returns.create": true, "returns.edit": false, "returns.approve": false,
        "reports.view": false, "reports.export": false,
        "settings.view": false, "settings.edit": false,
        "users.view": false, "users.create": false, "users.edit": false, "users.delete": false,
      },
    },
    {
      id: "4",
      name: "Viewer",
      description: "Read-only access for reporting and monitoring",
      userCount: 12,
      isSystem: true,
      permissions: {
        "orders.view": true, "orders.create": false, "orders.edit": false, "orders.delete": false,
        "inventory.view": true, "inventory.create": false, "inventory.edit": false, "inventory.delete": false,
        "fulfillment.view": true, "fulfillment.create": false, "fulfillment.edit": false,
        "returns.view": true, "returns.create": false, "returns.edit": false, "returns.approve": false,
        "reports.view": true, "reports.export": true,
        "settings.view": false, "settings.edit": false,
        "users.view": false, "users.create": false, "users.edit": false, "users.delete": false,
      },
    },
    {
      id: "5",
      name: "Returns Specialist",
      description: "Custom role for returns processing team",
      userCount: 5,
      isSystem: false,
      permissions: {
        "orders.view": true, "orders.create": false, "orders.edit": false, "orders.delete": false,
        "inventory.view": true, "inventory.create": false, "inventory.edit": true, "inventory.delete": false,
        "fulfillment.view": true, "fulfillment.create": false, "fulfillment.edit": false,
        "returns.view": true, "returns.create": true, "returns.edit": true, "returns.approve": true,
        "reports.view": true, "reports.export": false,
        "settings.view": false, "settings.edit": false,
        "users.view": false, "users.create": false, "users.edit": false, "users.delete": false,
      },
    },
  ];

  const permissionGroups = {
    "Orders": ["orders.view", "orders.create", "orders.edit", "orders.delete"],
    "Inventory": ["inventory.view", "inventory.create", "inventory.edit", "inventory.delete"],
    "Fulfillment": ["fulfillment.view", "fulfillment.create", "fulfillment.edit"],
    "Returns": ["returns.view", "returns.create", "returns.edit", "returns.approve"],
    "Reports": ["reports.view", "reports.export"],
    "Settings": ["settings.view", "settings.edit"],
    "Users": ["users.view", "users.create", "users.edit", "users.delete"],
  };

  const formatPermissionName = (permission: string) => {
    const [, action] = permission.split(".");
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="text-gray-600">Manage roles and access control</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Roles</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))
              ) : (
                roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedRole?.id === role.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-5 h-5 ${
                          selectedRole?.id === role.id ? "text-blue-600" : "text-gray-400"
                        }`} />
                        <span className="font-medium text-gray-900">{role.name}</span>
                      </div>
                      {role.isSystem && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 ml-7">{role.description}</p>
                    <div className="flex items-center gap-1 mt-2 ml-7">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{role.userCount} users</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedRole.name} Permissions</h2>
                  <p className="text-sm text-gray-500">{selectedRole.description}</p>
                </div>
                {!selectedRole.isSystem && (
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:text-blue-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                {Object.entries(permissionGroups).map(([group, permissions]) => (
                  <div key={group} className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">{group}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {permissions.map((permission) => (
                        <div
                          key={permission}
                          className={`flex items-center gap-2 p-2 rounded-lg ${
                            selectedRole.permissions[permission]
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {selectedRole.permissions[permission] ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          <span className="text-sm">{formatPermissionName(permission)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a role to view and manage permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create New Role</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Inventory Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={2}
                  placeholder="Describe the role's responsibilities"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clone From</label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Start from scratch</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Role
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
