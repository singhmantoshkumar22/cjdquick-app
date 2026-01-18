"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Layers,
  Zap,
  Users,
  ClipboardList,
  RefreshCw,
  Plus,
  Trash2,
  Search,
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface WaveDetail {
  id: string;
  waveNo: string;
  name: string;
  status: string;
  waveType: string;
  priority: number;
  createdAt: string;
  releasedAt: string | null;
  completedAt: string | null;
  location: {
    id: string;
    code: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  orders: Array<{
    id: string;
    orderId: string;
    order: {
      id: string;
      orderNo: string;
      status: string;
      customer: {
        name: string;
      };
      items: Array<{
        id: string;
        quantity: number;
        sku: {
          skuCode: string;
          name: string;
        };
      }>;
    };
  }>;
  picklists: Array<{
    id: string;
    picklistNo: string;
    status: string;
    assignedTo: {
      id: string;
      name: string;
    } | null;
  }>;
  stats: {
    totalOrders: number;
    totalItems: number;
    pickedItems: number;
    completionPercentage: number;
  };
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  DRAFT: { label: "Draft", variant: "outline", icon: Clock },
  PLANNED: { label: "Planned", variant: "secondary", icon: Layers },
  RELEASED: { label: "Released", variant: "secondary", icon: Play },
  IN_PROGRESS: { label: "In Progress", variant: "default", icon: Zap },
  COMPLETED: { label: "Completed", variant: "default", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

export default function WaveDetailPage() {
  const router = useRouter();
  const params = useParams();
  const waveId = params.id as string;

  const [wave, setWave] = useState<WaveDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showAddOrders, setShowAddOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");

  const fetchWave = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/waves/${waveId}`);
      if (!response.ok) throw new Error("Failed to fetch wave");
      const result = await response.json();
      setWave(result);
    } catch (error) {
      console.error("Error fetching wave:", error);
      toast.error("Failed to load wave details");
    } finally {
      setIsLoading(false);
    }
  }, [waveId]);

  const fetchAvailableOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("status", "CONFIRMED,ALLOCATED");
      params.set("limit", "50");
      if (orderSearch) params.set("search", orderSearch);

      const response = await fetch(`/api/v1/orders?${params}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const result = await response.json();
      setAvailableOrders(result.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, [orderSearch]);

  useEffect(() => {
    fetchWave();
  }, [fetchWave]);

  useEffect(() => {
    if (showAddOrders) {
      fetchAvailableOrders();
    }
  }, [showAddOrders, fetchAvailableOrders]);

  async function handleAction(action: string) {
    try {
      const response = await fetch(`/api/v1/waves/${waveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Wave ${action}d successfully`);
        fetchWave();
      } else {
        toast.error(result.error || `Failed to ${action} wave`);
      }
    } catch (error) {
      console.error(`Error ${action}ing wave:`, error);
      toast.error(`Failed to ${action} wave`);
    }
  }

  async function handleAddOrders() {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders to add");
      return;
    }

    try {
      const response = await fetch(`/api/v1/waves/${waveId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Added ${selectedOrders.length} orders to wave`);
        setSelectedOrders([]);
        setShowAddOrders(false);
        fetchWave();
      } else {
        toast.error(result.error || "Failed to add orders");
      }
    } catch (error) {
      console.error("Error adding orders:", error);
      toast.error("Failed to add orders");
    }
  }

  async function handleRemoveOrder(orderId: string) {
    try {
      const response = await fetch(`/api/v1/waves/${waveId}/orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Order removed from wave");
        fetchWave();
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to remove order");
      }
    } catch (error) {
      console.error("Error removing order:", error);
      toast.error("Failed to remove order");
    }
  }

  async function handleGeneratePicklist() {
    try {
      const response = await fetch(`/api/v1/waves/${waveId}/picklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Picklist generated successfully");
        fetchWave();
      } else {
        toast.error(result.error || "Failed to generate picklist");
      }
    } catch (error) {
      console.error("Error generating picklist:", error);
      toast.error("Failed to generate picklist");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-muted-foreground">Loading wave details...</div>
      </div>
    );
  }

  if (!wave) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Wave not found</p>
        <Button
          variant="link"
          onClick={() => router.push("/fulfillment/waves")}
          className="mt-2"
        >
          Back to waves
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[wave.status] || {
    label: wave.status,
    variant: "outline" as const,
    icon: Clock,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/fulfillment/waves")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{wave.waveNo}</h1>
              <Badge variant={statusInfo.variant}>
                <statusInfo.icon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
            {wave.name && (
              <p className="text-muted-foreground">{wave.name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchWave}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {wave.status === "DRAFT" && (
            <Button onClick={() => handleAction("plan")}>
              <Layers className="mr-2 h-4 w-4" />
              Plan Wave
            </Button>
          )}
          {wave.status === "PLANNED" && (
            <Button onClick={() => handleAction("release")}>
              <Play className="mr-2 h-4 w-4" />
              Release Wave
            </Button>
          )}
          {wave.status === "RELEASED" && (
            <Button onClick={() => handleAction("start")}>
              <Zap className="mr-2 h-4 w-4" />
              Start Picking
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wave.stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wave.stats?.totalItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Picked Items</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wave.stats?.pickedItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Progress value={wave.stats?.completionPercentage || 0} className="flex-1 h-2" />
              <span className="text-sm font-medium">
                {wave.stats?.completionPercentage || 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wave Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Wave Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Wave Type</p>
                <p className="font-medium">{wave.waveType?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Priority</p>
                <p className="font-medium">{wave.priority}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{wave.location?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p className="font-medium">{wave.createdBy?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {format(new Date(wave.createdAt), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
              {wave.releasedAt && (
                <div>
                  <p className="text-muted-foreground">Released At</p>
                  <p className="font-medium">
                    {format(new Date(wave.releasedAt), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Picklists</CardTitle>
            {["PLANNED", "RELEASED"].includes(wave.status) && (
              <Button size="sm" onClick={handleGeneratePicklist}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Generate Picklist
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {wave.picklists?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No picklists generated yet
              </p>
            ) : (
              <div className="space-y-2">
                {wave.picklists?.map((picklist) => (
                  <div
                    key={picklist.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <button
                        onClick={() => router.push(`/fulfillment/picklist/${picklist.id}`)}
                        className="font-medium text-primary hover:underline"
                      >
                        {picklist.picklistNo}
                      </button>
                      {picklist.assignedTo && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {picklist.assignedTo.name}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{picklist.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Wave Orders</CardTitle>
            <CardDescription>
              {wave.orders?.length || 0} orders in this wave
            </CardDescription>
          </div>
          {wave.status === "DRAFT" && (
            <Button onClick={() => setShowAddOrders(!showAddOrders)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Orders
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showAddOrders && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3">Add Orders to Wave</h4>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleAddOrders} disabled={selectedOrders.length === 0}>
                  Add Selected ({selectedOrders.length})
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {availableOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 p-2 border rounded"
                  >
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOrders((prev) => [...prev, order.id]);
                        } else {
                          setSelectedOrders((prev) =>
                            prev.filter((id) => id !== order.id)
                          );
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{order.orderNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer?.name} • {order.items?.length || 0} items
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wave.orders?.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders in this wave</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add orders to start wave planning
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  {wave.status === "DRAFT" && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {wave.orders?.map((waveOrder) => (
                  <TableRow key={waveOrder.id}>
                    <TableCell>
                      <button
                        onClick={() => router.push(`/orders/${waveOrder.order.id}`)}
                        className="font-medium text-primary hover:underline"
                      >
                        {waveOrder.order.orderNo}
                      </button>
                    </TableCell>
                    <TableCell>{waveOrder.order.customer?.name}</TableCell>
                    <TableCell>{waveOrder.order.items?.length || 0} items</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{waveOrder.order.status}</Badge>
                    </TableCell>
                    {wave.status === "DRAFT" && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOrder(waveOrder.orderId)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
