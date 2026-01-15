"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
} from "lucide-react";

export default function LogisticsDashboardPage() {
  const stats = [
    {
      title: "Total Shipments",
      value: "1,234",
      change: "+12%",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "In Transit",
      value: "456",
      change: "+5%",
      icon: Truck,
      color: "text-orange-600",
    },
    {
      title: "Delivered Today",
      value: "89",
      change: "+23%",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Pending Pickup",
      value: "67",
      change: "-8%",
      icon: Clock,
      color: "text-yellow-600",
    },
  ];

  const courierPerformance = [
    { name: "Delhivery", onTime: 94, delayed: 6, total: 456 },
    { name: "BlueDart", onTime: 92, delayed: 8, total: 234 },
    { name: "DTDC", onTime: 88, delayed: 12, total: 189 },
    { name: "Ekart", onTime: 91, delayed: 9, total: 355 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipping Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor shipment performance and courier metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>
                  {stat.change}
                </span>{" "}
                from yesterday
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courier Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Courier Performance</CardTitle>
          <CardDescription>
            On-time delivery rates by courier partner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courierPerformance.map((courier) => (
              <div key={courier.name} className="flex items-center gap-4">
                <div className="w-24 font-medium">{courier.name}</div>
                <div className="flex-1">
                  <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="bg-green-500"
                      style={{ width: `${courier.onTime}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${courier.delayed}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <Badge variant={courier.onTime >= 90 ? "default" : "secondary"}>
                    {courier.onTime}% OTD
                  </Badge>
                </div>
                <div className="w-20 text-right text-sm text-muted-foreground">
                  {courier.total} shipments
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Delayed Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">23</p>
            <p className="text-sm text-muted-foreground">Shipments delayed beyond SLA</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              NDR Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">15</p>
            <p className="text-sm text-muted-foreground">Non-delivery reports pending action</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Cost Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹12,450</p>
            <p className="text-sm text-muted-foreground">Saved this month via optimization</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
