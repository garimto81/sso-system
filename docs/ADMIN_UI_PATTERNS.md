# Admin Dashboard UI Patterns

**버전**: 1.0.0
**스택**: Next.js 14 + shadcn/ui + React Query v5
**업데이트**: 2025-01-12

---

## 📋 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [shadcn/ui 설정](#shadcnui-설정)
3. [공통 패턴](#공통-패턴)
4. [CRUD 화면 레시피](#crud-화면-레시피)
5. [Analytics Dashboard](#analytics-dashboard)
6. [Form 처리](#form-처리)

---

## 프로젝트 구조

### Next.js 14 App Router 구조

```
admin-dashboard/
├── app/
│   ├── admin/
│   │   ├── layout.tsx           # Admin 전체 레이아웃 (Sidebar + Header)
│   │   ├── page.tsx             # Dashboard home
│   │   ├── apps/
│   │   │   ├── page.tsx         # Apps list
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # Create app form
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # App detail/edit
│   │   │       └── analytics/
│   │   │           └── page.tsx # App analytics
│   │   └── login/
│   │       └── page.tsx         # Admin login
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── admin/
│   │   ├── AppsList.tsx         # Apps table
│   │   ├── CreateAppForm.tsx    # Create app form
│   │   ├── AppDetail.tsx        # App detail card
│   │   └── Sidebar.tsx          # Admin sidebar
│   └── charts/
│       ├── LoginTrendChart.tsx  # Line chart
│       └── UsageBarChart.tsx    # Bar chart
├── lib/
│   ├── api/
│   │   └── admin.ts             # API client
│   ├── query-client.ts          # React Query setup
│   └── utils.ts                 # cn(), etc.
├── hooks/
│   ├── useApps.ts               # Apps query hooks
│   ├── useAnalytics.ts          # Analytics hooks
│   └── useAuth.ts               # Auth hooks
├── types/
│   ├── api.ts                   # API response types
│   └── common.ts                # Common types
└── schemas/
    └── appForm.ts               # Zod schemas
```

---

## shadcn/ui 설정

### 1. 초기 설정

```bash
# Next.js 14 프로젝트 생성
npx create-next-app@latest admin-dashboard --typescript --tailwind --app

cd admin-dashboard

# shadcn/ui 초기화
npx shadcn-ui@latest init

# 필요한 컴포넌트 설치
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add card
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dropdown-menu
```

### 2. Tailwind 설정 (v4 스타일)

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... shadcn/ui defaults
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 3. 테마 커스터마이징

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --primary: 221.2 83.2% 53.3%; /* Blue */
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%; /* Red */
    --destructive-foreground: 210 40% 98%;

    --success: 142 76% 36%; /* Green */
    --warning: 38 92% 50%; /* Yellow */

    /* ... 나머지 CSS 변수 */
  }
}
```

---

## 공통 패턴

### Pattern 1: Admin Layout with Sidebar

```tsx
// app/admin/layout.tsx
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
```

```tsx
// components/admin/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AppWindow, Users, Settings } from 'lucide-react';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/apps', icon: AppWindow, label: 'Apps' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-2xl font-bold">SSO Admin</h1>
      </div>

      <nav className="px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg mb-1
                transition-colors
                ${isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

### Pattern 2: React Query Setup

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

```tsx
// app/layout.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Pattern 3: API Client

```typescript
// lib/api/admin.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class AdminAPIClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('admin_token'); // ⚠️ Development only
    // ✅ Production: Use httpOnly cookies

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getApps(params?: { search?: string; active?: boolean }) {
    const query = new URLSearchParams(params as any);
    const response = await fetch(`${API_URL}/api/v1/admin/apps?${query}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch apps');
    }

    return response.json();
  }

  async createApp(data: CreateAppInput) {
    const response = await fetch(`${API_URL}/api/v1/admin/apps`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create app');
    }

    return response.json();
  }

  // ... 나머지 메서드
}

export const adminAPI = new AdminAPIClient();
```

---

## CRUD 화면 레시피

### Recipe 1: Apps List Page

```tsx
// app/admin/apps/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppsTable } from '@/components/admin/AppsTable';
import { adminAPI } from '@/lib/api/admin';

export default function AppsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['apps', search],
    queryFn: () => adminAPI.getApps({ search }),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Apps</h1>
          <p className="text-gray-600">Manage your registered applications</p>
        </div>

        <Button asChild>
          <Link href="/admin/apps/new">
            <Plus className="w-4 h-4 mr-2" />
            New App
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search apps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <AppsTable apps={data?.apps || []} />
      )}
    </div>
  );
}
```

### Recipe 2: Data Table with shadcn/ui

```tsx
// components/admin/AppsTable.tsx
'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { MoreHorizontal, Trash2, Edit, BarChart } from 'lucide-react';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type App = {
  id: string;
  name: string;
  owner_email: string;
  is_active: boolean;
  created_at: string;
};

const columns: ColumnDef<App>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link
        href={`/admin/apps/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.getValue('name')}
      </Link>
    ),
  },
  {
    accessorKey: 'owner_email',
    header: 'Owner',
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
        {row.getValue('is_active') ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/apps/${row.original.id}`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/apps/${row.original.id}/analytics`}>
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function AppsTable({ apps }: { apps: App[] }) {
  const table = useReactTable({
    data: apps,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Recipe 3: Create Form with React Hook Form + Zod

```typescript
// schemas/appForm.ts
import { z } from 'zod';

export const createAppSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  redirect_urls: z
    .string()
    .transform((val) => val.split('\n').filter(Boolean))
    .pipe(z.array(z.string().url()).min(1)),
  owner_email: z.string().email(),
});

export type CreateAppInput = z.infer<typeof createAppSchema>;
```

```tsx
// app/admin/apps/new/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

import { createAppSchema, CreateAppInput } from '@/schemas/appForm';
import { adminAPI } from '@/lib/api/admin';

export default function CreateAppPage() {
  const router = useRouter();

  const form = useForm<CreateAppInput>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      name: '',
      description: '',
      redirect_urls: '',
      owner_email: '',
    },
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: adminAPI.createApp,
    onSuccess: (data) => {
      toast({
        title: 'App created!',
        description: `${data.app.name} has been created successfully.`,
      });

      // Show API secret modal (once!)
      // ... modal logic

      router.push(`/admin/apps/${data.app.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New App</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-6">
          {/* App Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>App Name *</FormLabel>
                <FormControl>
                  <Input placeholder="OJT Platform" {...field} />
                </FormControl>
                <FormDescription>
                  A unique name for your application
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Employee training system"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Redirect URLs */}
          <FormField
            control={form.control}
            name="redirect_urls"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Redirect URLs *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="http://localhost:3001/callback&#10;https://app.example.com/callback"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  One URL per line
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Owner Email */}
          <FormField
            control={form.control}
            name="owner_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="admin@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create App'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
```

---

## Analytics Dashboard

### Recipe 4: Charts with Recharts

```tsx
// components/charts/LoginTrendChart.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ChartData = {
  date: string;
  logins: number;
};

export function LoginTrendChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="logins"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Recipe 5: Stats Cards

```tsx
// components/admin/StatsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

type StatsCardProps = {
  title: string;
  value: number;
  change?: number; // Percentage change
  icon?: React.ReactNode;
};

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  const isPositive = change !== undefined && change > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span>from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Form 처리

### Pattern: Show-Once API Secret Modal

```tsx
// components/admin/ApiSecretModal.tsx
'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function ApiSecretModal({
  open,
  onClose,
  apiKey,
  apiSecret,
}: {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  apiSecret: string;
}) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const copyToClipboard = async (text: string, type: 'key' | 'secret') => {
    await navigator.clipboard.writeText(text);

    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>✅ App Created Successfully</DialogTitle>
          <DialogDescription>
            Save these credentials now. The API Secret will not be shown again!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="text-sm font-medium">API Key</label>
            <div className="flex gap-2 mt-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">
                {apiKey}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiKey, 'key')}
              >
                {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* API Secret */}
          <div>
            <label className="text-sm font-medium">API Secret</label>
            <div className="flex gap-2 mt-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">
                {apiSecret}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiSecret, 'secret')}
              >
                {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Important:</strong> The API Secret won't be shown again.
              Store it securely (e.g., environment variables).
            </p>
          </div>

          <Button onClick={onClose} className="w-full">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

**Last Updated**: 2025-01-12
**Next Review**: After Phase 2 Frontend implementation
