"use client";

import { useSession } from "next-auth/react";
import {
  Package,
  ShoppingCart,
  Truck,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  PackageCheck,
  Building2,
  Users,
  Boxes,
  Settings,
  BarChart3,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type ChangeType = "positive" | "negative" | "neutral";

// Master Panel Stats - Multi-tenant overview
const masterStats: Array<{
  title: string;
  value: string;
  change: string;
  changeType: ChangeType;
  icon: React.ElementType;
  description: string;
}> = [
  {
    title: "Active Companies",
    value: "12",
    change: "+2",
    changeType: "positive",
    icon: Building2,
    description: "registered companies",
  },
  {
    title: "Total Brands/Clients",
    value: "48",
    change: "+5",
    changeType: "positive",
    icon: Users,
    description: "across all companies",
  },
  {
    title: "Warehouses",
    value: "24",
    change: "+3",
    changeType: "positive",
    icon: MapPin,
    description: "active locations",
  },
  {
    title: "System Users",
    value: "156",
    change: "+12",
    changeType: "positive",
    icon: Users,
    description: "total users",
  },
];

// Operations Stats
const operationsStats: Array<{
  title: string;
  value: string;
  change: string;
  changeType: ChangeType;
  icon: React.ElementType;
  description: string;
}> = [
  {
    title: "Total Orders Today",
    value: "1,234",
    change: "+12%",
    changeType: "positive",
    icon: ShoppingCart,
    description: "vs yesterday",
  },
  {
    title: "Pending Processing",
    value: "45",
    change: "-8%",
    changeType: "positive",
    icon: Clock,
    description: "awaiting action",
  },
  {
    title: "In Transit",
    value: "156",
    change: "+5%",
    changeType: "neutral",
    icon: Truck,
    description: "shipments on the way",
  },
  {
    title: "Delivered Today",
    value: "89",
    change: "+23%",
    changeType: "positive",
    icon: CheckCircle,
    description: "successfully delivered",
  },
];

const ordersByStatus = [
  { status: "New Orders", count: 45, color: "bg-blue-500" },
  { status: "Picklist Created", count: 23, color: "bg-yellow-500" },
  { status: "Picking", count: 12, color: "bg-orange-500" },
  { status: "Packed", count: 34, color: "bg-purple-500" },
  { status: "Manifested", count: 28, color: "bg-indigo-500" },
  { status: "Shipped", count: 156, color: "bg-green-500" },
];

const recentActivity = [
  {
    id: 1,
    action: "New company 'ABC Corp' registered",
    time: "2 minutes ago",
    icon: Building2,
    type: "master",
  },
  {
    id: 2,
    action: "Order #ORD-2024-1234 shipped",
    time: "5 minutes ago",
    icon: Truck,
    type: "operations",
  },
  {
    id: 3,
    action: "New client 'Fashion Brand' added",
    time: "15 minutes ago",
    icon: Users,
    type: "master",
  },
  {
    id: 4,
    action: "Picklist #PL-456 completed",
    time: "32 minutes ago",
    icon: PackageCheck,
    type: "operations",
  },
  {
    id: 5,
    action: "Stock alert: SKU-001 low inventory",
    time: "1 hour ago",
    icon: AlertCircle,
    type: "alert",
  },
];

// Company-wise order summary
const companyOrderSummary = [
  { company: "Demo Company", orders: 456, revenue: "₹12.4L", trend: "+15%" },
  { company: "ABC Corp", orders: 234, revenue: "₹8.2L", trend: "+8%" },
  { company: "XYZ Industries", orders: 189, revenue: "₹6.5L", trend: "+12%" },
  { company: "Global Retail", orders: 167, revenue: "₹5.8L", trend: "+5%" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isSuperAdmin ? "Master Control Panel" : "Operations Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || "User"}!{" "}
            {isSuperAdmin
              ? "Here's your multi-tenant system overview."
              : "Here's your order management overview."}
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2 text-white">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">Super Admin</span>
          </div>
        )}
      </div>

      {/* Master Panel Stats - Only for Super Admin */}
      {isSuperAdmin && (
        <>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
              System Overview
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {masterStats.map((stat) => (
                <Card key={stat.title} className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{stat.change}</span>{" "}
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Company-wise Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Company Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companyOrderSummary.map((company) => (
                  <div
                    key={company.company}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{company.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {company.orders} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{company.revenue}</p>
                      <p className="text-sm text-green-600">{company.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Operations Stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
          Today's Operations
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {operationsStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                          ? "text-red-600"
                          : "text-muted-foreground"
                    }
                  >
                    {stat.change}
                  </span>{" "}
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Orders by Status */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersByStatus.map((item) => (
                <div key={item.status} className="flex items-center">
                  <div className={`h-2 w-2 rounded-full ${item.color} mr-3`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {item.status}
                    </p>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{
                          width: `${Math.min((item.count / 200) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 font-medium">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity
                .filter((a) => isSuperAdmin || a.type !== "master")
                .map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        activity.type === "master"
                          ? "bg-blue-100"
                          : activity.type === "alert"
                            ? "bg-red-100"
                            : "bg-muted"
                      }`}
                    >
                      <activity.icon
                        className={`h-3 w-3 ${
                          activity.type === "master"
                            ? "text-blue-600"
                            : activity.type === "alert"
                              ? "text-red-600"
                              : ""
                        }`}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {isSuperAdmin && (
              <>
                <QuickActionButton
                  icon={Building2}
                  label="Manage Companies"
                  href="/master/companies"
                  variant="primary"
                />
                <QuickActionButton
                  icon={Users}
                  label="Manage Clients"
                  href="/master/brands"
                  variant="primary"
                />
              </>
            )}
            <QuickActionButton
              icon={ShoppingCart}
              label="View All Orders"
              href="/orders"
            />
            <QuickActionButton
              icon={Boxes}
              label="Inventory Overview"
              href="/inventory"
            />
            <QuickActionButton
              icon={BarChart3}
              label="View Reports"
              href="/reports"
            />
            <QuickActionButton
              icon={Settings}
              label="System Settings"
              href="/settings"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  href,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  variant?: "default" | "primary";
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted ${
        variant === "primary"
          ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
          : ""
      }`}
    >
      <div
        className={`rounded-full p-2 ${
          variant === "primary" ? "bg-blue-600 text-white" : "bg-primary/10"
        }`}
      >
        <Icon
          className={`h-5 w-5 ${variant === "primary" ? "" : "text-primary"}`}
        />
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
