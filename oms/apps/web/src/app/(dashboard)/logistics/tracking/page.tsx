"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

export default function TrackingPage() {
  const [searchAWB, setSearchAWB] = useState("");

  const recentShipments = [
    {
      awb: "DEL123456789",
      orderId: "ORD-2024-1234",
      courier: "Delhivery",
      status: "IN_TRANSIT",
      lastUpdate: "Mumbai Hub",
      timestamp: "2 hours ago",
    },
    {
      awb: "BLU987654321",
      orderId: "ORD-2024-1235",
      courier: "BlueDart",
      status: "OUT_FOR_DELIVERY",
      lastUpdate: "Out for delivery",
      timestamp: "30 mins ago",
    },
    {
      awb: "DTC456789123",
      orderId: "ORD-2024-1236",
      courier: "DTDC",
      status: "DELIVERED",
      lastUpdate: "Delivered",
      timestamp: "Yesterday",
    },
    {
      awb: "EKT789123456",
      orderId: "ORD-2024-1237",
      courier: "Ekart",
      status: "PENDING",
      lastUpdate: "Awaiting pickup",
      timestamp: "1 hour ago",
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PICKED_UP: "bg-blue-100 text-blue-800",
    IN_TRANSIT: "bg-purple-100 text-purple-800",
    OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-green-100 text-green-800",
    RTO: "bg-red-100 text-red-800",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-4 w-4" />,
    PICKED_UP: <Package className="h-4 w-4" />,
    IN_TRANSIT: <Truck className="h-4 w-4" />,
    OUT_FOR_DELIVERY: <MapPin className="h-4 w-4" />,
    DELIVERED: <CheckCircle className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipment Tracking</h1>
        <p className="text-muted-foreground">
          Track shipments across all courier partners
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Track Shipment</CardTitle>
          <CardDescription>
            Enter AWB number or Order ID to track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter AWB or Order ID..."
                value={searchAWB}
                onChange={(e) => setSearchAWB(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>Track</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Shipments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Shipments</CardTitle>
              <CardDescription>Latest tracking updates</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AWB Number</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentShipments.map((shipment) => (
                <TableRow key={shipment.awb}>
                  <TableCell className="font-mono font-medium">
                    {shipment.awb}
                  </TableCell>
                  <TableCell>{shipment.orderId}</TableCell>
                  <TableCell>{shipment.courier}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[shipment.status]}>
                      <span className="flex items-center gap-1">
                        {statusIcons[shipment.status]}
                        {shipment.status.replace(/_/g, " ")}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {shipment.lastUpdate}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {shipment.timestamp}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-sm text-muted-foreground">Active Shipments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">456</div>
            <p className="text-sm text-muted-foreground">Delivered Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">89</div>
            <p className="text-sm text-muted-foreground">Out for Delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">23</div>
            <p className="text-sm text-muted-foreground">Exceptions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
