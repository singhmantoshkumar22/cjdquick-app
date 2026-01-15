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
import { Plus, Search, Download, FileText, Eye } from "lucide-react";

export default function InvoicesPage() {
  const invoices = [
    {
      id: "GST/2024/001234",
      orderId: "ORD-2024-1234",
      customer: "John Doe",
      date: "2024-01-15",
      amount: 4599,
      gst: 414,
      total: 5013,
      status: "GENERATED",
    },
    {
      id: "GST/2024/001235",
      orderId: "ORD-2024-1235",
      customer: "Jane Smith",
      date: "2024-01-14",
      amount: 2999,
      gst: 270,
      total: 3269,
      status: "SENT",
    },
    {
      id: "GST/2024/001236",
      orderId: "ORD-2024-1236",
      customer: "Bob Wilson",
      date: "2024-01-13",
      amount: 8999,
      gst: 810,
      total: 9809,
      status: "GENERATED",
    },
  ];

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    GENERATED: "bg-blue-100 text-blue-800",
    SENT: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
          <p className="text-muted-foreground">
            Generate and manage GST compliant invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Bulk Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">1,234</p>
            <p className="text-sm text-muted-foreground">Total Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">₹45,67,890</p>
            <p className="text-sm text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">₹4,11,110</p>
            <p className="text-sm text-muted-foreground">GST Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">89</p>
            <p className="text-sm text-muted-foreground">Today's Invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by Invoice # or Order ID..." className="pl-10" />
            </div>
            <Input type="date" className="w-40" />
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>GST invoices generated for orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.orderId}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                  <TableCell className="text-right">₹{invoice.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{invoice.gst.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold">₹{invoice.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
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
