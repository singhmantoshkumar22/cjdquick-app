/**
 * Dashboard React Query Hooks
 *
 * Type-safe data fetching for dashboard statistics
 * using the generated OpenAPI client and TanStack Query.
 */

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardApiDashboardGet,
  getAnalyticsApiDashboardAnalyticsGet,
  type GetDashboardApiDashboardGetData,
  type GetAnalyticsApiDashboardAnalyticsGetData,
} from "@/lib/api/client";

// Query keys for cache management
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (params?: GetDashboardApiDashboardGetData) =>
    [...dashboardKeys.all, "stats", params] as const,
  analytics: (params?: GetAnalyticsApiDashboardAnalyticsGetData) =>
    [...dashboardKeys.all, "analytics", params] as const,
};

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats(params: GetDashboardApiDashboardGetData = {}) {
  return useQuery({
    queryKey: dashboardKeys.stats(params),
    queryFn: () => getDashboardApiDashboardGet(params),
    staleTime: 30 * 1000, // 30 seconds - dashboard should be relatively fresh
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

/**
 * Hook to fetch dashboard analytics data
 */
export function useDashboardAnalytics(
  params: GetAnalyticsApiDashboardAnalyticsGetData = {}
) {
  return useQuery({
    queryKey: dashboardKeys.analytics(params),
    queryFn: () => getAnalyticsApiDashboardAnalyticsGet(params),
    staleTime: 60 * 1000, // 1 minute
  });
}
