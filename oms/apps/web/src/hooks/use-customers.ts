/**
 * Customers React Query Hooks
 *
 * Type-safe data fetching for customer-related operations
 * using the generated OpenAPI client and TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCustomersApiV1CustomersGet,
  getCustomerApiV1CustomersCustomerIdGet,
  createCustomerApiV1CustomersPost,
  updateCustomerApiV1CustomersCustomerIdPatch,
  deleteCustomerApiV1CustomersCustomerIdDelete,
  countCustomersApiV1CustomersCountGet,
  getCreditSummaryApiV1CustomersCreditSummaryGet,
  adjustCustomerCreditApiV1CustomersCustomerIdCreditAdjustmentPost,
  listCustomerGroupsApiV1CustomersGroupsGet,
  getCustomerGroupApiV1CustomersGroupsGroupIdGet,
  createCustomerGroupApiV1CustomersGroupsPost,
  updateCustomerGroupApiV1CustomersGroupsGroupIdPatch,
  deleteCustomerGroupApiV1CustomersGroupsGroupIdDelete,
  type ListCustomersApiV1CustomersGetData,
  type CreateCustomerApiV1CustomersPostData,
  type UpdateCustomerApiV1CustomersCustomerIdPatchData,
  type CountCustomersApiV1CustomersCountGetData,
  type AdjustCustomerCreditApiV1CustomersCustomerIdCreditAdjustmentPostData,
  type ListCustomerGroupsApiV1CustomersGroupsGetData,
  type CreateCustomerGroupApiV1CustomersGroupsPostData,
  type UpdateCustomerGroupApiV1CustomersGroupsGroupIdPatchData,
} from "@/lib/api/client";

// Query keys for cache management
export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (filters: ListCustomersApiV1CustomersGetData) =>
    [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  count: (params?: CountCustomersApiV1CustomersCountGetData) =>
    [...customerKeys.all, "count", params] as const,
  creditSummary: () => [...customerKeys.all, "creditSummary"] as const,
  groups: () => [...customerKeys.all, "groups"] as const,
  groupList: (filters: ListCustomerGroupsApiV1CustomersGroupsGetData) =>
    [...customerKeys.groups(), filters] as const,
  groupDetail: (id: string) => [...customerKeys.groups(), id] as const,
};

/**
 * Hook to fetch paginated customer list with filters
 */
export function useCustomerList(params: ListCustomersApiV1CustomersGetData = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomersApiV1CustomersGet(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch customer count
 */
export function useCustomerCount(
  params: CountCustomersApiV1CustomersCountGetData = {}
) {
  return useQuery({
    queryKey: customerKeys.count(params),
    queryFn: () => countCustomersApiV1CustomersCountGet(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch credit summary across all customers
 */
export function useCustomerCreditSummary() {
  return useQuery({
    queryKey: customerKeys.creditSummary(),
    queryFn: () => getCreditSummaryApiV1CustomersCreditSummaryGet(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a single customer by ID
 */
export function useCustomerDetail(customerId: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => getCustomerApiV1CustomersCustomerIdGet({ customerId }),
    enabled: enabled && !!customerId,
  });
}

/**
 * Hook to create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerApiV1CustomersPostData) =>
      createCustomerApiV1CustomersPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.count() });
    },
  });
}

/**
 * Hook to update a customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCustomerApiV1CustomersCustomerIdPatchData) =>
      updateCustomerApiV1CustomersCustomerIdPatch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.customerId),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

/**
 * Hook to delete a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) =>
      deleteCustomerApiV1CustomersCustomerIdDelete({ customerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.count() });
    },
  });
}

/**
 * Hook to adjust customer credit
 */
export function useAdjustCustomerCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: AdjustCustomerCreditApiV1CustomersCustomerIdCreditAdjustmentPostData
    ) => adjustCustomerCreditApiV1CustomersCustomerIdCreditAdjustmentPost(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.customerId),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.creditSummary() });
    },
  });
}

// ============================================================================
// Customer Groups
// ============================================================================

/**
 * Hook to fetch customer groups list
 */
export function useCustomerGroupList(
  params: ListCustomerGroupsApiV1CustomersGroupsGetData = {}
) {
  return useQuery({
    queryKey: customerKeys.groupList(params),
    queryFn: () => listCustomerGroupsApiV1CustomersGroupsGet(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a single customer group by ID
 */
export function useCustomerGroupDetail(groupId: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.groupDetail(groupId),
    queryFn: () => getCustomerGroupApiV1CustomersGroupsGroupIdGet({ groupId }),
    enabled: enabled && !!groupId,
  });
}

/**
 * Hook to create a new customer group
 */
export function useCreateCustomerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerGroupApiV1CustomersGroupsPostData) =>
      createCustomerGroupApiV1CustomersGroupsPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.groups() });
    },
  });
}

/**
 * Hook to update a customer group
 */
export function useUpdateCustomerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCustomerGroupApiV1CustomersGroupsGroupIdPatchData) =>
      updateCustomerGroupApiV1CustomersGroupsGroupIdPatch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.groupDetail(variables.groupId),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.groups() });
    },
  });
}

/**
 * Hook to delete a customer group
 */
export function useDeleteCustomerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) =>
      deleteCustomerGroupApiV1CustomersGroupsGroupIdDelete({ groupId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.groups() });
    },
  });
}
