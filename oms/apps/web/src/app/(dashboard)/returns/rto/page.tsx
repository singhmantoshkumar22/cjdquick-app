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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, RotateCcw, Package, AlertTriangle, Clock, TrendingDown } from "lucide-react";

export default function RTOManagementPage() {
  const rtoOrders = [
    {
      id: "RTO001",
      orderId: "ORD-2024-1234",
      awb: "DEL123456789",
      courier: "Delhivery",
      reason: "Customer Refused",
      attempts: 3,
      status: "IN_TRANSIT",
      initiatedDate: "2024-01-12",
    },
    {
      id: "RTO002",
      orderId: "ORD-2024-1235",
      awb: "BLU987654321",
      courier: "BlueDart",
      reason: "Address Incorrect",
      attempts: 2,
      status: "RECEIVED",
      initiatedDate: "2024-01-10",
    },
    {
      id: "RTO003",
      orderId: "ORD-2024-1236",
      awb: "DTC456789123",
      courier: "DTDC",
      reason: "Customer Not Available",
      attempts: 3,
      status: "QC_PENDING",
      initiatedDate: "2024-01-08",
    },
  ];

  const statusColors: Record<string, string> = {
    INITIATED: "bg-yellow-100 text-yellow-800",
    IN_TRANSIT: "bg-purple-100 text-purple-800",
    RECEIVED: "bg-blue-100 text-blue-800",
    QC_PENDING: "bg-orange-100 text-orange-800",
    RESTOCKED: "bg-green-100 text-green-800",
    DAMAGED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RTO Management</h1>
          <p className="text-muted-foreground">
            Track and manage return to origin shipments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Active RTOs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">QC Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">89</p>
                <p className="text-sm text-muted-foreground">Restocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">8.5%</p>
                <p className="text-sm text-muted-foreground">RTO Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RTO Reasons Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>RTO Reasons Analysis</CardTitle>
          <CardDescription>Top reasons for return to origin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { reason: "Customer Refused", count: 45, percent: 35 },
              { reason: "Address Incorrect", count: 32, percent: 25 },
              { reason: "Customer Not Available", count: 28, percent: 22 },
              { reason: "Fake/Incomplete Address", count: 15, percent: 12 },
              { reason: "Other", count: 8, percent: 6 },
            ].map((item) => (
              <div key={item.reason} className="flex items-center gap-4">
                <div className="w-40 text-sm">{item.reason}</div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-sm text-muted-foreground">
                  {item.count} ({item.percent}%)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by AWB or Order ID..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="QC_PENDING">QC Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Courier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Couriers</SelectItem>
                <SelectItem value="delhivery">Delhivery</SelectItem>
                <SelectItem value="bluedart">BlueDart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* RTO List */}
      <Card>
        <CardHeader>
          <CardTitle>RTO Orders</CardTitle>
          <CardDescription>All return to origin shipments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RTO ID</TableHead>
                <TableHead>Order / AWB</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Initiated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rtoOrders.map((rto) => (
                <TableRow key={rto.id}>
                  <TableCell className="font-medium">{rto.id}</TableCell>
                  <TableCell>
                    <div>
                      <p>{rto.orderId}</p>
                      <p className="text-xs text-muted-foreground font-mono">{rto.awb}</p>
                    </div>
                  </TableCell>
                  <TableCell>{rto.courier}</TableCell>
                  <TableCell className="text-muted-foreground">{rto.reason}</TableCell>
                  <TableCell>{rto.attempts}</TableCell>
                  <TableCell className="text-muted-foreground">{rto.initiatedDate}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[rto.status]}>
                      {rto.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
