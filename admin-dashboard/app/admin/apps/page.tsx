'use client'

/**
 * Apps Management Page
 * List, search, and manage registered OAuth applications
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateAppModal } from '@/components/apps/CreateAppModal'
import { apiClient } from '@/lib/api/client'
import type { ListAppsResponse, AppFilters } from '@/types'

export default function AppsPage() {
  const router = useRouter()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [filters, setFilters] = useState<AppFilters>({
    search: '',
    is_active: undefined,
    page: 1,
    limit: 10,
  })

  // Fetch apps list
  const { data, isLoading, error } = useQuery({
    queryKey: ['apps', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active))
      params.append('page', String(filters.page))
      params.append('limit', String(filters.limit))

      return apiClient.get<ListAppsResponse>(`/api/v1/admin/apps?${params}`)
    },
  })

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">
            Manage OAuth 2.0 applications and API credentials
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New App
        </Button>
      </div>

      {/* Create App Modal */}
      <CreateAppModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Apps</CardTitle>
          <CardDescription>
            Find applications by name, description, or API key
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search apps..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">All Apps</Button>
            <Button variant="outline">Active Only</Button>
          </div>
        </CardContent>
      </Card>

      {/* Apps Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-8 text-center text-gray-500">
              Loading applications...
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-red-500">
              Error loading applications. Please try again.
            </div>
          )}

          {data && data.apps.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No applications found. Create your first app to get started.
            </div>
          )}

          {data && data.apps.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.apps.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/admin/apps/${app.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.name}
                        </div>
                        {app.description && (
                          <div className="text-sm text-gray-500">
                            {app.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {app.api_key}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            app.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {app.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/apps/${app.id}`)
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{' '}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
            {data.pagination.total} apps
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={data.pagination.page === 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={data.pagination.page === data.pagination.total_pages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
