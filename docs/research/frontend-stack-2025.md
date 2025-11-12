# Frontend Stack Best Practices 2025
## Next.js 14 App Router, React Server Components, React Query v5, Zod & shadcn/ui

**Version**: 1.0.0
**Last Updated**: 2025-11-11
**Research Date**: November 2025
**Target Project**: SSO Admin Dashboard (Phase 2)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Next.js 14 App Router](#nextjs-14-app-router)
3. [React Server Components (RSC)](#react-server-components-rsc)
4. [TanStack Query v5 (React Query)](#tanstack-query-v5-react-query)
5. [Zod Validation](#zod-validation)
6. [shadcn/ui Component Library](#shadcnui-component-library)
7. [TypeScript Best Practices](#typescript-best-practices)
8. [Recommended Project Structure](#recommended-project-structure)
9. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
10. [Performance Optimization](#performance-optimization)
11. [Production Checklist](#production-checklist)
12. [Additional Resources](#additional-resources)

---

## Executive Summary

### Key Findings for 2025

The modern React ecosystem has matured significantly with production-ready patterns centered around:

1. **Next.js 14 App Router** - Server Components by default, streaming, and Server Actions for full-stack development
2. **React Server Components** - Zero JavaScript to client for data-heavy components
3. **TanStack Query v5** - Simplified API with `useSuspenseQuery` and native Next.js 14 integration
4. **Zod + React Hook Form** - Type-safe form validation with single schema definition
5. **shadcn/ui** - Copy-paste components built on Radix UI with Tailwind v4 support

### Technology Stack Overview

```
┌─────────────────────────────────────────────┐
│           Next.js 14 App Router             │
│  (Framework - Server & Client Components)   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│     React Server Components (RSC)           │
│  Data Fetching, Static & Dynamic Rendering  │
└─────────────────────────────────────────────┘
                    ↓
┌──────────────────┬──────────────────────────┐
│  Server Side     │    Client Side           │
├──────────────────┼──────────────────────────┤
│ • Direct DB      │ • TanStack Query v5      │
│ • Server Actions │ • React Hook Form        │
│ • Metadata API   │ • Zod Validation         │
│ • Streaming      │ • shadcn/ui Components   │
└──────────────────┴──────────────────────────┘
```

### Critical Recommendations

✅ **DO:**
- Default to Server Components
- Use `loading.tsx` and Suspense for streaming
- Implement Server Actions for mutations
- Prefetch data in Server Components, consume in Client Components
- Use Zod for both client and server validation
- Keep Client Components as leaf nodes

❌ **DON'T:**
- Add `"use client"` at the top of your component tree
- Fetch data in Client Components when Server Components can do it
- Skip TypeScript strict mode
- Mix data fetching strategies (pick Server Components OR React Query per route)
- Ignore accessibility (use shadcn/ui built-in ARIA patterns)

---

## Next.js 14 App Router

### Overview

Next.js 14 introduced stable Server Actions and improved the App Router with built-in streaming, partial prerendering (PPR), and enhanced metadata API.

### Core Concepts

#### 1. File-System Based Routing

```
app/
├── layout.tsx              # Root layout (wraps all pages)
├── page.tsx                # Homepage (/)
├── loading.tsx             # Loading UI (automatic Suspense)
├── error.tsx               # Error boundary
├── not-found.tsx           # 404 page
│
├── (marketing)/            # Route group (doesn't affect URL)
│   ├── layout.tsx          # Marketing layout
│   ├── about/
│   │   └── page.tsx        # /about
│   └── contact/
│       └── page.tsx        # /contact
│
├── dashboard/              # /dashboard
│   ├── layout.tsx          # Dashboard layout
│   ├── page.tsx            # /dashboard
│   ├── loading.tsx         # Dashboard loading
│   ├── error.tsx           # Dashboard error boundary
│   │
│   ├── users/              # /dashboard/users
│   │   ├── page.tsx
│   │   ├── [id]/           # /dashboard/users/:id
│   │   │   ├── page.tsx
│   │   │   └── edit/       # /dashboard/users/:id/edit
│   │   │       └── page.tsx
│   │   └── new/            # /dashboard/users/new
│   │       └── page.tsx
│   │
│   └── settings/           # /dashboard/settings
│       └── page.tsx
│
└── api/                    # API routes
    └── webhook/
        └── route.ts        # /api/webhook
```

#### 2. Special Files

| File | Purpose | Notes |
|------|---------|-------|
| `layout.tsx` | Shared UI, wraps children | Persists across navigation |
| `page.tsx` | Unique UI for route | Makes route publicly accessible |
| `loading.tsx` | Loading UI | Creates Suspense boundary automatically |
| `error.tsx` | Error UI | Creates Error Boundary automatically |
| `not-found.tsx` | 404 UI | Triggered by `notFound()` function |
| `route.ts` | API endpoint | For REST API routes |
| `template.tsx` | Re-rendered layout | Unlike layout, creates new instance |
| `default.tsx` | Parallel route fallback | For parallel routes |

#### 3. Route Groups

Use parentheses to organize routes without affecting URL structure:

```tsx
// app/(auth)/login/page.tsx
export default function LoginPage() {
  return <div>Login</div>
}
// URL: /login (not /auth/login)

// app/(auth)/register/page.tsx
export default function RegisterPage() {
  return <div>Register</div>
}
// URL: /register

// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-container">
      {children}
    </div>
  )
}
// Applies to /login and /register
```

**Use Cases:**
- Organize routes by feature (marketing, dashboard, admin)
- Multiple layouts without affecting URL structure
- Opt-in/out of layouts for specific routes

#### 4. Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx
interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function BlogPost({ params, searchParams }: PageProps) {
  return <div>Post: {params.slug}</div>
}

// Catch-all: app/docs/[...slug]/page.tsx
// Matches: /docs/a, /docs/a/b, /docs/a/b/c
interface PageProps {
  params: { slug: string[] }
}

// Optional catch-all: app/docs/[[...slug]]/page.tsx
// Matches: /docs, /docs/a, /docs/a/b
```

### Loading UI & Streaming

#### Instant Loading States with `loading.tsx`

```tsx
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  )
}
```

**How it works:**
1. User navigates to `/dashboard`
2. Next.js immediately shows `loading.tsx`
3. Data fetching happens in parallel
4. Page content replaces loading UI when ready

#### Granular Streaming with Suspense

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { RevenueChart, RecentSales, LatestInvoices } from './components'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1>Dashboard</h1>

      {/* Fast component - renders immediately */}
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      {/* Slow component - streams when ready */}
      <Suspense fallback={<SalesSkeleton />}>
        <RecentSales />
      </Suspense>

      {/* Another slow component - parallel loading */}
      <Suspense fallback={<InvoicesSkeleton />}>
        <LatestInvoices />
      </Suspense>
    </div>
  )
}
```

**Benefits:**
- Parallel data fetching
- Progressive rendering
- Better perceived performance
- Avoid blocking entire page on slow queries

### Error Handling

#### Error Boundaries with `error.tsx`

```tsx
// app/dashboard/error.tsx
'use client' // Error boundaries must be Client Components

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-gray-600 mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  )
}
```

**Error Boundary Hierarchy:**
- `app/error.tsx` - Catches errors in entire app
- `app/dashboard/error.tsx` - Catches errors in dashboard
- `app/dashboard/users/error.tsx` - Catches errors in users section

**Important:** Error boundaries do NOT catch errors in:
- The same segment (use parent segment's error boundary)
- Layouts (use parent layout's error boundary)

### Metadata API for SEO

#### Static Metadata

```tsx
// app/about/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn more about our company',
  openGraph: {
    title: 'About Us',
    description: 'Learn more about our company',
    images: ['/og-image.jpg'],
  },
}

export default function AboutPage() {
  return <div>About Us</div>
}
```

#### Dynamic Metadata with `generateMetadata`

```tsx
// app/blog/[slug]/page.tsx
import { Metadata } from 'next'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Fetch data
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  }
}

export default function BlogPost({ params }: PageProps) {
  const post = await getPost(params.slug)
  return <article>{/* Post content */}</article>
}
```

**Key Points:**
- `generateMetadata` runs on the server
- Data fetching is automatically memoized (same `getPost` call doesn't run twice)
- Next.js waits for metadata before streaming UI
- Only supported in Server Components

### Server Actions

Server Actions allow you to run server-side code directly from components without creating API routes.

#### Basic Form with Server Action

```tsx
// app/actions/user.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'user']),
})

export async function createUser(formData: FormData) {
  // Validate
  const validatedFields = UserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Insert into database
  try {
    await db.user.create({
      data: validatedFields.data,
    })
  } catch (error) {
    return {
      message: 'Database Error: Failed to create user.',
    }
  }

  // Revalidate cache and redirect
  revalidatePath('/dashboard/users')
  redirect('/dashboard/users')
}
```

#### Form Component

```tsx
// app/dashboard/users/new/page.tsx
import { createUser } from '@/app/actions/user'

export default function NewUserPage() {
  return (
    <form action={createUser}>
      <input type="text" name="name" required />
      <input type="email" name="email" required />
      <select name="role">
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit">Create User</button>
    </form>
  )
}
```

#### Progressive Enhancement

Forms work even if JavaScript is disabled!

```tsx
// With loading state (requires JavaScript)
'use client'

import { useFormState } from 'react-dom'
import { createUser } from '@/app/actions/user'

export default function CreateUserForm() {
  const [state, formAction] = useFormState(createUser, null)

  return (
    <form action={formAction}>
      <input type="text" name="name" required />
      {state?.errors?.name && (
        <p className="text-red-500">{state.errors.name}</p>
      )}

      <input type="email" name="email" required />
      {state?.errors?.email && (
        <p className="text-red-500">{state.errors.email}</p>
      )}

      <button type="submit">Create User</button>
    </form>
  )
}
```

### Best Practices Summary

#### ✅ DO

1. **Use loading.tsx for route-level loading states**
   ```tsx
   // app/dashboard/loading.tsx
   export default function Loading() {
     return <DashboardSkeleton />
   }
   ```

2. **Use Suspense for component-level streaming**
   ```tsx
   <Suspense fallback={<Skeleton />}>
     <SlowComponent />
   </Suspense>
   ```

3. **Use Route Groups for organization**
   ```
   app/
   ├── (marketing)/
   ├── (dashboard)/
   └── (admin)/
   ```

4. **Generate metadata dynamically**
   ```tsx
   export async function generateMetadata({ params }) {
     const data = await fetchData(params.id)
     return { title: data.title }
   }
   ```

5. **Use Server Actions for mutations**
   ```tsx
   'use server'
   export async function updateUser(formData: FormData) {
     // Mutation logic
   }
   ```

#### ❌ DON'T

1. **Don't create unnecessary loading.tsx files**
   - Only add when you have async operations

2. **Don't use loading.tsx for component-level loading**
   - Use Suspense instead for granular control

3. **Don't create API routes for simple mutations**
   - Use Server Actions instead

4. **Don't read cookies/headers in layouts unnecessarily**
   - Forces dynamic rendering, disables static/PPR

5. **Don't create error.tsx in same segment as page.tsx**
   - Won't catch errors in that page (use parent segment)

---

## React Server Components (RSC)

### What Are Server Components?

React Server Components run exclusively on the server and send only the rendered output to the client as a lightweight payload.

### Server vs Client Components

```tsx
// Server Component (default in App Router)
// app/dashboard/page.tsx
import { db } from '@/lib/db'

export default async function DashboardPage() {
  // Direct database access
  const users = await db.user.findMany()

  return (
    <div>
      <h1>Dashboard</h1>
      <UserList users={users} />
    </div>
  )
}

// Client Component
// app/dashboard/user-list.tsx
'use client'

import { useState } from 'react'

export function UserList({ users }: { users: User[] }) {
  const [filter, setFilter] = useState('')

  const filtered = users.filter(user =>
    user.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter users..."
      />
      <ul>
        {filtered.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### When to Use Server vs Client Components

#### Server Components (Default)

Use for:
- ✅ Data fetching
- ✅ Direct database/backend access
- ✅ Keeping sensitive data on server (tokens, API keys)
- ✅ Reducing client-side JavaScript
- ✅ SEO-friendly content

```tsx
// app/products/page.tsx
import { db } from '@/lib/db'

export default async function ProductsPage() {
  const products = await db.product.findMany()

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

#### Client Components

Use for:
- ✅ Interactivity (onClick, onChange, etc.)
- ✅ State management (useState, useReducer)
- ✅ Effects (useEffect)
- ✅ Browser APIs (localStorage, window, etc.)
- ✅ Custom hooks
- ✅ React Context

```tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### Composition Patterns

#### Pattern 1: Server Component Wrapping Client Component

```tsx
// app/dashboard/page.tsx (Server Component)
import { db } from '@/lib/db'
import { InteractiveChart } from './interactive-chart'

export default async function DashboardPage() {
  const data = await db.analytics.findMany()

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      {/* Pass server data to client component */}
      <InteractiveChart data={data} />
    </div>
  )
}

// app/dashboard/interactive-chart.tsx (Client Component)
'use client'

export function InteractiveChart({ data }: { data: Analytics[] }) {
  // Interactive chart logic
  return <Chart data={data} />
}
```

#### Pattern 2: Passing Server Components as Props

```tsx
// app/layout.tsx (Server Component)
import { Header } from './header'
import { Footer } from './footer'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  return (
    <html>
      <body>
        {/* Header is a Client Component */}
        <Header user={user}>
          {/* SearchBar is a Server Component */}
          <SearchBar />
        </Header>
        {children}
        <Footer />
      </body>
    </html>
  )
}

// app/header.tsx (Client Component)
'use client'

export function Header({
  user,
  children, // Can contain Server Components!
}: {
  user: User
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header>
      <nav>{children}</nav>
      <UserMenu user={user} isOpen={isOpen} onToggle={setIsOpen} />
    </header>
  )
}
```

#### Pattern 3: Shared Components (Server & Client)

Some components can work in both environments:

```tsx
// components/ui/button.tsx
// No 'use client' - works in both!

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ children, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`}>
      {children}
    </button>
  )
}

// Usage in Server Component
// app/page.tsx
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div>
      <Button>Static Button</Button>
    </div>
  )
}

// Usage in Client Component
// app/interactive-form.tsx
'use client'

import { Button } from '@/components/ui/button'

export function InteractiveForm() {
  return (
    <form>
      <Button>Submit</Button>
    </form>
  )
}
```

### Data Fetching Patterns

#### Pattern 1: Parallel Data Fetching

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'

// Fetch functions
async function getRevenue() {
  const data = await fetch('https://api.example.com/revenue')
  return data.json()
}

async function getUsers() {
  const data = await fetch('https://api.example.com/users')
  return data.json()
}

async function getOrders() {
  const data = await fetch('https://api.example.com/orders')
  return data.json()
}

// Components
async function Revenue() {
  const revenue = await getRevenue()
  return <div>Revenue: {revenue}</div>
}

async function Users() {
  const users = await getUsers()
  return <div>Users: {users.length}</div>
}

async function Orders() {
  const orders = await getOrders()
  return <div>Orders: {orders.length}</div>
}

// Page
export default function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Suspense fallback={<Skeleton />}>
        <Revenue />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <Users />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <Orders />
      </Suspense>
    </div>
  )
}
```

All three requests fire in parallel! 🚀

#### Pattern 2: Sequential Data Fetching (Waterfall)

```tsx
// app/user/[id]/page.tsx
async function UserPage({ params }: { params: { id: string } }) {
  // Wait for user
  const user = await getUser(params.id)

  // Then fetch posts (waterfall - avoid this!)
  const posts = await getUserPosts(user.id)

  return (
    <div>
      <h1>{user.name}</h1>
      <PostList posts={posts} />
    </div>
  )
}

// Better: Fetch in parallel
async function UserPage({ params }: { params: { id: string } }) {
  const [user, posts] = await Promise.all([
    getUser(params.id),
    getUserPosts(params.id),
  ])

  return (
    <div>
      <h1>{user.name}</h1>
      <PostList posts={posts} />
    </div>
  )
}
```

#### Pattern 3: Preloading Data

```tsx
// lib/data.ts
import { cache } from 'react'

export const getUser = cache(async (id: string) => {
  const data = await fetch(`https://api.example.com/users/${id}`)
  return data.json()
})

// app/user/[id]/page.tsx
import { getUser } from '@/lib/data'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const user = await getUser(params.id) // First call
  return { title: user.name }
}

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id) // Deduped - uses cache!
  return <div>{user.name}</div>
}
```

### Streaming Patterns

#### Pattern 1: Route-Level Streaming

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}

// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchDashboardData() // Streams when ready
  return <Dashboard data={data} />
}
```

#### Pattern 2: Component-Level Streaming

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Fast component */}
      <Suspense fallback={<Skeleton />}>
        <RecentActivity />
      </Suspense>

      {/* Slow component */}
      <Suspense fallback={<Skeleton />}>
        <ComplexAnalytics />
      </Suspense>
    </div>
  )
}

// Server Component with data fetching
async function RecentActivity() {
  const activities = await db.activity.findMany({ take: 5 })
  return <ActivityList activities={activities} />
}

async function ComplexAnalytics() {
  const analytics = await db.analytics.aggregate() // Slow query
  return <AnalyticsChart data={analytics} />
}
```

### Best Practices Summary

#### ✅ DO

1. **Default to Server Components**
   ```tsx
   // app/page.tsx (no 'use client')
   export default async function HomePage() {
     const data = await fetchData()
     return <div>{data}</div>
   }
   ```

2. **Keep Client Components as leaf nodes**
   ```tsx
   // app/page.tsx (Server)
   import { InteractiveButton } from './interactive-button'

   export default function Page() {
     return (
       <div>
         <h1>Static Content</h1>
         <InteractiveButton /> {/* Only this is a Client Component */}
       </div>
     )
   }
   ```

3. **Use cache() for deduplication**
   ```tsx
   import { cache } from 'react'

   export const getUser = cache(async (id: string) => {
     return await db.user.findUnique({ where: { id } })
   })
   ```

4. **Pass data from Server to Client Components**
   ```tsx
   // Server Component
   const data = await fetchData()
   return <ClientComponent data={data} />
   ```

5. **Use Suspense for parallel data fetching**
   ```tsx
   <Suspense fallback={<Skeleton />}>
     <AsyncComponent />
   </Suspense>
   ```

#### ❌ DON'T

1. **Don't add 'use client' at the top of your tree**
   ```tsx
   // ❌ Bad
   'use client'

   export default function Layout({ children }) {
     return <div>{children}</div>
   }

   // ✅ Good - no 'use client'
   export default function Layout({ children }) {
     return <div>{children}</div>
   }
   ```

2. **Don't import Server Components into Client Components**
   ```tsx
   // ❌ Bad
   'use client'
   import { ServerComponent } from './server-component'

   export function ClientComponent() {
     return <ServerComponent /> // Error!
   }

   // ✅ Good - pass as children
   export function ClientComponent({ children }) {
     return <div>{children}</div>
   }
   ```

3. **Don't fetch data in Client Components unnecessarily**
   ```tsx
   // ❌ Bad
   'use client'
   import { useEffect, useState } from 'react'

   export function Users() {
     const [users, setUsers] = useState([])

     useEffect(() => {
       fetch('/api/users').then(r => r.json()).then(setUsers)
     }, [])

     return <ul>{users.map(u => <li>{u.name}</li>)}</ul>
   }

   // ✅ Good - Server Component
   async function Users() {
     const users = await db.user.findMany()
     return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
   }
   ```

---

## TanStack Query v5 (React Query)

### Overview

TanStack Query (formerly React Query) v5 is the latest version with improved TypeScript support, simpler API, and native Next.js 14 App Router integration.

### Breaking Changes from v4

#### 1. Status Renaming

```tsx
// v4
const { isLoading, isFetching, data } = useQuery(...)

// v5
const { isPending, isFetching, data } = useQuery(...)

// New derived flag:
// isLoading = isPending && isFetching
```

#### 2. Single Object API

```tsx
// v4 - Multiple overloads
useQuery(['todos'], fetchTodos, { staleTime: 5000 })

// v5 - Single object signature
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5000,
})
```

#### 3. Suspense Hooks

```tsx
// v4
useQuery({ queryKey: ['user'], queryFn: fetchUser, suspense: true })

// v5 - Dedicated hook
useSuspenseQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
})
```

#### 4. React 18 Required

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### Setup with Next.js 14 App Router

#### 1. Install Dependencies

```bash
npm install @tanstack/react-query
npm install --save-dev @tanstack/react-query-devtools
```

#### 2. Create Query Client Provider

```tsx
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client per request
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

#### 3. Wrap App with Provider

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Integration with Next.js App Router

#### Pattern 1: Prefetch in Server Component, Consume in Client Component

```tsx
// app/users/page.tsx (Server Component)
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { UsersList } from './users-list'

async function getUsers() {
  const res = await fetch('https://api.example.com/users')
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export default async function UsersPage() {
  const queryClient = new QueryClient()

  // Prefetch data on server
  await queryClient.prefetchQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersList />
    </HydrationBoundary>
  )
}

// app/users/users-list.tsx (Client Component)
'use client'

import { useQuery } from '@tanstack/react-query'

async function getUsers() {
  const res = await fetch('https://api.example.com/users')
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export function UsersList() {
  const { data: users, isPending, error } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {users.map((user: User) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

#### Pattern 2: With Streaming Support

```tsx
// lib/query-client.ts
import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // Include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  })
}

// Server-side: one client per request
// Client-side: singleton
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}
```

### Query Patterns

#### Basic Query

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

function TodoList() {
  const { data, isPending, error, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos')
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    },
  })

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

#### Query with Parameters

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

interface UserProfileProps {
  userId: string
}

function UserProfile({ userId }: UserProfileProps) {
  const { data: user } = useQuery({
    queryKey: ['users', userId], // Include params in key
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`)
      return res.json()
    },
    enabled: !!userId, // Only run if userId exists
  })

  if (!user) return null

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )
}
```

#### Dependent Queries

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

function UserPosts({ userId }: { userId: string }) {
  // Fetch user first
  const { data: user } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  })

  // Then fetch posts (only when we have user)
  const { data: posts } = useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!user, // Wait for user data
  })

  return <div>{/* Render posts */}</div>
}
```

#### Parallel Queries

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

function Dashboard() {
  const users = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const posts = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  const comments = useQuery({
    queryKey: ['comments'],
    queryFn: fetchComments,
  })

  // All queries run in parallel

  if (users.isPending || posts.isPending || comments.isPending) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Users: {users.data.length}</h2>
      <h2>Posts: {posts.data.length}</h2>
      <h2>Comments: {comments.data.length}</h2>
    </div>
  )
}
```

### Mutation Patterns

#### Basic Mutation

```tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreateUserForm() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (newUser: { name: string; email: string }) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      if (!res.ok) throw new Error('Failed to create user')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ name: 'John Doe', email: 'john@example.com' })
  }

  return (
    <form onSubmit={handleSubmit}>
      {mutation.isPending ? (
        'Creating user...'
      ) : (
        <>
          {mutation.isError && <div>Error: {mutation.error.message}</div>}
          {mutation.isSuccess && <div>User created!</div>}
          <button type="submit">Create User</button>
        </>
      )}
    </form>
  )
}
```

#### Optimistic Updates

```tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

function TodoList() {
  const queryClient = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: async (todoId: string) => {
      const res = await fetch(`/api/todos/${todoId}/toggle`, {
        method: 'PATCH',
      })
      return res.json()
    },
    // Optimistic update
    onMutate: async (todoId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos'])

      // Optimistically update
      queryClient.setQueryData(['todos'], (old: Todo[]) =>
        old.map((todo) =>
          todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
        )
      )

      // Return context with snapshot
      return { previousTodos }
    },
    // Rollback on error
    onError: (err, todoId, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos)
    },
    // Refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <div>
      {/* Render todos with toggle button */}
      <button onClick={() => toggleMutation.mutate('todo-1')}>
        Toggle Todo
      </button>
    </div>
  )
}
```

### Cache Management

#### Manual Cache Updates

```tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: (newUser) => {
      // Option 1: Invalidate (refetch)
      queryClient.invalidateQueries({ queryKey: ['users'] })

      // Option 2: Manually update cache
      queryClient.setQueryData(['users'], (old: User[]) => [...old, newUser])

      // Option 3: Update specific item
      queryClient.setQueryData(['users', newUser.id], newUser)
    },
  })
}
```

#### Invalidation Strategies

```tsx
// Invalidate all users queries
queryClient.invalidateQueries({ queryKey: ['users'] })

// Invalidate specific user
queryClient.invalidateQueries({ queryKey: ['users', userId] })

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'users' && query.state.data?.isActive === false,
})
```

### Pagination

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

function PaginatedUsers() {
  const [page, setPage] = useState(1)

  const { data, isPending, isPlaceholderData } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchUsers(page),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  })

  return (
    <div>
      {isPending ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {data.users.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setPage((old) => Math.max(old - 1, 1))}
        disabled={page === 1}
      >
        Previous
      </button>

      <button
        onClick={() => {
          if (!isPlaceholderData && data.hasMore) {
            setPage((old) => old + 1)
          }
        }}
        disabled={isPlaceholderData || !data.hasMore}
      >
        Next
      </button>
    </div>
  )
}
```

### Infinite Queries

```tsx
'use client'

import { useInfiniteQuery } from '@tanstack/react-query'

function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['users'],
    queryFn: ({ pageParam = 1 }) => fetchUsers(pageParam),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined
    },
    initialPageParam: 1,
  })

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.users.map((user) => (
            <div key={user.id}>{user.name}</div>
          ))}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'Nothing more to load'}
      </button>
    </div>
  )
}
```

### Best Practices Summary

#### ✅ DO

1. **Use meaningful query keys**
   ```tsx
   queryKey: ['users', userId, { filter: 'active' }]
   ```

2. **Prefetch data in Server Components**
   ```tsx
   await queryClient.prefetchQuery({ queryKey: ['users'], queryFn: getUsers })
   ```

3. **Use staleTime appropriately**
   ```tsx
   staleTime: 60 * 1000 // Data is fresh for 1 minute
   ```

4. **Handle errors properly**
   ```tsx
   if (error) return <ErrorComponent error={error} />
   ```

5. **Use optimistic updates for better UX**
   ```tsx
   onMutate: async () => {
     await queryClient.cancelQueries({ queryKey: ['todos'] })
     // Update cache optimistically
   }
   ```

#### ❌ DON'T

1. **Don't use React Query for everything**
   - Use Server Components for initial data
   - Use React Query for interactive/real-time data

2. **Don't forget to handle loading states**
   ```tsx
   if (isPending) return <Loading />
   ```

3. **Don't mutate query data directly**
   ```tsx
   // ❌ Bad
   data.push(newItem)

   // ✅ Good
   queryClient.setQueryData(['items'], (old) => [...old, newItem])
   ```

4. **Don't over-invalidate**
   ```tsx
   // ❌ Bad - invalidates all queries
   queryClient.invalidateQueries()

   // ✅ Good - specific invalidation
   queryClient.invalidateQueries({ queryKey: ['users'] })
   ```

---

## Zod Validation

### Overview

Zod is a TypeScript-first schema validation library that provides both runtime validation and automatic type inference.

### Installation

```bash
npm install zod
npm install @hookform/resolvers react-hook-form
```

### Basic Schemas

```tsx
import { z } from 'zod'

// String
const nameSchema = z.string()
const emailSchema = z.string().email()
const urlSchema = z.string().url()

// Number
const ageSchema = z.number().min(0).max(120)
const priceSchema = z.number().positive()

// Boolean
const isActiveSchema = z.boolean()

// Date
const dateSchema = z.date()
const futureDate = z.date().min(new Date())

// Enum
const roleSchema = z.enum(['admin', 'user', 'guest'])

// Literal
const statusSchema = z.literal('active')

// Array
const tagsSchema = z.array(z.string())
const numbersSchema = z.array(z.number()).min(1).max(10)

// Object
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
  role: z.enum(['admin', 'user']),
})

// Union
const idSchema = z.union([z.string(), z.number()])

// Intersection
const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
})

const userWithTimestampsSchema = userSchema.and(timestampsSchema)
```

### Type Inference

```tsx
import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
})

// Automatic type inference
type User = z.infer<typeof userSchema>
// type User = {
//   id: string;
//   name: string;
//   email: string;
//   role: "admin" | "user";
// }
```

### Validation

```tsx
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be 18 or older'),
})

// Parse (throws on error)
const user = userSchema.parse({
  name: 'John',
  email: 'john@example.com',
  age: 25,
})

// Safe parse (returns result object)
const result = userSchema.safeParse({
  name: 'John',
  email: 'invalid-email',
  age: 15,
})

if (result.success) {
  console.log(result.data)
} else {
  console.log(result.error.errors)
  // [
  //   { path: ['email'], message: 'Invalid email address' },
  //   { path: ['age'], message: 'Must be 18 or older' }
  // ]
}
```

### Integration with React Hook Form

#### Basic Form

```tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Define schema
const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Infer type
type FormValues = z.infer<typeof formSchema>

export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: FormValues) => {
    console.log(data)
    // Submit to API
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Username</label>
        <input {...register('username')} />
        {errors.username && <p>{errors.username.message}</p>}
      </div>

      <div>
        <label>Email</label>
        <input type="email" {...register('email')} />
        {errors.email && <p>{errors.email.message}</p>}
      </div>

      <div>
        <label>Password</label>
        <input type="password" {...register('password')} />
        {errors.password && <p>{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

#### With shadcn/ui Form Components

```tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
})

type FormValues = z.infer<typeof formSchema>

export function ProfileForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  })

  const onSubmit = (data: FormValues) => {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Advanced Validation Patterns

#### Cross-Field Validation

```tsx
import { z } from 'zod'

const passwordFormSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // Error appears on confirmPassword field
  })
```

#### Conditional Validation

```tsx
const orderSchema = z
  .object({
    type: z.enum(['standard', 'express']),
    deliveryDate: z.date().optional(),
  })
  .refine(
    (data) => {
      // Express orders must have delivery date
      if (data.type === 'express') {
        return !!data.deliveryDate
      }
      return true
    },
    {
      message: 'Delivery date is required for express orders',
      path: ['deliveryDate'],
    }
  )
```

#### Async Validation

```tsx
const usernameSchema = z.string().refine(
  async (username) => {
    // Check if username is available
    const response = await fetch(`/api/check-username?username=${username}`)
    const { available } = await response.json()
    return available
  },
  {
    message: 'Username is already taken',
  }
)

// Use with React Hook Form
const form = useForm({
  resolver: zodResolver(formSchema),
  mode: 'onBlur', // Trigger validation on blur for async checks
})
```

#### Custom Error Messages

```tsx
const userSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name cannot be empty')
    .max(50, 'Name is too long'),

  age: z
    .number({
      required_error: 'Age is required',
      invalid_type_error: 'Age must be a number',
    })
    .int('Age must be a whole number')
    .positive('Age must be positive')
    .max(120, 'Age must be less than 120'),

  email: z
    .string()
    .email({ message: 'Please enter a valid email address' }),
})
```

### Server-Side Validation

```tsx
// app/actions/user.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'user']),
})

export async function createUser(formData: FormData) {
  // Validate on server
  const validatedFields = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Insert into database
  const user = await db.user.create({
    data: validatedFields.data,
  })

  revalidatePath('/users')

  return { user }
}
```

### Reusable Schemas

```tsx
// lib/schemas.ts
import { z } from 'zod'

// Base schemas
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Reusable object schemas
export const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Extend schemas
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: emailSchema,
  role: z.enum(['admin', 'user']),
})

export const userWithTimestampsSchema = userSchema.extend({
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Or merge
export const userWithTimestampsSchema2 = userSchema.merge(timestampsSchema)
```

### Best Practices Summary

#### ✅ DO

1. **Define schemas once, use everywhere**
   ```tsx
   // Shared schema for client and server
   export const userSchema = z.object({ ... })
   ```

2. **Use type inference**
   ```tsx
   type User = z.infer<typeof userSchema>
   ```

3. **Provide clear error messages**
   ```tsx
   z.string().min(1, 'Name is required')
   ```

4. **Use safeParse for better error handling**
   ```tsx
   const result = schema.safeParse(data)
   if (!result.success) {
     console.log(result.error.errors)
   }
   ```

5. **Validate on both client and server**
   ```tsx
   // Client: zodResolver(schema)
   // Server: schema.safeParse(formData)
   ```

#### ❌ DON'T

1. **Don't skip validation on server**
   - Always validate server-side, even if you validate client-side

2. **Don't expose internal error details to users**
   ```tsx
   // ❌ Bad
   return { error: error.stack }

   // ✅ Good
   return { error: 'Invalid input' }
   ```

3. **Don't create duplicate schemas**
   - Share schemas between client and server

---

## shadcn/ui Component Library

### Overview

shadcn/ui is NOT a traditional component library. It's a collection of re-usable components that you copy into your project. Built on Radix UI primitives with Tailwind CSS.

### Key Features

- ✅ **Own the code** - Components live in your repo
- ✅ **Customizable** - Full control over styling
- ✅ **Accessible** - Built on Radix UI (WAI-ARIA compliant)
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind v4** - Latest CSS features

### Installation

#### 1. Initialize shadcn/ui

```bash
npx shadcn@latest init
```

Configuration prompts:
```
✔ Would you like to use TypeScript (recommended)? ... yes
✔ Which style would you like to use? › New York
✔ Which color would you like to use as base color? › Zinc
✔ Where is your global CSS file? ... app/globals.css
✔ Would you like to use CSS variables for colors? ... yes
✔ Are you using a custom tailwind prefix eg. tw-? (Leave blank if not) ...
✔ Where is your tailwind.config.js located? ... tailwind.config.ts
✔ Configure the import alias for components: ... @/components
✔ Configure the import alias for utils: ... @/lib/utils
✔ Are you using React Server Components? ... yes
```

This creates:
- `components/ui/` - Components directory
- `lib/utils.ts` - Utility functions
- `components.json` - Configuration

#### 2. Add Components

```bash
# Add individual components
npx shadcn@latest add button
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add card

# Add multiple at once
npx shadcn@latest add button form input card table
```

### Core Components for Admin Dashboard

#### 1. Layout Components

```bash
npx shadcn@latest add card
npx shadcn@latest add separator
npx shadcn@latest add tabs
```

```tsx
// components/dashboard/stats-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function StatsCard({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
```

#### 2. Form Components

```bash
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add textarea
```

```tsx
// components/forms/user-form.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
})

export function UserForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

#### 3. Data Display Components

```bash
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar
```

```tsx
// components/tables/users-table.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function UsersTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.isActive ? 'success' : 'destructive'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

#### 4. Feedback Components

```bash
npx shadcn@latest add alert
npx shadcn@latest add toast
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
```

```tsx
// components/dialogs/delete-user-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function DeleteUserDialog({ userId }: { userId: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteUser(userId)}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

#### 5. Navigation Components

```bash
npx shadcn@latest add dropdown-menu
npx shadcn@latest add navigation-menu
npx shadcn@latest add command
```

```tsx
// components/navigation/user-menu.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function UserMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Theming with Tailwind v4

#### Configuration

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  /* Colors */
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(9.8% 0 0);

  --color-card: oklch(100% 0 0);
  --color-card-foreground: oklch(9.8% 0 0);

  --color-primary: oklch(90.48% 0.0007 286.75);
  --color-primary-foreground: oklch(98% 0 0);

  --color-secondary: oklch(96.08% 0 0);
  --color-secondary-foreground: oklch(9.8% 0 0);

  --color-muted: oklch(96.08% 0 0);
  --color-muted-foreground: oklch(45.77% 0.0006 286.75);

  --color-accent: oklch(96.08% 0 0);
  --color-accent-foreground: oklch(9.8% 0 0);

  --color-destructive: oklch(62.8% 0.257 29.23);
  --color-destructive-foreground: oklch(98% 0 0);

  --color-border: oklch(89.88% 0 0);
  --color-input: oklch(89.88% 0 0);
  --color-ring: oklch(9.8% 0 0);

  /* Radius */
  --radius-sm: 0.125rem;
  --radius: 0.5rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

@media (prefers-color-scheme: dark) {
  @theme inline {
    --color-background: oklch(9.8% 0 0);
    --color-foreground: oklch(98% 0 0);

    --color-card: oklch(9.8% 0 0);
    --color-card-foreground: oklch(98% 0 0);

    --color-primary: oklch(98% 0 0);
    --color-primary-foreground: oklch(9.8% 0 0);

    --color-secondary: oklch(14.88% 0 0);
    --color-secondary-foreground: oklch(98% 0 0);

    --color-muted: oklch(14.88% 0 0);
    --color-muted-foreground: oklch(63.92% 0.0007 286.75);

    --color-accent: oklch(14.88% 0 0);
    --color-accent-foreground: oklch(98% 0 0);

    --color-destructive: oklch(62.8% 0.257 29.23);
    --color-destructive-foreground: oklch(98% 0 0);

    --color-border: oklch(14.88% 0 0);
    --color-input: oklch(14.88% 0 0);
    --color-ring: oklch(83.28% 0.0007 286.75);
  }
}
```

### Accessibility (ARIA Patterns)

shadcn/ui components are built on Radix UI, which provides:

- ✅ **Automatic ARIA attributes** - Components have correct roles and states
- ✅ **Keyboard navigation** - All components support keyboard interactions
- ✅ **Focus management** - Proper focus trapping and restoration
- ✅ **Screen reader support** - Announcements and labels

Example: Form accessibility

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="email">Email</FormLabel>
      <FormControl>
        <Input
          id="email"
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
          {...field}
        />
      </FormControl>
      <FormMessage id="email-error" />
    </FormItem>
  )}
/>
```

Automatically generates:
- `htmlFor` association between label and input
- `aria-invalid` when validation fails
- `aria-describedby` linking error message
- Unique IDs via `React.useId()`

### Best Practices Summary

#### ✅ DO

1. **Customize components to match your design**
   ```tsx
   // Extend button variants
   const buttonVariants = cva('...', {
     variants: {
       variant: {
         custom: 'bg-brand-500 hover:bg-brand-600',
       },
     },
   })
   ```

2. **Use composition for complex components**
   ```tsx
   <Card>
     <CardHeader>
       <CardTitle>Title</CardTitle>
     </CardHeader>
     <CardContent>Content</CardContent>
   </Card>
   ```

3. **Leverage Radix UI primitives**
   - Built-in accessibility
   - Keyboard navigation
   - Focus management

4. **Use CSS variables for theming**
   ```css
   --color-primary: oklch(90.48% 0.0007 286.75);
   ```

#### ❌ DON'T

1. **Don't try to update components via npm**
   - You own the code, modify directly

2. **Don't skip accessibility features**
   - Use FormLabel, FormMessage, etc.
   - Keep ARIA attributes

3. **Don't ignore dark mode**
   - Use Tailwind's dark: prefix
   - Test both themes

---

## TypeScript Best Practices

### Configuration

#### Strict Mode tsconfig.json

```json
{
  "compilerOptions": {
    // Type Checking
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Modules
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,

    // Emit
    "jsx": "preserve",
    "incremental": true,
    "noEmit": true,

    // Interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,

    // Skip Lib Check
    "skipLibCheck": true,

    // Paths
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"]
    },

    // Next.js
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### Type-Safe API Responses

```tsx
// lib/types/api.ts
import { z } from 'zod'

// Define response schemas
export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  createdAt: z.string(),
})

export const usersResponseSchema = z.array(userResponseSchema)

// Infer types
export type User = z.infer<typeof userResponseSchema>
export type UsersResponse = z.infer<typeof usersResponseSchema>

// API wrapper with validation
export async function getUsers(): Promise<User[]> {
  const res = await fetch('/api/users')
  const data = await res.json()

  // Validate response at runtime
  return usersResponseSchema.parse(data)
}
```

### Generic Patterns

#### Generic API Client

```tsx
// lib/api-client.ts
import { z } from 'zod'

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T>(
    path: string,
    schema: z.ZodType<T>
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return schema.parse(data)
  }

  async post<T, U>(
    path: string,
    body: T,
    responseSchema: z.ZodType<U>
  ): Promise<U> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return responseSchema.parse(data)
  }
}

// Usage
const api = new ApiClient('https://api.example.com')

const users = await api.get('/users', usersResponseSchema)
const newUser = await api.post('/users', { name: 'John' }, userResponseSchema)
```

#### Generic Table Component

```tsx
// components/data-table.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={String(column.key)}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={keyExtractor(row)}>
            {columns.map((column) => (
              <TableCell key={String(column.key)}>
                {column.render
                  ? column.render(row)
                  : String(row[column.key as keyof T])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Usage
<DataTable
  data={users}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (user) => <Badge>{user.role}</Badge>,
    },
  ]}
  keyExtractor={(user) => user.id}
/>
```

### Utility Types

```tsx
// lib/types/utils.ts

// Make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Make specific keys required
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

// Omit keys from nested objects
export type DeepOmit<T, K extends string> = T extends object
  ? {
      [P in Exclude<keyof T, K>]: DeepOmit<T[P], K>
    }
  : T

// Extract async function return type
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any

// Usage
type UserWithId = RequireKeys<Partial<User>, 'id'>

type ApiFunction = typeof getUsers
type UsersData = AsyncReturnType<ApiFunction>
```

### Best Practices Summary

#### ✅ DO

1. **Enable strict mode**
   ```json
   { "compilerOptions": { "strict": true } }
   ```

2. **Use Zod for runtime validation**
   ```tsx
   const data = schema.parse(unknownData)
   ```

3. **Type API responses**
   ```tsx
   export async function getUsers(): Promise<User[]> { ... }
   ```

4. **Use generics for reusable components**
   ```tsx
   function DataTable<T>({ data }: { data: T[] }) { ... }
   ```

5. **Leverage type inference**
   ```tsx
   const user = { id: '1', name: 'John' } // Type inferred
   ```

#### ❌ DON'T

1. **Don't use `any`**
   ```tsx
   // ❌ Bad
   function process(data: any) { ... }

   // ✅ Good
   function process<T>(data: T) { ... }
   ```

2. **Don't skip runtime validation**
   ```tsx
   // ❌ Bad
   const data = await res.json() as User

   // ✅ Good
   const data = userSchema.parse(await res.json())
   ```

3. **Don't ignore TypeScript errors**
   - Fix the error, don't use `@ts-ignore`

---

## Recommended Project Structure

```
sso-admin-dashboard/
├── app/
│   ├── (auth)/                    # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx             # Auth layout
│   │
│   ├── (dashboard)/               # Dashboard route group
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # /dashboard
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   │
│   │   ├── users/
│   │   │   ├── page.tsx           # /users (list)
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx       # /users/:id (view)
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx   # /users/:id/edit
│   │   │   ├── new/
│   │   │   │   └── page.tsx       # /users/new
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   │
│   │   ├── sessions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── applications/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   │
│   │   └── layout.tsx             # Dashboard layout (sidebar, nav)
│   │
│   ├── api/                       # API routes (if needed)
│   │   └── webhook/
│   │       └── route.ts
│   │
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Homepage
│   ├── globals.css                # Global styles
│   ├── providers.tsx              # Client providers (React Query, etc.)
│   └── error.tsx                  # Global error boundary
│
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   │
│   ├── dashboard/                 # Dashboard-specific components
│   │   ├── stats-card.tsx
│   │   ├── recent-activity.tsx
│   │   └── analytics-chart.tsx
│   │
│   ├── users/                     # User-specific components
│   │   ├── users-table.tsx
│   │   ├── user-form.tsx
│   │   └── user-avatar.tsx
│   │
│   ├── sessions/                  # Session-specific components
│   │   ├── sessions-table.tsx
│   │   └── session-details.tsx
│   │
│   ├── layout/                    # Layout components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── nav.tsx
│   │   └── footer.tsx
│   │
│   └── shared/                    # Shared components
│       ├── data-table.tsx         # Generic table
│       ├── empty-state.tsx
│       ├── error-boundary.tsx
│       └── loading-spinner.tsx
│
├── lib/
│   ├── actions/                   # Server Actions
│   │   ├── user.ts
│   │   ├── session.ts
│   │   └── application.ts
│   │
│   ├── api/                       # API client
│   │   ├── client.ts              # Base API client
│   │   ├── users.ts               # User endpoints
│   │   ├── sessions.ts            # Session endpoints
│   │   └── applications.ts        # Application endpoints
│   │
│   ├── schemas/                   # Zod schemas
│   │   ├── user.ts
│   │   ├── session.ts
│   │   └── application.ts
│   │
│   ├── types/                     # TypeScript types
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── utils.ts
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── use-users.ts           # React Query hooks
│   │   ├── use-sessions.ts
│   │   └── use-pagination.ts
│   │
│   ├── utils/                     # Utility functions
│   │   ├── cn.ts                  # Class name utility
│   │   ├── format.ts              # Date/number formatting
│   │   └── validation.ts          # Validation helpers
│   │
│   └── constants.ts               # App constants
│
├── public/
│   ├── images/
│   └── icons/
│
├── .env.local                     # Environment variables
├── .env.example                   # Example env file
├── next.config.ts                 # Next.js config
├── tailwind.config.ts             # Tailwind config
├── tsconfig.json                  # TypeScript config
├── components.json                # shadcn/ui config
└── package.json
```

### File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `users-table.tsx`)
- **Pages**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **API routes**: `route.ts`
- **Types**: `PascalCase` interfaces/types
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

### Import Alias Configuration

```tsx
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"]
    }
  }
}

// Usage
import { Button } from '@/components/ui/button'
import { getUsers } from '@/lib/api/users'
import { userSchema } from '@/lib/schemas/user'
```

---

## Common Pitfalls & Solutions

### 1. Adding "use client" Too High in Component Tree

#### ❌ Problem

```tsx
// app/layout.tsx
'use client' // DON'T DO THIS!

export default function Layout({ children }) {
  return <div>{children}</div>
}
```

This disables Server Components for your entire app!

#### ✅ Solution

```tsx
// app/layout.tsx (Server Component)
export default function Layout({ children }) {
  return <div>{children}</div>
}

// components/interactive-nav.tsx (Client Component)
'use client'

export function InteractiveNav() {
  const [isOpen, setIsOpen] = useState(false)
  return <nav>{/* ... */}</nav>
}
```

### 2. Fetching Data in Client Components

#### ❌ Problem

```tsx
'use client'

export function Users() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
  }, [])

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

#### ✅ Solution 1: Server Component

```tsx
// app/users/page.tsx (Server Component)
async function UsersPage() {
  const users = await db.user.findMany()
  return <UserList users={users} />
}
```

#### ✅ Solution 2: React Query (if interactivity needed)

```tsx
// Prefetch in Server Component
// app/users/page.tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

export default async function UsersPage() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersList />
    </HydrationBoundary>
  )
}

// Consume in Client Component
// components/users-list.tsx
'use client'

export function UsersList() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

### 3. Not Handling Loading States

#### ❌ Problem

```tsx
// No loading state
async function DashboardPage() {
  const data = await fetchData() // Takes 2 seconds
  return <Dashboard data={data} />
}
```

User sees blank page for 2 seconds!

#### ✅ Solution

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}

// app/dashboard/page.tsx
async function DashboardPage() {
  const data = await fetchData()
  return <Dashboard data={data} />
}
```

### 4. Not Using Suspense for Parallel Loading

#### ❌ Problem

```tsx
async function DashboardPage() {
  const revenue = await getRevenue()    // 1 second
  const users = await getUsers()        // 1 second
  const orders = await getOrders()      // 1 second
  // Total: 3 seconds (waterfall!)

  return <Dashboard revenue={revenue} users={users} orders={orders} />
}
```

#### ✅ Solution

```tsx
function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Suspense fallback={<Skeleton />}>
        <RevenueCard />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <UsersCard />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <OrdersCard />
      </Suspense>
    </div>
  )
}

// Total: 1 second (parallel!)
```

### 5. Not Validating API Responses

#### ❌ Problem

```tsx
const data = await fetch('/api/users').then(r => r.json())
// What if API returns unexpected structure?
console.log(data.users[0].name) // Might throw!
```

#### ✅ Solution

```tsx
import { z } from 'zod'

const usersSchema = z.array(z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
}))

const response = await fetch('/api/users').then(r => r.json())
const users = usersSchema.parse(response) // Type-safe!
```

### 6. Mixing Data Fetching Strategies

#### ❌ Problem

```tsx
// app/users/page.tsx
async function UsersPage() {
  const users = await db.user.findMany() // Server Component

  return (
    <div>
      <UsersList users={users} />
      <RecentActivity /> {/* Uses React Query */}
    </div>
  )
}
```

This creates confusion about data source.

#### ✅ Solution

Pick ONE strategy per route:
- **Static/infrequently updated**: Server Components
- **Real-time/interactive**: React Query

```tsx
// Option 1: All Server Components
async function UsersPage() {
  const users = await db.user.findMany()
  const activity = await db.activity.findMany()

  return (
    <div>
      <UsersList users={users} />
      <ActivityList activity={activity} />
    </div>
  )
}

// Option 2: All React Query
function UsersPage() {
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersList />
      <RecentActivity />
    </HydrationBoundary>
  )
}
```

### 7. Not Using Error Boundaries

#### ❌ Problem

```tsx
// No error handling
async function UsersPage() {
  const users = await db.user.findMany() // Might fail!
  return <UsersList users={users} />
}
```

#### ✅ Solution

```tsx
// app/users/error.tsx
'use client'

export default function UsersError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}

// app/users/page.tsx
async function UsersPage() {
  const users = await db.user.findMany()
  return <UsersList users={users} />
}
```

### 8. Forgetting to Revalidate Cache After Mutations

#### ❌ Problem

```tsx
'use server'

export async function createUser(formData: FormData) {
  await db.user.create({ ... })
  // User list still shows old data!
}
```

#### ✅ Solution

```tsx
'use server'

import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  await db.user.create({ ... })
  revalidatePath('/users') // Refresh cache
}
```

---

## Performance Optimization

### 1. Image Optimization

```tsx
import Image from 'next/image'

// ✅ Good - Automatic optimization
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// ❌ Bad - No optimization
<img src="/hero.jpg" alt="Hero" />
```

### 2. Font Optimization

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### 3. Code Splitting

```tsx
// Dynamic import for heavy components
import dynamic from 'next/dynamic'

const DynamicChart = dynamic(() => import('./chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Disable SSR if needed
})

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <DynamicChart data={data} />
    </div>
  )
}
```

### 4. Streaming with Suspense

```tsx
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Fast content renders immediately */}
      <QuickStats />

      {/* Slow content streams when ready */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <Analytics />
      </Suspense>
    </div>
  )
}
```

### 5. React Query Stale Time

```tsx
// Reduce unnecessary refetches
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: getUsers,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
})
```

### 6. Metadata for SEO

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: [post.coverImage],
    },
  }
}
```

### 7. Route Prefetching

```tsx
import Link from 'next/link'

// Prefetches on hover
<Link href="/dashboard" prefetch={true}>
  Dashboard
</Link>
```

---

## Production Checklist

### Configuration

- [ ] TypeScript strict mode enabled
- [ ] Environment variables configured (`.env.local`, `.env.production`)
- [ ] API base URL configured for production
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Analytics configured (Google Analytics, PostHog, etc.)

### Performance

- [ ] Images optimized with Next.js `<Image>`
- [ ] Fonts optimized with `next/font`
- [ ] Code splitting implemented
- [ ] Streaming with Suspense
- [ ] React Query stale time configured
- [ ] Lighthouse score > 90

### Security

- [ ] Environment secrets not committed
- [ ] API rate limiting implemented
- [ ] CORS configured properly
- [ ] Content Security Policy (CSP) headers
- [ ] Input validation (Zod) on client AND server
- [ ] XSS protection
- [ ] CSRF protection

### Accessibility

- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

### SEO

- [ ] Metadata configured for all pages
- [ ] Open Graph tags
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Structured data (JSON-LD)

### Testing

- [ ] Unit tests for utilities/hooks
- [ ] Integration tests for critical flows
- [ ] E2E tests for user journeys
- [ ] Accessibility tests

### Deployment

- [ ] Build succeeds without errors
- [ ] Environment variables set in production
- [ ] Database migrations run
- [ ] CDN configured for static assets
- [ ] Monitoring setup (error tracking, performance)
- [ ] Backup strategy

---

## Additional Resources

### Official Documentation

- **Next.js 14**: https://nextjs.org/docs
- **React**: https://react.dev
- **TanStack Query v5**: https://tanstack.com/query/v5
- **Zod**: https://zod.dev
- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com

### Community Resources

- **TkDodo's Blog** (React Query): https://tkdodo.eu/blog
- **Next.js Examples**: https://github.com/vercel/next.js/tree/canary/examples
- **shadcn/ui Templates**: https://ui.shadcn.com/examples
- **React Server Components Deep Dive**: https://github.com/reactwg/server-components

### Tools

- **React DevTools**: Browser extension for debugging React
- **TanStack Query DevTools**: Built-in devtools for React Query
- **Next.js DevTools**: Chrome extension
- **TypeScript Playground**: https://www.typescriptlang.org/play
- **Tailwind Play**: https://play.tailwindcss.com

### Learning Resources

- **Next.js Learn**: https://nextjs.org/learn
- **React Query Tutorial**: https://ui.dev/react-query-tutorial
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook
- **Zod Tutorial**: https://www.totaltypescript.com/tutorials/zod

---

## Changelog

### v1.0.0 (2025-11-11)

- ✅ Initial research completed
- ✅ Comprehensive coverage of Next.js 14 App Router
- ✅ React Server Components patterns
- ✅ TanStack Query v5 integration
- ✅ Zod validation patterns
- ✅ shadcn/ui setup and usage
- ✅ TypeScript best practices
- ✅ Recommended project structure
- ✅ Common pitfalls and solutions
- ✅ Performance optimization techniques
- ✅ Production checklist

---

**End of Document**

*This research document is based on the latest official documentation and community best practices as of November 2025. For the most up-to-date information, always refer to official documentation.*
