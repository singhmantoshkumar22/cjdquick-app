"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@cjdquick/ui";
import {
  AlertTriangle,
  Package,
  Truck,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Calculator,
  FileText,
  HeadphonesIcon,
  Plus,
  Calendar,
  MapPin,
  RefreshCw,
  ExternalLink,
  Zap,
  ShoppingCart,
  BookOpen,
  Smartphone,
  Gift,
} from "lucide-react";

interface DashboardStats {
  actionRequired: {
    highRisk: number;
    badAddresses: number;
    pending: number;
    toBeShipped: number;
    exceptions: number;
    total: number;
  };
  performance: {
    onTimeDeliveryPercent: number;
    deliverySuccessRate: number;
    avgFirstAttemptDays: number;
    firstAttemptPercent: number;
  };
  today: {
    delivered: number;
    inTransit: number;
    returned: number;
  };
  upcomingPickups: Array<{
    id: string;
    location: string;
    date: string;
    awbCount: number;
    status: string;
  }>;
}

interface ServiceType {
  id: string;
  type: "B2B" | "B2C";
  name: string;
}

const whatsNew = [
  {
    title: "Direct Shipping Integration",
    description: "Ship directly from your warehouse",
    icon: Truck,
    isNew: true,
  },
  {
    title: "Secure with Insurance",
    description: "Get cover up to Rs.30,000 per shipment",
    icon: Gift,
    isNew: true,
  },
  {
    title: "Save More with RTO Prediction",
    description: "Reduce returns using AI",
    icon: Zap,
    isNew: false,
  },
  {
    title: "Connect Shopify in One-Click!",
    description: "Get orders auto-fetched",
    icon: ShoppingCart,
    isNew: false,
  },
  {
    title: "Connect WooCommerce",
    description: "Sync your orders automatically",
    icon: ShoppingCart,
    isNew: false,
  },
];

export default function PortalDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType>({ id: "B2B", type: "B2B", name: "CJD Quick B2B" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedServiceType = localStorage.getItem("portal_service_type");

    if (storedServiceType === "B2C") {
      setSelectedService({ id: "B2C", type: "B2C", name: "CJD Quick B2C" });
    } else {
      setSelectedService({ id: "B2B", type: "B2B", name: "CJD Quick B2B" });
    }

    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const token = localStorage.getItem("portal_token");
    const serviceType = localStorage.getItem("portal_service_type") || "B2B";

    try {
      const res = await fetch(`/api/portal/dashboard/stats?serviceType=${serviceType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
    setLoading(false);
  };

  // Mock data for demo
  const mockStats: DashboardStats = {
    actionRequired: {
      highRisk: 0,
      badAddresses: 3,
      pending: 0,
      toBeShipped: 0,
      exceptions: 2,
      total: 5,
    },
    performance: {
      onTimeDeliveryPercent: 100,
      deliverySuccessRate: 95,
      avgFirstAttemptDays: 3,
      firstAttemptPercent: 100,
    },
    today: {
      delivered: 18,
      inTransit: 41,
      returned: 1,
    },
    upcomingPickups: [
      {
        id: "1",
        location: "DEL",
        date: "Today",
        awbCount: 12,
        status: "Scheduled",
      },
    ],
  };

  const displayStats = stats || mockStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home</h1>
          <p className="text-sm text-gray-500">
            Welcome back! Here&apos;s your {selectedService.name} dashboard overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchStats} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href="/portal/orders/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Required Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <Link href="/portal/orders?filter=high-risk" className="group">
                  <div className="text-center p-4 rounded-lg border hover:border-red-300 hover:bg-red-50 transition-colors">
                    <p className="text-3xl font-bold text-red-600">
                      {displayStats.actionRequired.highRisk}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">High Risk Orders</p>
                    {displayStats.actionRequired.highRisk > 0 && (
                      <span className="text-xs text-red-600 font-medium">Act now</span>
                    )}
                  </div>
                </Link>
                <Link href="/portal/orders?filter=bad-address" className="group">
                  <div className="text-center p-4 rounded-lg border hover:border-amber-300 hover:bg-amber-50 transition-colors">
                    <p className="text-3xl font-bold text-amber-600">
                      {displayStats.actionRequired.badAddresses}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Bad Addresses</p>
                    {displayStats.actionRequired.badAddresses > 0 && (
                      <span className="text-xs text-amber-600 font-medium">Add Now</span>
                    )}
                  </div>
                </Link>
                <Link href="/portal/orders?status=pending" className="group">
                  <div className="text-center p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <p className="text-3xl font-bold text-blue-600">
                      {displayStats.actionRequired.pending}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Pending</p>
                  </div>
                </Link>
                <Link href="/portal/orders?status=to-be-shipped" className="group">
                  <div className="text-center p-4 rounded-lg border hover:border-green-300 hover:bg-green-50 transition-colors">
                    <p className="text-3xl font-bold text-green-600">
                      {displayStats.actionRequired.toBeShipped}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">To Be Shipped</p>
                    {displayStats.actionRequired.toBeShipped > 0 && (
                      <span className="text-xs text-green-600 font-medium">Manifest Now</span>
                    )}
                  </div>
                </Link>
                <Link href="/portal/exceptions" className="group">
                  <div className="text-center p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50 transition-colors">
                    <p className="text-3xl font-bold text-purple-600">
                      {displayStats.actionRequired.exceptions}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Exceptions and NDR</p>
                    {displayStats.actionRequired.exceptions > 0 && (
                      <span className="text-xs text-purple-600 font-medium">Act Now</span>
                    )}
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Pickups */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                Upcoming Pickups
              </CardTitle>
              <Link href="/portal/pickups" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {displayStats.upcomingPickups.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">No upcoming pickups</p>
                  <Link href="/portal/pickups/new">
                    <Button variant="outline" size="sm">Schedule a Pickup</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayStats.upcomingPickups.map((pickup) => (
                    <div
                      key={pickup.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                          {pickup.location}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{pickup.date}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">{pickup.awbCount} AWBs</span>
                          </div>
                          <Badge variant="info" size="sm" className="mt-1">
                            {pickup.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Download</Button>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          Escalate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Performance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Your Performance
              </CardTitle>
              <select className="text-sm border rounded-lg px-3 py-1.5">
                <option>Last 14 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* On-Time Delivery */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">On-Time Delivery Attempt</p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#E5E7EB"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#10B981"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${displayStats.performance.onTimeDeliveryPercent * 3.52} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-green-600">
                        {displayStats.performance.onTimeDeliveryPercent}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Average time for first attempt: {displayStats.performance.avgFirstAttemptDays} Days
                  </p>
                </div>

                {/* Successful Delivery Rate */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Successful Delivery Rate</p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#E5E7EB"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#3B82F6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${displayStats.performance.deliverySuccessRate * 3.52} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-blue-600">
                        {displayStats.performance.deliverySuccessRate}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    First Attempt Delivery: {displayStats.performance.firstAttemptPercent}%
                  </p>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">Delivered - {displayStats.today.delivered}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">Returned - {displayStats.today.returned}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600">In Transit - {displayStats.today.inTransit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - What's New */}
        <div className="space-y-6">
          {/* What's New */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                What&apos;s New
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {whatsNew.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={index}
                    href="#"
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        {item.isNew && (
                          <Badge variant="success" size="sm">New</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/portal/info/knowledge-base">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium">Knowledge Base</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/info/rate-calculator">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <Calculator className="h-8 w-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium">Rate Calculator</span>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Help Center */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <HeadphonesIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">Need Help?</p>
                  <p className="text-sm text-blue-100">24/7 Support Available</p>
                </div>
              </div>
              <Link href="/portal/support">
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  Help Center
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
