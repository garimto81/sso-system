'use client'

/**
 * App Details Page
 * View app information, statistics, and analytics
 */

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Users,
  Key,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api/client'
import { copyToClipboard, formatDate, formatNumber } from '@/lib/utils'
import type { AppDetailsResponse } from '@/types'
import { useState } from 'react'

interface Props {
  params: Promise<{ id: string }>
}

export default function AppDetailsPage({ params }: Props) {
  const router = useRouter()
  const { id } = use(params)
  const [copiedKey, setCopiedKey] = useState(false)

  // Fetch app details
  const { data, isLoading, error } = useQuery({
    queryKey: ['app', id],
    queryFn: () => apiClient.get<AppDetailsResponse>(`/api/v1/admin/apps/${id}`),
  })

  const handleCopyKey = async () => {
    if (data?.app.api_key) {
      await copyToClipboard(data.app.api_key)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading app details...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load app details</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const { app, stats } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{app.name}</h1>
              <Badge variant={app.is_active ? 'success' : 'secondary'}>
                {app.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {app.description && (
              <p className="text-gray-600 mt-1">{app.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate Secret
          </Button>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(stats.total_logins)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Token Exchanges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(stats.total_token_exchanges)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Unique Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-500 mt-1">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-gray-900">
              {stats.last_activity
                ? formatDate(stats.last_activity, 'relative')
                : 'No activity'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* App Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>API Credentials</CardTitle>
            <CardDescription>
              Use these credentials to authenticate API requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key */}
            <div>
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <div className="flex gap-2 mt-1.5">
                <code className="flex-1 bg-gray-50 px-3 py-2 rounded border border-gray-200 text-sm font-mono overflow-x-auto">
                  {app.api_key}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                  title="Copy API Key"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* API Secret Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>API Secret:</strong> Not shown for security. If lost, regenerate a new one.
              </p>
            </div>

            {/* Creation Date */}
            <div>
              <label className="text-sm font-medium text-gray-700">Created</label>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(app.created_at, 'long')}
              </p>
            </div>

            {/* Created By */}
            <div>
              <label className="text-sm font-medium text-gray-700">Created By</label>
              <p className="text-sm text-gray-600 mt-1">{app.created_by}</p>
            </div>
          </CardContent>
        </Card>

        {/* URLs Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>URLs Configuration</CardTitle>
            <CardDescription>
              Authorized redirect and origin URLs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Redirect URLs */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Redirect URLs ({app.redirect_urls.length})
              </label>
              <div className="space-y-2">
                {app.redirect_urls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded border border-gray-200"
                  >
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{url}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Allowed Origins */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Allowed Origins ({app.allowed_origins.length})
              </label>
              <div className="space-y-2">
                {app.allowed_origins.map((origin, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded border border-gray-200"
                  >
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{origin}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>
            Usage trends and activity over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-400">Analytics charts coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
