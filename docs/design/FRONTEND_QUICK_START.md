# Frontend Quick Start Guide

**Version**: 1.0.0
**Date**: 2025-01-12
**Read Time**: 5 minutes

---

## Setup (5 minutes)

### 1. Install Dependencies

```bash
cd apps/admin-dashboard

# Core framework
npm install next@latest react@latest react-dom@latest

# React Query
npm install @tanstack/react-query @tanstack/react-query-devtools

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# State
npm install zustand

# UI
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Icons & Utilities
npm install lucide-react date-fns clsx tailwind-merge

# Charts (lazy load)
npm install recharts

# Notifications
npm install sonner
```

### 2. Initialize shadcn/ui

```bash
npx shadcn-ui@latest init

# Install essential components
npx shadcn-ui@latest add button card form input label \
  select table dialog toast sonner dropdown-menu \
  avatar badge separator breadcrumb alert skeleton
```

### 3. Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Project Structure

```
apps/admin-dashboard/
├── app/
│   ├── (auth)/login/page.tsx       # Login page
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + header
│   │   ├── dashboard/page.tsx      # Overview
│   │   ├── apps/page.tsx           # App list
│   │   └── apps/[id]/page.tsx      # App details
│   ├── layout.tsx                  # Root (providers)
│   └── providers.tsx               # React Query + Theme
├── components/
│   ├── ui/                         # shadcn/ui (auto-generated)
│   ├── dashboard/                  # Sidebar, header, stats
│   ├── apps/                       # App-specific components
│   └── shared/                     # DataTable, EmptyState
├── lib/
│   ├── api/                        # API client + functions
│   ├── hooks/                      # React Query hooks
│   ├── schemas/                    # Zod schemas
│   ├── stores/                     # Zustand stores
│   └── utils/                      # Helpers
└── public/
```

---

## Essential Patterns

### 1. Server Component (Default)

```tsx
// app/(dashboard)/apps/page.tsx
import { getApps } from '@/lib/api/apps'
import { AppList } from '@/components/apps/app-list'

export default async function AppsPage() {
  const apps = await getApps()

  return (
    <div>
      <h1>Applications</h1>
      <AppList apps={apps} />
    </div>
  )
}
```

### 2. Client Component (Interactivity)

```tsx
// components/apps/app-list.tsx
'use client'

import { useApps } from '@/lib/hooks/use-apps'
import { DataTable } from '@/components/shared/data-table'
import { appColumns } from './columns'

export function AppList({ initialApps }) {
  const { data: apps = initialApps } = useApps()

  return <DataTable columns={appColumns} data={apps} />
}
```

### 3. React Query Hook

```tsx
// lib/hooks/use-apps.ts
import { useQuery } from '@tanstack/react-query'
import { getApps } from '@/lib/api/apps'

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: getApps,
    staleTime: 60 * 1000, // 1 minute
  })
}
```

### 4. Form with Validation

```tsx
// components/apps/create-app-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAppSchema } from '@/lib/schemas/app'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CreateAppForm() {
  const form = useForm({
    resolver: zodResolver(createAppSchema),
    defaultValues: { name: '', description: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(console.log)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create</Button>
      </form>
    </Form>
  )
}
```

### 5. Zustand Store

```tsx
// lib/stores/sidebar.ts
import { create } from 'zustand'

interface SidebarStore {
  isCollapsed: boolean
  toggle: () => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}))

// Usage:
const { isCollapsed, toggle } = useSidebarStore()
```

---

## Common Tasks

### Add New Route

1. Create file: `app/(dashboard)/new-route/page.tsx`
2. Add to sidebar: `components/dashboard/sidebar.tsx`

### Add shadcn/ui Component

```bash
npx shadcn-ui@latest add [component-name]
# Examples: calendar, date-picker, tabs, accordion
```

### Add API Endpoint

1. Create function: `lib/api/new-resource.ts`
2. Create hook: `lib/hooks/use-new-resource.ts`
3. Use in component: `const { data } = useNewResource()`

### Add Form

1. Create schema: `lib/schemas/new-form.ts`
2. Create component: `components/forms/new-form.tsx`
3. Use React Hook Form + Zod resolver

---

## Development Commands

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build

# Analyze bundle size
ANALYZE=true npm run build
```

---

## Key Decisions Reference

| Question | Answer | Why |
|----------|--------|-----|
| Server or Client Component? | Server (default) | Smaller bundle, better performance |
| Where to fetch data? | React Query hooks | Caching, background refetch |
| Where to store UI state? | Zustand | Lightweight, no provider hell |
| How to validate forms? | Zod + React Hook Form | Type-safe, minimal re-renders |
| Which UI library? | shadcn/ui | Full control, no runtime CSS-in-JS |
| How to style? | TailwindCSS v4 | Utility-first, small bundle |

---

## Next Steps

1. ✅ Read full architecture: [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
2. ✅ Review UI/UX design: [UI_UX_DESIGN.md](./UI_UX_DESIGN.md)
3. ✅ Start coding: Follow Week 1 timeline (setup + layout)
4. ✅ Reference research: [docs/research/](../research/)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-12
