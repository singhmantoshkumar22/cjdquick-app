"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Search, Download, Filter, ShoppingCart, Clock, CheckCircle, Truck, Plus, Loader2 } from "lucide-react";

interface Order {
  id: string;
  orderNo: string;
  channel: string;
  customerName: string;
  totalAmount: number;
  status: string;
  orderDate: string;
  itemCount?: number;
}

interface OrderStats {
  status_counts: Record<string, number>;
  total_amount: number;
}

export default function ClientOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 25;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("skip", String(page * limit));
      params.append("limit", String(limit));

      if (search) {
        params.append("search", search);
      }
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (channelFilter && channelFilter !== "all") {
        params.append("channel", channelFilter);
      }

      const response = await fetch(`/api/v1/orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data);

      // Fetch count
      const countResponse = await fetch(`/api/v1/orders/count?${params.toString()}`);
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setTotalCount(countData.count);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, channelFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/orders/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Calculate stats from API data
  const todayTotal = stats?.status_counts ? Object.values(stats.status_counts).reduce((a, b) => a + b, 0) : 0;
  const pendingCount = stats?.status_counts?.CREATED || 0 + (stats?.status_counts?.CONFIRMED || 0);
  const inTransitCount = stats?.status_counts?.SHIPPED || 0 + (stats?.status_counts?.IN_TRANSIT || 0);
  const deliveredCount = stats?.status_counts?.DELIVERED || 0;

  const statusColors: Record<string, string> = {
    CREATED: "bg-gray-100 text-gray-800",
    PENDING: "bg-gray-100 text-gray-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-yellow-100 text-yellow-800",
    ALLOCATED: "bg-indigo-100 text-indigo-800",
    PICKING: "bg-orange-100 text-orange-800",
    PICKED: "bg-amber-100 text-amber-800",
    PACKING: "bg-cyan-100 text-cyan-800",
    PACKED: "bg-teal-100 text-teal-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    IN_TRANSIT: "bg-purple-100 text-purple-800",
    OUT_FOR_DELIVERY: "bg-violet-100 text-violet-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Orders</h1>
          <p className="text-muted-foreground">
            View and manage all your orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/client/orders/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{inTransitCount}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{deliveredCount}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Order ID, Customer..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={channelFilter} onValueChange={(value) => { setChannelFilter(value); setPage(0); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="AMAZON">Amazon</SelectItem>
                <SelectItem value="FLIPKART">Flipkart</SelectItem>
                <SelectItem value="MYNTRA">Myntra</SelectItem>
                <SelectItem value="SHOPIFY">Shopify</SelectItem>
                <SelectItem value="AJIO">Ajio</SelectItem>
                <SelectItem value="MEESHO">Meesho</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(0); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="CREATED">Created</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="ALLOCATED">Allocated</SelectItem>
                <SelectItem value="PICKED">Picked</SelectItem>
                <SelectItem value="PACKED">Packed</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); setChannelFilter("all"); setPage(0); }}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `Showing ${orders.length} of ${totalCount} orders`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-lg">
              {error}
              <Button variant="link" onClick={fetchOrders} className="ml-2">
                Retry
              </Button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNo}</TableCell>
                        <TableCell>{order.channel}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell className="text-right font-bold">
                          ₹{Number(order.totalAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.orderDate)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/client/orders/${order.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
