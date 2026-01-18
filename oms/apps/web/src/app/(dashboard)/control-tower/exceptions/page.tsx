"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Search,
  X,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Exception {
  id: string;
  type: string;
  orderNo: string;
  orderId: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  assignedTo: string | null;
}

const severityConfig: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: "Critical", color: "text-red-600" },
  HIGH: { label: "High", color: "text-orange-600" },
  MEDIUM: { label: "Medium", color: "text-yellow-600" },
  LOW: { label: "Low", color: "text-green-600" },
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  OPEN: { label: "Open", variant: "destructive" },
  IN_PROGRESS: { label: "In Progress", variant: "secondary" },
  RESOLVED: { label: "Resolved", variant: "default" },
  IGNORED: { label: "Ignored", variant: "outline" },
};

const exceptionTypes = [
  { value: "all", label: "All Types" },
  { value: "STUCK_ORDER", label: "Stuck Orders" },
  { value: "SLA_BREACH", label: "SLA Breach" },
  { value: "INVENTORY_ISSUE", label: "Inventory Issues" },
  { value: "CARRIER_DELAY", label: "Carrier Delays" },
  { value: "PAYMENT_ISSUE", label: "Payment Issues" },
];

export default function ExceptionManagementPage() {
  const router = useRouter();
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const fetchExceptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeTab !== "all") params.set("type", activeTab);
      params.set("limit", "50");

      const response = await fetch(`/api/v1/system/exceptions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch exceptions");
      const result = await response.json();

      // Map backend response to frontend interface
      const mappedExceptions = (result || []).map((e: Record<string, unknown>) => ({
        id: e.id,
        type: e.type || "UNKNOWN",
        orderNo: e.orderNo || e.exceptionCode || "-",
        orderId: e.orderId || "",
        description: e.description || e.message || "",
        severity: e.severity || "MEDIUM",
        status: e.status || "OPEN",
        createdAt: e.createdAt,
        resolvedAt: e.resolvedAt,
        assignedTo: e.assignedTo,
      }));

      setExceptions(mappedExceptions);
      setTotal(mappedExceptions.length);
    } catch (error) {
      console.error("Error fetching exceptions:", error);
      toast.error("Failed to load exceptions");
      setExceptions([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [search, activeTab]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  function clearFilters() {
    setSearch("");
    setActiveTab("all");
  }

  const hasFilters = search || activeTab !== "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/control-tower")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exception Management</h1>
            <p className="text-muted-foreground">
              Monitor and resolve operational exceptions and anomalies
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchExceptions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">Requires immediate action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {exceptionTypes.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order no or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exceptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exception Queue</CardTitle>
          <CardDescription>
            {total} exceptions found {hasFilters && "(filtered)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : exceptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">All Clear!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {hasFilters
                  ? "No exceptions match your filters"
                  : "No exceptions detected. Operations running smoothly."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exceptions.map((exception) => {
                  const severityInfo = severityConfig[exception.severity] || {
                    label: exception.severity,
                    color: "text-muted-foreground",
                  };
                  const statusInfo = statusConfig[exception.status] || {
                    label: exception.status,
                    variant: "outline" as const,
                  };

                  return (
                    <TableRow key={exception.id}>
                      <TableCell>
                        <Badge variant="outline">{exception.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => router.push(`/orders/${exception.orderId}`)}
                          className="font-medium text-primary hover:underline"
                        >
                          {exception.orderNo}
                        </button>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {exception.description}
                      </TableCell>
                      <TableCell>
                        <span className={severityInfo.color}>
                          {severityInfo.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(exception.createdAt), "dd MMM, HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
