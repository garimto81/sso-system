'use client'

/**
 * Create App Modal (Simplified Version)
 * ✅ P1-2: API Secret show-once pattern
 * ✅ Form validation with React Hook Form + Zod
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, Copy, Check, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateApp } from '@/lib/hooks/use-apps'
import { createAppSchema, type CreateAppFormData } from '@/lib/validations/app'
import { copyToClipboard } from '@/lib/utils'

interface CreateAppModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAppModal({ open, onOpenChange }: CreateAppModalProps) {
  const [showSecret, setShowSecret] = useState(false)
  const [apiSecret, setApiSecret] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [apiKey, setApiKey] = useState('')

  // Dynamic URL fields
  const [redirectUrls, setRedirectUrls] = useState<string[]>([''])
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([''])

  const createApp = useCreateApp()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAppFormData>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (data: Omit<CreateAppFormData, 'redirect_urls' | 'allowed_origins'>) => {
    try {
      const response = await createApp.mutateAsync({
        name: data.name,
        description: data.description,
        redirect_urls: redirectUrls.filter((url) => url.trim() !== ''),
        allowed_origins: allowedOrigins.filter((url) => url.trim() !== ''),
      })

      // ✅ Show API Secret ONCE
      setApiSecret(response.api_secret)
      setApiKey(response.app.api_key)
      setShowSecret(true)
    } catch (error) {
      console.error('Failed to create app:', error)
    }
  }

  const handleCopySecret = async () => {
    await copyToClipboard(apiSecret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const handleCopyKey = async () => {
    await copyToClipboard(apiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleClose = () => {
    reset()
    setRedirectUrls([''])
    setAllowedOrigins([''])
    setShowSecret(false)
    setApiSecret('')
    setApiKey('')
    setCopiedSecret(false)
    setCopiedKey(false)
    onOpenChange(false)
  }

  // ⚠️ Show-Once Warning Screen
  if (showSecret) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              Application Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your API credentials have been generated. Copy them now - the secret will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* ⚠️ Critical Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    ⚠️ Important: Copy Your API Secret Now
                  </h4>
                  <p className="text-sm text-yellow-800">
                    This is the <strong>only time</strong> you will see your API secret.
                    If you lose it, you'll need to regenerate a new one, which will invalidate the old secret.
                  </p>
                </div>
              </div>
            </div>

            {/* API Key */}
            <div>
              <Label>API Key</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* API Secret (Show-Once) */}
            <div>
              <Label className="text-red-600">API Secret (Show Once Only)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={apiSecret}
                  readOnly
                  className="font-mono text-sm bg-red-50 border-red-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-red-600 mt-1">
                ⚠️ This secret will never be shown again. Store it securely.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-semibold">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Copy both the API Key and Secret to a secure location</li>
                <li>Store the secret in your environment variables (e.g., .env file)</li>
                <li>Never commit the secret to version control</li>
                <li>Use the credentials to authenticate API requests</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              I've Saved My Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Main Create App Form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Application</DialogTitle>
          <DialogDescription>
            Register a new OAuth 2.0 application to get API credentials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* App Name */}
          <div>
            <Label htmlFor="name">App Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="My Awesome App"
              className="mt-1.5"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of your application"
              className="mt-1.5"
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Redirect URLs */}
          <div>
            <Label>Redirect URLs *</Label>
            <p className="text-xs text-gray-500 mb-2">
              URLs where users will be redirected after authentication
            </p>
            <div className="space-y-2">
              {redirectUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...redirectUrls]
                      newUrls[index] = e.target.value
                      setRedirectUrls(newUrls)
                    }}
                    placeholder="https://example.com/callback"
                    className="flex-1"
                  />
                  {redirectUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setRedirectUrls(redirectUrls.filter((_, i) => i !== index))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRedirectUrls([...redirectUrls, ''])}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Redirect URL
              </Button>
            </div>
          </div>

          {/* Allowed Origins */}
          <div>
            <Label>Allowed Origins *</Label>
            <p className="text-xs text-gray-500 mb-2">
              Origins allowed to make CORS requests to your app
            </p>
            <div className="space-y-2">
              {allowedOrigins.map((origin, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={origin}
                    onChange={(e) => {
                      const newOrigins = [...allowedOrigins]
                      newOrigins[index] = e.target.value
                      setAllowedOrigins(newOrigins)
                    }}
                    placeholder="https://example.com"
                    className="flex-1"
                  />
                  {allowedOrigins.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAllowedOrigins(allowedOrigins.filter((_, i) => i !== index))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAllowedOrigins([...allowedOrigins, ''])}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Allowed Origin
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createApp.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createApp.isPending}>
              {createApp.isPending ? 'Creating...' : 'Create Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
