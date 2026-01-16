/**
 * Inventory React Query Hooks
 *
 * Type-safe data fetching for inventory-related operations
 * using the generated OpenAPI client and TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listInventoryApiV1InventoryGet,
  getInventoryApiV1InventoryInventoryIdGet,
  createInventoryApiV1InventoryPost,
  updateInventoryApiV1InventoryInventoryIdPatch,
  deleteInventoryApiV1InventoryInventoryIdDelete,
  getInventorySummaryApiV1InventorySummaryGet,
  countInventoryApiV1InventoryCountGet,
  adjustInventoryApiV1InventoryAdjustPost,
  transferInventoryApiV1InventoryTransferPost,
  type ListInventoryApiV1InventoryGetData,
  type CreateInventoryApiV1InventoryPostData,
  type UpdateInventoryApiV1InventoryInventoryIdPatchData,
  type GetInventorySummaryApiV1InventorySummaryGetData,
  type CountInventoryApiV1InventoryCountGetData,
  type AdjustInventoryApiV1InventoryAdjustPostData,
  type TransferInventoryApiV1InventoryTransferPostData,
} from "@/lib/api/client";

// Query keys for cache management
export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (filters: ListInventoryApiV1InventoryGetData) =>
    [...inventoryKeys.lists(), filters] as const,
  details: () => [...inventoryKeys.all, "detail"] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  summary: (params?: GetInventorySummaryApiV1InventorySummaryGetData) =>
    [...inventoryKeys.all, "summary", params] as const,
  count: (params?: CountInventoryApiV1InventoryCountGetData) =>
    [...inventoryKeys.all, "count", params] as const,
};

/**
 * Hook to fetch paginated inventory list with filters
 */
export function useInventoryList(params: ListInventoryApiV1InventoryGetData = {}) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => listInventoryApiV1InventoryGet(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch inventory summary statistics
 */
export function useInventorySummary(
  params: GetInventorySummaryApiV1InventorySummaryGetData = {}
) {
  return useQuery({
    queryKey: inventoryKeys.summary(params),
    queryFn: () => getInventorySummaryApiV1InventorySummaryGet(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch inventory count
 */
export function useInventoryCount(
  params: CountInventoryApiV1InventoryCountGetData = {}
) {
  return useQuery({
    queryKey: inventoryKeys.count(params),
    queryFn: () => countInventoryApiV1InventoryCountGet(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch a single inventory record by ID
 */
export function useInventoryDetail(inventoryId: string, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.detail(inventoryId),
    queryFn: () => getInventoryApiV1InventoryInventoryIdGet({ inventoryId }),
    enabled: enabled && !!inventoryId,
  });
}

/**
 * Hook to create a new inventory record
 */
export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryApiV1InventoryPostData) =>
      createInventoryApiV1InventoryPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.count() });
    },
  });
}

/**
 * Hook to update an inventory record
 */
export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateInventoryApiV1InventoryInventoryIdPatchData) =>
      updateInventoryApiV1InventoryInventoryIdPatch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.detail(variables.inventoryId),
      });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
    },
  });
}

/**
 * Hook to delete an inventory record
 */
export function useDeleteInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryId: string) =>
      deleteInventoryApiV1InventoryInventoryIdDelete({ inventoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.count() });
    },
  });
}

/**
 * Hook to adjust inventory (add/remove stock)
 */
export function useAdjustInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdjustInventoryApiV1InventoryAdjustPostData) =>
      adjustInventoryApiV1InventoryAdjustPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
    },
  });
}

/**
 * Hook to transfer inventory between locations
 */
export function useTransferInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferInventoryApiV1InventoryTransferPostData) =>
      transferInventoryApiV1InventoryTransferPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
    },
  });
}
