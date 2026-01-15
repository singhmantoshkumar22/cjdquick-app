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
import { Download, FileText, IndianRupee, Truck, Calendar } from "lucide-react";

export default function FreightBillingPage() {
  const bills = [
    {
      id: "INV-2024-001",
      courier: "Delhivery",
      period: "Jan 1-15, 2024",
      shipments: 456,
      grossAmount: 45600,
      adjustments: -2340,
      netAmount: 43260,
      status: "PENDING",
      dueDate: "2024-01-30",
    },
    {
      id: "INV-2024-002",
      courier: "BlueDart",
      period: "Jan 1-15, 2024",
      shipments: 234,
      grossAmount: 28900,
      adjustments: -890,
      netAmount: 28010,
      status: "PAID",
      dueDate: "2024-01-25",
    },
    {
      id: "INV-2023-052",
      courier: "DTDC",
      period: "Dec 16-31, 2023",
      shipments: 189,
      grossAmount: 18900,
      adjustments: -450,
      netAmount: 18450,
      status: "OVERDUE",
      dueDate: "2024-01-10",
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
    DISPUTED: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Freight Billing</h1>
          <p className="text-muted-foreground">
            Manage courier invoices and freight reconciliation
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">₹1,23,456</p>
                <p className="text-sm text-muted-foreground">Total This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">₹43,260</p>
                <p className="text-sm text-muted-foreground">Pending Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">879</p>
                <p className="text-sm text-muted-foreground">Shipments Billed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">₹18,450</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Freight Invoices</CardTitle>
          <CardDescription>
            Courier freight bills and payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Shipments</TableHead>
                <TableHead className="text-right">Gross Amount</TableHead>
                <TableHead className="text-right">Adjustments</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.id}</TableCell>
                  <TableCell>{bill.courier}</TableCell>
                  <TableCell className="text-muted-foreground">{bill.period}</TableCell>
                  <TableCell className="text-right">{bill.shipments}</TableCell>
                  <TableCell className="text-right">₹{bill.grossAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">
                    {bill.adjustments < 0 ? "-" : "+"}₹{Math.abs(bill.adjustments).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ₹{bill.netAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{bill.dueDate}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[bill.status]}>{bill.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">View</Button>
                      {bill.status === "PENDING" && (
                        <Button variant="outline" size="sm">Pay</Button>
                      )}
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
