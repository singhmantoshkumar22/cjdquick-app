"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  RotateCcw,
  BarChart3,
  Settings,
  Users,
  Building2,
  Layers,
  AlertCircle,
  CreditCard,
  Radar,
  FileText,
  Search,
  Plus,
  Upload,
  TrendingUp,
  Handshake,
  ArrowDownToLine,
  PackageOpen,
} from "lucide-react";

interface NavigationItem {
  icon: React.ElementType;
  label: string;
  href: string;
  keywords?: string[];
  group: string;
  adminOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  // Command Center
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", group: "Command Center", keywords: ["home", "main", "overview"] },
  { icon: Radar, label: "Control Tower", href: "/control-tower", group: "Command Center", keywords: ["monitoring", "alerts", "sla"] },
  { icon: AlertCircle, label: "NDR Queue", href: "/ndr", group: "Command Center", keywords: ["non-delivery", "failed", "returns"] },

  // Orders
  { icon: ShoppingCart, label: "All Orders", href: "/orders", group: "Orders", keywords: ["sales", "purchases"] },
  { icon: Plus, label: "Create Order", href: "/orders/new", group: "Orders", keywords: ["new", "add"] },
  { icon: Upload, label: "Import Orders", href: "/orders/import", group: "Orders", keywords: ["bulk", "csv", "excel"] },
  { icon: Handshake, label: "B2B Sales", href: "/b2b/quotations", group: "Orders", keywords: ["wholesale", "business"] },

  // Warehouse Operations
  { icon: ArrowDownToLine, label: "Inbound", href: "/inbound/purchase-orders", group: "Warehouse", keywords: ["receiving", "po", "purchase"] },
  { icon: PackageOpen, label: "Fulfillment", href: "/fulfillment/waves", group: "Warehouse", keywords: ["picking", "packing", "shipping"] },
  { icon: Layers, label: "Wave Planning", href: "/fulfillment/waves", group: "Warehouse", keywords: ["batch", "pick"] },
  { icon: Package, label: "Picklist", href: "/fulfillment/picklist", group: "Warehouse", keywords: ["pick", "picking"] },
  { icon: Boxes, label: "Inventory", href: "/inventory", group: "Warehouse", keywords: ["stock", "warehouse"] },

  // Logistics
  { icon: Truck, label: "Shipments", href: "/logistics/tracking", group: "Logistics", keywords: ["tracking", "delivery", "courier"] },
  { icon: FileText, label: "Manifest", href: "/fulfillment/manifest", group: "Logistics", keywords: ["awb", "shipping"] },
  { icon: RotateCcw, label: "Returns", href: "/returns", group: "Logistics", keywords: ["rto", "refund"] },

  // Finance & Analytics
  { icon: CreditCard, label: "Finance", href: "/finance/dashboard", group: "Finance", keywords: ["cod", "payments", "billing"] },
  { icon: BarChart3, label: "Reports", href: "/reports", group: "Finance", keywords: ["analytics", "stats"] },
  { icon: TrendingUp, label: "Analytics", href: "/analytics/sales", group: "Finance", keywords: ["charts", "trends"] },

  // Settings
  { icon: Settings, label: "Settings", href: "/settings/company", group: "Settings", keywords: ["config", "preferences"] },
  { icon: Users, label: "Users & Roles", href: "/settings/users", group: "Settings", keywords: ["team", "permissions"] },
  { icon: Package, label: "SKU Master", href: "/masters/skus", group: "Settings", keywords: ["products", "catalog"] },

  // Admin
  { icon: Building2, label: "All Companies", href: "/master/companies", group: "Admin", adminOnly: true, keywords: ["tenants", "clients"] },
  { icon: Users, label: "All Brands", href: "/master/brands", group: "Admin", adminOnly: true, keywords: ["tenants"] },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const filteredItems = navigationItems.filter(
    (item) => !item.adminOnly || isSuperAdmin
  );

  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = [];
      }
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, NavigationItem[]>
  );

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, actions, orders..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {Object.entries(groupedItems).map(([group, items], index) => (
            <React.Fragment key={group}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.keywords?.join(" ") || ""}`}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}

          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem
              value="create new order"
              onSelect={() => handleSelect("/orders/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Order</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="import orders csv"
              onSelect={() => handleSelect("/orders/import")}
            >
              <Upload className="mr-2 h-4 w-4" />
              <span>Import Orders</span>
            </CommandItem>
            <CommandItem
              value="start wave picking"
              onSelect={() => handleSelect("/fulfillment/waves")}
            >
              <Layers className="mr-2 h-4 w-4" />
              <span>Start Wave</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
