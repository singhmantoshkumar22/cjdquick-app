"use client";

import Link from "next/link";
import {
  FolderInput,
  Package,
  Clock,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

const miscItems = [
  {
    id: "putaway",
    label: "Manage Putaway",
    description: "View and manage putaway operations for inbound items",
    icon: FolderInput,
    href: "/customer/oms/miscellaneous/putaway",
    color: "bg-blue-500",
    stats: { open: 5, partConfirmed: 3, confirmed: 12 },
  },
];

export default function MiscellaneousPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Miscellaneous</h1>
        <p className="text-sm text-gray-500">Additional warehouse management operations</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {miscItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${item.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-4">{item.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>

              {/* Stats */}
              <div className="flex gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">{item.stats.open} Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-600">{item.stats.partConfirmed} Part</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">{item.stats.confirmed} Done</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Putaway Summary */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-sm font-semibold text-gray-700">Recent Putaway Activity</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-800">5</p>
              <p className="text-sm text-yellow-600">Pending Putaway</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-800">8</p>
              <p className="text-sm text-blue-600">In Progress</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-800">45</p>
              <p className="text-sm text-green-600">Completed Today</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-800">1,234</p>
              <p className="text-sm text-purple-600">Units Putaway</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
