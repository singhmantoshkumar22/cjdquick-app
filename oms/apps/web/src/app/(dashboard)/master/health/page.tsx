"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Server,
  Database,
  Globe,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SystemHealthPage() {
  const services = [
    {
      name: "API Server",
      status: "operational",
      uptime: "99.9%",
      responseTime: "45ms",
      icon: Server,
    },
    {
      name: "Database",
      status: "operational",
      uptime: "99.99%",
      responseTime: "12ms",
      icon: Database,
    },
    {
      name: "CDN",
      status: "operational",
      uptime: "100%",
      responseTime: "8ms",
      icon: Globe,
    },
    {
      name: "Background Jobs",
      status: "operational",
      uptime: "99.5%",
      responseTime: "N/A",
      icon: Activity,
    },
  ];

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ElementType }> = {
    operational: { label: "Operational", variant: "default", icon: CheckCircle },
    degraded: { label: "Degraded", variant: "secondary", icon: AlertTriangle },
    down: { label: "Down", variant: "destructive", icon: XCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor platform infrastructure and service status
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Systems Operational</CardTitle>
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Healthy
            </Badge>
          </div>
          <CardDescription>
            Last checked: just now
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Service Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => {
          const status = statusConfig[service.status];
          return (
            <Card key={service.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
                <service.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <status.icon className={`h-4 w-4 ${service.status === 'operational' ? 'text-green-600' : 'text-yellow-600'}`} />
                  <span className="font-medium">{status.label}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Uptime: {service.uptime}</p>
                  <p>Response: {service.responseTime}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resource Usage */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23%</div>
            <Progress value={23} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">2 cores available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45%</div>
            <Progress value={45} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">1.8 GB / 4 GB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 MB/s</div>
            <Progress value={12} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Bandwidth: 100 MB/s</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>
            Platform incidents and maintenance windows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-muted-foreground font-medium">No Recent Incidents</p>
            <p className="text-sm text-muted-foreground">
              The platform has been running smoothly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
