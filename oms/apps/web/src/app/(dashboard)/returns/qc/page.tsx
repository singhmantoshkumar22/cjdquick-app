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
import { ClipboardCheck, Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function ReturnQCPage() {
  const qcQueue = [
    {
      id: "RQC001",
      orderId: "ORD-2024-1234",
      sku: "SKU-TSHIRT-BLU-M",
      productName: "Blue T-Shirt M",
      returnReason: "Wrong Size",
      receivedDate: "2024-01-15",
      status: "PENDING",
    },
    {
      id: "RQC002",
      orderId: "ORD-2024-1235",
      sku: "SKU-JEANS-BLK-32",
      productName: "Black Jeans 32",
      returnReason: "Damaged",
      receivedDate: "2024-01-14",
      status: "IN_PROGRESS",
    },
    {
      id: "RQC003",
      orderId: "ORD-2024-1236",
      sku: "SKU-SHIRT-WHT-L",
      productName: "White Shirt L",
      returnReason: "Quality Issue",
      receivedDate: "2024-01-13",
      status: "PASSED",
    },
    {
      id: "RQC004",
      orderId: "ORD-2024-1237",
      sku: "SKU-DRESS-RED-S",
      productName: "Red Dress S",
      returnReason: "Not as Described",
      receivedDate: "2024-01-12",
      status: "FAILED",
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    PASSED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <ClipboardCheck className="h-4 w-4" />,
    IN_PROGRESS: <Package className="h-4 w-4" />,
    PASSED: <CheckCircle className="h-4 w-4" />,
    FAILED: <XCircle className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Return QC</h1>
          <p className="text-muted-foreground">
            Quality check for returned products
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Pending QC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">234</p>
                <p className="text-sm text-muted-foreground">Passed (Restockable)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-sm text-muted-foreground">Failed (Damaged)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">91%</p>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QC Queue */}
      <Card>
        <CardHeader>
          <CardTitle>QC Queue</CardTitle>
          <CardDescription>Returns awaiting quality inspection</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QC ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Return Reason</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qcQueue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.orderId}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className="text-muted-foreground">{item.returnReason}</TableCell>
                  <TableCell className="text-muted-foreground">{item.receivedDate}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[item.status]}>
                      <span className="flex items-center gap-1">
                        {statusIcons[item.status]}
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.status === "PENDING" || item.status === "IN_PROGRESS" ? (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="text-green-600">
                          Pass
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          Fail
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

      {/* QC Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>QC Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Pass Criteria (Restockable)</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Product in original packaging</li>
                <li>• No visible damage or stains</li>
                <li>• All tags intact</li>
                <li>• No signs of use</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Fail Criteria (Non-Restockable)</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Visible damage or defects</li>
                <li>• Missing components or tags</li>
                <li>• Signs of wear or washing</li>
                <li>• Hygiene products opened</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
