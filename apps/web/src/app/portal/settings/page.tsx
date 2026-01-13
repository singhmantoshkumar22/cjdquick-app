"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Building, MapPin, CreditCard, Key, Users, Bell, Shield } from "lucide-react";
import { Button } from "@cjdquick/ui";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("portal_user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { name: "Profile", description: "Update your personal information", icon: User, href: "/portal/settings/profile" },
        { name: "Company Details", description: "Manage business information and KYC", icon: Building, href: "/portal/settings/company" },
        { name: "Users", description: "Manage team members and permissions", icon: Users, href: "/portal/settings/users" },
      ],
    },
    {
      title: "Shipping",
      items: [
        { name: "Pickup Locations", description: "Manage pickup addresses", icon: MapPin, href: "/portal/settings/pickup-locations" },
      ],
    },
    {
      title: "Payments",
      items: [
        { name: "Bank Account", description: "Configure bank details for remittances", icon: CreditCard, href: "/portal/settings/bank" },
      ],
    },
    {
      title: "Integrations",
      items: [
        { name: "API Keys", description: "Manage API access credentials", icon: Key, href: "/portal/settings/api" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { name: "Notifications", description: "Configure email and SMS alerts", icon: Bell, href: "/portal/settings/notifications" },
        { name: "Security", description: "Password and two-factor authentication", icon: Shield, href: "/portal/settings/security" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Current User Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name || "User"}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              {user?.role || "User"}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{group.title}</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
