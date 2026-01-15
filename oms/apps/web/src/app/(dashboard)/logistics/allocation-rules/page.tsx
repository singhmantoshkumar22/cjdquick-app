"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, ArrowUpDown, Settings } from "lucide-react";

export default function AllocationRulesPage() {
  const rules = [
    {
      id: "1",
      name: "Metro Express",
      type: "ZONE_BASED",
      priority: 1,
      courier: "BlueDart",
      zone: "Metro",
      status: "ACTIVE",
    },
    {
      id: "2",
      name: "High Value Orders",
      type: "VALUE_BASED",
      priority: 2,
      courier: "Delhivery",
      condition: "Order > ₹5000",
      status: "ACTIVE",
    },
    {
      id: "3",
      name: "COD Orders",
      type: "PAYMENT_MODE",
      priority: 3,
      courier: "DTDC",
      condition: "Payment = COD",
      status: "ACTIVE",
    },
    {
      id: "4",
      name: "Heavy Weight",
      type: "WEIGHT_BASED",
      priority: 4,
      courier: "Ekart",
      condition: "Weight > 5kg",
      status: "INACTIVE",
    },
  ];

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    DRAFT: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Allocation Rules</h1>
          <p className="text-muted-foreground">
            Configure automatic courier allocation based on order attributes
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rule Configuration</CardTitle>
          <CardDescription>
            Rules are evaluated in priority order. First matching rule wins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">
                  <div className="flex items-center gap-1">
                    Priority
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Assigned Courier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono">{rule.priority}</TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{rule.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {rule.zone || rule.condition}
                  </TableCell>
                  <TableCell>{rule.courier}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[rule.status]}>
                      {rule.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Default Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              When no rules match, orders are assigned to:
            </p>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Delhivery</span>
              <Button variant="outline" size="sm">Change</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocation Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orders allocated today</span>
              <span className="font-medium">234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rule matches</span>
              <span className="font-medium">89%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Default fallback</span>
              <span className="font-medium">11%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
