/**
 * React Query Hooks for App Management
 * ✅ P1-2: API Secrets Never Cached
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  App,
  CreateAppInput,
  CreateAppResponse,
  UpdateAppInput,
  ListAppsResponse,
  AppDetailsResponse,
} from '@/types'

/**
 * Fetch apps list
 * ✅ Safe to cache (no sensitive data)
 */
export function useApps(params?: { search?: string; active?: boolean }) {
  return useQuery({
    queryKey: ['apps', params],
    queryFn: () => apiClient.get<ListAppsResponse>('/api/v1/admin/apps', {
      headers: params ? { 'X-Query-Params': JSON.stringify(params) } : undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch single app details
 * ✅ Safe to cache (api_secret is never included)
 */
export function useApp(id: string) {
  return useQuery({
    queryKey: ['app', id],
    queryFn: () => apiClient.get<AppDetailsResponse>(`/api/v1/admin/apps/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Create new app
 * ✅ P1-2: API Secret NEVER cached
 */
export function useCreateApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAppInput) =>
      apiClient.post<CreateAppResponse>('/api/v1/admin/apps', data),

    onSuccess: (response) => {
      // ✅ Invalidate apps list
      queryClient.invalidateQueries({ queryKey: ['apps'] })

      // ❌ CRITICAL: Do NOT cache the response containing api_secret!
      // The secret is only available in the mutation result, shown once in modal

      // ✅ Cache the app data WITHOUT secret
      queryClient.setQueryData(['app', response.app.id], {
        app: {
          ...response.app,
          // api_secret is NOT included in cached data
        },
      })
    },

    // ✅ P1-2: Prevent secret from being retained
    gcTime: 0, // Immediately garbage collect from memory
    retry: false, // Don't retry (would regenerate secret)
  })
}

/**
 * Update app
 */
export function useUpdateApp(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateAppInput) =>
      apiClient.put<AppDetailsResponse>(`/api/v1/admin/apps/${id}`, data),

    onSuccess: (response) => {
      queryClient.setQueryData(['app', id], response)
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

/**
 * Delete/Deactivate app
 */
export function useDeleteApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, hard }: { id: string; hard?: boolean }) =>
      apiClient.delete(`/api/v1/admin/apps/${id}?hard=${hard ? 'true' : 'false'}`),

    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: ['app', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

/**
 * Regenerate API Secret
 * ✅ P1-2: Secret NEVER cached, shown once
 */
export function useRegenerateSecret(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      apiClient.post<{ api_secret: string }>(`/api/v1/admin/apps/${id}/regenerate-secret`),

    onSuccess: () => {
      // Invalidate app data (api_key might have changed)
      queryClient.invalidateQueries({ queryKey: ['app', id] })
    },

    // ✅ P1-2: Security settings
    gcTime: 0, // Immediate garbage collection
    retry: false, // Never retry (would generate multiple secrets!)
    // Note: api_secret is only in mutation.data, never cached
  })
}

/**
 * Security Notes:
 *
 * ✅ DO:
 * - Use gcTime: 0 for secret-generating mutations
 * - Show secrets in modal immediately
 * - Never cache secrets in React Query
 * - Clear secret from React state after modal closes
 *
 * ❌ DON'T:
 * - queryClient.setQueryData with secrets
 * - Store secrets in localStorage/sessionStorage
 * - Keep secrets in React state longer than needed
 * - Log secrets to console
 *
 * Example Usage:
 *
 * const createApp = useCreateApp()
 *
 * const handleCreate = async (data) => {
 *   const result = await createApp.mutateAsync(data)
 *   // result.api_secret is available HERE
 *   showSecretModal(result.api_secret) // Show once
 *   // After modal closes, secret is gone from memory
 * }
 */
