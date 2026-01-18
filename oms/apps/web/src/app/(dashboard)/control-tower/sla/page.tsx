"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RefreshCw,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Truck,
  Package,
} from "lucide-react";

export default function SLAMonitorPage() {
  const router = useRouter();

  const slaMetrics = [
    {
      name: "Order Processing SLA",
      description: "Orders processed within 4 hours of confirmation",
      current: 0,
      target: 95,
      unit: "%",
      status: "no_data",
    },
    {
      name: "Same Day Dispatch",
      description: "Orders dispatched same day (if ordered before 2 PM)",
      current: 0,
      target: 90,
      unit: "%",
      status: "no_data",
    },
    {
      name: "Pick Accuracy",
      description: "Correct items picked without errors",
      current: 0,
      target: 99.5,
      unit: "%",
      status: "no_data",
    },
    {
      name: "On-Time Delivery",
      description: "Deliveries completed within committed TAT",
      current: 0,
      target: 85,
      unit: "%",
      status: "no_data",
    },
    {
      name: "NDR Resolution",
      description: "NDRs resolved within 48 hours",
      current: 0,
      target: 80,
      unit: "%",
      status: "no_data",
    },
    {
      name: "Return Processing",
      description: "Returns processed within 24 hours of receipt",
      current: 0,
      target: 90,
      unit: "%",
      status: "no_data",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/control-tower")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SLA Monitor</h1>
            <p className="text-muted-foreground">
              Track service level agreements and operational targets
            </p>
          </div>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Overall SLA Health */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall SLA Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <Progress value={0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">No data available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Target</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">of 6 metrics</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <p className="text-xs text-muted-foreground">Below target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breached</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {slaMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <Badge variant="outline">No Data</Badge>
              </div>
              <CardDescription className="text-xs">
                {metric.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">
                    Target: {metric.target}{metric.unit}
                  </p>
                </div>
                <div className="text-right">
                  <Progress value={0} className="w-24 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    0% of target
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SLA Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Performance Trend</CardTitle>
          <CardDescription>
            Weekly SLA compliance over the last 12 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>SLA trend chart will appear here</p>
              <p className="text-sm">No historical data available yet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Orders at SLA Risk</CardTitle>
          <CardDescription>
            Orders approaching or past their committed SLA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-muted-foreground font-medium">All Clear!</p>
            <p className="text-sm text-muted-foreground">
              No orders at SLA risk currently
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
