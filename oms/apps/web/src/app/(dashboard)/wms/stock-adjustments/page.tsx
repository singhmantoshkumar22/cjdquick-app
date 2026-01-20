"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Clock,
  Check,
  X,
  Send,
  FileCheck,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface StockAdjustment {
  id: string;
  adjustmentNo: string;
  locationId: string;
  reason: string;
  status: string;
  remarks?: string;
  createdById: string;
  submittedAt?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectedById?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  postedById?: string;
  postedAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: StockAdjustmentItem[];
}

interface StockAdjustmentItem {
  id: string;
  adjustmentId: string;
  skuId: string;
  binId: string;
  batchNo?: string;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
}

interface Summary {
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  posted: number;
  total: number;
}

interface Location {
  id: string;
  name: string;
  code: string;
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

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  DRAFT: { label: "Draft", variant: "secondary", icon: Clock },
  PENDING: { label: "Pending Approval", variant: "outline", icon: Send },
  APPROVED: { label: "Approved", variant: "default", icon: Check },
  REJECTED: { label: "Rejected", variant: "destructive", icon: X },
  POSTED: { label: "Posted", variant: "default", icon: FileCheck },
};

const reasonOptions = [
  { value: "CYCLE_COUNT", label: "Cycle Count Variance" },
  { value: "DAMAGE", label: "Damage" },
  { value: "THEFT", label: "Theft/Loss" },
  { value: "EXPIRED", label: "Expired" },
  { value: "FOUND", label: "Found" },
  { value: "CORRECTION", label: "Data Correction" },
  { value: "WRITE_OFF", label: "Write Off" },
  { value: "OTHER", label: "Other" },
];

export default function StockAdjustmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLocationId, setNewLocationId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newRemarks, setNewRemarks] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Add item dialog
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null);
  const [newItemSkuId, setNewItemSkuId] = useState("");
  const [newItemBinId, setNewItemBinId] = useState("");
  const [newItemBatchNo, setNewItemBatchNo] = useState("");
  const [newItemQtyChange, setNewItemQtyChange] = useState<number>(0);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailAdjustment, setDetailAdjustment] = useState<StockAdjustment | null>(null);

  const canManage = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(
    session?.user?.role || ""
  );

  useEffect(() => {
    fetchAdjustments();
    fetchSummary();
    fetchLocations();
    fetchSkus();
  }, [statusFilter]);

  async function fetchAdjustments() {
    try {
      setIsLoading(true);
      let url = "/api/v1/wms/stock-adjustments?limit=100";
      if (statusFilter && statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAdjustments(data);
      }
    } catch (error) {
      console.error("Error fetching adjustments:", error);
      toast.error("Failed to load stock adjustments");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSummary() {
    try {
      const response = await fetch("/api/v1/wms/stock-adjustments/summary");
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }

  async function fetchLocations() {
    try {
      const response = await fetch("/api/v1/locations?limit=100");
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }

  async function fetchSkus() {
    try {
      const response = await fetch("/api/v1/skus?limit=500");
      if (response.ok) {
        const data = await response.json();
        setSkus(data);
      }
    } catch (error) {
      console.error("Error fetching SKUs:", error);
    }
  }

  async function fetchBinsForLocation(locationId: string) {
    try {
      const response = await fetch(`/api/v1/bins?location_id=${locationId}&limit=500`);
      if (response.ok) {
        const data = await response.json();
        setBins(data);
      }
    } catch (error) {
      console.error("Error fetching bins:", error);
    }
  }

  async function handleCreate() {
    if (!newLocationId || !newReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/v1/wms/stock-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: newLocationId,
          reason: newReason,
          remarks: newRemarks || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create adjustment");
      }

      toast.success("Stock adjustment created");
      setCreateDialogOpen(false);
      setNewLocationId("");
      setNewReason("");
      setNewRemarks("");
      fetchAdjustments();
      fetchSummary();
    } catch (error) {
      console.error("Error creating adjustment:", error);
      toast.error("Failed to create adjustment");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAddItem() {
    if (!selectedAdjustment || !newItemSkuId || !newItemBinId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsAddingItem(true);
      const response = await fetch(`/api/v1/wms/stock-adjustments/${selectedAdjustment.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skuId: newItemSkuId,
          binId: newItemBinId,
          batchNo: newItemBatchNo || undefined,
          quantityChange: newItemQtyChange,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      toast.success("Item added");
      setAddItemDialogOpen(false);
      setNewItemSkuId("");
      setNewItemBinId("");
      setNewItemBatchNo("");
      setNewItemQtyChange(0);
      fetchAdjustments();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
  }

  async function handleSubmit(adjustment: StockAdjustment) {
    try {
      const response = await fetch(`/api/v1/wms/stock-adjustments/${adjustment.id}/submit`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to submit");
      }

      toast.success("Adjustment submitted for approval");
      fetchAdjustments();
      fetchSummary();
    } catch (error: any) {
      console.error("Error submitting adjustment:", error);
      toast.error(error.message || "Failed to submit adjustment");
    }
  }

  async function handleApprove(adjustment: StockAdjustment) {
    try {
      const response = await fetch(`/api/v1/wms/stock-adjustments/${adjustment.id}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to approve");
      }

      toast.success("Adjustment approved");
      fetchAdjustments();
      fetchSummary();
    } catch (error) {
      console.error("Error approving adjustment:", error);
      toast.error("Failed to approve adjustment");
    }
  }

  async function handleReject() {
    if (!selectedAdjustment || !rejectReason) return;

    try {
      setIsRejecting(true);
      const response = await fetch(`/api/v1/wms/stock-adjustments/${selectedAdjustment.id}/reject?reason=${encodeURIComponent(rejectReason)}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reject");
      }

      toast.success("Adjustment rejected");
      setRejectDialogOpen(false);
      setSelectedAdjustment(null);
      setRejectReason("");
      fetchAdjustments();
      fetchSummary();
    } catch (error) {
      console.error("Error rejecting adjustment:", error);
      toast.error("Failed to reject adjustment");
    } finally {
      setIsRejecting(false);
    }
  }

  async function handlePost(adjustment: StockAdjustment) {
    try {
      const response = await fetch(`/api/v1/wms/stock-adjustments/${adjustment.id}/post`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to post");
      }

      toast.success("Adjustment posted to inventory");
      fetchAdjustments();
      fetchSummary();
    } catch (error) {
      console.error("Error posting adjustment:", error);
      toast.error("Failed to post adjustment");
    }
  }

  function openAddItemDialog(adjustment: StockAdjustment) {
    setSelectedAdjustment(adjustment);
    fetchBinsForLocation(adjustment.locationId);
    setAddItemDialogOpen(true);
  }

  function openRejectDialog(adjustment: StockAdjustment) {
    setSelectedAdjustment(adjustment);
    setRejectReason("");
    setRejectDialogOpen(true);
  }

  async function openDetailDialog(adjustment: StockAdjustment) {
    try {
      const response = await fetch(`/api/v1/wms/stock-adjustments/${adjustment.id}`);
      if (response.ok) {
        const data = await response.json();
        setDetailAdjustment(data);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching adjustment details:", error);
    }
  }

  function getStatusBadge(status: string) {
    const config = statusConfig[status] || { label: status, variant: "secondary" as const, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  function getReasonLabel(reason: string) {
    return reasonOptions.find((r) => r.value === reason)?.label || reason;
  }

  function formatDate(dateString?: string) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  }

  const filteredAdjustments = adjustments.filter((adj) => {
    if (activeTab === "pending-approval" && adj.status !== "PENDING") return false;
    return true;
  });

  if (isLoading && adjustments.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Adjustments</h1>
          <p className="text-muted-foreground">
            Manage inventory adjustments with approval workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { fetchAdjustments(); fetchSummary(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Adjustment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Posted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.posted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Adjustments</TabsTrigger>
            <TabsTrigger value="pending-approval">
              Pending Approval ({summary?.pending || 0})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="POSTED">Posted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adjustment #</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No stock adjustments found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => openDetailDialog(adjustment)}
                            className="text-primary hover:underline"
                          >
                            {adjustment.adjustmentNo}
                          </button>
                        </TableCell>
                        <TableCell>{getReasonLabel(adjustment.reason)}</TableCell>
                        <TableCell>{getStatusBadge(adjustment.status)}</TableCell>
                        <TableCell>{formatDate(adjustment.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailDialog(adjustment)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {adjustment.status === "DRAFT" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAddItemDialog(adjustment)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Items
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleSubmit(adjustment)}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Submit
                                </Button>
                              </>
                            )}
                            {adjustment.status === "PENDING" && canManage && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(adjustment)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRejectDialog(adjustment)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {adjustment.status === "APPROVED" && canManage && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handlePost(adjustment)}
                              >
                                <FileCheck className="h-3 w-3 mr-1" />
                                Post
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-approval" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>
                Review and approve or reject stock adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adjustment #</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Check className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No adjustments pending approval</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => openDetailDialog(adjustment)}
                            className="text-primary hover:underline"
                          >
                            {adjustment.adjustmentNo}
                          </button>
                        </TableCell>
                        <TableCell>{getReasonLabel(adjustment.reason)}</TableCell>
                        <TableCell>{formatDate(adjustment.submittedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailDialog(adjustment)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {canManage && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(adjustment)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRejectDialog(adjustment)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Stock Adjustment</DialogTitle>
            <DialogDescription>
              Create a new stock adjustment. Add items after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Location *</Label>
              <Select value={newLocationId} onValueChange={setNewLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={newReason} onValueChange={setNewReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={newRemarks}
                onChange={(e) => setNewRemarks(e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !newLocationId || !newReason}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Adjustment Item</DialogTitle>
            <DialogDescription>
              Add SKU adjustment to {selectedAdjustment?.adjustmentNo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Select value={newItemSkuId} onValueChange={setNewItemSkuId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {skus.map((sku) => (
                    <SelectItem key={sku.id} value={sku.id}>
                      {sku.code} - {sku.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bin *</Label>
              <Select value={newItemBinId} onValueChange={setNewItemBinId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bin" />
                </SelectTrigger>
                <SelectContent>
                  {bins.map((bin) => (
                    <SelectItem key={bin.id} value={bin.id}>
                      {bin.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Batch No (optional)</Label>
              <Input
                value={newItemBatchNo}
                onChange={(e) => setNewItemBatchNo(e.target.value)}
                placeholder="Enter batch number..."
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity Change *</Label>
              <Input
                type="number"
                value={newItemQtyChange}
                onChange={(e) => setNewItemQtyChange(parseInt(e.target.value) || 0)}
                placeholder="Positive to add, negative to remove"
              />
              <p className="text-xs text-muted-foreground">
                Enter positive value to increase, negative to decrease
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={isAddingItem || !newItemSkuId || !newItemBinId}
            >
              {isAddingItem && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Stock Adjustment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedAdjustment?.adjustmentNo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailAdjustment?.adjustmentNo}</DialogTitle>
            <DialogDescription>
              Stock Adjustment Details
            </DialogDescription>
          </DialogHeader>
          {detailAdjustment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(detailAdjustment.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reason</Label>
                  <p className="font-medium">{getReasonLabel(detailAdjustment.reason)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{formatDate(detailAdjustment.createdAt)}</p>
                </div>
                {detailAdjustment.submittedAt && (
                  <div>
                    <Label className="text-muted-foreground">Submitted</Label>
                    <p>{formatDate(detailAdjustment.submittedAt)}</p>
                  </div>
                )}
                {detailAdjustment.approvedAt && (
                  <div>
                    <Label className="text-muted-foreground">Approved</Label>
                    <p>{formatDate(detailAdjustment.approvedAt)}</p>
                  </div>
                )}
                {detailAdjustment.rejectedAt && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Rejected</Label>
                    <p>{formatDate(detailAdjustment.rejectedAt)}</p>
                    <p className="text-sm text-red-600 mt-1">{detailAdjustment.rejectionReason}</p>
                  </div>
                )}
                {detailAdjustment.postedAt && (
                  <div>
                    <Label className="text-muted-foreground">Posted</Label>
                    <p>{formatDate(detailAdjustment.postedAt)}</p>
                  </div>
                )}
              </div>
              {detailAdjustment.remarks && (
                <div>
                  <Label className="text-muted-foreground">Remarks</Label>
                  <p>{detailAdjustment.remarks}</p>
                </div>
              )}
              {detailAdjustment.items && detailAdjustment.items.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Items</Label>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Bin</TableHead>
                        <TableHead className="text-right">Before</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                        <TableHead className="text-right">After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailAdjustment.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.skuId}</TableCell>
                          <TableCell>{item.binId}</TableCell>
                          <TableCell className="text-right">{item.quantityBefore}</TableCell>
                          <TableCell className={`text-right font-medium ${item.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.quantityChange >= 0 ? '+' : ''}{item.quantityChange}
                          </TableCell>
                          <TableCell className="text-right">{item.quantityAfter}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
