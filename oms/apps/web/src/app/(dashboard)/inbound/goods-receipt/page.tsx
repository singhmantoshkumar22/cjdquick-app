"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  MoreHorizontal,
  Eye,
  PackageCheck,
  FileText,
  Search,
  Filter,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface GoodsReceipt {
  id: string;
  grNo: string;
  inboundId: string | null;
  purchaseOrderId: string | null;
  asnNo: string | null;
  status: string;
  movementType: string;
  totalQty: number;
  totalValue: number;
  locationId: string;
  companyId: string;
  receivedAt: string | null;
  postedAt: string | null;
  itemCount: number;
  createdAt: string;
}

interface Location {
  id: string;
  code: string;
  name: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-500" },
  RECEIVING: { label: "Receiving", color: "bg-blue-500" },
  POSTED: { label: "Posted", color: "bg-green-500" },
  REVERSED: { label: "Reversed", color: "bg-orange-500" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500" },
};

export default function GoodsReceiptsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");

  const canManage = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(
    session?.user?.role || ""
  );

  useEffect(() => {
    fetchLocations();
    fetchGoodsReceipts();
  }, [filterStatus, filterLocation]);

  async function fetchLocations() {
    try {
      const response = await fetch("/api/v1/locations");
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }

  async function fetchGoodsReceipts() {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      if (filterLocation && filterLocation !== "all") {
        params.append("location_id", filterLocation);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/v1/goods-receipts?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch goods receipts");
      const data = await response.json();
      setGoodsReceipts(data);
    } catch (error) {
      console.error("Error fetching goods receipts:", error);
      toast.error("Failed to load goods receipts");
    } finally {
      setIsLoading(false);
    }
  }

  const getLocationName = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    return location?.name || "Unknown";
  };

  const filteredReceipts = goodsReceipts.filter((gr) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        gr.grNo.toLowerCase().includes(query) ||
        gr.asnNo?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: goodsReceipts.length,
      DRAFT: 0,
      RECEIVING: 0,
      POSTED: 0,
      REVERSED: 0,
      CANCELLED: 0,
    };
    goodsReceipts.forEach((gr) => {
      if (counts[gr.status] !== undefined) {
        counts[gr.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goods Receipt</h1>
          <p className="text-muted-foreground">
            Manage inbound goods receipt documents
          </p>
        </div>
        {canManage && (
          <Button onClick={() => router.push("/inbound/goods-receipt/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Goods Receipt
          </Button>
        )}
      </div>

      {/* Status Tabs */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="DRAFT">
            Draft ({statusCounts.DRAFT})
          </TabsTrigger>
          <TabsTrigger value="RECEIVING">
            Receiving ({statusCounts.RECEIVING})
          </TabsTrigger>
          <TabsTrigger value="POSTED">
            Posted ({statusCounts.POSTED})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Location:</Label>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by GR# or ASN#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchGoodsReceipts();
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Goods Receipts</CardTitle>
          <CardDescription>
            {filteredReceipts.length} document{filteredReceipts.length !== 1 ? "s" : ""}{" "}
            found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No goods receipts found</p>
              {canManage && (
                <Button
                  variant="link"
                  onClick={() => router.push("/inbound/goods-receipt/new")}
                >
                  Create your first goods receipt
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GR Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Qty</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((gr) => (
                  <TableRow key={gr.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{gr.grNo}</p>
                          {gr.asnNo && (
                            <p className="text-xs text-muted-foreground">
                              ASN: {gr.asnNo}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${statusConfig[gr.status]?.color || "bg-gray-500"} text-white`}
                      >
                        {statusConfig[gr.status]?.label || gr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {getLocationName(gr.locationId)}
                    </TableCell>
                    <TableCell>{gr.itemCount}</TableCell>
                    <TableCell>{gr.totalQty.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(gr.totalValue)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(gr.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/inbound/goods-receipt/${gr.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {gr.status === "DRAFT" && canManage && (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/inbound/goods-receipt/${gr.id}`)
                              }
                            >
                              <PackageCheck className="mr-2 h-4 w-4" />
                              Start Receiving
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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
