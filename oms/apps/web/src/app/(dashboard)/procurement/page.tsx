"use client";

import Link from "next/link";
import { Building2, ShoppingCart, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const procurementModules = [
  {
    title: "Vendors",
    description: "Manage suppliers and vendor information",
    href: "/procurement/vendors",
    icon: Building2,
  },
  {
    title: "Purchase Orders",
    description: "Create and manage purchase orders",
    href: "/procurement/purchase-orders",
    icon: ShoppingCart,
  },
];

export default function ProcurementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Procurement</h1>
        <p className="text-muted-foreground">
          Manage vendors and purchase orders
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {procurementModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <module.icon className="h-8 w-8 text-primary" />
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
