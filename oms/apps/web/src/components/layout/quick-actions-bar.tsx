"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  ShoppingCart,
  Package,
  Truck,
  FileText,
  Layers,
  Upload,
  RotateCcw,
  Boxes,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  color: string;
  roles?: string[];
}

const quickActions: QuickAction[] = [
  {
    id: "create-order",
    label: "Create Order",
    shortLabel: "Order",
    icon: ShoppingCart,
    href: "/orders/new",
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "import-orders",
    label: "Import Orders",
    shortLabel: "Import",
    icon: Upload,
    href: "/orders/import",
    color: "bg-indigo-600 hover:bg-indigo-700",
  },
  {
    id: "start-wave",
    label: "Start Wave",
    shortLabel: "Wave",
    icon: Layers,
    href: "/fulfillment/waves",
    color: "bg-purple-600 hover:bg-purple-700",
  },
  {
    id: "create-shipment",
    label: "Create Shipment",
    shortLabel: "Ship",
    icon: Truck,
    href: "/fulfillment/manifest",
    color: "bg-green-600 hover:bg-green-700",
  },
  {
    id: "process-return",
    label: "Process Return",
    shortLabel: "Return",
    icon: RotateCcw,
    href: "/returns",
    color: "bg-amber-600 hover:bg-amber-700",
  },
  {
    id: "inventory-adjustment",
    label: "Inventory Adjustment",
    shortLabel: "Adjust",
    icon: Boxes,
    href: "/inventory/adjustment",
    color: "bg-teal-600 hover:bg-teal-700",
  },
];

export function QuickActionsBar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                onClick={() => setIsVisible(true)}
              >
                <Zap className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Show Quick Actions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <TooltipProvider>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full bg-background/95 backdrop-blur-md shadow-lg border p-2 transition-all duration-300",
            isExpanded ? "pr-4" : ""
          )}
        >
          {/* Main Actions - Always visible */}
          <div className="flex items-center gap-1">
            {quickActions.slice(0, isExpanded ? quickActions.length : 3).map((action) => (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className={cn(
                      "h-10 rounded-full text-white transition-all",
                      action.color,
                      isExpanded ? "px-4" : "w-10"
                    )}
                    onClick={() => action.href && router.push(action.href)}
                  >
                    <action.icon className="h-4 w-4" />
                    {isExpanded && (
                      <span className="ml-2 text-sm">{action.shortLabel}</span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Expand/Collapse Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Plus
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-45"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isExpanded ? "Show Less" : "More Actions"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Close Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setIsVisible(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Hide Quick Actions</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
