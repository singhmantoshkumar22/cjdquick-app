"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ClipboardCheck,
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Check,
  Play,
  Loader2,
  AlertCircle,
  Package,
  Save,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CycleCount {
  id: string;
  cycleCountNo: string;
  status: string;
  locationId: string;
  zoneId?: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  varianceFound: boolean;
  varianceValue?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  items?: CycleCountItem[];
}

interface CycleCountItem {
  id: string;
  cycleCountId: string;
  skuId: string;
  binId: string;
  batchNo?: string;
  expectedQty: number;
  countedQty: number;
  varianceQty: number;
  status: string;
  countedAt?: string;
  remarks?: string;
}

interface SKU {
  id: string;
  code: string;
  name: string;
}

interface Bin {
  id: string;
  code: string;
}

interface Location {
  id: string;
  name: string;
  code: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Planned", color: "bg-gray-100 text-gray-800" },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

export default function CycleCountDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const countId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [cycleCount, setCycleCount] = useState<CycleCount | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [skus, setSkus] = useState<Record<string, SKU>>({});
  const [bins, setBins] = useState<Record<string, Bin>>({});
  const [countedQuantities, setCountedQuantities] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const canManage = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(
    session?.user?.role || ""
  );

  useEffect(() => {
    if (countId) {
      fetchCycleCount();
    }
  }, [countId]);

  async function fetchCycleCount() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/wms/cycle-counts/${countId}`);
      if (response.ok) {
        const data = await response.json();
        setCycleCount(data);

        // Fetch location
        if (data.locationId) {
          fetchLocation(data.locationId);
        }

        // Initialize counted quantities from existing data
        if (data.items) {
          const quantities: Record<string, number> = {};
          data.items.forEach((item: CycleCountItem) => {
            quantities[item.id] = item.countedQty;
          });
          setCountedQuantities(quantities);

          // Fetch SKU and Bin info
          const skuIds = [...new Set(data.items.map((item: CycleCountItem) => item.skuId))];
          const binIds = [...new Set(data.items.map((item: CycleCountItem) => item.binId))];
          fetchSkus(skuIds);
          fetchBins(binIds);
        }
      } else {
        toast.error("Cycle count not found");
        router.push("/wms/cycle-counts");
      }
    } catch (error) {
      console.error("Error fetching cycle count:", error);
      toast.error("Failed to load cycle count");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLocation(locationId: string) {
    try {
      const response = await fetch(`/api/v1/locations/${locationId}`);
      if (response.ok) {
        const data = await response.json();
        setLocation(data);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  }

  async function fetchSkus(skuIds: string[]) {
    try {
      const skuMap: Record<string, SKU> = {};
      for (const id of skuIds) {
        const response = await fetch(`/api/v1/skus/${id}`);
        if (response.ok) {
          const data = await response.json();
          skuMap[id] = data;
        }
      }
      setSkus(skuMap);
    } catch (error) {
      console.error("Error fetching SKUs:", error);
    }
  }

  async function fetchBins(binIds: string[]) {
    try {
      const binMap: Record<string, Bin> = {};
      for (const id of binIds) {
        const response = await fetch(`/api/v1/bins/${id}`);
        if (response.ok) {
          const data = await response.json();
          binMap[id] = data;
        }
      }
      setBins(binMap);
    } catch (error) {
      console.error("Error fetching bins:", error);
    }
  }

  async function handleStart() {
    try {
      const response = await fetch(`/api/v1/wms/cycle-counts/${countId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to start cycle count");
      }

      toast.success("Cycle count started");
      fetchCycleCount();
    } catch (error) {
      console.error("Error starting cycle count:", error);
      toast.error("Failed to start cycle count");
    }
  }

  async function handleSaveCount(itemId: string) {
    const countedQty = countedQuantities[itemId];
    if (countedQty === undefined) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/v1/wms/cycle-counts/${countId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countedQty }),
      });

      if (!response.ok) {
        throw new Error("Failed to save count");
      }

      toast.success("Count saved");
      fetchCycleCount();
    } catch (error) {
      console.error("Error saving count:", error);
      toast.error("Failed to save count");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleComplete() {
    try {
      const response = await fetch(`/api/v1/wms/cycle-counts/${countId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to complete cycle count");
      }

      toast.success("Cycle count completed");
      fetchCycleCount();
    } catch (error) {
      console.error("Error completing cycle count:", error);
      toast.error("Failed to complete cycle count");
    }
  }

  function updateCountedQty(itemId: string, value: number) {
    setCountedQuantities((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  }

  function formatDate(dateString?: string) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  }

  function formatDateTime(dateString?: string) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cycleCount) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Cycle count not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/wms/cycle-counts")}>
          Back to Cycle Counts
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[cycleCount.status] || { label: cycleCount.status, color: "bg-gray-100" };
  const items = cycleCount.items || [];
  const totalItems = items.length;
  const countedItems = items.filter((item) => item.status === "COUNTED" || item.countedAt).length;
  const varianceItems = items.filter((item) => item.varianceQty !== 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/wms/cycle-counts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{cycleCount.cycleCountNo}</h1>
              <span className={`px-2 py-1 rounded text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-muted-foreground">
              Cycle Count Details
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cycleCount.status === "PLANNED" && (
            <Button onClick={handleStart}>
              <Play className="h-4 w-4 mr-2" />
              Start Count
            </Button>
          )}
          {cycleCount.status === "IN_PROGRESS" && canManage && (
            <Button onClick={handleComplete}>
              <Check className="h-4 w-4 mr-2" />
              Complete Count
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Count Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Count Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Location</span>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{location?.name || cycleCount.locationId}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scheduled</span>
              <span>{formatDate(cycleCount.scheduledDate)}</span>
            </div>
            {cycleCount.startedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Started</span>
                <span>{formatDateTime(cycleCount.startedAt)}</span>
              </div>
            )}
            {cycleCount.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span>{formatDateTime(cycleCount.completedAt)}</span>
              </div>
            )}
            {cycleCount.remarks && (
              <div>
                <span className="text-muted-foreground">Remarks</span>
                <p className="text-sm mt-1">{cycleCount.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Items</span>
              <span className="text-xl font-bold">{totalItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Counted</span>
              <span className="text-xl font-bold text-green-600">{countedItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="text-xl font-bold text-orange-600">{totalItems - countedItems}</span>
            </div>
            {totalItems > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(countedItems / totalItems) * 100}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Variance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Items with Variance</span>
              <span className={`text-xl font-bold ${varianceItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {varianceItems}
              </span>
            </div>
            {cycleCount.varianceFound && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Variance Value</span>
                <span className="text-xl font-bold text-red-600">
                  {cycleCount.varianceValue || 0}
                </span>
              </div>
            )}
            {cycleCount.status === "COMPLETED" && (
              <Badge variant={cycleCount.varianceFound ? "destructive" : "default"} className="w-full justify-center">
                {cycleCount.varianceFound ? "Variance Found" : "No Variance"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Count Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Count Items
          </CardTitle>
          <CardDescription>
            {cycleCount.status === "IN_PROGRESS"
              ? "Enter counted quantities for each item"
              : "View count results"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Bin</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Counted</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead>Status</TableHead>
                {cycleCount.status === "IN_PROGRESS" && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={cycleCount.status === "IN_PROGRESS" ? 8 : 7} className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No items to count</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Items will be automatically populated when the count starts
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const sku = skus[item.skuId];
                  const bin = bins[item.binId];
                  const variance = (countedQuantities[item.id] ?? item.countedQty) - item.expectedQty;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sku?.code || item.skuId}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {sku?.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{bin?.code || item.binId}</TableCell>
                      <TableCell>{item.batchNo || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{item.expectedQty}</TableCell>
                      <TableCell className="text-right">
                        {cycleCount.status === "IN_PROGRESS" ? (
                          <Input
                            type="number"
                            value={countedQuantities[item.id] ?? item.countedQty}
                            onChange={(e) => updateCountedQty(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 text-right"
                            min={0}
                          />
                        ) : (
                          <span className="font-medium">{item.countedQty}</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${variance !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {variance > 0 ? '+' : ''}{variance}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.countedAt ? "default" : "secondary"}>
                          {item.countedAt ? "Counted" : "Pending"}
                        </Badge>
                      </TableCell>
                      {cycleCount.status === "IN_PROGRESS" && (
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveCount(item.id)}
                            disabled={isSaving}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
