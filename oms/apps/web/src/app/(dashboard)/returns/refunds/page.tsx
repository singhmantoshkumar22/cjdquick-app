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
import { Search, IndianRupee, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function RefundsPage() {
  const refunds = [
    {
      id: "REF001",
      orderId: "ORD-2024-1234",
      customer: "John Doe",
      amount: 2499,
      method: "Bank Transfer",
      reason: "Product Return",
      requestDate: "2024-01-15",
      status: "PENDING",
    },
    {
      id: "REF002",
      orderId: "ORD-2024-1235",
      customer: "Jane Smith",
      amount: 1599,
      method: "Original Payment",
      reason: "Order Cancelled",
      requestDate: "2024-01-14",
      status: "PROCESSING",
    },
    {
      id: "REF003",
      orderId: "ORD-2024-1236",
      customer: "Bob Wilson",
      amount: 3999,
      method: "Wallet Credit",
      reason: "Product Return",
      requestDate: "2024-01-13",
      status: "COMPLETED",
    },
    {
      id: "REF004",
      orderId: "ORD-2024-1237",
      customer: "Alice Brown",
      amount: 899,
      method: "Bank Transfer",
      reason: "Partial Return",
      requestDate: "2024-01-12",
      status: "REJECTED",
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    FAILED: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refund Processing</h1>
          <p className="text-muted-foreground">
            Manage customer refunds and payment reversals
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-sm text-muted-foreground">Pending Refunds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">₹45,678</p>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">₹1,23,456</p>
                <p className="text-sm text-muted-foreground">Processed This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">2.5 days</p>
              <p className="text-sm text-muted-foreground">Avg. Processing Time</p>
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
              <Input placeholder="Search by Order ID or Customer..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="original">Original Payment</SelectItem>
                <SelectItem value="wallet">Wallet Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
          <CardDescription>All refund requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Refund ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell className="font-medium">{refund.id}</TableCell>
                  <TableCell>{refund.orderId}</TableCell>
                  <TableCell>{refund.customer}</TableCell>
                  <TableCell className="text-right font-bold">₹{refund.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{refund.method}</TableCell>
                  <TableCell className="text-muted-foreground">{refund.reason}</TableCell>
                  <TableCell className="text-muted-foreground">{refund.requestDate}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[refund.status]}>{refund.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {refund.status === "PENDING" ? (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="text-green-600">
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm">View</Button>
                    )}
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
