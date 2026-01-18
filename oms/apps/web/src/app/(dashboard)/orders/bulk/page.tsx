"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Package,
  Truck,
  XCircle,
  CheckCircle,
  FileText,
  Upload,
  Download,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BulkActionsPage() {
  const router = useRouter();

  const bulkActions = [
    {
      title: "Bulk Import Orders",
      description: "Import multiple orders from CSV or Excel file",
      icon: Upload,
      href: "/orders/import",
      color: "text-blue-600",
    },
    {
      title: "Bulk Ship Orders",
      description: "Generate AWBs and ship multiple orders at once",
      icon: Truck,
      action: "ship",
      color: "text-green-600",
    },
    {
      title: "Bulk Cancel Orders",
      description: "Cancel multiple orders in one action",
      icon: XCircle,
      action: "cancel",
      color: "text-red-600",
    },
    {
      title: "Bulk Print Labels",
      description: "Print shipping labels for selected orders",
      icon: FileText,
      action: "print_labels",
      color: "text-purple-600",
    },
    {
      title: "Bulk Print Invoices",
      description: "Generate and print invoices in bulk",
      icon: FileText,
      action: "print_invoices",
      color: "text-indigo-600",
    },
    {
      title: "Export Orders",
      description: "Download orders data in CSV or Excel format",
      icon: Download,
      action: "export",
      color: "text-teal-600",
    },
    {
      title: "Bulk Add to Wave",
      description: "Add multiple orders to a picking wave",
      icon: Layers,
      href: "/fulfillment/waves",
      color: "text-amber-600",
    },
    {
      title: "Bulk Update Status",
      description: "Update status of multiple orders",
      icon: CheckCircle,
      action: "update_status",
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/orders")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Actions</h1>
          <p className="text-muted-foreground">
            Perform operations on multiple orders at once
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to Use Bulk Actions</CardTitle>
          <CardDescription>
            Select orders from the orders list, then return here to perform bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Package className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No orders selected</p>
              <p className="text-sm text-muted-foreground">
                Go to All Orders and select the orders you want to process
              </p>
            </div>
            <Button
              variant="outline"
              className="ml-auto"
              onClick={() => router.push("/orders")}
            >
              Select Orders
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {bulkActions.map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => action.href ? router.push(action.href) : null}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <action.icon className={`h-5 w-5 ${action.color}`} />
                {action.href && <Badge variant="outline">Go</Badge>}
              </div>
              <CardTitle className="text-sm">{action.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {action.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bulk Operations</CardTitle>
          <CardDescription>
            History of bulk actions performed on orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent bulk operations</p>
            <p className="text-sm text-muted-foreground">
              Bulk operation history will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
