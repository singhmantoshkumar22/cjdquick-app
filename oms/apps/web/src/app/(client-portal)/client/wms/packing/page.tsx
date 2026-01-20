"use client";

import { useState, useEffect, useCallback } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, PackageCheck, Clock, CheckCircle, Box, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PackingOrder {
  id: string;
  orderNo: string;
  channel: string;
  customerName: string;
  status: string;
  itemCount: number;
  totalAmount: number;
  pickedAt?: string;
  packingStation?: string;
}

interface PackingStats {
  readyToPack: number;
  inProgress: number;
  packedToday: number;
  totalPacked: number;
}

export default function ClientPackingPage() {
  const [packingQueue, setPackingQueue] = useState<PackingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PackingStats | null>(null);
  const [search, setSearch] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Packing dialog state
  const [selectedOrder, setSelectedOrder] = useState<PackingOrder | null>(null);
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  const [packingForm, setPackingForm] = useState({
    boxes: 1,
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const fetchPackingOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/v1/packing?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPackingQueue(data);
      }
    } catch (error) {
      console.error("Error fetching packing orders:", error);
      toast.error("Failed to load packing queue");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/packing/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchPackingOrders();
    fetchStats();
  }, [fetchPackingOrders, fetchStats]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPackingOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStartPacking = async (order: PackingOrder) => {
    setActionLoading(order.id);
    try {
      const response = await fetch(`/api/v1/packing/${order.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to start packing");
      }

      toast.success(`Started packing order ${order.orderNo}`);
      fetchPackingOrders();
      fetchStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start packing");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompletePacking = async () => {
    if (!selectedOrder) return;

    setActionLoading(selectedOrder.id);
    try {
      const response = await fetch(`/api/v1/packing/${selectedOrder.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          boxes: packingForm.boxes,
          weight: packingForm.weight ? parseFloat(packingForm.weight) : null,
          length: packingForm.length ? parseFloat(packingForm.length) : null,
          width: packingForm.width ? parseFloat(packingForm.width) : null,
          height: packingForm.height ? parseFloat(packingForm.height) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to complete packing");
      }

      const result = await response.json();
      toast.success(`Packing completed. Delivery ${result.deliveryNo} created.`);
      setPackingDialogOpen(false);
      setSelectedOrder(null);
      setPackingForm({ boxes: 1, weight: "", length: "", width: "", height: "" });
      fetchPackingOrders();
      fetchStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete packing");
    } finally {
      setActionLoading(null);
    }
  };

  const handleScanOrder = async () => {
    if (!scanInput.trim()) return;

    try {
      // Find order by order number in the current queue
      const order = packingQueue.find(
        (o) => o.orderNo.toLowerCase() === scanInput.toLowerCase()
      );

      if (order) {
        if (order.status === "PICKED") {
          handleStartPacking(order);
        } else if (order.status === "PACKING") {
          setSelectedOrder(order);
          setPackingDialogOpen(true);
        } else {
          toast.info(`Order ${order.orderNo} is already ${order.status}`);
        }
      } else {
        toast.error(`Order ${scanInput} not found in packing queue`);
      }
    } catch (error) {
      toast.error("Error processing scan");
    }
    setScanInput("");
  };

  const statusColors: Record<string, string> = {
    PICKED: "bg-blue-100 text-blue-800",
    PACKING: "bg-yellow-100 text-yellow-800",
    PACKED: "bg-green-100 text-green-800",
  };

  const getDisplayStatus = (status: string) => {
    if (status === "PICKED") return "READY";
    return status;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Packing</h1>
          <p className="text-muted-foreground">
            Pack picked orders for shipment
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchPackingOrders(); fetchStats(); }}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.readyToPack || 0}</p>
                <p className="text-sm text-muted-foreground">Ready to Pack</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.packedToday || 0}</p>
                <p className="text-sm text-muted-foreground">Packed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalPacked || 0}</p>
                <p className="text-sm text-muted-foreground">Total Packed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan order barcode or enter Order ID..."
                className="pl-10"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScanOrder()}
              />
            </div>
            <Button onClick={handleScanOrder}>Start Packing</Button>
          </div>
        </CardContent>
      </Card>

      {/* Packing Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Packing Queue</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${packingQueue.length} orders in queue`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Picked At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packingQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders in packing queue
                    </TableCell>
                  </TableRow>
                ) : (
                  packingQueue.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNo}</TableCell>
                      <TableCell>{order.channel}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.itemCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTime(order.pickedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                          {getDisplayStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status === "PICKED" ? (
                          <Button
                            size="sm"
                            onClick={() => handleStartPacking(order)}
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Pack"
                            )}
                          </Button>
                        ) : order.status === "PACKING" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setPackingDialogOpen(true);
                            }}
                          >
                            Complete
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">View</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Packing Complete Dialog */}
      <Dialog open={packingDialogOpen} onOpenChange={setPackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Packing</DialogTitle>
            <DialogDescription>
              Enter packing details for order {selectedOrder?.orderNo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="boxes">Number of Boxes</Label>
                <Input
                  id="boxes"
                  type="number"
                  min="1"
                  value={packingForm.boxes}
                  onChange={(e) =>
                    setPackingForm({ ...packingForm, boxes: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Optional"
                  value={packingForm.weight}
                  onChange={(e) =>
                    setPackingForm({ ...packingForm, weight: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={packingForm.length}
                  onChange={(e) =>
                    setPackingForm({ ...packingForm, length: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={packingForm.width}
                  onChange={(e) =>
                    setPackingForm({ ...packingForm, width: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={packingForm.height}
                  onChange={(e) =>
                    setPackingForm({ ...packingForm, height: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPackingDialogOpen(false);
                setSelectedOrder(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompletePacking}
              disabled={actionLoading === selectedOrder?.id}
            >
              {actionLoading === selectedOrder?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Complete Packing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
