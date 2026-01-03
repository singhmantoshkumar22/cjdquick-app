"use client";

import { useState } from "react";
import {
  Warehouse,
  Package,
  BoxSelect,
  ClipboardList,
  PackageCheck,
  ArrowDownToLine,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  Boxes,
  ScanLine,
  ListChecks,
} from "lucide-react";
import { Card, Button, Badge } from "@cjdquick/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function WMSDashboard() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await fetch("/api/warehouses");
      return res.json();
    },
  });

  // Fetch zones for selected warehouse
  const { data: zonesData } = useQuery({
    queryKey: ["wms-zones", selectedWarehouse],
    queryFn: async () => {
      if (!selectedWarehouse) return null;
      const res = await fetch(`/api/wms/zones?warehouseId=${selectedWarehouse}`);
      return res.json();
    },
    enabled: !!selectedWarehouse,
  });

  // Fetch inventory summary
  const { data: inventoryData } = useQuery({
    queryKey: ["wms-inventory", selectedWarehouse],
    queryFn: async () => {
      const url = selectedWarehouse
        ? `/api/wms/inventory?warehouseId=${selectedWarehouse}&limit=100`
        : "/api/wms/inventory?limit=100";
      const res = await fetch(url);
      return res.json();
    },
  });

  // Fetch pick lists
  const { data: pickListsData } = useQuery({
    queryKey: ["wms-pick-lists", selectedWarehouse],
    queryFn: async () => {
      const url = selectedWarehouse
        ? `/api/wms/pick-lists?warehouseId=${selectedWarehouse}&limit=50`
        : "/api/wms/pick-lists?limit=50";
      const res = await fetch(url);
      return res.json();
    },
  });

  // Fetch packing tasks
  const { data: packingData } = useQuery({
    queryKey: ["wms-packing", selectedWarehouse],
    queryFn: async () => {
      const url = selectedWarehouse
        ? `/api/wms/packing?warehouseId=${selectedWarehouse}&limit=50`
        : "/api/wms/packing?limit=50";
      const res = await fetch(url);
      return res.json();
    },
  });

  // Fetch receiving records
  const { data: receivingData } = useQuery({
    queryKey: ["wms-receiving", selectedWarehouse],
    queryFn: async () => {
      const url = selectedWarehouse
        ? `/api/wms/receiving?warehouseId=${selectedWarehouse}&limit=50`
        : "/api/wms/receiving?limit=50";
      const res = await fetch(url);
      return res.json();
    },
  });

  const warehouses = warehousesData?.data || [];
  const zones = zonesData?.data || [];
  const inventory = inventoryData?.data || {};
  const pickLists = pickListsData?.data || {};
  const packing = packingData?.data || {};
  const receiving = receivingData?.data || {};

  // Calculate summary stats
  const stats = {
    totalSKUs: inventory.stats?.totalItems || 0,
    lowStockItems: inventory.stats?.lowStockItems || 0,
    outOfStockItems: inventory.stats?.outOfStockItems || 0,
    inventoryValue: inventory.stats?.totalValue || 0,
    pendingPicks: pickLists.stats?.pending || 0,
    inProgressPicks: pickLists.stats?.inProgress || 0,
    pendingPacking: packing.stats?.pending || 0,
    inProgressPacking: packing.stats?.inProgress || 0,
    pendingReceiving: receiving.stats?.pending || 0,
    inProgressReceiving: receiving.stats?.inProgress || 0,
  };

  const quickActions = [
    {
      href: "/wms/receiving",
      icon: ArrowDownToLine,
      label: "Receive Inventory",
      description: "Process incoming shipments and ASNs",
      color: "bg-blue-500",
      badge: stats.pendingReceiving > 0 ? stats.pendingReceiving : null,
    },
    {
      href: "/wms/pick",
      icon: ClipboardList,
      label: "Pick Orders",
      description: "Pick items for outbound orders",
      color: "bg-green-500",
      badge: stats.pendingPicks > 0 ? stats.pendingPicks : null,
    },
    {
      href: "/wms/pack",
      icon: PackageCheck,
      label: "Pack Orders",
      description: "Pack and verify shipments",
      color: "bg-purple-500",
      badge: stats.pendingPacking > 0 ? stats.pendingPacking : null,
    },
    {
      href: "/wms/inventory",
      icon: Boxes,
      label: "Manage Inventory",
      description: "View and manage stock levels",
      color: "bg-amber-500",
      badge: stats.lowStockItems > 0 ? stats.lowStockItems : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Warehouse Management
          </h1>
          <p className="text-gray-500">
            Pick, pack, and ship operations dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh: any) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total SKUs</p>
              <p className="text-2xl font-bold">{stats.totalSKUs}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.lowStockItems}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.outOfStockItems}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Picks</p>
              <p className="text-2xl font-bold">{stats.pendingPicks}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Pack</p>
              <p className="text-2xl font-bold">{stats.pendingPacking}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <PackageCheck className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inventory Value</p>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(stats.inventoryValue)}
              </p>
            </div>
            <div className="p-2 bg-cyan-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {action.label}
                    </h3>
                    {action.badge && (
                      <Badge variant="warning">{action.badge}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Zone Utilization & Active Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Utilization */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Zone Utilization</h3>
              <Link href="/wms/zones">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            {zones.length > 0 ? (
              <div className="space-y-3">
                {zones.slice(0, 6).map((zone: any) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          zone.type === "RECEIVING"
                            ? "bg-blue-100"
                            : zone.type === "STORAGE"
                              ? "bg-green-100"
                              : zone.type === "PICKING"
                                ? "bg-amber-100"
                                : zone.type === "PACKING"
                                  ? "bg-purple-100"
                                  : "bg-gray-100"
                        }`}
                      >
                        <BoxSelect
                          className={`h-4 w-4 ${
                            zone.type === "RECEIVING"
                              ? "text-blue-600"
                              : zone.type === "STORAGE"
                                ? "text-green-600"
                                : zone.type === "PICKING"
                                  ? "text-amber-600"
                                  : zone.type === "PACKING"
                                    ? "text-purple-600"
                                    : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{zone.name}</p>
                        <p className="text-xs text-gray-500">
                          {zone.code} • {zone.stats?.totalBins || 0} bins
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              zone.stats?.utilizationPercent > 80
                                ? "bg-red-500"
                                : zone.stats?.utilizationPercent > 50
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${zone.stats?.utilizationPercent || 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">
                          {zone.stats?.utilizationPercent || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BoxSelect className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No zones configured</p>
                <Link href="/wms/zones/new">
                  <Button variant="outline" size="sm" className="mt-2">
                    Create Zone
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Active Pick Lists */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Active Pick Lists</h3>
              <Link href="/wms/pick">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            {pickLists.items?.length > 0 ? (
              <div className="space-y-3">
                {pickLists.items
                  .filter(
                    (p: any) =>
                      p.status === "PENDING" || p.status === "IN_PROGRESS"
                  )
                  .slice(0, 5)
                  .map((pickList: any) => (
                    <div
                      key={pickList.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            pickList.status === "IN_PROGRESS"
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <ClipboardList
                            className={`h-4 w-4 ${
                              pickList.status === "IN_PROGRESS"
                                ? "text-blue-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">
                            {pickList.pickListNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {pickList._count?.items || 0} items •{" "}
                            {pickList.priority}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{
                                  width: `${pickList.progress?.percent || 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {pickList.progress?.percent || 0}%
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            pickList.status === "IN_PROGRESS"
                              ? "primary"
                              : "default"
                          }
                        >
                          {pickList.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-300" />
                <p>No active pick lists</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Receiving & Packing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Receiving */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Pending Receiving</h3>
              <Link href="/wms/receiving">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            {receiving.items?.length > 0 ? (
              <div className="space-y-3">
                {receiving.items
                  .filter(
                    (r: any) =>
                      r.status === "PENDING" || r.status === "IN_PROGRESS"
                  )
                  .slice(0, 5)
                  .map((record: any) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ArrowDownToLine className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">
                            {record.receivingNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {record.supplierName || "Unknown Supplier"} •{" "}
                            {record._count?.items || 0} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.expectedArrival && (
                          <span className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(record.expectedArrival).toLocaleDateString()}
                          </span>
                        )}
                        <Badge
                          variant={
                            record.status === "IN_PROGRESS"
                              ? "primary"
                              : "default"
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ArrowDownToLine className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No pending receiving</p>
              </div>
            )}
          </div>
        </Card>

        {/* Active Packing Tasks */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Active Packing Tasks
              </h3>
              <Link href="/wms/pack">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            {packing.items?.length > 0 ? (
              <div className="space-y-3">
                {packing.items
                  .filter(
                    (p: any) =>
                      p.status === "PENDING" || p.status === "IN_PROGRESS"
                  )
                  .slice(0, 5)
                  .map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            task.status === "IN_PROGRESS"
                              ? "bg-purple-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <PackageCheck
                            className={`h-4 w-4 ${
                              task.status === "IN_PROGRESS"
                                ? "text-purple-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">
                            {task.taskNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {task.progress?.totalItems || 0} items •{" "}
                            {task.packStation?.code || "Unassigned"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {task.allItemsScanned && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                              Scanned
                            </span>
                          )}
                          {task.weightVerified && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                              Weighed
                            </span>
                          )}
                          {task.shippingLabelPrinted && (
                            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                              Labeled
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={
                            task.status === "IN_PROGRESS"
                              ? "primary"
                              : "default"
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PackageCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No active packing tasks</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockItems > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">
                Low Stock Alert - {stats.lowStockItems} items need attention
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {inventory.items
                ?.filter((i: any) => i.isLowStock)
                .slice(0, 4)
                .map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-lg border border-amber-200"
                  >
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-amber-600">
                        {item.availableQuantity} left
                      </span>
                      <span className="text-xs text-gray-400">
                        Min: {item.reorderPoint}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            {stats.lowStockItems > 4 && (
              <Link
                href="/wms/inventory?lowStock=true"
                className="block text-center text-sm text-amber-700 hover:underline mt-4"
              >
                View all {stats.lowStockItems} low stock items →
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Additional Management Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/wms/zones">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <BoxSelect className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-sm">Manage Zones</p>
                <p className="text-xs text-gray-500">Configure warehouse zones</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/wms/bins">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-sm">Manage Bins</p>
                <p className="text-xs text-gray-500">Storage bin locations</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/wms/cycle-count">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-sm">Cycle Count</p>
                <p className="text-xs text-gray-500">Inventory verification</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/wms/reports">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-sm">WMS Reports</p>
                <p className="text-xs text-gray-500">Analytics & insights</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
