# Task List: SSO Admin Dashboard (PRD-0003)

**PRD**: [0003-prd-sso-admin-dashboard.md](prds/0003-prd-sso-admin-dashboard.md)
**Target Version**: v1.1.0
**Timeline**: 4 weeks
**Status**: Ready for Development

---

## 📋 Parent Tasks Overview

### Phase 1: Backend API (Week 1) - 5 days
- [ ] 1.0 Setup & Planning
- [ ] 1.1 Admin Authentication Middleware
- [ ] 1.2 Apps CRUD API Endpoints
- [ ] 1.3 API Key/Secret Management
- [ ] 1.4 Analytics Data Collection
- [ ] 1.5 API Testing & Documentation

### Phase 2: Frontend Core (Week 2) - 5 days
- [ ] 2.0 Next.js Admin App Setup
- [ ] 2.1 Authentication & Layout
- [ ] 2.2 Apps List Page
- [ ] 2.3 Create App Form
- [ ] 2.4 App Detail/Edit Page
- [ ] 2.5 Integration with Backend

### Phase 3: Analytics (Week 3) - 5 days
- [ ] 3.0 Database Schema for Analytics
- [ ] 3.1 Analytics API Endpoints
- [ ] 3.2 Dashboard Overview Page
- [ ] 3.3 App Analytics Page
- [ ] 3.4 Charts & Visualizations

### Phase 4: Polish & Deploy (Week 4) - 5 days
- [ ] 4.0 UI/UX Refinements
- [ ] 4.1 Error Handling & Loading States
- [ ] 4.2 Testing (E2E)
- [ ] 4.3 Documentation
- [ ] 4.4 Production Deployment

---

## 🔨 Detailed Sub-Tasks

---

## Phase 1: Backend API

### Task 1.0: Setup & Planning
**Estimate**: 2 hours
**Owner**: Backend Developer

#### Sub-tasks:
- [ ] 1.0.1 Review PRD-0003 thoroughly
- [ ] 1.0.2 Create feature branch `feature/admin-dashboard-backend`
- [ ] 1.0.3 Update `server/package.json` dependencies if needed
- [ ] 1.0.4 Create API design document (endpoints, request/response schemas)
- [ ] 1.0.5 Set up testing framework (Jest + Supertest)

**Acceptance Criteria**:
- ✅ Feature branch created and pushed
- ✅ API design document completed
- ✅ Testing framework configured

**Files to Create/Modify**:
- `server/docs/API_ADMIN.md` (new)
- `server/package.json` (update)
- `server/jest.config.js` (new)

---

### Task 1.1: Admin Authentication Middleware
**Estimate**: 4 hours
**Owner**: Backend Developer
**Dependencies**: 1.0

#### Sub-tasks:
- [ ] 1.1.1 Create `server/src/middleware/authenticateAdmin.js`
- [ ] 1.1.2 Implement JWT token validation (extract from Authorization header)
- [ ] 1.1.3 Verify user exists in Supabase
- [ ] 1.1.4 Check user role is 'admin' in profiles table
- [ ] 1.1.5 Attach user object to `req.user`
- [ ] 1.1.6 Handle errors (401 for invalid token, 403 for non-admin)
- [ ] 1.1.7 Write unit tests (valid token, expired token, non-admin, no token)

**Acceptance Criteria**:
- ✅ Middleware validates JWT correctly
- ✅ Only admin users can pass through
- ✅ Proper error responses (401/403)
- ✅ Unit test coverage >90%

**Implementation**:
```javascript
// server/src/middleware/authenticateAdmin.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // Verify JWT with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = authenticateAdmin;
```

**Test File**: `server/src/middleware/__tests__/authenticateAdmin.test.js`

---

### Task 1.2: Apps CRUD API Endpoints
**Estimate**: 8 hours
**Owner**: Backend Developer
**Dependencies**: 1.1

#### Sub-tasks:
- [ ] 1.2.1 Create `server/src/routes/admin.js`
- [ ] 1.2.2 Implement `GET /api/v1/admin/apps` (list with pagination, search, filter)
- [ ] 1.2.3 Implement `POST /api/v1/admin/apps` (create new app)
- [ ] 1.2.4 Implement `GET /api/v1/admin/apps/:id` (get app details)
- [ ] 1.2.5 Implement `PUT /api/v1/admin/apps/:id` (update app)
- [ ] 1.2.6 Implement `DELETE /api/v1/admin/apps/:id` (deactivate/delete app)
- [ ] 1.2.7 Add input validation (express-validator)
- [ ] 1.2.8 Mount routes in `server/src/index.js`
- [ ] 1.2.9 Write integration tests for all endpoints

**Acceptance Criteria**:
- ✅ All CRUD operations work correctly
- ✅ Pagination works (default 20 items/page)
- ✅ Search by name works (case-insensitive)
- ✅ Filter by status (active/inactive) works
- ✅ Input validation prevents invalid data
- ✅ Integration tests cover all endpoints
- ✅ API returns consistent JSON format

**API Specification**:

```javascript
// GET /api/v1/admin/apps?search=ojt&status=active&page=1&limit=20
// Response:
{
  "apps": [
    {
      "id": "uuid",
      "name": "OJT Platform",
      "description": "...",
      "api_key": "uuid",
      "auth_method": "token_exchange",
      "is_active": true,
      "created_at": "2025-01-12T...",
      "owner": {
        "email": "admin@example.com",
        "display_name": "Admin User"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}

// POST /api/v1/admin/apps
// Request:
{
  "name": "New App",
  "description": "Description",
  "redirect_urls": ["http://localhost:3000/callback"],
  "allowed_origins": ["http://localhost:3000"],
  "auth_method": "token_exchange",
  "owner_email": "dev@example.com"
}
// Response:
{
  "message": "App registered successfully",
  "app": {
    "id": "uuid",
    "name": "New App",
    "api_key": "generated-uuid",
    "api_secret": "generated-64-char-hex", // Only shown once!
    ...
  }
}

// PUT /api/v1/admin/apps/:id
// Request: (partial update allowed)
{
  "name": "Updated Name",
  "is_active": false
}

// DELETE /api/v1/admin/apps/:id?permanent=false
// Response:
{
  "message": "App deactivated" // or "App permanently deleted"
}
```

**Test File**: `server/src/routes/__tests__/admin.test.js`

---

### Task 1.3: API Key/Secret Management
**Estimate**: 4 hours
**Owner**: Backend Developer
**Dependencies**: 1.2

#### Sub-tasks:
- [ ] 1.3.1 Implement `POST /api/v1/admin/apps/:id/regenerate-secret`
- [ ] 1.3.2 Generate new secret (crypto.randomBytes(32).toString('hex'))
- [ ] 1.3.3 Update database with new secret
- [ ] 1.3.4 Return new secret (shown once)
- [ ] 1.3.5 Add confirmation requirement (future: require typing app name)
- [ ] 1.3.6 (Optional) Send email notification to app owner
- [ ] 1.3.7 Write tests for regenerate endpoint

**Acceptance Criteria**:
- ✅ Regenerate endpoint works correctly
- ✅ Old secret is invalidated immediately
- ✅ New secret is cryptographically secure (64 chars hex)
- ✅ Response includes new secret
- ✅ Tests verify old secret no longer works

**Implementation**:
```javascript
// POST /api/v1/admin/apps/:id/regenerate-secret
router.post('/apps/:id/regenerate-secret', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  const new_secret = crypto.randomBytes(32).toString('hex');

  const { data: app, error } = await supabaseAdmin
    .from('apps')
    .update({
      api_secret: new_secret,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // TODO: Send notification to app owner

  res.json({
    message: 'API secret regenerated successfully',
    api_secret: new_secret, // Only shown once!
    warning: 'Update your application configuration immediately'
  });
});
```

---

### Task 1.4: Analytics Data Collection
**Estimate**: 6 hours
**Owner**: Backend Developer
**Dependencies**: 1.0

#### Sub-tasks:
- [ ] 1.4.1 Design `app_analytics` table schema
- [ ] 1.4.2 Create migration `supabase/migrations/20250113000001_app_analytics.sql`
- [ ] 1.4.3 Add analytics recording to auth endpoints (login, token exchange, etc.)
- [ ] 1.4.4 Create helper function `recordAnalyticsEvent(app_id, event_type, user_id, metadata)`
- [ ] 1.4.5 Update existing auth routes to call helper
- [ ] 1.4.6 Create database view `app_usage_stats` (if not exists)
- [ ] 1.4.7 Write tests for analytics recording

**Database Schema**:
```sql
-- supabase/migrations/20250113000001_app_analytics.sql
CREATE TABLE IF NOT EXISTS app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'token_exchange', 'token_refresh', 'token_revoke', 'error'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_analytics_app_time ON app_analytics(app_id, created_at DESC);
CREATE INDEX idx_app_analytics_event_type ON app_analytics(event_type);
CREATE INDEX idx_app_analytics_user ON app_analytics(user_id) WHERE user_id IS NOT NULL;

-- View for aggregated stats (extends existing view if present)
CREATE OR REPLACE VIEW app_usage_stats AS
SELECT
  a.id as app_id,
  a.name as app_name,
  COUNT(DISTINCT an.user_id) FILTER (WHERE an.created_at > NOW() - INTERVAL '30 days') as active_users_30d,
  COUNT(*) FILTER (WHERE an.event_type = 'login' AND an.created_at > NOW() - INTERVAL '30 days') as logins_30d,
  COUNT(*) FILTER (WHERE an.event_type = 'token_exchange' AND an.created_at > NOW() - INTERVAL '30 days') as token_requests_30d,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE an.event_type = 'error' AND an.created_at > NOW() - INTERVAL '30 days') /
    NULLIF(COUNT(*) FILTER (WHERE an.created_at > NOW() - INTERVAL '30 days'), 0),
    2
  ) as error_rate_30d
FROM apps a
LEFT JOIN app_analytics an ON a.id = an.app_id
GROUP BY a.id, a.name;
```

**Helper Function**:
```javascript
// server/src/utils/analytics.js
async function recordAnalyticsEvent(app_id, event_type, user_id = null, metadata = {}) {
  try {
    await supabaseAdmin.from('app_analytics').insert({
      app_id,
      event_type,
      user_id,
      metadata,
    });
  } catch (error) {
    console.error('Failed to record analytics:', error);
    // Don't throw - analytics failure shouldn't break auth flow
  }
}
```

**Acceptance Criteria**:
- ✅ Analytics table created with proper indexes
- ✅ Events recorded for all auth operations
- ✅ View provides aggregated stats
- ✅ Analytics failures don't break main flow

---

### Task 1.5: API Testing & Documentation
**Estimate**: 4 hours
**Owner**: Backend Developer
**Dependencies**: 1.2, 1.3, 1.4

#### Sub-tasks:
- [ ] 1.5.1 Create Postman collection for all admin endpoints
- [ ] 1.5.2 Add example requests/responses
- [ ] 1.5.3 Export collection to `server/docs/postman/Admin_API.json`
- [ ] 1.5.4 Write API documentation in `server/docs/API_ADMIN.md`
- [ ] 1.5.5 Document authentication flow
- [ ] 1.5.6 Document error codes and responses
- [ ] 1.5.7 Run full integration test suite
- [ ] 1.5.8 Verify test coverage >80%

**Acceptance Criteria**:
- ✅ Postman collection includes all endpoints
- ✅ API documentation is complete and accurate
- ✅ All tests pass
- ✅ Coverage report shows >80%

**Deliverables**:
- `server/docs/API_ADMIN.md`
- `server/docs/postman/Admin_API.json`
- Coverage report

---

## Phase 2: Frontend Core

### Task 2.0: Next.js Admin App Setup
**Estimate**: 4 hours
**Owner**: Frontend Developer

#### Sub-tasks:
- [ ] 2.0.1 Create feature branch `feature/admin-dashboard-frontend`
- [ ] 2.0.2 Create Next.js app in `admin/` directory (or `server/admin/`)
- [ ] 2.0.3 Install dependencies:
  ```bash
  npx create-next-app@14 admin --typescript --tailwind --app
  cd admin
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  npm install @radix-ui/react-* (dialog, dropdown, select, etc.)
  npm install @tanstack/react-query @tanstack/react-table
  npm install react-hook-form zod @hookform/resolvers
  npm install recharts
  npm install lucide-react
  npm install sonner (toast notifications)
  ```
- [ ] 2.0.4 Set up Shadcn UI: `npx shadcn-ui@latest init`
- [ ] 2.0.5 Install Shadcn components:
  ```bash
  npx shadcn-ui@latest add button input textarea select label
  npx shadcn-ui@latest add card table dialog alert-dialog
  npx shadcn-ui@latest add badge tabs toast
  ```
- [ ] 2.0.6 Configure environment variables (`.env.local`)
- [ ] 2.0.7 Set up Tanstack Query provider
- [ ] 2.0.8 Create base layout structure

**Environment Variables**:
```bash
# admin/.env.local
NEXT_PUBLIC_SSO_API_URL=https://sso-system-ruby.vercel.app/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Acceptance Criteria**:
- ✅ Next.js app runs on `npm run dev`
- ✅ Tailwind CSS working
- ✅ Shadcn UI components available
- ✅ Tanstack Query configured

**Files Created**:
- `admin/package.json`
- `admin/app/layout.tsx`
- `admin/app/providers.tsx`
- `admin/lib/api-client.ts`

---

### Task 2.1: Authentication & Layout
**Estimate**: 6 hours
**Owner**: Frontend Developer
**Dependencies**: 2.0

#### Sub-tasks:
- [ ] 2.1.1 Create login page `admin/app/login/page.tsx`
- [ ] 2.1.2 Implement Supabase auth (email/password)
- [ ] 2.1.3 Create middleware `admin/middleware.ts` for route protection
- [ ] 2.1.4 Create admin layout `admin/app/(admin)/layout.tsx` with sidebar
- [ ] 2.1.5 Implement sidebar navigation component
- [ ] 2.1.6 Add logout functionality
- [ ] 2.1.7 Create API client utility with auto token injection
- [ ] 2.1.8 Handle session persistence (cookies)

**Login Page**:
```tsx
// admin/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      toast({
        title: 'Access Denied',
        description: 'Admin access required',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    router.push('/admin/apps');
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">SSO Admin Dashboard</h1>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
}
```

**Middleware**:
```typescript
// admin/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect to apps if already authenticated and on login page
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/admin/apps', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Acceptance Criteria**:
- ✅ Login page works
- ✅ Only admin users can access admin routes
- ✅ Non-admin users see error message
- ✅ Session persists across page refreshes
- ✅ Logout works correctly

---

### Task 2.2: Apps List Page
**Estimate**: 8 hours
**Owner**: Frontend Developer
**Dependencies**: 2.1

#### Sub-tasks:
- [ ] 2.2.1 Create apps list page `admin/app/(admin)/apps/page.tsx`
- [ ] 2.2.2 Set up Tanstack Table for data display
- [ ] 2.2.3 Implement search functionality (debounced)
- [ ] 2.2.4 Implement filter by status (dropdown)
- [ ] 2.2.5 Implement pagination
- [ ] 2.2.6 Add "New App" button
- [ ] 2.2.7 Add action buttons (Edit, Analytics, Delete)
- [ ] 2.2.8 Implement delete confirmation dialog
- [ ] 2.2.9 Add loading skeleton
- [ ] 2.2.10 Add empty state
- [ ] 2.2.11 Handle errors with toast notifications

**Implementation** (key parts):
```tsx
// admin/app/(admin)/apps/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { apiClient } from '@/lib/api-client';

export default function AppsListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['apps', debouncedSearch, status, page],
    queryFn: () => apiClient.getApps({ search: debouncedSearch, status, page }),
  });

  const deleteMutation = useMutation({
    mutationFn: (appId: string) => apiClient.deleteApp(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      toast({ title: 'App deleted successfully' });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Applications</h1>
        <Button onClick={() => router.push('/admin/apps/new')}>
          + New App
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search apps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {/* Filter dropdown */}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell>{app.owner.email}</TableCell>
                <TableCell>
                  <Badge variant={app.is_active ? 'default' : 'secondary'}>
                    {app.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(app.created_at)}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => router.push(`/admin/apps/${app.id}`)}>
                    Edit
                  </Button>
                  {/* More actions */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ Table displays apps correctly
- ✅ Search works (debounced 300ms)
- ✅ Filter by status works
- ✅ Pagination works
- ✅ Loading skeleton shows during fetch
- ✅ Empty state shows when no apps
- ✅ Error handling works

---

### Task 2.3: Create App Form
**Estimate**: 8 hours
**Owner**: Frontend Developer
**Dependencies**: 2.1

#### Sub-tasks:
- [ ] 2.3.1 Create form page `admin/app/(admin)/apps/new/page.tsx`
- [ ] 2.3.2 Set up React Hook Form with Zod validation
- [ ] 2.3.3 Create form fields (name, description, redirect_urls, etc.)
- [ ] 2.3.4 Implement client-side validation
- [ ] 2.3.5 Handle form submission
- [ ] 2.3.6 Display success modal with API credentials
- [ ] 2.3.7 Implement copy to clipboard for credentials
- [ ] 2.3.8 Add warning about API secret shown once
- [ ] 2.3.9 Handle server-side validation errors
- [ ] 2.3.10 Redirect to app detail after success

**Validation Schema**:
```typescript
// admin/lib/schemas/app.ts
import { z } from 'zod';

export const createAppSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  redirect_urls: z
    .string()
    .transform((val) => val.split('\n').filter((url) => url.trim()))
    .pipe(z.array(z.string().url('Invalid URL')).min(1, 'At least one redirect URL required')),
  allowed_origins: z
    .string()
    .transform((val) => val.split('\n').filter((url) => url.trim()))
    .pipe(z.array(z.string().url('Invalid URL')).optional()),
  auth_method: z.enum(['token_exchange', 'shared_cookie', 'hybrid']),
  owner_email: z.string().email('Invalid email'),
});

export type CreateAppInput = z.infer<typeof createAppSchema>;
```

**Form Component** (simplified):
```tsx
// admin/app/(admin)/apps/new/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createAppSchema, type CreateAppInput } from '@/lib/schemas/app';
import { apiClient } from '@/lib/api-client';
import { SuccessModal } from '@/components/success-modal';

export default function CreateAppPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ api_key: string; api_secret: string } | null>(null);

  const form = useForm<CreateAppInput>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      auth_method: 'token_exchange',
    },
  });

  const createMutation = useMutation({
    mutationFn: apiClient.createApp,
    onSuccess: (data) => {
      setCredentials({ api_key: data.app.api_key, api_secret: data.app.api_secret });
      setShowSuccess(true);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: CreateAppInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New Application</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields */}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create App'}
        </Button>
      </form>

      {showSuccess && credentials && (
        <SuccessModal credentials={credentials} onClose={() => router.push('/admin/apps')} />
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ Form validation works (client-side)
- ✅ Submit creates app successfully
- ✅ Success modal shows credentials
- ✅ Copy buttons work
- ✅ Server errors displayed properly
- ✅ Redirect works after modal closed

---

### Task 2.4: App Detail/Edit Page
**Estimate**: 10 hours
**Owner**: Frontend Developer
**Dependencies**: 2.3

#### Sub-tasks:
- [ ] 2.4.1 Create detail page `admin/app/(admin)/apps/[id]/page.tsx`
- [ ] 2.4.2 Fetch app data
- [ ] 2.4.3 Display basic info section
- [ ] 2.4.4 Display credentials section (API Key visible, Secret masked)
- [ ] 2.4.5 Implement "Show Secret" toggle
- [ ] 2.4.6 Implement "Regenerate Secret" with confirmation
- [ ] 2.4.7 Display URLs section (editable)
- [ ] 2.4.8 Implement status toggle (Active/Inactive)
- [ ] 2.4.9 Display usage stats cards
- [ ] 2.4.10 Implement edit mode (inline editing)
- [ ] 2.4.11 Handle save changes
- [ ] 2.4.12 Add "View Analytics" button

**Key Components**:
```tsx
// admin/app/(admin)/apps/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { apiClient } from '@/lib/api-client';

export default function AppDetailPage({ params }: { params: { id: string } }) {
  const [showSecret, setShowSecret] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: app, isLoading } = useQuery({
    queryKey: ['app', params.id],
    queryFn: () => apiClient.getApp(params.id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<App>) => apiClient.updateApp(params.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app', params.id] });
      toast({ title: 'App updated successfully' });
      setIsEditing(false);
    },
  });

  const regenerateSecretMutation = useMutation({
    mutationFn: () => apiClient.regenerateSecret(params.id),
    onSuccess: (data) => {
      // Show new secret in modal
      toast({ title: 'Secret regenerated', description: 'New secret: ' + data.api_secret });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{app.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/apps/${app.id}/analytics`)}>
            View Analytics
          </Button>
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">App ID</label>
            <div className="flex items-center gap-2">
              <code className="text-sm">{app.id}</code>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(app.id)}>
                Copy
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <div className="flex items-center gap-2">
              <Switch
                checked={app.is_active}
                onCheckedChange={(checked) => updateMutation.mutate({ is_active: checked })}
              />
              <span>{app.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          {/* More fields... */}
        </CardContent>
      </Card>

      {/* Credentials Card */}
      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">API Key</label>
            <div className="flex items-center gap-2">
              <code className="text-sm">{app.api_key}</code>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(app.api_key)}>
                Copy
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">API Secret</label>
            <div className="flex items-center gap-2">
              <code className="text-sm">
                {showSecret ? app.api_secret : '••••••••••••••••••••'}
              </code>
              <Button size="sm" variant="ghost" onClick={() => setShowSecret(!showSecret)}>
                {showSecret ? 'Hide' : 'Show'}
              </Button>
              {showSecret && (
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(app.api_secret)}>
                  Copy
                </Button>
              )}
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="mt-2"
              onClick={() => setShowRegenerateDialog(true)}
            >
              Regenerate Secret
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Stats (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Logins</p>
              <p className="text-2xl font-bold">{app.stats?.total_logins || 0}</p>
            </div>
            {/* More stats... */}
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Secret Confirmation Dialog */}
      {/* ... */}
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ App details display correctly
- ✅ Credentials section works (show/hide secret)
- ✅ Status toggle updates immediately
- ✅ Edit mode works
- ✅ Regenerate secret requires confirmation
- ✅ Copy buttons work
- ✅ Usage stats display correctly

---

### Task 2.5: Integration with Backend
**Estimate**: 4 hours
**Owner**: Frontend Developer
**Dependencies**: 2.2, 2.3, 2.4

#### Sub-tasks:
- [ ] 2.5.1 Create API client utilities in `admin/lib/api-client.ts`
- [ ] 2.5.2 Implement all API methods (getApps, createApp, updateApp, etc.)
- [ ] 2.5.3 Add JWT token injection to requests
- [ ] 2.5.4 Handle token refresh
- [ ] 2.5.5 Implement error handling (401, 403, 500)
- [ ] 2.5.6 Add request/response logging (development)
- [ ] 2.5.7 Test all API integrations end-to-end

**API Client**:
```typescript
// admin/lib/api-client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

class APIClient {
  private baseURL = process.env.NEXT_PUBLIC_SSO_API_URL!;
  private supabase = createClientComponentClient();

  private async getAuthToken(): Promise<string> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    return session.access_token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async getApps(params: { search?: string; status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.set('search', params.search);
    if (params.status && params.status !== 'all') queryParams.set('status', params.status);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());

    return this.request<{ apps: App[]; pagination: Pagination }>(
      `/admin/apps?${queryParams.toString()}`
    );
  }

  async getApp(id: string) {
    return this.request<App>(`/admin/apps/${id}`);
  }

  async createApp(data: CreateAppInput) {
    return this.request<{ message: string; app: App }>('/admin/apps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApp(id: string, data: Partial<App>) {
    return this.request<{ message: string; app: App }>(`/admin/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApp(id: string, permanent = false) {
    return this.request<{ message: string }>(`/admin/apps/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  }

  async regenerateSecret(id: string) {
    return this.request<{ message: string; api_secret: string }>(
      `/admin/apps/${id}/regenerate-secret`,
      { method: 'POST' }
    );
  }

  async getAnalytics(id: string, period: '7d' | '30d' | '90d' = '30d') {
    return this.request<AnalyticsData>(`/admin/apps/${id}/analytics?period=${period}`);
  }
}

export const apiClient = new APIClient();
```

**Acceptance Criteria**:
- ✅ All API methods work correctly
- ✅ JWT token automatically included
- ✅ 401 errors trigger re-authentication
- ✅ 403 errors show access denied message
- ✅ Network errors handled gracefully

---

## Phase 3: Analytics

### Task 3.0: Database Schema for Analytics
**Estimate**: 2 hours
**Owner**: Backend Developer
**Dependencies**: Task 1.4 (already partially done)

#### Sub-tasks:
- [ ] 3.0.1 Review/verify `app_analytics` table from Task 1.4
- [ ] 3.0.2 Create additional aggregation views if needed
- [ ] 3.0.3 Create stored function for login trend data
- [ ] 3.0.4 Optimize indexes for analytics queries
- [ ] 3.0.5 Test query performance with sample data

**Stored Function for Login Trend**:
```sql
-- Function to get daily login counts
CREATE OR REPLACE FUNCTION get_login_trend(p_app_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
  date DATE,
  login_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    COUNT(*) as login_count
  FROM app_analytics
  WHERE app_id = p_app_id
    AND event_type = 'login'
    AND created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql;
```

**Acceptance Criteria**:
- ✅ Analytics schema supports all required queries
- ✅ Queries execute in <500ms with 1000+ records
- ✅ Indexes optimize common query patterns

---

### Task 3.1: Analytics API Endpoints
**Estimate**: 6 hours
**Owner**: Backend Developer
**Dependencies**: 3.0

#### Sub-tasks:
- [ ] 3.1.1 Implement `GET /api/v1/admin/apps/:id/analytics?period=30d`
- [ ] 3.1.2 Return key metrics (logins, active users, token requests, error rate)
- [ ] 3.1.3 Return login trend data (daily counts)
- [ ] 3.1.4 Return top users list
- [ ] 3.1.5 Return recent errors
- [ ] 3.1.6 Implement global dashboard endpoint `GET /api/v1/admin/dashboard`
- [ ] 3.1.7 Add caching (5 min TTL) for expensive queries
- [ ] 3.1.8 Write tests for analytics endpoints

**API Response Example**:
```json
{
  "period": "30d",
  "metrics": {
    "total_logins": 1234,
    "active_users": 456,
    "token_requests": 2345,
    "error_rate": 0.2
  },
  "login_trend": [
    { "date": "2025-01-01", "count": 45 },
    { "date": "2025-01-02", "count": 52 },
    ...
  ],
  "top_users": [
    { "user_id": "uuid", "email": "user@example.com", "login_count": 45 },
    ...
  ],
  "recent_errors": [
    { "timestamp": "2025-01-12T10:30:00Z", "error_type": "token_invalid", "user_id": "uuid" },
    ...
  ]
}
```

**Acceptance Criteria**:
- ✅ Analytics endpoint returns correct data
- ✅ Period filter works (7d, 30d, 90d)
- ✅ Response time <2s
- ✅ Caching reduces database load

---

### Task 3.2: Dashboard Overview Page
**Estimate**: 6 hours
**Owner**: Frontend Developer
**Dependencies**: 3.1

#### Sub-tasks:
- [ ] 3.2.1 Create dashboard page `admin/app/(admin)/page.tsx`
- [ ] 3.2.2 Fetch global dashboard data
- [ ] 3.2.3 Display summary metrics cards (Total Apps, Users, Logins Today)
- [ ] 3.2.4 Create "Top Apps" bar chart component
- [ ] 3.2.5 Create "Recent Activity" feed component
- [ ] 3.2.6 Implement auto-refresh (60s interval)
- [ ] 3.2.7 Add loading skeletons
- [ ] 3.2.8 Style with responsive layout

**Summary Cards**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Card>
    <CardHeader>
      <CardTitle>Total Apps</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{data.total_apps}</p>
      <p className="text-sm text-muted-foreground">
        {data.active_apps} active
      </p>
    </CardContent>
  </Card>
  {/* More cards... */}
</div>
```

**Acceptance Criteria**:
- ✅ Dashboard displays correctly
- ✅ Metrics update in real-time
- ✅ Charts are responsive
- ✅ Auto-refresh works

---

### Task 3.3: App Analytics Page
**Estimate**: 8 hours
**Owner**: Frontend Developer
**Dependencies**: 3.1

#### Sub-tasks:
- [ ] 3.3.1 Create analytics page `admin/app/(admin)/apps/[id]/analytics/page.tsx`
- [ ] 3.3.2 Implement time range selector (7d/30d/90d tabs)
- [ ] 3.3.3 Fetch analytics data based on selected period
- [ ] 3.3.4 Display key metrics cards
- [ ] 3.3.5 Create login trend line chart
- [ ] 3.3.6 Create top users table
- [ ] 3.3.7 Create error log table
- [ ] 3.3.8 Add export functionality (CSV)
- [ ] 3.3.9 Implement data refresh button
- [ ] 3.3.10 Handle empty states (no data)

**Login Trend Chart**:
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data.login_trend}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

**Acceptance Criteria**:
- ✅ Analytics page displays correctly
- ✅ Time range selector updates data
- ✅ Charts render properly
- ✅ Tables display data correctly
- ✅ Export to CSV works

---

### Task 3.4: Charts & Visualizations
**Estimate**: 4 hours
**Owner**: Frontend Developer
**Dependencies**: 3.3

#### Sub-tasks:
- [ ] 3.4.1 Install and configure Recharts
- [ ] 3.4.2 Create reusable chart components
- [ ] 3.4.3 Implement line chart for login trend
- [ ] 3.4.4 Implement bar chart for top apps
- [ ] 3.4.5 Add hover tooltips
- [ ] 3.4.6 Add responsive behavior (mobile)
- [ ] 3.4.7 Style charts to match design system
- [ ] 3.4.8 Add loading states for charts

**Acceptance Criteria**:
- ✅ All charts render correctly
- ✅ Charts are interactive (hover, tooltips)
- ✅ Charts are responsive
- ✅ Charts match design system colors

---

## Phase 4: Polish & Deploy

### Task 4.0: UI/UX Refinements
**Estimate**: 6 hours
**Owner**: Frontend Developer
**Dependencies**: All Phase 2 & 3 tasks

#### Sub-tasks:
- [ ] 4.0.1 Review all pages for consistency
- [ ] 4.0.2 Fix spacing/alignment issues
- [ ] 4.0.3 Improve button states (hover, active, disabled)
- [ ] 4.0.4 Add transitions and animations
- [ ] 4.0.5 Improve form UX (focus states, error display)
- [ ] 4.0.6 Test mobile responsiveness on all pages
- [ ] 4.0.7 Add keyboard navigation support
- [ ] 4.0.8 Run Lighthouse audit and fix issues

**Acceptance Criteria**:
- ✅ UI is consistent across all pages
- ✅ Mobile layout works on 375px width
- ✅ Lighthouse score >90 (Performance, Accessibility)
- ✅ Keyboard navigation works

---

### Task 4.1: Error Handling & Loading States
**Estimate**: 4 hours
**Owner**: Frontend Developer
**Dependencies**: 4.0

#### Sub-tasks:
- [ ] 4.1.1 Add loading skeletons to all pages
- [ ] 4.1.2 Implement error boundaries
- [ ] 4.1.3 Add retry logic for failed requests
- [ ] 4.1.4 Improve error messages (user-friendly)
- [ ] 4.1.5 Add offline detection
- [ ] 4.1.6 Test error scenarios (network failure, 500 errors, etc.)
- [ ] 4.1.7 Add toast notifications for all actions

**Acceptance Criteria**:
- ✅ Loading states display correctly
- ✅ Errors don't crash the app
- ✅ Error messages are clear and actionable
- ✅ Users can recover from errors

---

### Task 4.2: Testing (E2E)
**Estimate**: 8 hours
**Owner**: QA / Full-stack Developer
**Dependencies**: 4.1

#### Sub-tasks:
- [ ] 4.2.1 Set up Playwright for E2E testing
- [ ] 4.2.2 Write test: Admin login
- [ ] 4.2.3 Write test: Create app (happy path)
- [ ] 4.2.4 Write test: Edit app
- [ ] 4.2.5 Write test: Regenerate secret
- [ ] 4.2.6 Write test: Deactivate app
- [ ] 4.2.7 Write test: Search and filter
- [ ] 4.2.8 Write test: View analytics
- [ ] 4.2.9 Run all tests in CI/CD
- [ ] 4.2.10 Fix any failing tests

**Test Example**:
```typescript
// admin/e2e/create-app.spec.ts
import { test, expect } from '@playwright/test';

test('admin can create a new app', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to create app
  await page.waitForURL('/admin/apps');
  await page.click('text=New App');

  // Fill form
  await page.fill('input[name="name"]', 'Test App');
  await page.fill('textarea[name="redirect_urls"]', 'http://localhost:3000/callback');
  await page.fill('input[name="owner_email"]', 'admin@example.com');
  await page.click('button[type="submit"]');

  // Verify success modal
  await expect(page.locator('text=App created successfully')).toBeVisible();
  await expect(page.locator('code')).toContainText('api_key');
});
```

**Acceptance Criteria**:
- ✅ All critical paths have E2E tests
- ✅ Tests run in CI/CD pipeline
- ✅ Tests pass consistently

---

### Task 4.3: Documentation
**Estimate**: 6 hours
**Owner**: Technical Writer / Developer
**Dependencies**: All tasks

#### Sub-tasks:
- [ ] 4.3.1 Write Admin User Guide (`docs/ADMIN_DASHBOARD_GUIDE.md`)
- [ ] 4.3.2 Add screenshots to guide
- [ ] 4.3.3 Document all features (CRUD, analytics, etc.)
- [ ] 4.3.4 Create troubleshooting section
- [ ] 4.3.5 Update main README with dashboard info
- [ ] 4.3.6 Update CHANGELOG for v1.1.0
- [ ] 4.3.7 Create video walkthrough (optional, 5 min)

**Guide Structure**:
```markdown
# SSO Admin Dashboard User Guide

## Getting Started
- Login
- Dashboard overview

## Managing Applications
- Creating a new app
- Editing app details
- Regenerating credentials
- Deactivating/Deleting apps

## Analytics
- Viewing app usage
- Understanding metrics
- Exporting data

## Troubleshooting
- Common errors
- FAQ
```

**Acceptance Criteria**:
- ✅ Admin guide is complete and accurate
- ✅ Screenshots are up to date
- ✅ README and CHANGELOG updated

---

### Task 4.4: Production Deployment
**Estimate**: 4 hours
**Owner**: DevOps / Backend Developer
**Dependencies**: 4.2, 4.3

#### Sub-tasks:
- [ ] 4.4.1 Review deployment checklist
- [ ] 4.4.2 Run database migrations on production
- [ ] 4.4.3 Deploy backend API to production (Vercel)
- [ ] 4.4.4 Deploy frontend admin app to production (Vercel)
- [ ] 4.4.5 Configure environment variables
- [ ] 4.4.6 Set up custom domain (optional: admin.sso-system.vercel.app)
- [ ] 4.4.7 Verify all features work in production
- [ ] 4.4.8 Monitor for errors (first 24 hours)
- [ ] 4.4.9 Create rollback plan
- [ ] 4.4.10 Announce launch to team

**Deployment Checklist**:
```
Backend:
- [ ] API endpoints tested
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Health check passes

Frontend:
- [ ] Build succeeds
- [ ] Environment variables set
- [ ] Authentication works
- [ ] All pages load correctly

Monitoring:
- [ ] Logs configured
- [ ] Alerts set up
- [ ] Performance monitoring
```

**Acceptance Criteria**:
- ✅ Both backend and frontend deployed successfully
- ✅ All features work in production
- ✅ No critical errors in first 24 hours
- ✅ Rollback plan documented and tested

---

## 📊 Progress Tracking

### Overall Progress: 0/56 tasks completed (0%)

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Phase 1: Backend API | 14 | 0 | 0% |
| Phase 2: Frontend Core | 18 | 0 | 0% |
| Phase 3: Analytics | 12 | 0 | 0% |
| Phase 4: Polish & Deploy | 12 | 0 | 0% |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (Supabase)
- Git
- Vercel CLI (optional)

### Setup
```bash
# 1. Create feature branch
git checkout -b feature/admin-dashboard-backend

# 2. Install dependencies (backend)
cd server
npm install

# 3. Run database migrations
npx supabase migration up

# 4. Start development server
npm run dev

# 5. Run tests
npm test
```

### Development Workflow
1. Pick a task from Phase 1
2. Create feature branch if needed
3. Implement task
4. Write tests
5. Mark task as complete `[x]`
6. Commit with message: `feat: [Task ID] Description [PRD-0003]`
7. Push and create PR when phase complete

---

## 📝 Notes

- **Parallel Development**: Phase 1 and Phase 2 can be developed in parallel by different developers
- **Testing**: Write tests alongside implementation (TDD recommended)
- **Code Review**: Each phase should be reviewed before moving to next phase
- **Documentation**: Update docs as features are completed

---

## 🔗 References

- **PRD**: [0003-prd-sso-admin-dashboard.md](prds/0003-prd-sso-admin-dashboard.md)
- **API Docs**: `server/docs/API_ADMIN.md` (to be created)
- **Tech Stack**: Next.js 14, Express.js, Supabase, Shadcn UI, Recharts

---

**Created**: 2025-01-12
**Last Updated**: 2025-01-12
**Estimated Total Time**: 160 hours (4 weeks × 40 hours/week)
