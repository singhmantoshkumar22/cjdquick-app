"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Settings,
  Building2,
  MapPin,
  Package,
  Check,
  X,
  Loader2,
  Info,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface ValuationOverview {
  companyDefault: string;
  locationOverrides: number;
  skuOverrides: number;
  locations: LocationValuation[];
}

interface LocationValuation {
  locationId: string;
  locationName: string;
  locationCode: string;
  valuationMethod: string | null;
  effectiveMethod: string;
}

interface SKUValuation {
  skuId: string;
  skuCode: string;
  skuName: string;
  valuationMethod: string | null;
  effectiveMethod: string;
}

const valuationMethods = [
  { value: "FIFO", label: "FIFO", description: "First In, First Out - Oldest inventory picked first" },
  { value: "LIFO", label: "LIFO", description: "Last In, First Out - Newest inventory picked first" },
  { value: "FEFO", label: "FEFO", description: "First Expired, First Out - Earliest expiry picked first" },
  { value: "WAC", label: "WAC", description: "Weighted Average Cost - No specific order" },
];

export default function ValuationSettingsPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [overview, setOverview] = useState<ValuationOverview | null>(null);
  const [skuOverrides, setSkuOverrides] = useState<SKUValuation[]>([]);
  const [companyMethod, setCompanyMethod] = useState("FIFO");
  const [activeTab, setActiveTab] = useState("overview");

  const canManage = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(
    session?.user?.role || ""
  );

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "skus") {
      fetchSkuOverrides();
    }
  }, [activeTab]);

  async function fetchOverview() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/v1/settings/valuation/overview");
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
        setCompanyMethod(data.companyDefault);
      }
    } catch (error) {
      console.error("Error fetching valuation overview:", error);
      toast.error("Failed to load valuation settings");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSkuOverrides() {
    try {
      const response = await fetch("/api/v1/settings/valuation/skus?has_override=true&limit=100");
      if (response.ok) {
        const data = await response.json();
        setSkuOverrides(data);
      }
    } catch (error) {
      console.error("Error fetching SKU overrides:", error);
    }
  }

  async function updateCompanyMethod(method: string) {
    try {
      setIsSaving(true);
      const response = await fetch("/api/v1/settings/valuation/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valuationMethod: method }),
      });

      if (!response.ok) {
        throw new Error("Failed to update company valuation method");
      }

      setCompanyMethod(method);
      toast.success("Company valuation method updated");
      fetchOverview();
    } catch (error) {
      console.error("Error updating company method:", error);
      toast.error("Failed to update valuation method");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateLocationMethod(locationId: string, method: string) {
    try {
      const response = await fetch(`/api/v1/settings/valuation/location/${locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valuationMethod: method }),
      });

      if (!response.ok) {
        throw new Error("Failed to update location valuation method");
      }

      toast.success("Location valuation method updated");
      fetchOverview();
    } catch (error) {
      console.error("Error updating location method:", error);
      toast.error("Failed to update location valuation method");
    }
  }

  async function clearLocationMethod(locationId: string) {
    try {
      const response = await fetch(`/api/v1/settings/valuation/location/${locationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear location override");
      }

      toast.success("Location will use company default");
      fetchOverview();
    } catch (error) {
      console.error("Error clearing location override:", error);
      toast.error("Failed to clear location override");
    }
  }

  async function clearSkuMethod(skuId: string) {
    try {
      const response = await fetch(`/api/v1/settings/valuation/sku/${skuId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear SKU override");
      }

      toast.success("SKU will use default valuation");
      fetchSkuOverrides();
      fetchOverview();
    } catch (error) {
      console.error("Error clearing SKU override:", error);
      toast.error("Failed to clear SKU override");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory Valuation Settings</h1>
        <p className="text-muted-foreground">
          Configure FIFO/LIFO/FEFO allocation methods for inventory picking
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Location Overrides</TabsTrigger>
          <TabsTrigger value="skus">SKU Overrides ({overview?.skuOverrides || 0})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Method Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Valuation Methods
              </CardTitle>
              <CardDescription>
                Valuation method determines the order in which inventory is picked for orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {valuationMethods.map((method) => (
                  <div
                    key={method.value}
                    className={`p-4 rounded-lg border ${
                      companyMethod === method.value
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{method.label}</span>
                      {companyMethod === method.value && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Company Default */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Default
              </CardTitle>
              <CardDescription>
                Default valuation method applied to all locations and SKUs unless overridden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select
                  value={companyMethod}
                  onValueChange={updateCompanyMethod}
                  disabled={!canManage || isSaving}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {valuationMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Company Default
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overview?.companyDefault}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Overrides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overview?.locationOverrides || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  SKU Overrides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overview?.skuOverrides || 0}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Location Overrides Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Valuation Settings
              </CardTitle>
              <CardDescription>
                Override the company default for specific locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Override</TableHead>
                    <TableHead>Effective Method</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.locations.map((loc) => (
                    <TableRow key={loc.locationId}>
                      <TableCell className="font-medium">{loc.locationName}</TableCell>
                      <TableCell>{loc.locationCode}</TableCell>
                      <TableCell>
                        {canManage ? (
                          <Select
                            value={loc.valuationMethod || ""}
                            onValueChange={(value) => updateLocationMethod(loc.locationId, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Use default" />
                            </SelectTrigger>
                            <SelectContent>
                              {valuationMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span>{loc.valuationMethod || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={loc.valuationMethod ? "default" : "secondary"}>
                          {loc.effectiveMethod}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          {loc.valuationMethod && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => clearLocationMethod(loc.locationId)}
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Clear override (use company default)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SKU Overrides Tab */}
        <TabsContent value="skus">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                SKU Valuation Overrides
              </CardTitle>
              <CardDescription>
                SKUs with specific valuation method overrides
              </CardDescription>
            </CardHeader>
            <CardContent>
              {skuOverrides.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No SKU overrides configured</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All SKUs are using the company or location default
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Valuation Method</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skuOverrides.map((sku) => (
                      <TableRow key={sku.skuId}>
                        <TableCell className="font-medium">{sku.skuCode}</TableCell>
                        <TableCell>{sku.skuName}</TableCell>
                        <TableCell>
                          <Badge>{sku.valuationMethod}</Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => clearSkuMethod(sku.skuId)}
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Clear override (use default)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
