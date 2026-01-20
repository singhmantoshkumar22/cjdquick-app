"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Location {
  id: string;
  code: string;
  name: string;
}

interface SKU {
  id: string;
  code: string;
  name: string;
  mrp?: number;
  costPrice?: number;
}

interface GRItem {
  skuId: string;
  skuCode: string;
  skuName: string;
  expectedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  batchNo?: string;
  lotNo?: string;
  expiryDate?: string;
  mfgDate?: string;
  mrp?: number;
  costPrice?: number;
}

export default function NewGoodsReceiptPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [skuSearch, setSkuSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Form state
  const [locationId, setLocationId] = useState<string>("");
  const [asnNo, setAsnNo] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<GRItem[]>([]);

  // SKU selection dialog
  const [showSkuDialog, setShowSkuDialog] = useState(false);
  const [selectedSku, setSelectedSku] = useState<SKU | null>(null);
  const [itemForm, setItemForm] = useState<Partial<GRItem>>({
    expectedQty: 0,
    receivedQty: 0,
    acceptedQty: 0,
    rejectedQty: 0,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (skuSearch.length >= 2) {
      searchSkus(skuSearch);
    }
  }, [skuSearch]);

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

  async function searchSkus(query: string) {
    try {
      setIsSearching(true);
      const response = await fetch(`/api/v1/skus?search=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setSkus(data);
      }
    } catch (error) {
      console.error("Error searching SKUs:", error);
    } finally {
      setIsSearching(false);
    }
  }

  function handleAddItem() {
    if (!selectedSku) {
      toast.error("Please select a SKU");
      return;
    }

    if ((itemForm.receivedQty || 0) <= 0) {
      toast.error("Received quantity must be greater than 0");
      return;
    }

    const newItem: GRItem = {
      skuId: selectedSku.id,
      skuCode: selectedSku.code,
      skuName: selectedSku.name,
      expectedQty: itemForm.expectedQty || 0,
      receivedQty: itemForm.receivedQty || 0,
      acceptedQty: itemForm.acceptedQty || itemForm.receivedQty || 0,
      rejectedQty: itemForm.rejectedQty || 0,
      batchNo: itemForm.batchNo,
      lotNo: itemForm.lotNo,
      expiryDate: itemForm.expiryDate,
      mfgDate: itemForm.mfgDate,
      mrp: itemForm.mrp || selectedSku.mrp,
      costPrice: itemForm.costPrice || selectedSku.costPrice,
    };

    setItems([...items, newItem]);
    resetItemForm();
    setShowSkuDialog(false);
  }

  function resetItemForm() {
    setSelectedSku(null);
    setSkuSearch("");
    setItemForm({
      expectedQty: 0,
      receivedQty: 0,
      acceptedQty: 0,
      rejectedQty: 0,
    });
  }

  function removeItem(index: number) {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  }

  async function handleCreateGR() {
    if (!locationId) {
      toast.error("Please select a location");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    try {
      setIsLoading(true);

      // Create the GR
      const grResponse = await fetch("/api/v1/goods-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          asnNo: asnNo || null,
          notes: notes || null,
          movementType: "101",
          companyId: session?.user?.companyId,
        }),
      });

      if (!grResponse.ok) {
        const error = await grResponse.json();
        throw new Error(error.detail || "Failed to create goods receipt");
      }

      const gr = await grResponse.json();

      // Add items to the GR
      for (const item of items) {
        const itemResponse = await fetch(`/api/v1/goods-receipts/${gr.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skuId: item.skuId,
            expectedQty: item.expectedQty,
            receivedQty: item.receivedQty,
            acceptedQty: item.acceptedQty,
            rejectedQty: item.rejectedQty,
            batchNo: item.batchNo || null,
            lotNo: item.lotNo || null,
            expiryDate: item.expiryDate || null,
            mfgDate: item.mfgDate || null,
            mrp: item.mrp || null,
            costPrice: item.costPrice || null,
          }),
        });

        if (!itemResponse.ok) {
          console.error("Failed to add item:", await itemResponse.text());
        }
      }

      toast.success(`Goods Receipt ${gr.grNo} created successfully`);
      router.push(`/inbound/goods-receipt/${gr.id}`);
    } catch (error) {
      console.error("Error creating goods receipt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create goods receipt");
    } finally {
      setIsLoading(false);
    }
  }

  const totalQty = items.reduce((sum, item) => sum + item.receivedQty, 0);
  const totalValue = items.reduce(
    (sum, item) => sum + (item.costPrice || 0) * item.receivedQty,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/inbound/goods-receipt")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Goods Receipt</h1>
          <p className="text-muted-foreground">
            Create a new goods receipt document
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Header Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Receipt Information</CardTitle>
            <CardDescription>
              Enter the goods receipt header details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select value={locationId} onValueChange={setLocationId}>
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
                <Label htmlFor="asnNo">ASN Number</Label>
                <Input
                  id="asnNo"
                  value={asnNo}
                  onChange={(e) => setAsnNo(e.target.value)}
                  placeholder="Optional ASN reference"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Quantity</span>
              <span className="font-medium">{totalQty.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-medium">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(totalValue)}
              </span>
            </div>
            <Button
              className="w-full"
              onClick={handleCreateGR}
              disabled={isLoading || !locationId || items.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Goods Receipt"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Items</CardTitle>
            <CardDescription>Add SKUs to receive</CardDescription>
          </div>
          <Button onClick={() => setShowSkuDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items added yet</p>
              <Button
                variant="link"
                onClick={() => setShowSkuDialog(true)}
              >
                Add your first item
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Batch/Lot</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Accepted</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.skuCode}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.skuName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.batchNo && <p>Batch: {item.batchNo}</p>}
                      {item.lotNo && <p>Lot: {item.lotNo}</p>}
                      {!item.batchNo && !item.lotNo && "-"}
                    </TableCell>
                    <TableCell className="text-right">{item.expectedQty}</TableCell>
                    <TableCell className="text-right">{item.receivedQty}</TableCell>
                    <TableCell className="text-right">{item.acceptedQty}</TableCell>
                    <TableCell className="text-right">
                      {item.costPrice
                        ? new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(item.costPrice)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format((item.costPrice || 0) * item.receivedQty)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showSkuDialog} onOpenChange={setShowSkuDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
            <DialogDescription>
              Search and select a SKU to add to the goods receipt
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* SKU Search */}
            <div className="space-y-2">
              <Label>Search SKU</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU code or name..."
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {isSearching && (
                <p className="text-sm text-muted-foreground">Searching...</p>
              )}
              {skus.length > 0 && !selectedSku && (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {skus.map((sku) => (
                    <div
                      key={sku.id}
                      className="p-2 hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedSku(sku);
                        setItemForm({
                          ...itemForm,
                          mrp: sku.mrp,
                          costPrice: sku.costPrice,
                        });
                      }}
                    >
                      <p className="font-medium">{sku.code}</p>
                      <p className="text-sm text-muted-foreground">{sku.name}</p>
                    </div>
                  ))}
                </div>
              )}
              {selectedSku && (
                <div className="p-3 border rounded-md bg-muted/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{selectedSku.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSku.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSku(null)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Quantities */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Expected Qty</Label>
                <Input
                  type="number"
                  value={itemForm.expectedQty || ""}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, expectedQty: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Received Qty *</Label>
                <Input
                  type="number"
                  value={itemForm.receivedQty || ""}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0;
                    setItemForm({
                      ...itemForm,
                      receivedQty: qty,
                      acceptedQty: qty,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Accepted Qty</Label>
                <Input
                  type="number"
                  value={itemForm.acceptedQty || ""}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, acceptedQty: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rejected Qty</Label>
                <Input
                  type="number"
                  value={itemForm.rejectedQty || ""}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, rejectedQty: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            {/* Batch/Lot */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Batch No</Label>
                <Input
                  value={itemForm.batchNo || ""}
                  onChange={(e) => setItemForm({ ...itemForm, batchNo: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Lot No</Label>
                <Input
                  value={itemForm.lotNo || ""}
                  onChange={(e) => setItemForm({ ...itemForm, lotNo: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Manufacturing Date</Label>
                <Input
                  type="date"
                  value={itemForm.mfgDate || ""}
                  onChange={(e) => setItemForm({ ...itemForm, mfgDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={itemForm.expiryDate || ""}
                  onChange={(e) => setItemForm({ ...itemForm, expiryDate: e.target.value })}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemForm.costPrice || ""}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, costPrice: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>MRP</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemForm.mrp || ""}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, mrp: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkuDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!selectedSku}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
