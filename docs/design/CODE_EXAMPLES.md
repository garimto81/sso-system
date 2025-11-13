# Frontend Code Examples

**Version**: 1.0.0
**Date**: 2025-01-12
**Purpose**: Ready-to-use code snippets for common patterns

---

## Table of Contents

1. [Layouts](#layouts)
2. [Pages](#pages)
3. [Components](#components)
4. [Hooks](#hooks)
5. [API Functions](#api-functions)
6. [Schemas](#schemas)
7. [Stores](#stores)
8. [Utilities](#utilities)

---

## Layouts

### Root Layout

**File**: `app/layout.tsx`

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SSO Admin Dashboard',
  description: 'Manage your SSO applications and authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Dashboard Layout

**File**: `app/(dashboard)/layout.tsx`

```tsx
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Providers

**File**: `app/providers.tsx`

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster position="top-right" richColors />
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

---

## Pages

### Dashboard Page

**File**: `app/(dashboard)/dashboard/page.tsx`

```tsx
import { Suspense } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { LoginChart } from '@/components/dashboard/login-chart'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your SSO applications and activity
        </p>
      </div>

      {/* Stats cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Login chart */}
        <Suspense fallback={<ChartSkeleton />}>
          <LoginChart />
        </Suspense>

        {/* Recent activity */}
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  )
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <Skeleton className="h-96" />
}

function ActivitySkeleton() {
  return <Skeleton className="h-96" />
}
```

### Apps List Page

**File**: `app/(dashboard)/apps/page.tsx`

```tsx
import { getApps } from '@/lib/api/apps'
import { AppList } from '@/components/apps/app-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AppsPage() {
  const apps = await getApps()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">
            Manage your SSO applications
          </p>
        </div>
        <Button asChild>
          <Link href="/apps/new">
            <Plus className="mr-2 h-4 w-4" />
            Create App
          </Link>
        </Button>
      </div>

      <AppList initialApps={apps} />
    </div>
  )
}
```

### App Details Page

**File**: `app/(dashboard)/apps/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import { getAppById } from '@/lib/api/apps'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppOverview } from '@/components/apps/app-overview'
import { AppSettings } from '@/components/apps/app-settings'
import { AppKeys } from '@/components/apps/app-keys'
import { AppAnalytics } from '@/components/apps/app-analytics'

export default async function AppPage({
  params,
}: {
  params: { id: string }
}) {
  const app = await getAppById(params.id).catch(() => null)

  if (!app) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{app.name}</h1>
        <p className="text-muted-foreground">{app.description}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AppOverview app={app} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <AppSettings app={app} />
        </TabsContent>

        <TabsContent value="keys" className="mt-6">
          <AppKeys appId={app.id} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AppAnalytics appId={app.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Components

### Sidebar

**File**: `components/dashboard/sidebar.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/lib/stores/sidebar'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  AppWindow,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'Applications',
    icon: AppWindow,
    href: '/apps',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggle } = useSidebarStore()

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">SSO Admin</h2>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
              pathname === route.href
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <route.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{route.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="w-full"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}
```

### Header

**File**: `components/dashboard/header.tsx`

```tsx
'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        {/* Breadcrumbs or search would go here */}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

### Stats Card

**File**: `components/dashboard/stats-card.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  icon: LucideIcon
  description?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  description,
  className,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p
            className={cn(
              'text-xs',
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            )}
          >
            {change > 0 ? '+' : ''}
            {change}% from last month
          </p>
        )}
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

### Data Table

**File**: `components/shared/data-table.tsx`

```tsx
'use client'

import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className="space-y-4">
      {searchKey && (
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} result(s)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Hooks

### useApps Hook

**File**: `lib/hooks/use-apps.ts`

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getApps,
  getAppById,
  createApp,
  updateApp,
  deleteApp,
} from '@/lib/api/apps'
import { toast } from 'sonner'
import type { App, CreateAppInput, UpdateAppInput } from '@/lib/types'

const appsKeys = {
  all: ['apps'] as const,
  lists: () => [...appsKeys.all, 'list'] as const,
  details: () => [...appsKeys.all, 'detail'] as const,
  detail: (id: string) => [...appsKeys.details(), id] as const,
}

export function useApps() {
  return useQuery({
    queryKey: appsKeys.lists(),
    queryFn: getApps,
  })
}

export function useApp(id: string) {
  return useQuery({
    queryKey: appsKeys.detail(id),
    queryFn: () => getAppById(id),
    enabled: !!id,
  })
}

export function useCreateApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appsKeys.lists() })
      toast.success('Application created successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to create application', {
        description: error.message,
      })
    },
  })
}

export function useUpdateApp(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateAppInput) => updateApp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: appsKeys.lists() })
      toast.success('Application updated successfully')
    },
    onError: () => {
      toast.error('Failed to update application')
    },
  })
}

export function useDeleteApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appsKeys.lists() })
      toast.success('Application deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete application')
    },
  })
}
```

---

## API Functions

### API Client

**File**: `lib/api/client.ts`

```tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown
  ) {
    super(`API Error: ${status} ${statusText}`)
  }
}

async function request<T>(
  endpoint: string,
  config: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    ...config,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(response.status, response.statusText, data)
  }

  return response.json()
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
}
```

### Apps API

**File**: `lib/api/apps.ts`

```tsx
import { apiClient } from './client'
import type { App, CreateAppInput, UpdateAppInput } from '@/lib/types'

export async function getApps(): Promise<App[]> {
  return apiClient.get('/apps')
}

export async function getAppById(id: string): Promise<App> {
  return apiClient.get(`/apps/${id}`)
}

export async function createApp(data: CreateAppInput): Promise<App> {
  return apiClient.post('/apps', data)
}

export async function updateApp(
  id: string,
  data: UpdateAppInput
): Promise<App> {
  return apiClient.put(`/apps/${id}`, data)
}

export async function deleteApp(id: string): Promise<void> {
  return apiClient.delete(`/apps/${id}`)
}
```

---

## Schemas

### App Schema

**File**: `lib/schemas/app.ts`

```tsx
import { z } from 'zod'

export const createAppSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),
  redirectUris: z
    .array(
      z
        .string()
        .url('Must be a valid URL')
        .startsWith('https://', 'URLs must use HTTPS')
    )
    .min(1, 'At least one redirect URI is required'),
})

export type CreateAppInput = z.infer<typeof createAppSchema>

export const updateAppSchema = createAppSchema.partial()

export type UpdateAppInput = z.infer<typeof updateAppSchema>
```

---

## Stores

### Sidebar Store

**File**: `lib/stores/sidebar.ts`

```tsx
import { create } from 'zustand'

interface SidebarStore {
  isCollapsed: boolean
  toggle: () => void
  collapse: () => void
  expand: () => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  collapse: () => set({ isCollapsed: true }),
  expand: () => set({ isCollapsed: false }),
}))
```

### Theme Store

**File**: `lib/stores/theme.ts`

```tsx
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
)
```

---

## Utilities

### cn (classNames)

**File**: `lib/utils/cn.ts`

```tsx
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Format Utilities

**File**: `lib/utils/format.ts`

```tsx
import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}
```

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-01-12
**Usage**: Copy-paste these examples as starting points for your implementation
