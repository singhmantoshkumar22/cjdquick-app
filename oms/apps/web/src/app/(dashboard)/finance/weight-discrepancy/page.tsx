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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Scale, AlertTriangle, CheckCircle, Search, Download } from "lucide-react";

export default function WeightDiscrepancyPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const disputes = [
    {
      id: "WD001",
      awb: "DEL123456789",
      orderId: "ORD-2024-1234",
      courier: "Delhivery",
      declaredWeight: 0.5,
      chargedWeight: 1.2,
      difference: 0.7,
      chargeImpact: 125,
      status: "PENDING",
      date: "2024-01-15",
    },
    {
      id: "WD002",
      awb: "BLU987654321",
      orderId: "ORD-2024-1235",
      courier: "BlueDart",
      declaredWeight: 1.0,
      chargedWeight: 2.5,
      difference: 1.5,
      chargeImpact: 280,
      status: "DISPUTED",
      date: "2024-01-14",
    },
    {
      id: "WD003",
      awb: "DTC456789123",
      orderId: "ORD-2024-1236",
      courier: "DTDC",
      declaredWeight: 0.8,
      chargedWeight: 1.0,
      difference: 0.2,
      chargeImpact: 45,
      status: "RESOLVED",
      date: "2024-01-13",
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    DISPUTED: "bg-red-100 text-red-800",
    RESOLVED: "bg-green-100 text-green-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weight Discrepancy</h1>
          <p className="text-muted-foreground">
            Manage courier weight disputes and volumetric billing issues
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">₹12,450</p>
                <p className="text-sm text-muted-foreground">Disputed Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">₹8,900</p>
                <p className="text-sm text-muted-foreground">Recovered This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">78%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by AWB or Order ID..." className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="DISPUTED">Disputed</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
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
                <SelectItem value="dtdc">DTDC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Disputes</CardTitle>
          <CardDescription>Review and dispute overcharged shipments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AWB / Order</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead className="text-right">Declared (kg)</TableHead>
                <TableHead className="text-right">Charged (kg)</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead className="text-right">Impact (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <div>
                      <p className="font-mono font-medium">{dispute.awb}</p>
                      <p className="text-sm text-muted-foreground">{dispute.orderId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{dispute.courier}</TableCell>
                  <TableCell className="text-right">{dispute.declaredWeight}</TableCell>
                  <TableCell className="text-right font-medium">{dispute.chargedWeight}</TableCell>
                  <TableCell className="text-right text-red-600">+{dispute.difference}</TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    ₹{dispute.chargeImpact}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[dispute.status]}>{dispute.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        Dispute
                      </Button>
                      <Button variant="ghost" size="sm">
                        Accept
                      </Button>
                    </div>
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
