/**
 * React Query Hooks Index
 *
 * Centralized export of all data fetching hooks.
 * Import from this file for convenient access to all hooks.
 *
 * Usage:
 * ```tsx
 * import { useOrderList, useInventorySummary, useNdrList } from "@/hooks";
 * ```
 */

// Orders
export * from "./use-orders";

// Inventory
export * from "./use-inventory";

// Returns
export * from "./use-returns";

// Customers
export * from "./use-customers";

// SKUs
export * from "./use-skus";

// NDR (Non-Delivery Reports)
export * from "./use-ndr";

// Transporters & Manifests
export * from "./use-transporters";

// Dashboard
export * from "./use-dashboard";

// UI Hooks
export * from "./use-mobile";
export * from "./use-toast";
