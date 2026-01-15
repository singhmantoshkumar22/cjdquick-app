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
import { Plus, Settings, RefreshCw, CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default function ChannelsPage() {
  const channels = [
    {
      id: "1",
      name: "Amazon India",
      type: "MARKETPLACE",
      status: "ACTIVE",
      lastSync: "5 mins ago",
      ordersToday: 45,
      pendingSync: 0,
      logo: "AMZ",
    },
    {
      id: "2",
      name: "Flipkart",
      type: "MARKETPLACE",
      status: "ACTIVE",
      lastSync: "10 mins ago",
      ordersToday: 32,
      pendingSync: 2,
      logo: "FK",
    },
    {
      id: "3",
      name: "Myntra",
      type: "MARKETPLACE",
      status: "ACTIVE",
      lastSync: "15 mins ago",
      ordersToday: 28,
      pendingSync: 0,
      logo: "MYN",
    },
    {
      id: "4",
      name: "Shopify Store",
      type: "WEBSTORE",
      status: "ACTIVE",
      lastSync: "2 mins ago",
      ordersToday: 12,
      pendingSync: 0,
      logo: "SHO",
    },
    {
      id: "5",
      name: "Meesho",
      type: "MARKETPLACE",
      status: "INACTIVE",
      lastSync: "2 days ago",
      ordersToday: 0,
      pendingSync: 15,
      logo: "MEE",
    },
  ];

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    ERROR: "bg-red-100 text-red-800",
    SYNCING: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace Integrations</h1>
          <p className="text-muted-foreground">
            Manage marketplace and webstore connections
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Channel
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Active Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">117</p>
                <p className="text-sm text-muted-foreground">Orders Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">17</p>
                <p className="text-sm text-muted-foreground">Pending Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">99.2%</p>
              <p className="text-sm text-muted-foreground">Sync Success Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <Card key={channel.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {channel.logo}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                    <CardDescription>{channel.type}</CardDescription>
                  </div>
                </div>
                <Badge className={statusColors[channel.status]}>{channel.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Orders Today</span>
                  <span className="font-medium">{channel.ordersToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Sync</span>
                  <span className={`font-medium ${channel.pendingSync > 0 ? "text-yellow-600" : ""}`}>
                    {channel.pendingSync}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="text-muted-foreground">{channel.lastSync}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Sync
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>Connect more sales channels to expand your reach</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {["Ajio", "Nykaa", "Tata Cliq", "JioMart", "WooCommerce", "Magento", "BigCommerce", "PrestaShop"].map((name) => (
              <div key={name} className="p-4 border rounded-lg text-center hover:border-blue-500 cursor-pointer transition-colors">
                <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xs font-bold">
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs text-muted-foreground">{name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
