/**
 * Orders React Query Hooks
 *
 * Type-safe data fetching for order-related operations
 * using the generated OpenAPI client and TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOrdersApiV1OrdersGet,
  getOrderApiV1OrdersOrderIdGet,
  createOrderApiV1OrdersPost,
  updateOrderApiV1OrdersOrderIdPatch,
  cancelOrderApiV1OrdersOrderIdCancelPost,
  getOrderStatsApiV1OrdersStatsGet,
  countOrdersApiV1OrdersCountGet,
  listOrderItemsApiV1OrdersOrderIdItemsGet,
  listDeliveriesApiV1OrdersOrderIdDeliveriesGet,
  type ListOrdersApiV1OrdersGetData,
  type CreateOrderApiV1OrdersPostData,
  type UpdateOrderApiV1OrdersOrderIdPatchData,
  type CancelOrderApiV1OrdersOrderIdCancelPostData,
  type GetOrderStatsApiV1OrdersStatsGetData,
  type CountOrdersApiV1OrdersCountGetData,
} from "@/lib/api/client";

// Query keys for cache management
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: ListOrdersApiV1OrdersGetData) =>
    [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  stats: (params?: GetOrderStatsApiV1OrdersStatsGetData) =>
    [...orderKeys.all, "stats", params] as const,
  count: (params?: CountOrdersApiV1OrdersCountGetData) =>
    [...orderKeys.all, "count", params] as const,
  items: (orderId: string) => [...orderKeys.all, "items", orderId] as const,
  deliveries: (orderId: string) =>
    [...orderKeys.all, "deliveries", orderId] as const,
};

/**
 * Hook to fetch paginated order list with filters
 */
export function useOrderList(params: ListOrdersApiV1OrdersGetData = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => listOrdersApiV1OrdersGet(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch order statistics
 */
export function useOrderStats(params: GetOrderStatsApiV1OrdersStatsGetData = {}) {
  return useQuery({
    queryKey: orderKeys.stats(params),
    queryFn: () => getOrderStatsApiV1OrdersStatsGet(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch order count
 */
export function useOrderCount(params: CountOrdersApiV1OrdersCountGetData = {}) {
  return useQuery({
    queryKey: orderKeys.count(params),
    queryFn: () => countOrdersApiV1OrdersCountGet(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrderDetail(orderId: string, enabled = true) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderApiV1OrdersOrderIdGet({ orderId }),
    enabled: enabled && !!orderId,
  });
}

/**
 * Hook to fetch order items
 */
export function useOrderItems(orderId: string, enabled = true) {
  return useQuery({
    queryKey: orderKeys.items(orderId),
    queryFn: () => listOrderItemsApiV1OrdersOrderIdItemsGet({ orderId }),
    enabled: enabled && !!orderId,
  });
}

/**
 * Hook to fetch order deliveries
 */
export function useOrderDeliveries(orderId: string, enabled = true) {
  return useQuery({
    queryKey: orderKeys.deliveries(orderId),
    queryFn: () => listDeliveriesApiV1OrdersOrderIdDeliveriesGet({ orderId }),
    enabled: enabled && !!orderId,
  });
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderApiV1OrdersPostData) =>
      createOrderApiV1OrdersPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
      queryClient.invalidateQueries({ queryKey: orderKeys.count() });
    },
  });
}

/**
 * Hook to update an order
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrderApiV1OrdersOrderIdPatchData) =>
      updateOrderApiV1OrdersOrderIdPatch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
    },
  });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CancelOrderApiV1OrdersOrderIdCancelPostData) =>
      cancelOrderApiV1OrdersOrderIdCancelPost(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
      queryClient.invalidateQueries({ queryKey: orderKeys.count() });
    },
  });
}
