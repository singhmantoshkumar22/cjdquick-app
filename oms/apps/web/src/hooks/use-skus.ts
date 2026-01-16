/**
 * SKU React Query Hooks
 *
 * Type-safe data fetching for SKU-related operations
 * using the generated OpenAPI client and TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSkusApiV1SkusGet,
  getSkuApiV1SkusSkuIdGet,
  createSkuApiV1SkusPost,
  updateSkuApiV1SkusSkuIdPatch,
  deleteSkuApiV1SkusSkuIdDelete,
  countSkusApiV1SkusCountGet,
  listCategoriesApiV1SkusCategoriesGet,
  listBrandsApiV1SkusBrandsGet,
  type ListSkusApiV1SkusGetData,
  type CreateSkuApiV1SkusPostData,
  type UpdateSkuApiV1SkusSkuIdPatchData,
  type CountSkusApiV1SkusCountGetData,
} from "@/lib/api/client";

// Query keys for cache management
export const skuKeys = {
  all: ["skus"] as const,
  lists: () => [...skuKeys.all, "list"] as const,
  list: (filters: ListSkusApiV1SkusGetData) =>
    [...skuKeys.lists(), filters] as const,
  details: () => [...skuKeys.all, "detail"] as const,
  detail: (id: string) => [...skuKeys.details(), id] as const,
  count: (params?: CountSkusApiV1SkusCountGetData) =>
    [...skuKeys.all, "count", params] as const,
  categories: () => [...skuKeys.all, "categories"] as const,
  brands: () => [...skuKeys.all, "brands"] as const,
};

/**
 * Hook to fetch paginated SKU list with filters
 */
export function useSkuList(params: ListSkusApiV1SkusGetData = {}) {
  return useQuery({
    queryKey: skuKeys.list(params),
    queryFn: () => listSkusApiV1SkusGet(params),
    staleTime: 60 * 1000, // 1 minute - SKUs don't change frequently
  });
}

/**
 * Hook to fetch SKU count
 */
export function useSkuCount(params: CountSkusApiV1SkusCountGetData = {}) {
  return useQuery({
    queryKey: skuKeys.count(params),
    queryFn: () => countSkusApiV1SkusCountGet(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch a single SKU by ID
 */
export function useSkuDetail(skuId: string, enabled = true) {
  return useQuery({
    queryKey: skuKeys.detail(skuId),
    queryFn: () => getSkuApiV1SkusSkuIdGet({ skuId }),
    enabled: enabled && !!skuId,
  });
}

/**
 * Hook to fetch SKU categories
 */
export function useSkuCategories() {
  return useQuery({
    queryKey: skuKeys.categories(),
    queryFn: () => listCategoriesApiV1SkusCategoriesGet(),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories are relatively static
  });
}

/**
 * Hook to fetch brands for SKU dropdown
 */
export function useSkuBrands() {
  return useQuery({
    queryKey: skuKeys.brands(),
    queryFn: () => listBrandsApiV1SkusBrandsGet(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new SKU
 */
export function useCreateSku() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSkuApiV1SkusPostData) =>
      createSkuApiV1SkusPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skuKeys.lists() });
      queryClient.invalidateQueries({ queryKey: skuKeys.count() });
    },
  });
}

/**
 * Hook to update a SKU
 */
export function useUpdateSku() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSkuApiV1SkusSkuIdPatchData) =>
      updateSkuApiV1SkusSkuIdPatch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: skuKeys.detail(variables.skuId),
      });
      queryClient.invalidateQueries({ queryKey: skuKeys.lists() });
    },
  });
}

/**
 * Hook to delete a SKU
 */
export function useDeleteSku() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (skuId: string) => deleteSkuApiV1SkusSkuIdDelete({ skuId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skuKeys.lists() });
      queryClient.invalidateQueries({ queryKey: skuKeys.count() });
    },
  });
}
