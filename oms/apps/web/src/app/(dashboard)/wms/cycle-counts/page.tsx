"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Plus,
  Clock,
  Play,
  Check,
  Calendar,
  MapPin,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
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
}

interface Location {
  id: string;
  name: string;
  code: string;
}

interface Zone {
  id: string;
  name: string;
  code: string;
  locationId: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  PLANNED: { label: "Planned", variant: "secondary", icon: Calendar },
  IN_PROGRESS: { label: "In Progress", variant: "default", icon: Play },
  COMPLETED: { label: "Completed", variant: "default", icon: Check },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: AlertCircle },
};

export default function CycleCountsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cycleCounts, setCycleCounts] = useState<CycleCount[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLocationId, setNewLocationId] = useState("");
  const [newZoneId, setNewZoneId] = useState("");
  const [newScheduledDate, setNewScheduledDate] = useState("");
  const [newRemarks, setNewRemarks] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const canManage = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(
    session?.user?.role || ""
  );

  useEffect(() => {
    fetchCycleCounts();
    fetchLocations();
  }, [statusFilter]);

  useEffect(() => {
    if (newLocationId) {
      fetchZonesForLocation(newLocationId);
    } else {
      setZones([]);
    }
  }, [newLocationId]);

  async function fetchCycleCounts() {
    try {
      setIsLoading(true);
      let url = "/api/v1/wms/cycle-counts?limit=100";
      if (statusFilter && statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCycleCounts(data);
      }
    } catch (error) {
      console.error("Error fetching cycle counts:", error);
      toast.error("Failed to load cycle counts");
    } finally {
      setIsLoading(false);
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

  async function fetchZonesForLocation(locationId: string) {
    try {
      const response = await fetch(`/api/v1/zones?location_id=${locationId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setZones(data);
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  }

  async function handleCreate() {
    if (!newLocationId || !newScheduledDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/v1/wms/cycle-counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: newLocationId,
          zoneId: newZoneId || undefined,
          scheduledDate: new Date(newScheduledDate).toISOString(),
          remarks: newRemarks || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create cycle count");
      }

      toast.success("Cycle count created");
      setCreateDialogOpen(false);
      setNewLocationId("");
      setNewZoneId("");
      setNewScheduledDate("");
      setNewRemarks("");
      fetchCycleCounts();
    } catch (error) {
      console.error("Error creating cycle count:", error);
      toast.error("Failed to create cycle count");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStart(cycleCount: CycleCount) {
    try {
      const response = await fetch(`/api/v1/wms/cycle-counts/${cycleCount.id}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to start cycle count");
      }

      toast.success("Cycle count started");
      fetchCycleCounts();
    } catch (error) {
      console.error("Error starting cycle count:", error);
      toast.error("Failed to start cycle count");
    }
  }

  async function handleComplete(cycleCount: CycleCount) {
    try {
      const response = await fetch(`/api/v1/wms/cycle-counts/${cycleCount.id}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to complete cycle count");
      }

      toast.success("Cycle count completed");
      fetchCycleCounts();
    } catch (error) {
      console.error("Error completing cycle count:", error);
      toast.error("Failed to complete cycle count");
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

  function formatDate(dateString?: string) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  }

  function formatDateTime(dateString?: string) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  }

  function getLocationName(locationId: string) {
    return locations.find((l) => l.id === locationId)?.name || locationId;
  }

  // Summary counts
  const plannedCount = cycleCounts.filter((c) => c.status === "PLANNED").length;
  const inProgressCount = cycleCounts.filter((c) => c.status === "IN_PROGRESS").length;
  const completedCount = cycleCounts.filter((c) => c.status === "COMPLETED").length;

  const filteredCounts = cycleCounts.filter((count) => {
    if (activeTab === "active" && !["PLANNED", "IN_PROGRESS"].includes(count.status)) return false;
    if (activeTab === "completed" && count.status !== "COMPLETED") return false;
    return true;
  });

  if (isLoading && cycleCounts.length === 0) {
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
          <h1 className="text-2xl font-bold tracking-tight">Cycle Counts</h1>
          <p className="text-muted-foreground">
            Plan and execute inventory cycle counts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchCycleCounts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {canManage && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Cycle Count
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plannedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cycleCounts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Counts</TabsTrigger>
            <TabsTrigger value="active">Active ({plannedCount + inProgressCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                    <TableHead>Count #</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No cycle counts found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCounts.map((count) => (
                      <TableRow key={count.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => router.push(`/wms/cycle-counts/${count.id}`)}
                            className="text-primary hover:underline"
                          >
                            {count.cycleCountNo}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {getLocationName(count.locationId)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(count.scheduledDate)}</TableCell>
                        <TableCell>{getStatusBadge(count.status)}</TableCell>
                        <TableCell>
                          {count.varianceFound ? (
                            <Badge variant="destructive">Variance Found</Badge>
                          ) : count.status === "COMPLETED" ? (
                            <Badge variant="outline">No Variance</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/wms/cycle-counts/${count.id}`)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {count.status === "PLANNED" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleStart(count)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                            {count.status === "IN_PROGRESS" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/wms/cycle-counts/${count.id}`)}
                                >
                                  Continue
                                </Button>
                                {canManage && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleComplete(count)}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Complete
                                  </Button>
                                )}
                              </>
                            )}
                            {count.status === "COMPLETED" && count.varianceFound && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/wms/cycle-counts/${count.id}/review`)}
                              >
                                Review Variance
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

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Cycle Counts</CardTitle>
              <CardDescription>Planned and in-progress counts</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Count #</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Check className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No active cycle counts</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCounts.map((count) => (
                      <TableRow key={count.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => router.push(`/wms/cycle-counts/${count.id}`)}
                            className="text-primary hover:underline"
                          >
                            {count.cycleCountNo}
                          </button>
                        </TableCell>
                        <TableCell>{getLocationName(count.locationId)}</TableCell>
                        <TableCell>{formatDate(count.scheduledDate)}</TableCell>
                        <TableCell>{getStatusBadge(count.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {count.status === "PLANNED" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleStart(count)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                            {count.status === "IN_PROGRESS" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => router.push(`/wms/cycle-counts/${count.id}`)}
                              >
                                Continue Counting
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

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Cycle Counts</CardTitle>
              <CardDescription>Review completed counts and variances</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Count #</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No completed cycle counts</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCounts.map((count) => (
                      <TableRow key={count.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => router.push(`/wms/cycle-counts/${count.id}`)}
                            className="text-primary hover:underline"
                          >
                            {count.cycleCountNo}
                          </button>
                        </TableCell>
                        <TableCell>{getLocationName(count.locationId)}</TableCell>
                        <TableCell>{formatDateTime(count.completedAt)}</TableCell>
                        <TableCell>
                          {count.varianceFound ? (
                            <Badge variant="destructive">Variance: {count.varianceValue}</Badge>
                          ) : (
                            <Badge variant="outline">No Variance</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/wms/cycle-counts/${count.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
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
            <DialogTitle>Create Cycle Count</DialogTitle>
            <DialogDescription>
              Schedule a new cycle count for inventory verification
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
              <Label>Zone (optional)</Label>
              <Select value={newZoneId} onValueChange={setNewZoneId} disabled={!newLocationId || zones.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="All zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} ({zone.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave empty to count entire location
              </p>
            </div>
            <div className="space-y-2">
              <Label>Scheduled Date *</Label>
              <Input
                type="datetime-local"
                value={newScheduledDate}
                onChange={(e) => setNewScheduledDate(e.target.value)}
              />
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
            <Button onClick={handleCreate} disabled={isCreating || !newLocationId || !newScheduledDate}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
