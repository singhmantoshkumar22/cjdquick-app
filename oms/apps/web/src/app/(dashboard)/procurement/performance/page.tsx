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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

interface VendorPerformance {
  id: string;
  name: string;
  code: string;
  totalOrders: number;
  onTimeDelivery: number;
  qualityScore: number;
  avgLeadTime: number;
  status: string;
}

export default function VendorPerformancePage() {
  const [vendors, setVendors] = useState<VendorPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVendors: 0,
    avgOnTimeDelivery: 0,
    avgQualityScore: 0,
    topPerformer: "",
  });

  const fetchVendorPerformance = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/v1/procurement/vendors?limit=50");
      if (!response.ok) throw new Error("Failed to fetch vendors");
      const result = await response.json();

      // Map vendors to performance data (in real app, would have separate performance API)
      const mappedVendors = (result.vendors || result || []).map((v: Record<string, unknown>) => ({
        id: v.id,
        name: v.name || "Unknown Vendor",
        code: v.code || v.vendorCode || "-",
        totalOrders: Math.floor(Math.random() * 100), // Placeholder
        onTimeDelivery: 85 + Math.floor(Math.random() * 15), // Placeholder
        qualityScore: 80 + Math.floor(Math.random() * 20), // Placeholder
        avgLeadTime: 3 + Math.floor(Math.random() * 5), // Placeholder
        status: v.status || "ACTIVE",
      }));

      setVendors(mappedVendors);

      if (mappedVendors.length > 0) {
        const avgOnTime = mappedVendors.reduce((sum: number, v: VendorPerformance) => sum + v.onTimeDelivery, 0) / mappedVendors.length;
        const avgQuality = mappedVendors.reduce((sum: number, v: VendorPerformance) => sum + v.qualityScore, 0) / mappedVendors.length;
        const topPerformer = mappedVendors.sort((a: VendorPerformance, b: VendorPerformance) =>
          (b.onTimeDelivery + b.qualityScore) - (a.onTimeDelivery + a.qualityScore)
        )[0];

        setStats({
          totalVendors: mappedVendors.length,
          avgOnTimeDelivery: Math.round(avgOnTime),
          avgQualityScore: Math.round(avgQuality),
          topPerformer: topPerformer?.name || "-",
        });
      }
    } catch (error) {
      console.error("Error fetching vendor performance:", error);
      toast.error("Failed to load vendor performance");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendorPerformance();
  }, [fetchVendorPerformance]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Performance</h1>
          <p className="text-muted-foreground">
            Monitor and analyze supplier performance metrics
          </p>
        </div>
        <Button variant="outline" onClick={fetchVendorPerformance}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
            <p className="text-xs text-muted-foreground">Active suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOnTimeDelivery}%</div>
            <Progress value={stats.avgOnTimeDelivery} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgQualityScore}%</div>
            <Progress value={stats.avgQualityScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.topPerformer || "-"}</div>
            <p className="text-xs text-muted-foreground">Best overall rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Scorecard</CardTitle>
          <CardDescription>
            Performance metrics for all active vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Vendors Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Add vendors in Procurement → Vendors to track their performance.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>On-Time Delivery</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>Avg Lead Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.code}</TableCell>
                    <TableCell>{vendor.totalOrders}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={vendor.onTimeDelivery} className="w-16 h-2" />
                        <span className={vendor.onTimeDelivery >= 90 ? "text-green-600" : vendor.onTimeDelivery >= 80 ? "text-yellow-600" : "text-red-600"}>
                          {vendor.onTimeDelivery}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={vendor.qualityScore} className="w-16 h-2" />
                        <span className={vendor.qualityScore >= 90 ? "text-green-600" : vendor.qualityScore >= 80 ? "text-yellow-600" : "text-red-600"}>
                          {vendor.qualityScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{vendor.avgLeadTime} days</TableCell>
                    <TableCell>
                      <Badge variant={vendor.status === "ACTIVE" ? "default" : "secondary"}>
                        {vendor.status}
                      </Badge>
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
