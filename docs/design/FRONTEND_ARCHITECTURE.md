# SSO Admin Dashboard - Frontend Architecture

**Version**: 1.0.0
**Date**: 2025-01-12
**Project**: SSO Central Auth Server - Admin Dashboard
**Max Pages**: 25
**Status**: Design Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary) (2 pages)
2. [Technology Stack](#2-technology-stack) (2 pages)
3. [Project Structure](#3-project-structure) (3 pages)
4. [Routing Architecture](#4-routing-architecture) (2 pages)
5. [Component Architecture](#5-component-architecture) (3 pages)
6. [State Management](#6-state-management) (3 pages)
7. [API Integration](#7-api-integration) (3 pages)
8. [Authentication](#8-authentication) (2 pages)
9. [Forms & Validation](#9-forms--validation) (2 pages)
10. [Performance](#10-performance) (2 pages)
11. [Development Workflow](#11-development-workflow) (1 page)

**Total**: 25 pages

---

## 1. Executive Summary

### 1.1 Architecture Overview

The SSO Admin Dashboard is built using **Next.js 14 App Router** with a hybrid rendering strategy:
- **Server Components** for initial data fetching and SEO
- **Client Components** for interactivity and real-time updates
- **React Query v5** for server state management
- **Zustand** for client-side UI state

**Key Decision**: Server-first architecture reduces JavaScript bundle size by ~40% compared to traditional SPA approach.

### 1.2 Tech Stack Summary

| Category | Technology | Version | Justification |
|----------|-----------|---------|---------------|
| **Framework** | Next.js | 14.x | App Router, RSC, Server Actions |
| **UI Library** | shadcn/ui | Latest | Copy-paste components, full control |
| **Styling** | TailwindCSS | 4.x | Utility-first, CSS-first config |
| **State (Server)** | React Query | 5.x | Caching, optimistic updates |
| **State (UI)** | Zustand | 4.x | Lightweight, TypeScript-native |
| **Forms** | React Hook Form | 7.x | Performance, bundle size |
| **Validation** | Zod | 3.x | Type-safe schemas |
| **Charts** | Recharts | 2.x | React-native, composable |
| **Icons** | Lucide React | Latest | Tree-shakeable, consistent |
| **Dates** | date-fns | 3.x | Modular, lightweight |

### 1.3 Key Decisions

**1. Next.js 14 App Router over Pages Router**
- **Why**: Nested layouts, streaming, React Server Components
- **Trade-off**: Steeper learning curve, newer ecosystem
- **Impact**: Better performance, smaller bundles (40-60% reduction)

**2. React Query v5 over Redux/Context**
- **Why**: Built-in caching, optimistic updates, background refetching
- **Trade-off**: Additional dependency (but saves boilerplate)
- **Impact**: Less code (~50% reduction in state management code)

**3. shadcn/ui over Material-UI/Ant Design**
- **Why**: Full ownership, no runtime CSS-in-JS, Radix UI primitives
- **Trade-off**: Must copy components manually (but customizable)
- **Impact**: Smaller bundle (15-20KB vs 100KB+), better performance

**4. Zustand over Context API for UI State**
- **Why**: No provider hell, outside-React usage, dev tools
- **Trade-off**: Another library (but tiny: 2KB)
- **Impact**: Cleaner code, better DX

### 1.4 Timeline Estimate

**Total**: 6-8 weeks for full implementation

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Week 1** | Setup | Next.js, TailwindCSS, shadcn/ui, dark mode |
| **Week 2-3** | Core Features | Auth, app list, app details, API keys |
| **Week 3-4** | Analytics | Dashboard, charts, date pickers |
| **Week 4-5** | Polish | Mobile responsive, accessibility, loading states |
| **Week 5-6** | Testing | E2E tests, performance optimization |

---

## 2. Technology Stack

### 2.1 Framework: Next.js 14 App Router

**Why Next.js 14?**
- React Server Components (RSC) for zero-bundle data fetching
- App Router with nested layouts and parallel routes
- Server Actions for mutations (no API routes needed)
- Built-in optimization (image, font, script)

**App Router vs Pages Router**:
```
App Router (NEW)               Pages Router (OLD)
├── app/                       ├── pages/
│   ├── layout.tsx             │   ├── _app.tsx
│   ├── page.tsx               │   ├── index.tsx
│   ├── loading.tsx            │   └── api/
│   ├── error.tsx              │       └── [...].ts
│   └── (dashboard)/           └── No nested layouts
│       └── apps/
│           ├── page.tsx       Better: Nested layouts,
│           └── [id]/          streaming, server components
│               └── page.tsx
```

**Configuration** (`next.config.js`):
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['date-fns'],
  },
  images: {
    domains: ['api.sso-system.com'], // For user avatars
  },
}

module.exports = nextConfig
```

### 2.2 UI: shadcn/ui + TailwindCSS v4

**Why shadcn/ui?**
- Not a dependency (copy-paste model)
- Built on Radix UI (accessible primitives)
- Full customization control
- TailwindCSS + cva for variants

**Installation**:
```bash
npx shadcn-ui@latest init

# Select options:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - RSC: Yes
# - Path aliases: @/components, @/lib, @/app
```

**Critical Components** (install these first):
```bash
npx shadcn-ui@latest add button card form input label \
  select table dialog toast sonner dropdown-menu \
  avatar badge separator breadcrumb alert
```

**TailwindCSS v4 Setup** (`app/globals.css`):
```css
@import "tailwindcss";

/* Dark mode variant */
@variant dark (&:where(.dark, .dark *));

/* Custom theme tokens */
@theme {
  --color-primary: 221.2 83.2% 53.3%;
  --color-secondary: 210 40% 96.1%;
  --radius-base: 0.5rem;
  --font-sans: Inter, system-ui, sans-serif;
}

/* CSS variables for shadcn/ui */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... (see ui-ux-trends-2025.md Section 8.1) */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

### 2.3 State: React Query v5 + Zustand

**React Query** (server state):
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**When to use**:
- Fetching data from API
- Mutations (POST, PUT, DELETE)
- Caching, background refetch
- Optimistic updates

**Zustand** (UI state):
```bash
npm install zustand
```

**When to use**:
- Sidebar collapsed/expanded
- Theme (light/dark)
- Command palette open/closed
- Selected organization/app

**Decision Matrix**:
| State Type | Tool | Example |
|------------|------|---------|
| Server data | React Query | App list, analytics |
| UI state | Zustand | Sidebar, theme |
| Form state | React Hook Form | Login, app creation |
| URL state | Next.js params | Filters, pagination |

### 2.4 Forms: React Hook Form + Zod

**Installation**:
```bash
npm install react-hook-form @hookform/resolvers zod
```

**Why React Hook Form?**
- Minimal re-renders (uncontrolled inputs)
- Small bundle (9KB vs Formik 15KB)
- Built-in validation
- shadcn/ui Form component integration

**Why Zod?**
- Runtime + compile-time validation
- Type inference (`z.infer<typeof schema>`)
- Error messages with i18n support
- Shared schemas (client + server)

### 2.5 Charts: Recharts

**Installation**:
```bash
npm install recharts
```

**Why Recharts?**
- React-native (no D3 dependencies)
- Composable API (components, not config)
- Lightweight (40KB vs Chart.js 180KB)
- Responsive out-of-the-box

**Alternative Considered**: Tremor (higher-level, but more opinionated)

---

## 3. Project Structure

### 3.1 File Organization

**Monorepo Structure** (full SSO system):
```
sso-system/
├── apps/
│   ├── admin-dashboard/      # ← This project
│   ├── auth-api/             # Backend API
│   └── docs/
├── packages/
│   ├── ui/                   # Shared components (future)
│   ├── types/                # Shared TypeScript types
│   └── config/
└── package.json
```

**Admin Dashboard Structure**:
```
apps/admin-dashboard/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth route group (login, register)
│   │   ├── layout.tsx        # Minimal layout (no sidebar)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/          # Dashboard route group
│   │   ├── layout.tsx        # With sidebar + header
│   │   ├── dashboard/
│   │   │   ├── page.tsx      # Overview dashboard
│   │   │   ├── loading.tsx   # Skeleton loader
│   │   │   └── error.tsx     # Error boundary
│   │   ├── apps/
│   │   │   ├── page.tsx      # App list
│   │   │   ├── new/
│   │   │   │   └── page.tsx  # Create new app
│   │   │   └── [id]/
│   │   │       ├── page.tsx  # App details
│   │   │       ├── settings/
│   │   │       │   └── page.tsx
│   │   │       └── keys/
│   │   │           └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/                  # API routes (minimal, prefer Server Actions)
│   │   └── webhooks/
│   │       └── route.ts
│   ├── layout.tsx            # Root layout (providers)
│   ├── page.tsx              # Landing → redirect to /dashboard
│   ├── providers.tsx         # React Query, theme providers
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── dashboard/            # Dashboard-specific components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── stats-card.tsx
│   │   └── recent-activity.tsx
│   ├── apps/                 # App-related components
│   │   ├── app-list.tsx
│   │   ├── app-card.tsx
│   │   ├── create-app-dialog.tsx
│   │   └── app-settings-form.tsx
│   ├── analytics/            # Analytics components
│   │   ├── login-chart.tsx
│   │   ├── user-growth-chart.tsx
│   │   └── date-range-picker.tsx
│   └── shared/               # Reusable components
│       ├── data-table.tsx    # Generic table
│       ├── command-palette.tsx
│       ├── empty-state.tsx
│       └── page-header.tsx
├── lib/
│   ├── actions/              # Server Actions
│   │   ├── app.ts            # createApp, updateApp, deleteApp
│   │   ├── auth.ts           # login, logout
│   │   └── key.ts            # generateKey, rotateKey
│   ├── api/                  # API client functions
│   │   ├── client.ts         # Fetch wrapper with auth
│   │   ├── apps.ts           # getApps, getAppById, etc.
│   │   ├── analytics.ts      # getLoginStats, getUserGrowth
│   │   └── types.ts          # API response types
│   ├── hooks/                # React Query hooks
│   │   ├── use-apps.ts       # useApps, useApp, useCreateApp
│   │   ├── use-analytics.ts  # useLoginStats
│   │   └── use-auth.ts       # useCurrentUser
│   ├── schemas/              # Zod schemas
│   │   ├── app.ts            # appSchema, createAppSchema
│   │   ├── auth.ts           # loginSchema
│   │   └── key.ts            # keySchema
│   ├── stores/               # Zustand stores
│   │   ├── theme.ts          # useThemeStore
│   │   ├── sidebar.ts        # useSidebarStore
│   │   └── org.ts            # useOrgStore
│   ├── utils/                # Utilities
│   │   ├── cn.ts             # classNames helper
│   │   ├── format.ts         # Date, number formatting
│   │   └── constants.ts      # API_URL, etc.
│   └── types/
│       └── index.ts          # Global TypeScript types
├── public/
│   ├── fonts/
│   └── images/
├── .env.local                # Environment variables
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.2 Route Structure

**Public Routes** (no auth required):
```
/login
/register
/forgot-password
```

**Protected Routes** (require auth):
```
/dashboard              → Overview dashboard
/apps                   → App list (table view)
/apps/new               → Create new app (modal or page)
/apps/:id               → App details + tabs
/apps/:id/settings      → App settings form
/apps/:id/keys          → API keys management
/analytics              → Analytics dashboard
/settings               → User/org settings
/settings/team          → Team members
/settings/billing       → Billing (if applicable)
```

**Route Groups** (don't affect URL):
```
(auth)/         → Routes without sidebar/header
(dashboard)/    → Routes with sidebar/header
```

### 3.3 Component Hierarchy

**Page → Layout → Components**:
```
app/layout.tsx (Root)
  └── Providers
      └── app/(dashboard)/layout.tsx
          ├── Sidebar
          ├── Header
          └── Main
              └── app/(dashboard)/apps/page.tsx
                  ├── PageHeader
                  ├── DataTable
                  │   ├── TableHeader
                  │   ├── TableBody
                  │   │   └── TableRow
                  │   │       ├── TableCell
                  │   │       └── DropdownMenu (actions)
                  │   └── TablePagination
                  └── CreateAppDialog
```

**Component Ownership**:
- **UI components** (`components/ui/`): Owned by shadcn, rarely modified
- **Feature components** (`components/apps/`, etc.): Project-specific, frequently modified
- **Shared components** (`components/shared/`): Reusable across features

---

## 4. Routing Architecture

### 4.1 App Router Routes

**Route Map** (with file paths):
```
URL Path                    File Path                           Type
──────────────────────────────────────────────────────────────────────
/                          app/page.tsx                         Server
/login                     app/(auth)/login/page.tsx            Client
/dashboard                 app/(dashboard)/dashboard/page.tsx   Server
/apps                      app/(dashboard)/apps/page.tsx        Server
/apps/new                  app/(dashboard)/apps/new/page.tsx    Client
/apps/:id                  app/(dashboard)/apps/[id]/page.tsx   Server
/apps/:id/settings         app/(dashboard)/apps/[id]/settings/page.tsx  Client
/apps/:id/keys             app/(dashboard)/apps/[id]/keys/page.tsx      Client
/analytics                 app/(dashboard)/analytics/page.tsx   Server
/settings                  app/(dashboard)/settings/page.tsx    Client
```

**Server vs Client Decision**:
| Route | Component Type | Reason |
|-------|----------------|--------|
| `/dashboard` | Server | Fetch stats on server, no interactivity |
| `/apps` | Server | Prefetch app list, use React Query hydration |
| `/apps/:id` | Server | SEO-friendly, fast initial load |
| `/apps/:id/settings` | Client | Forms need `useState`, `useForm` |
| `/apps/:id/keys` | Client | Copy-to-clipboard, reveal buttons |

### 4.2 Layouts

**Root Layout** (`app/layout.tsx`):
```tsx
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SSO Admin Dashboard',
  description: 'Manage your SSO applications',
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

**Dashboard Layout** (`app/(dashboard)/layout.tsx`):
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
      <Sidebar />
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

### 4.3 Loading & Error States

**Loading State** (`app/(dashboard)/apps/loading.tsx`):
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function AppsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" /> {/* Page title */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  )
}
```

**Error Boundary** (`app/(dashboard)/apps/error.tsx`):
```tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AppsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Apps page error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <AlertCircle className="mb-4 h-16 w-16 text-destructive" />
      <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
      <p className="mb-6 text-muted-foreground">
        Failed to load applications. Please try again.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  )
}
```

---

## 5. Component Architecture

### 5.1 Component Hierarchy

**Three-Layer Architecture**:
```
Layer 1: UI Primitives (shadcn/ui)
  ↓
Layer 2: Shared Components (custom)
  ↓
Layer 3: Feature Components (app-specific)
```

**Example: App List Page**:
```tsx
// Layer 3: Feature Component
import { DataTable } from '@/components/shared/data-table' // Layer 2
import { Button } from '@/components/ui/button'            // Layer 1
import { appColumns } from './columns'

export function AppList({ apps }) {
  return (
    <DataTable
      columns={appColumns}
      data={apps}
      searchKey="name"
      actions={
        <Button>Create App</Button>
      }
    />
  )
}
```

### 5.2 Props Interfaces

**Example: Stats Card Component**:
```tsx
// components/dashboard/stats-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number              // Percentage change
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
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={cn(
            'text-xs',
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {change > 0 ? '+' : ''}{change}% from last month
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

**Usage**:
```tsx
<StatsCard
  title="Total Apps"
  value="12"
  change={15.3}
  trend="up"
  icon={AppWindow}
  description="3 apps created this month"
/>
```

### 5.3 Reusable Components

**DataTable** (`components/shared/data-table.tsx`):
```tsx
'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  actions?: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  actions,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {searchKey && (
          <Input
            placeholder={`Search ${searchKey}...`}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        )}
        {actions}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} results
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

**Empty State** (`components/shared/empty-state.tsx`):
```tsx
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon className="mb-4 h-16 w-16 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

---

## 6. State Management

### 6.1 React Query Configuration

**Providers Setup** (`app/providers.tsx`):
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
            staleTime: 60 * 1000,        // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
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
        <Toaster position="top-right" />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### 6.2 React Query Hooks

**Example: Apps Hook** (`lib/hooks/use-apps.ts`):
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApps, getAppById, createApp, updateApp, deleteApp } from '@/lib/api/apps'
import { toast } from 'sonner'
import type { App, CreateAppInput, UpdateAppInput } from '@/lib/types'

// Query keys
const appsKeys = {
  all: ['apps'] as const,
  lists: () => [...appsKeys.all, 'list'] as const,
  list: (filters: string) => [...appsKeys.lists(), filters] as const,
  details: () => [...appsKeys.all, 'detail'] as const,
  detail: (id: string) => [...appsKeys.details(), id] as const,
}

// Get all apps
export function useApps() {
  return useQuery({
    queryKey: appsKeys.lists(),
    queryFn: getApps,
  })
}

// Get app by ID
export function useApp(id: string) {
  return useQuery({
    queryKey: appsKeys.detail(id),
    queryFn: () => getAppById(id),
    enabled: !!id,
  })
}

// Create app mutation
export function useCreateApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAppInput) => createApp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appsKeys.lists() })
      toast.success('App created successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to create app', {
        description: error.message,
      })
    },
  })
}

// Update app mutation
export function useUpdateApp(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateAppInput) => updateApp(id, data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: appsKeys.detail(id) })

      // Snapshot previous value
      const previousApp = queryClient.getQueryData<App>(appsKeys.detail(id))

      // Optimistically update
      queryClient.setQueryData<App>(appsKeys.detail(id), (old) => ({
        ...old!,
        ...newData,
      }))

      return { previousApp }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(appsKeys.detail(id), context?.previousApp)
      toast.error('Failed to update app')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: appsKeys.lists() })
      toast.success('App updated successfully')
    },
  })
}

// Delete app mutation
export function useDeleteApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteApp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appsKeys.lists() })
      toast.success('App deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete app')
    },
  })
}
```

### 6.3 Zustand Stores

**Theme Store** (`lib/stores/theme.ts`):
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

**Sidebar Store** (`lib/stores/sidebar.ts`):
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

**Organization Store** (`lib/stores/org.ts`):
```tsx
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OrgStore {
  selectedOrgId: string | null
  setSelectedOrg: (orgId: string) => void
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set) => ({
      selectedOrgId: null,
      setSelectedOrg: (orgId) => set({ selectedOrgId: orgId }),
    }),
    {
      name: 'org-storage',
    }
  )
)
```

### 6.4 When to Use Each

**Decision Tree**:
```
Is the data from API?
  ├─ YES → React Query
  │        - Cache it
  │        - Background refetch
  │        - Optimistic updates
  │
  └─ NO → Is it global UI state?
           ├─ YES → Zustand
           │        - Theme, sidebar
           │        - Selected org
           │
           └─ NO → Is it form data?
                    ├─ YES → React Hook Form
                    │        - Local state
                    │        - Validation
                    │
                    └─ NO → useState
                             - Component-local
```

---

## 7. API Integration

### 7.1 API Client Setup

**Fetch Wrapper** (`lib/api/client.ts`):
```tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface RequestConfig extends RequestInit {
  token?: string
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown
  ) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { token, headers, ...customConfig } = config

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(response.status, response.statusText, data)
  }

  return response.json()
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, data: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),
}
```

### 7.2 API Functions

**Apps API** (`lib/api/apps.ts`):
```tsx
import { apiClient } from './client'
import type { App, CreateAppInput, UpdateAppInput } from './types'

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

// Generate API key
export async function generateApiKey(appId: string): Promise<{
  key: string
  secret: string
  createdAt: string
}> {
  return apiClient.post(`/apps/${appId}/keys`, {})
}

// Rotate API key
export async function rotateApiKey(appId: string, keyId: string): Promise<{
  key: string
  secret: string
}> {
  return apiClient.post(`/apps/${appId}/keys/${keyId}/rotate`, {})
}
```

**Analytics API** (`lib/api/analytics.ts`):
```tsx
import { apiClient } from './client'

interface LoginStatsParams {
  startDate: string  // ISO 8601
  endDate: string
  appId?: string
}

interface LoginStats {
  date: string
  successful: number
  failed: number
}

export async function getLoginStats(
  params: LoginStatsParams
): Promise<LoginStats[]> {
  const query = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    ...(params.appId && { appId: params.appId }),
  })

  return apiClient.get(`/analytics/logins?${query}`)
}

export async function getUserGrowth(
  params: Omit<LoginStatsParams, 'appId'>
): Promise<{ date: string; users: number }[]> {
  const query = new URLSearchParams(params)
  return apiClient.get(`/analytics/users?${query}`)
}
```

### 7.3 Error Handling

**Global Error Handler** (`lib/api/error-handler.ts`):
```tsx
import { ApiError } from './client'
import { toast } from 'sonner'

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    // Specific status code handling
    switch (error.status) {
      case 401:
        toast.error('Session expired', {
          description: 'Please log in again',
        })
        // Redirect to login
        window.location.href = '/login'
        break

      case 403:
        toast.error('Access denied', {
          description: 'You do not have permission to perform this action',
        })
        break

      case 404:
        toast.error('Not found', {
          description: 'The requested resource does not exist',
        })
        break

      case 422:
        // Validation error
        const data = error.data as { errors?: Record<string, string[]> }
        if (data.errors) {
          const firstError = Object.values(data.errors)[0]?.[0]
          toast.error('Validation error', {
            description: firstError,
          })
        }
        break

      case 500:
        toast.error('Server error', {
          description: 'Something went wrong. Please try again later.',
        })
        break

      default:
        toast.error('Request failed', {
          description: error.message,
        })
    }
  } else if (error instanceof Error) {
    toast.error('Error', {
      description: error.message,
    })
  } else {
    toast.error('Unknown error', {
      description: 'An unexpected error occurred',
    })
  }
}
```

**Usage in React Query**:
```tsx
export function useApps() {
  return useQuery({
    queryKey: appsKeys.lists(),
    queryFn: getApps,
    onError: handleApiError,  // ← Global error handling
  })
}
```

---

## 8. Authentication

### 8.1 JWT Storage

**Strategy**: HttpOnly cookies (set by backend) + client-side token for API calls

**Token Storage** (`lib/auth/token.ts`):
```tsx
const TOKEN_KEY = 'sso_access_token'

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  set: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
  },

  remove: () => {
    localStorage.removeItem(TOKEN_KEY)
  },
}
```

### 8.2 Protected Routes

**Middleware** (`middleware.ts`):
```tsx
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sso_access_token')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/apps') ||
                          request.nextUrl.pathname.startsWith('/analytics')

  // Redirect to login if accessing protected page without token
  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing auth page with token
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/apps/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
}
```

### 8.3 Token Refresh

**Auto-Refresh Hook** (`lib/hooks/use-auth.ts`):
```tsx
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { tokenStorage } from '@/lib/auth/token'

interface User {
  id: string
  email: string
  name: string
}

async function getCurrentUser(): Promise<User> {
  return apiClient.get('/auth/me', {
    token: tokenStorage.get() || undefined,
  })
}

async function refreshToken(): Promise<{ accessToken: string }> {
  return apiClient.post('/auth/refresh', {})
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    retry: false,
  })

  // Refresh token every 14 minutes (assuming 15-min expiry)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { accessToken } = await refreshToken()
        tokenStorage.set(accessToken)
        queryClient.invalidateQueries({ queryKey: ['user'] })
      } catch (error) {
        // Refresh failed, redirect to login
        tokenStorage.remove()
        window.location.href = '/login'
      }
    }, 14 * 60 * 1000) // 14 minutes

    return () => clearInterval(interval)
  }, [queryClient])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  }
}
```

---

## 9. Forms & Validation

### 9.1 Zod Schemas

**App Schema** (`lib/schemas/app.ts`):
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
      z.string().url('Must be a valid URL').startsWith('https://', {
        message: 'URLs must use HTTPS',
      })
    )
    .min(1, 'At least one redirect URI is required'),
  allowedOrigins: z
    .array(z.string().url('Must be a valid URL'))
    .optional(),
})

export type CreateAppInput = z.infer<typeof createAppSchema>

export const updateAppSchema = createAppSchema.partial()

export type UpdateAppInput = z.infer<typeof updateAppSchema>
```

### 9.2 React Hook Form Patterns

**Create App Form** (`components/apps/create-app-form.tsx`):
```tsx
'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAppSchema, CreateAppInput } from '@/lib/schemas/app'
import { useCreateApp } from '@/lib/hooks/use-apps'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

export function CreateAppForm({ onSuccess }: { onSuccess?: () => void }) {
  const { mutate: createApp, isPending } = useCreateApp()

  const form = useForm<CreateAppInput>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      name: '',
      description: '',
      redirectUris: [''],
      allowedOrigins: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'redirectUris',
  })

  const onSubmit = (data: CreateAppInput) => {
    createApp(data, {
      onSuccess: () => {
        form.reset()
        onSuccess?.()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Name</FormLabel>
              <FormControl>
                <Input placeholder="My Application" {...field} />
              </FormControl>
              <FormDescription>
                This is your application's display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Briefly describe your application"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Redirect URIs</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append('')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add URI
            </Button>
          </div>

          {fields.map((field, index) => (
            <FormField
              key={field.id}
              control={form.control}
              name={`redirectUris.${index}`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="https://example.com/callback"
                        {...field}
                      />
                    </FormControl>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FormDescription>
            URLs where users will be redirected after authentication.
            Must use HTTPS in production.
          </FormDescription>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Creating...' : 'Create Application'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 10. Performance

### 10.1 Code Splitting

**Dynamic Imports**:
```tsx
// Heavy component (charts, Monaco editor)
import dynamic from 'next/dynamic'

const LoginChart = dynamic(
  () => import('@/components/analytics/login-chart'),
  {
    loading: () => <Skeleton className="h-96" />,
    ssr: false, // Client-side only
  }
)

export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      <LoginChart />
    </div>
  )
}
```

### 10.2 Bundle Targets

**Bundle Analysis**:
```bash
npm install -D @next/bundle-analyzer
```

**Configuration** (`next.config.js`):
```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... other config
})
```

**Run**:
```bash
ANALYZE=true npm run build
```

**Target Bundle Sizes**:
- First Load JS: < 100KB (gzipped)
- Route chunks: < 50KB each
- Total: < 200KB for all routes

**Current Baseline** (estimated):
- Next.js runtime: 80KB
- React: 45KB
- shadcn/ui components: 15-20KB
- React Query: 12KB
- Recharts: 40KB (lazy loaded)
- **Total**: ~130KB (within target)

---

## 11. Development Workflow

### 11.1 Setup Steps

**1. Clone & Install**:
```bash
git clone https://github.com/your-org/sso-system.git
cd sso-system/apps/admin-dashboard
npm install
```

**2. Environment Variables** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**3. Initialize shadcn/ui**:
```bash
npx shadcn-ui@latest init

# Install core components
npx shadcn-ui@latest add button card form input label \
  select table dialog toast sonner dropdown-menu avatar \
  badge separator breadcrumb alert skeleton
```

**4. Run Development Server**:
```bash
npm run dev
# → http://localhost:3000
```

### 11.2 Scripts

**package.json**:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "analyze": "ANALYZE=true npm run build"
  }
}
```

---

## Appendix A: Key Files Summary

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `app/layout.tsx` | Root layout, providers | 30 |
| `app/(dashboard)/layout.tsx` | Dashboard layout with sidebar | 25 |
| `components/shared/data-table.tsx` | Reusable table | 120 |
| `lib/api/client.ts` | API fetch wrapper | 60 |
| `lib/hooks/use-apps.ts` | React Query hooks for apps | 80 |
| `lib/stores/theme.ts` | Zustand theme store | 20 |
| `lib/schemas/app.ts` | Zod validation schemas | 30 |
| **Total (core files)** | | **~365 lines** |

**Impact**: Minimal boilerplate due to Next.js conventions + shadcn/ui.

---

## Appendix B: Migration from Pages Router

If migrating from existing Pages Router codebase:

**Changes Required**:
1. Move `pages/` → `app/`
2. Rename `_app.tsx` → `layout.tsx`
3. Replace `getServerSideProps` with Server Components
4. Replace `getStaticProps` with `fetch` in Server Components
5. Add `'use client'` to components with hooks

**Incremental Adoption**: App Router can coexist with Pages Router (use `pages/` for old routes, `app/` for new).

---

**Document Status**: ✅ Complete (25 pages)
**Last Updated**: 2025-01-12
**Next Steps**: Begin implementation (Week 1 setup)
