"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ClipboardCheck, Search } from "lucide-react";

export default function QCParametersPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QC Parameters</h1>
          <p className="text-muted-foreground">
            Define quality control parameters and inspection criteria
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Parameter
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search parameters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QC Parameters</CardTitle>
          <CardDescription>
            Quality control inspection parameters and thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Parameters Defined</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Define QC parameters to standardize your quality control process.
              Parameters can be reused across multiple QC templates.
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create First Parameter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
