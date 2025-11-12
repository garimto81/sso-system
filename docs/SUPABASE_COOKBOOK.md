# Supabase Cookbook

**버전**: 1.0.0
**대상**: SSO System 개발자
**업데이트**: 2025-01-12

---

## 📋 목차

1. [RLS Policies](#rls-policies)
2. [Triggers & Functions](#triggers--functions)
3. [Indexes & Performance](#indexes--performance)
4. [Migrations](#migrations)
5. [Best Practices](#best-practices)

---

## RLS Policies

### Pattern 1: Admin-Only Access

**Use Case**: `apps` 테이블은 Admin만 관리

```sql
-- Enable RLS
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "admin_all_apps"
ON apps
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Alternative: Using security definer function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Use in policy
CREATE POLICY "admin_all_apps_v2"
ON apps
FOR ALL
TO authenticated
USING (is_admin());
```

### Pattern 2: Owner-Based Access

**Use Case**: Users can only see their own data

```sql
-- profiles: Users can read all, but only update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can see profiles
CREATE POLICY "profiles_select"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- UPDATE: Only own profile
CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- INSERT: Prevent manual inserts (use trigger instead)
CREATE POLICY "profiles_insert_none"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (false);
```

### Pattern 3: App-Scoped Access

**Use Case**: App analytics visible to app owner OR admins

```sql
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_analytics_select"
ON app_analytics
FOR SELECT
TO authenticated
USING (
  -- Admin can see all
  is_admin()
  OR
  -- App owner can see their app analytics
  EXISTS (
    SELECT 1 FROM apps
    WHERE apps.id = app_analytics.app_id
    AND apps.owner_id = auth.uid()
  )
);
```

### Pattern 4: Time-Based Expiration

**Use Case**: Auth codes expire after 10 minutes

```sql
ALTER TABLE auth_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_codes_select_valid"
ON auth_codes
FOR SELECT
TO authenticated
USING (
  expires_at > NOW()
  AND
  used_at IS NULL
);

-- Cleanup expired codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_auth_codes()
RETURNS void
LANGUAGE SQL
AS $$
  DELETE FROM auth_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
$$;
```

---

## Triggers & Functions

### Pattern 1: Auto-Create Profile on Signup

**Problem**: When user signs up via Supabase Auth, create profile automatically

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    'user', -- Default role
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users INSERT
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
```

### Pattern 2: Auto-Update Timestamp

**Problem**: Keep `updated_at` in sync

```sql
-- Use Supabase's built-in moddatetime extension
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Apply to table
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON apps
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);

-- Apply to all tables
CREATE TRIGGER handle_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER handle_app_analytics_updated_at
BEFORE UPDATE ON app_analytics
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);
```

### Pattern 3: Analytics Event Recording

**Problem**: Record analytics events automatically

```sql
CREATE OR REPLACE FUNCTION record_app_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- On app creation, record event
  IF TG_OP = 'INSERT' THEN
    INSERT INTO app_analytics (app_id, event_type, user_id, metadata)
    VALUES (NEW.id, 'app_created', NEW.owner_id, jsonb_build_object(
      'app_name', NEW.name
    ));
  END IF;

  -- On app update, record event
  IF TG_OP = 'UPDATE' THEN
    IF NEW.is_active <> OLD.is_active THEN
      INSERT INTO app_analytics (app_id, event_type, user_id, metadata)
      VALUES (NEW.id,
        CASE WHEN NEW.is_active THEN 'app_activated' ELSE 'app_deactivated' END,
        auth.uid(),
        jsonb_build_object('previous_state', OLD.is_active)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER app_analytics_trigger
AFTER INSERT OR UPDATE ON apps
FOR EACH ROW
EXECUTE FUNCTION record_app_event();
```

### Pattern 4: Cascading Soft Delete

**Problem**: When app is deactivated, cascade to related records

```sql
CREATE OR REPLACE FUNCTION cascade_app_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    -- Delete pending auth codes
    DELETE FROM auth_codes
    WHERE app_id = NEW.id AND used_at IS NULL;

    -- Optional: Archive analytics
    -- (Keep analytics for historical data)
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER app_deactivation_cascade
AFTER UPDATE ON apps
FOR EACH ROW
WHEN (NEW.is_active IS DISTINCT FROM OLD.is_active)
EXECUTE FUNCTION cascade_app_deactivation();
```

---

## Indexes & Performance

### Essential Indexes

```sql
-- apps table
CREATE INDEX IF NOT EXISTS idx_apps_owner ON apps(owner_id);
CREATE INDEX IF NOT EXISTS idx_apps_active ON apps(is_active);
CREATE INDEX IF NOT EXISTS idx_apps_api_key ON apps(api_key); -- For fast lookups

-- app_analytics table
CREATE INDEX IF NOT EXISTS idx_app_analytics_app_time
ON app_analytics(app_id, created_at DESC); -- For time-series queries

CREATE INDEX IF NOT EXISTS idx_app_analytics_event_type
ON app_analytics(event_type); -- For filtering by event

CREATE INDEX IF NOT EXISTS idx_app_analytics_user
ON app_analytics(user_id); -- For user-specific analytics

-- auth_codes table
CREATE INDEX IF NOT EXISTS idx_auth_codes_code ON auth_codes(code); -- Fast code lookup
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires ON auth_codes(expires_at); -- For cleanup
```

### Composite Indexes

**Use Case**: Filter by app + date range (common in analytics)

```sql
-- Composite index for app analytics queries
CREATE INDEX IF NOT EXISTS idx_app_analytics_composite
ON app_analytics(app_id, created_at DESC, event_type);

-- Query that benefits from this index
SELECT event_type, COUNT(*)
FROM app_analytics
WHERE app_id = 'some-uuid'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type;
```

### Partial Indexes

**Use Case**: Index only active apps

```sql
-- Only index active apps
CREATE INDEX IF NOT EXISTS idx_apps_active_only
ON apps(created_at DESC)
WHERE is_active = true;

-- Query that benefits
SELECT * FROM apps
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 20;
```

### JSONB Indexes

**Use Case**: Search in metadata

```sql
-- GIN index for JSONB search
CREATE INDEX IF NOT EXISTS idx_app_analytics_metadata
ON app_analytics USING GIN (metadata);

-- Query that benefits
SELECT * FROM app_analytics
WHERE metadata @> '{"success": true}';

-- Or search by key
SELECT * FROM app_analytics
WHERE metadata ? 'ip_address';
```

---

## Migrations

### Migration Workflow

```bash
# 1. Create migration
npx supabase migration new add_new_feature

# 2. Write SQL in generated file
vim supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql

# 3. Test locally
npx supabase db reset

# 4. Apply to production
npx supabase db push --db-url YOUR_PROD_DB_URL

# 5. Verify
npx supabase db diff --use-remote
```

### Migration Template

```sql
-- Migration: add_app_logo_column
-- Purpose: Allow apps to upload custom logos
-- Date: 2025-01-12

BEGIN;

-- 1. Add column
ALTER TABLE apps
ADD COLUMN logo_url TEXT;

-- 2. Add check constraint
ALTER TABLE apps
ADD CONSTRAINT apps_logo_url_format
CHECK (logo_url IS NULL OR logo_url ~ '^https?://');

-- 3. Add comment
COMMENT ON COLUMN apps.logo_url IS 'URL to app logo (optional, https only)';

-- 4. Update RLS (if needed)
-- (Existing policies already cover this column)

COMMIT;
```

### Rollback Strategy

```sql
-- Always include rollback instructions in comments
-- ROLLBACK:
-- ALTER TABLE apps DROP COLUMN IF EXISTS logo_url;
```

### Safe Migration Patterns

**Adding Column (Safe)**:
```sql
-- ✅ Safe: Adding nullable column
ALTER TABLE apps ADD COLUMN new_field TEXT;

-- ✅ Safe: Adding with default
ALTER TABLE apps ADD COLUMN status TEXT DEFAULT 'pending';
```

**Renaming Column (Risky)**:
```sql
-- ❌ Risky: Breaking change
-- ALTER TABLE apps RENAME COLUMN old_name TO new_name;

-- ✅ Better: Add new, deprecate old, backfill, then drop
-- Step 1: Add new column
ALTER TABLE apps ADD COLUMN new_name TEXT;

-- Step 2: Backfill data
UPDATE apps SET new_name = old_name WHERE new_name IS NULL;

-- Step 3: Update application code to use new_name

-- Step 4 (later): Drop old column
-- ALTER TABLE apps DROP COLUMN old_name;
```

---

## Best Practices

### 1. Supabase Client Setup

**Use Two Clients**:
```javascript
import { createClient } from '@supabase/supabase-js';

// Anon client (RLS enforced)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

**When to Use Each**:
- `supabase` (Anon): User-facing queries, respects RLS
- `supabaseAdmin`: Admin operations, user creation, bypassing RLS

### 2. Query Optimization

**Use `.select()` Wisely**:
```javascript
// ❌ Bad: Fetch all columns
const { data } = await supabase.from('apps').select('*');

// ✅ Good: Fetch only needed columns
const { data } = await supabase.from('apps').select('id, name, is_active');

// ✅ Great: Use count when you just need count
const { count } = await supabase
  .from('apps')
  .select('*', { count: 'exact', head: true });
```

**Use Pagination**:
```javascript
// ❌ Bad: Fetch all rows
const { data } = await supabase.from('app_analytics').select('*');

// ✅ Good: Paginate
const { data } = await supabase
  .from('app_analytics')
  .select('*')
  .range(0, 19) // First 20 items
  .order('created_at', { ascending: false });
```

### 3. Error Handling

```javascript
const { data, error } = await supabase
  .from('apps')
  .select('*')
  .eq('id', appId)
  .single();

if (error) {
  // Log full error for debugging
  console.error('Supabase error:', error);

  // Return user-friendly message
  if (error.code === 'PGRST116') {
    return res.status(404).json({ error: 'App not found' });
  }

  return res.status(500).json({ error: 'Database error' });
}
```

### 4. Connection Management

**Use Connection Pooling**:
```javascript
// Supabase handles pooling automatically
// But avoid creating multiple clients
// ❌ Bad
function someFunction() {
  const supabase = createClient(...); // New client every time!
}

// ✅ Good
import { supabase } from './utils/supabase.js'; // Singleton
```

### 5. Testing with Supabase

**Reset Database Between Tests**:
```bash
# In package.json
{
  "scripts": {
    "test": "npx supabase db reset && jest"
  }
}
```

**Mock Supabase in Unit Tests**:
```javascript
// __mocks__/@supabase/supabase-js.js
export const createClient = jest.fn(() => ({
  from: jest.fn(() => ({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: {}, error: null })
  }))
}));
```

---

## Troubleshooting

### RLS Debugging

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'apps';

-- Test policy as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM apps; -- Will respect RLS
RESET ROLE;
```

### Performance Analysis

```sql
-- Explain query plan
EXPLAIN ANALYZE
SELECT * FROM app_analytics
WHERE app_id = 'some-uuid'
  AND created_at >= NOW() - INTERVAL '30 days';

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## Quick Reference

### Useful SQL Commands

```sql
-- List all tables
\dt

-- Describe table
\d apps

-- List indexes
\di

-- List functions
\df

-- Current database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table row counts
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

---

**Last Updated**: 2025-01-12
**Next Review**: When adding new Supabase features
