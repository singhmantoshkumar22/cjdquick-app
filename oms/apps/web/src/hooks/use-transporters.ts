/**
 * Transporters React Query Hooks
 *
 * Type-safe data fetching for transporter and manifest operations
 * using the generated OpenAPI client and TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTransportersApiV1TransportersGet,
  getTransporterApiV1TransportersTransporterIdGet,
  createTransporterApiV1TransportersPost,
  updateTransporterApiV1TransportersTransporterIdPatch,
  deleteTransporterApiV1TransportersTransporterIdDelete,
  countTransportersApiV1TransportersCountGet,
  listManifestsApiV1TransportersManifestsGet,
  getManifestApiV1TransportersManifestsManifestIdGet,
  createManifestApiV1TransportersManifestsPost,
  updateManifestApiV1TransportersManifestsManifestIdPatch,
  closeManifestApiV1TransportersManifestsManifestIdClosePost,
  handoverManifestApiV1TransportersManifestsManifestIdHandoverPost,
  countManifestsApiV1TransportersManifestsCountGet,
  type ListTransportersApiV1TransportersGetData,
  type CreateTransporterApiV1TransportersPostData,
  type UpdateTransporterApiV1TransportersTransporterIdPatchData,
  type CountTransportersApiV1TransportersCountGetData,
  type ListManifestsApiV1TransportersManifestsGetData,
  type CreateManifestApiV1TransportersManifestsPostData,
  type UpdateManifestApiV1TransportersManifestsManifestIdPatchData,
  type CloseManifestApiV1TransportersManifestsManifestIdClosePostData,
  type HandoverManifestApiV1TransportersManifestsManifestIdHandoverPostData,
  type CountManifestsApiV1TransportersManifestsCountGetData,
} from "@/lib/api/client";

// Query keys for cache management
export const transporterKeys = {
  all: ["transporters"] as const,
  lists: () => [...transporterKeys.all, "list"] as const,
  list: (filters: ListTransportersApiV1TransportersGetData) =>
    [...transporterKeys.lists(), filters] as const,
  details: () => [...transporterKeys.all, "detail"] as const,
  detail: (id: string) => [...transporterKeys.details(), id] as const,
  count: (params?: CountTransportersApiV1TransportersCountGetData) =>
    [...transporterKeys.all, "count", params] as const,
};

export const manifestKeys = {
  all: ["manifests"] as const,
  lists: () => [...manifestKeys.all, "list"] as const,
  list: (filters: ListManifestsApiV1TransportersManifestsGetData) =>
    [...manifestKeys.lists(), filters] as const,
  details: () => [...manifestKeys.all, "detail"] as const,
  detail: (id: string) => [...manifestKeys.details(), id] as const,
  count: (params?: CountManifestsApiV1TransportersManifestsCountGetData) =>
    [...manifestKeys.all, "count", params] as const,
};

// ============================================================================
// Transporter Hooks
// ============================================================================

/**
 * Hook to fetch paginated transporter list
 */
export function useTransporterList(
  params: ListTransportersApiV1TransportersGetData = {}
) {
  return useQuery({
    queryKey: transporterKeys.list(params),
    queryFn: () => listTransportersApiV1TransportersGet(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch transporter count
 */
export function useTransporterCount(
  params: CountTransportersApiV1TransportersCountGetData = {}
) {
  return useQuery({
    queryKey: transporterKeys.count(params),
    queryFn: () => countTransportersApiV1TransportersCountGet(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch a single transporter by ID
 */
export function useTransporterDetail(transporterId: string, enabled = true) {
  return useQuery({
    queryKey: transporterKeys.detail(transporterId),
    queryFn: () =>
      getTransporterApiV1TransportersTransporterIdGet({ transporterId }),
    enabled: enabled && !!transporterId,
  });
}

/**
 * Hook to create a new transporter
 */
export function useCreateTransporter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransporterApiV1TransportersPostData) =>
      createTransporterApiV1TransportersPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transporterKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transporterKeys.count() });
    },
  });
}

/**
 * Hook to update a transporter
 */
export function useUpdateTransporter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTransporterApiV1TransportersTransporterIdPatchData) =>
      updateTransporterApiV1TransportersTransporterIdPatch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: transporterKeys.detail(variables.transporterId),
      });
      queryClient.invalidateQueries({ queryKey: transporterKeys.lists() });
    },
  });
}

/**
 * Hook to delete a transporter
 */
export function useDeleteTransporter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transporterId: string) =>
      deleteTransporterApiV1TransportersTransporterIdDelete({ transporterId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transporterKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transporterKeys.count() });
    },
  });
}

// ============================================================================
// Manifest Hooks
// ============================================================================

/**
 * Hook to fetch paginated manifest list
 */
export function useManifestList(
  params: ListManifestsApiV1TransportersManifestsGetData = {}
) {
  return useQuery({
    queryKey: manifestKeys.list(params),
    queryFn: () => listManifestsApiV1TransportersManifestsGet(params),
    staleTime: 30 * 1000, // 30 seconds - manifests change frequently
  });
}

/**
 * Hook to fetch manifest count
 */
export function useManifestCount(
  params: CountManifestsApiV1TransportersManifestsCountGetData = {}
) {
  return useQuery({
    queryKey: manifestKeys.count(params),
    queryFn: () => countManifestsApiV1TransportersManifestsCountGet(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch a single manifest by ID
 */
export function useManifestDetail(manifestId: string, enabled = true) {
  return useQuery({
    queryKey: manifestKeys.detail(manifestId),
    queryFn: () =>
      getManifestApiV1TransportersManifestsManifestIdGet({ manifestId }),
    enabled: enabled && !!manifestId,
  });
}

/**
 * Hook to create a new manifest
 */
export function useCreateManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateManifestApiV1TransportersManifestsPostData) =>
      createManifestApiV1TransportersManifestsPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manifestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: manifestKeys.count() });
    },
  });
}

/**
 * Hook to update a manifest
 */
export function useUpdateManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateManifestApiV1TransportersManifestsManifestIdPatchData) =>
      updateManifestApiV1TransportersManifestsManifestIdPatch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: manifestKeys.detail(variables.manifestId),
      });
      queryClient.invalidateQueries({ queryKey: manifestKeys.lists() });
    },
  });
}

/**
 * Hook to close a manifest
 */
export function useCloseManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: CloseManifestApiV1TransportersManifestsManifestIdClosePostData
    ) => closeManifestApiV1TransportersManifestsManifestIdClosePost(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: manifestKeys.detail(variables.manifestId),
      });
      queryClient.invalidateQueries({ queryKey: manifestKeys.lists() });
    },
  });
}

/**
 * Hook to handover a manifest to transporter
 */
export function useHandoverManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: HandoverManifestApiV1TransportersManifestsManifestIdHandoverPostData
    ) => handoverManifestApiV1TransportersManifestsManifestIdHandoverPost(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: manifestKeys.detail(variables.manifestId),
      });
      queryClient.invalidateQueries({ queryKey: manifestKeys.lists() });
    },
  });
}
