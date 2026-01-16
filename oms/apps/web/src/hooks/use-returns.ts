/**
 * Returns React Query Hooks
 *
 * Type-safe data fetching for return-related operations
 * using the generated OpenAPI client and TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listReturnsApiV1ReturnsGet,
  getReturnApiV1ReturnsReturnIdGet,
  createReturnApiV1ReturnsPost,
  updateReturnApiV1ReturnsReturnIdPatch,
  getReturnSummaryApiV1ReturnsSummaryGet,
  countReturnsApiV1ReturnsCountGet,
  receiveReturnApiV1ReturnsReturnIdReceivePost,
  updateQcStatusApiV1ReturnsReturnIdQcPost,
  processReturnApiV1ReturnsReturnIdProcessPost,
  listReturnItemsApiV1ReturnsReturnIdItemsGet,
  type ListReturnsApiV1ReturnsGetData,
  type CreateReturnApiV1ReturnsPostData,
  type UpdateReturnApiV1ReturnsReturnIdPatchData,
  type CountReturnsApiV1ReturnsCountGetData,
  type ReceiveReturnApiV1ReturnsReturnIdReceivePostData,
  type UpdateQcStatusApiV1ReturnsReturnIdQcPostData,
  type ProcessReturnApiV1ReturnsReturnIdProcessPostData,
} from "@/lib/api/client";

// Query keys for cache management
export const returnKeys = {
  all: ["returns"] as const,
  lists: () => [...returnKeys.all, "list"] as const,
  list: (filters: ListReturnsApiV1ReturnsGetData) =>
    [...returnKeys.lists(), filters] as const,
  details: () => [...returnKeys.all, "detail"] as const,
  detail: (id: string) => [...returnKeys.details(), id] as const,
  summary: () => [...returnKeys.all, "summary"] as const,
  count: (params?: CountReturnsApiV1ReturnsCountGetData) =>
    [...returnKeys.all, "count", params] as const,
  items: (returnId: string) => [...returnKeys.all, "items", returnId] as const,
};

/**
 * Hook to fetch paginated returns list with filters
 */
export function useReturnList(params: ListReturnsApiV1ReturnsGetData = {}) {
  return useQuery({
    queryKey: returnKeys.list(params),
    queryFn: () => listReturnsApiV1ReturnsGet(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch return summary statistics
 */
export function useReturnSummary() {
  return useQuery({
    queryKey: returnKeys.summary(),
    queryFn: () => getReturnSummaryApiV1ReturnsSummaryGet(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch returns count
 */
export function useReturnCount(params: CountReturnsApiV1ReturnsCountGetData = {}) {
  return useQuery({
    queryKey: returnKeys.count(params),
    queryFn: () => countReturnsApiV1ReturnsCountGet(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch a single return by ID
 */
export function useReturnDetail(returnId: string, enabled = true) {
  return useQuery({
    queryKey: returnKeys.detail(returnId),
    queryFn: () => getReturnApiV1ReturnsReturnIdGet({ returnId }),
    enabled: enabled && !!returnId,
  });
}

/**
 * Hook to fetch return items
 */
export function useReturnItems(returnId: string, enabled = true) {
  return useQuery({
    queryKey: returnKeys.items(returnId),
    queryFn: () => listReturnItemsApiV1ReturnsReturnIdItemsGet({ returnId }),
    enabled: enabled && !!returnId,
  });
}

/**
 * Hook to create a new return
 */
export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReturnApiV1ReturnsPostData) =>
      createReturnApiV1ReturnsPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.summary() });
      queryClient.invalidateQueries({ queryKey: returnKeys.count() });
    },
  });
}

/**
 * Hook to update a return
 */
export function useUpdateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateReturnApiV1ReturnsReturnIdPatchData) =>
      updateReturnApiV1ReturnsReturnIdPatch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: returnKeys.detail(variables.returnId),
      });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.summary() });
    },
  });
}

/**
 * Hook to mark a return as received
 */
export function useReceiveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReceiveReturnApiV1ReturnsReturnIdReceivePostData) =>
      receiveReturnApiV1ReturnsReturnIdReceivePost(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: returnKeys.detail(variables.returnId),
      });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.summary() });
    },
  });
}

/**
 * Hook to update QC status of a return
 */
export function useUpdateReturnQc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateQcStatusApiV1ReturnsReturnIdQcPostData) =>
      updateQcStatusApiV1ReturnsReturnIdQcPost(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: returnKeys.detail(variables.returnId),
      });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.summary() });
    },
  });
}

/**
 * Hook to process a return (restock/dispose)
 */
export function useProcessReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProcessReturnApiV1ReturnsReturnIdProcessPostData) =>
      processReturnApiV1ReturnsReturnIdProcessPost(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: returnKeys.detail(variables.returnId),
      });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.summary() });
      queryClient.invalidateQueries({ queryKey: returnKeys.count() });
    },
  });
}
