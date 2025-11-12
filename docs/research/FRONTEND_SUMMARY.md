# Frontend Stack Summary (2025)
## Quick Reference Guide

**Last Updated**: 2025-11-11
**Read Time**: 5 minutes

---

## Stack Overview

```
Next.js 14 App Router
  ↓
React Server Components (RSC)
  ↓
┌──────────────────┬────────────────────┐
│  Server Side     │    Client Side     │
├──────────────────┼────────────────────┤
│ • Data Fetching  │ • React Query v5   │
│ • Server Actions │ • Zod Validation   │
│ • Direct DB      │ • shadcn/ui        │
│ • Streaming      │ • Interactivity    │
└──────────────────┴────────────────────┘
```

---

## Key Decisions

### 1. Server Components by Default

✅ **Use Server Components for:**
- Data fetching from database/API
- Non-interactive content
- SEO-critical pages
- Reducing JavaScript bundle

❌ **Use Client Components for:**
- Interactivity (onClick, onChange)
- Browser APIs (localStorage)
- Hooks (useState, useEffect)
- React Context

### 2. Data Fetching Strategy

**Choose ONE per route:**

**Option A: Server Components** (Recommended for static/infrequent updates)
```tsx
// app/users/page.tsx
async function UsersPage() {
  const users = await db.user.findMany()
  return <UsersList users={users} />
}
```

**Option B: React Query** (For interactive/real-time data)
```tsx
// Prefetch on server, consume on client
<HydrationBoundary state={dehydrate(queryClient)}>
  <UsersList />
</HydrationBoundary>
```

### 3. Form Handling

**Server Actions** (Simple forms, progressive enhancement)
```tsx
'use server'
export async function createUser(formData: FormData) {
  // Validate with Zod
  const data = userSchema.parse(...)
  // Insert to DB
  await db.user.create({ data })
  revalidatePath('/users')
}
```

**React Hook Form + Zod** (Complex forms, client validation)
```tsx
const form = useForm({
  resolver: zodResolver(userSchema),
})
```

---

## File Structure

```
app/
├── (auth)/              # Route group (doesn't affect URL)
│   ├── login/page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── loading.tsx  # Automatic Suspense
│   │   └── error.tsx    # Error boundary
│   └── users/
│       ├── page.tsx     # /users
│       ├── [id]/
│       │   └── page.tsx # /users/:id
│       └── new/
│           └── page.tsx # /users/new
└── providers.tsx        # React Query provider

components/
├── ui/                  # shadcn/ui components
│   ├── button.tsx
│   ├── form.tsx
│   └── table.tsx
├── dashboard/           # Feature-specific
│   └── stats-card.tsx
└── shared/              # Reusable
    └── data-table.tsx

lib/
├── actions/             # Server Actions
│   └── user.ts
├── api/                 # API client
│   └── users.ts
├── schemas/             # Zod schemas
│   └── user.ts
├── hooks/               # React Query hooks
│   └── use-users.ts
└── types/
    └── api.ts
```

---

## Quick Start Guide

### 1. Install Dependencies

```bash
# Core
npm install next@latest react@latest react-dom@latest

# React Query
npm install @tanstack/react-query
npm install --save-dev @tanstack/react-query-devtools

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# UI Components
npx shadcn@latest init
npx shadcn@latest add button form input card table
```

### 2. TypeScript Config

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

### 3. Setup React Query Provider

```tsx
// app/providers.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### 4. Create a Page with Loading/Error States

```tsx
// app/users/loading.tsx
export default function Loading() {
  return <div>Loading users...</div>
}

// app/users/error.tsx
'use client'
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Error: {error.message}</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}

// app/users/page.tsx
import { db } from '@/lib/db'

export default async function UsersPage() {
  const users = await db.user.findMany()
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Essential Patterns

### Pattern 1: Server Component with Streaming

```tsx
import { Suspense } from 'react'

export default function DashboardPage() {
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

async function RevenueCard() {
  const revenue = await getRevenue()
  return <Card>{revenue}</Card>
}
```

### Pattern 2: React Query with Prefetching

```tsx
// app/users/page.tsx (Server Component)
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

// components/users-list.tsx (Client Component)
'use client'
export function UsersList() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

### Pattern 3: Form with Zod Validation

```tsx
// lib/schemas/user.ts
import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'user']),
})

export type User = z.infer<typeof userSchema>

// components/user-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, User } from '@/lib/schemas/user'

export function UserForm() {
  const form = useForm<User>({
    resolver: zodResolver(userSchema),
  })

  const onSubmit = async (data: User) => {
    await createUser(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <p>{form.formState.errors.name.message}</p>
      )}

      <input type="email" {...form.register('email')} />
      {form.formState.errors.email && (
        <p>{form.formState.errors.email.message}</p>
      )}

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Pattern 4: shadcn/ui Form

```tsx
'use client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ProfileForm() {
  const form = useForm<User>({
    resolver: zodResolver(userSchema),
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

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Adding 'use client' Too High

```tsx
// ❌ BAD - Entire layout is now Client Component
'use client'
export default function Layout({ children }) {
  return <div>{children}</div>
}

// ✅ GOOD - Layout is Server Component
export default function Layout({ children }) {
  return (
    <div>
      <InteractiveNav /> {/* Only this is Client */}
      {children}
    </div>
  )
}
```

### ❌ Pitfall 2: Fetching Data in Client Components

```tsx
// ❌ BAD
'use client'
export function Users() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers)
  }, [])
  return <ul>{users.map(u => <li>{u.name}</li>)}</ul>
}

// ✅ GOOD - Server Component
async function Users() {
  const users = await db.user.findMany()
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

### ❌ Pitfall 3: Not Using Loading States

```tsx
// ❌ BAD - No loading state
async function DashboardPage() {
  const data = await fetchData() // Takes 2 seconds
  return <Dashboard data={data} />
}

// ✅ GOOD - Add loading.tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}
```

### ❌ Pitfall 4: Sequential Data Fetching

```tsx
// ❌ BAD - Waterfall (3 seconds total)
async function DashboardPage() {
  const revenue = await getRevenue()  // 1s
  const users = await getUsers()      // 1s
  const orders = await getOrders()    // 1s
  return <Dashboard {...} />
}

// ✅ GOOD - Parallel with Suspense (1 second total)
function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<Skeleton />}><RevenueCard /></Suspense>
      <Suspense fallback={<Skeleton />}><UsersCard /></Suspense>
      <Suspense fallback={<Skeleton />}><OrdersCard /></Suspense>
    </div>
  )
}
```

### ❌ Pitfall 5: Not Validating API Responses

```tsx
// ❌ BAD
const data = await fetch('/api/users').then(r => r.json())
console.log(data.users[0].name) // Might throw!

// ✅ GOOD
const usersSchema = z.array(z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
}))

const response = await fetch('/api/users').then(r => r.json())
const users = usersSchema.parse(response) // Type-safe!
```

---

## Performance Checklist

- [ ] Use `<Image>` from next/image
- [ ] Optimize fonts with next/font
- [ ] Implement Suspense for streaming
- [ ] Use loading.tsx for route-level loading
- [ ] Set appropriate React Query staleTime
- [ ] Dynamic import heavy components
- [ ] Generate metadata for SEO
- [ ] Use Suspense for parallel data fetching
- [ ] Prefetch links with `<Link prefetch>`

---

## Production Checklist

### Configuration
- [ ] TypeScript strict mode enabled
- [ ] Environment variables configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured

### Performance
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Bundle size < 200KB

### Security
- [ ] Zod validation on client AND server
- [ ] No secrets in client code
- [ ] CORS configured
- [ ] Rate limiting

### Accessibility
- [ ] Alt text on images
- [ ] Forms have labels
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA

### SEO
- [ ] Metadata on all pages
- [ ] Open Graph tags
- [ ] Sitemap generated
- [ ] Robots.txt configured

---

## Next Steps

1. **Read Full Guide**: [frontend-stack-2025.md](./frontend-stack-2025.md)
2. **Setup Project**: Follow Quick Start Guide above
3. **Implement Patterns**: Use essential patterns section
4. **Avoid Pitfalls**: Review common pitfalls
5. **Optimize**: Use performance checklist
6. **Deploy**: Follow production checklist

---

## Additional Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [TanStack Query v5](https://tanstack.com/query/v5)
- [Zod Documentation](https://zod.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Full Research Document](./frontend-stack-2025.md)

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
