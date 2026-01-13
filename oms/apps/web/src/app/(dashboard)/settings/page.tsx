"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Building2,
  MapPin,
  Users,
  Package,
  Settings,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const settingsLinks = [
  {
    title: "Company",
    description: "Manage company details, GST, and legal information",
    href: "/settings/company",
    icon: Building2,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Locations",
    description: "Manage warehouses, stores, and hub locations",
    href: "/settings/locations",
    icon: MapPin,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Users",
    description: "Manage user accounts and access permissions",
    href: "/settings/users",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "SKU Master",
    description: "Manage products, SKUs, and item master data",
    href: "/settings/skus",
    icon: Package,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";

  const accessibleLinks = settingsLinks.filter((link) =>
    link.roles.includes(userRole)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and configurations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {accessibleLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>{link.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Logged in as</dt>
              <dd className="font-medium">{session?.user?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium">
                {session?.user?.role?.replace("_", " ")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Company</dt>
              <dd className="font-medium">
                {session?.user?.companyName || "Not assigned"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-medium">1.0.0</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
