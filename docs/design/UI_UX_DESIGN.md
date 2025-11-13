# SSO Admin Dashboard - Complete UI/UX Design Specification

**Version**: 1.0.0
**Date**: 2025-01-12
**Project**: SSO Central Auth Server - Admin Dashboard
**Screens**: 8 Core Screens
**Pages**: 35

---

## Table of Contents

1. [Executive Summary](#1-executive-summary) (2 pages)
2. [Design System](#2-design-system) (5 pages)
3. [Information Architecture](#3-information-architecture) (3 pages)
4. [Layout & Navigation](#4-layout--navigation) (4 pages)
5. [Screen Wireframes](#5-screen-wireframes) (16 pages - 2 per screen)
6. [Component Mapping](#6-component-mapping) (3 pages)
7. [Interaction Patterns](#7-interaction-patterns) (3 pages)
8. [Accessibility](#8-accessibility) (2 pages)
9. [Responsive Design](#9-responsive-design) (2 pages)

---

## 1. Executive Summary

### 1.1 Design Philosophy

The SSO Admin Dashboard is designed with three core principles:

1. **Security-First UX**: Following industry best practices from Auth0, Stripe, and Vercel
   - API secrets shown only once (Stripe pattern)
   - Visual warnings for sensitive operations
   - Confirmation dialogs for destructive actions

2. **Progressive Disclosure**: Minimize cognitive load
   - Dashboard overview provides quick insights
   - Detailed analytics only when needed
   - Advanced settings hidden in collapsible sections

3. **Accessibility by Default**: WCAG 2.1 AA compliance
   - Keyboard navigation for all actions
   - Screen reader support with ARIA labels
   - High contrast ratios (4.5:1 minimum)
   - Command palette (⌘K) for power users

### 1.2 Key UI/UX Decisions

Based on Wave 1 research (competitor-analysis-2025.md), we adopt:

**From Stripe:**
- ✅ Show-once pattern for API secrets (production keys displayed once at creation)
- ✅ Two-tier key system (public `api_key` + secret `api_secret`)
- ✅ Customizable data tables with column sorting/filtering

**From Vercel:**
- ✅ Command palette (⌘K) for keyboard-first navigation
- ✅ Dark mode as standard with smooth transitions
- ✅ Minimalist card-based dashboard

**From Auth0:**
- ✅ Danger Zone for destructive actions (red background section)
- ✅ Confirmation input ("Type app name to confirm")

**From Supabase:**
- ✅ Real-time status indicators (active apps, recent logins)
- ✅ Spreadsheet-like table for analytics data
- ✅ Card transformation on mobile (table → cards)

### 1.3 User Personas

**Primary User: Backend Developer**
- Age: 25-40
- Role: Full-stack or backend developer
- Goals: Integrate SSO into their application, manage API keys, monitor authentication events
- Pain Points: Complex OAuth setup, key rotation downtime, unclear error messages
- Tech Savvy: High (comfortable with API keys, webhooks, JSON)

**Secondary User: DevOps Engineer**
- Age: 28-45
- Role: Infrastructure/DevOps
- Goals: Monitor system health, manage access for multiple apps, audit logs
- Pain Points: Lack of visibility into failed logins, no bulk operations
- Tech Savvy: Very high (prefers CLI/API over GUI when possible)

**Tertiary User: Product Manager**
- Age: 30-50
- Role: Non-technical stakeholder
- Goals: View analytics, understand user adoption
- Pain Points: Technical jargon, no clear KPIs
- Tech Savvy: Low to medium (needs simple dashboards)

---

## 2. Design System

### 2.1 Color Palette (Light + Dark Mode)

Based on ui-ux-trends-2025.md recommendations:

#### Light Mode
```css
:root {
  /* Brand Colors */
  --primary: 221.2 83.2% 53.3%;      /* Blue #3b82f6 */
  --primary-foreground: 210 40% 98%; /* White text on primary */

  /* Semantic Colors */
  --success: 142.1 76.2% 36.3%;      /* Green #22c55e */
  --warning: 38 92% 50%;             /* Orange #f97316 */
  --destructive: 0 84.2% 60.2%;      /* Red #ef4444 */

  /* Neutral Colors */
  --background: 0 0% 100%;           /* White #ffffff */
  --foreground: 222.2 84% 4.9%;      /* Near black #0f172a */
  --muted: 210 40% 96.1%;            /* Light gray #f1f5f9 */
  --muted-foreground: 215.4 16.3% 46.9%; /* Medium gray #64748b */

  /* UI Elements */
  --card: 0 0% 100%;                 /* White */
  --card-foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;       /* Light gray border #e2e8f0 */
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;         /* Focus ring (same as primary) */

  /* Radius */
  --radius: 0.5rem;                  /* 8px */
}
```

#### Dark Mode
```css
.dark {
  --primary: 217.2 91.2% 59.8%;      /* Lighter blue #60a5fa */
  --primary-foreground: 222.2 47.4% 11.2%;

  --success: 142.1 70.6% 45.3%;      /* Lighter green #4ade80 */
  --warning: 32 95% 44%;             /* Darker orange #ea580c */
  --destructive: 0 62.8% 30.6%;      /* Darker red #991b1b */

  --background: 222.2 84% 4.9%;      /* Near black #0f172a */
  --foreground: 210 40% 98%;         /* Off-white #f8fafc */
  --muted: 217.2 32.6% 17.5%;        /* Dark gray #1e293b */
  --muted-foreground: 215 20.2% 65.1%; /* Medium gray #94a3b8 */

  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
```

#### Color Usage Guidelines

| Color | Usage | Example |
|-------|-------|---------|
| Primary | CTAs, links, active states | "Create New App" button |
| Success | Positive feedback, active status | "App Active" badge |
| Warning | Caution messages, pending states | "Key will expire soon" alert |
| Destructive | Errors, delete actions | "Delete App" button |
| Muted | Secondary text, disabled states | Timestamps, helper text |
| Border | Dividers, card borders | Table borders, input borders |

### 2.2 Typography Scale

**Font Stack** (from ui-ux-trends-2025.md):
```css
--font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "Fira Code", "Courier New", monospace;
```

**Type Scale** (Major Third - 1.250 ratio):
```css
--text-xs: 0.64rem;    /* 10.24px - Labels, small metadata */
--text-sm: 0.8rem;     /* 12.8px - Captions, timestamps */
--text-base: 1rem;     /* 16px - Body text (DEFAULT) */
--text-lg: 1.25rem;    /* 20px - H4, subheadings */
--text-xl: 1.563rem;   /* 25px - H3 */
--text-2xl: 1.953rem;  /* 31.25px - H2 */
--text-3xl: 2.441rem;  /* 39px - H1, page titles */
```

**Font Weights:**
- Normal: 400 (body text)
- Medium: 500 (emphasis, labels)
- Semibold: 600 (headings)
- Bold: 700 (page titles, metric values)

**Line Heights:**
- Headings: 1.2
- UI elements: 1.5
- Body text: 1.6

**Example Usage:**
```tsx
// Page title
<h1 className="text-3xl font-bold leading-tight">Dashboard Overview</h1>

// Section heading
<h2 className="text-2xl font-semibold leading-tight">Recent Activity</h2>

// Body text
<p className="text-base leading-relaxed">Your applications are listed below.</p>

// Metadata
<span className="text-sm text-muted-foreground">Created 2 hours ago</span>
```

### 2.3 Spacing System (8-Point Grid)

Based on TailwindCSS defaults (from ui-ux-trends-2025.md):

```
0.5 = 2px   (hairline gap)
1   = 4px   (tight spacing)
2   = 8px   (compact spacing)
3   = 12px  (default gap between related items)
4   = 16px  (form field spacing)
6   = 24px  (card padding, section spacing)
8   = 32px  (large gaps, page margins)
12  = 48px  (section separators)
16  = 64px  (page-level spacing)
```

**Common Applications:**
- Card padding: `p-6` (24px)
- Form field spacing: `space-y-4` (16px between fields)
- Section gaps: `gap-8` (32px)
- Page margins: `px-8 py-6` (32px horizontal, 24px vertical)
- Button padding: `px-4 py-2` (16px horizontal, 8px vertical)

### 2.4 Component Styles

#### Buttons

```tsx
// Primary (Default)
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Create App
</Button>

// Destructive
<Button variant="destructive">
  Delete App
</Button>

// Outline (Secondary)
<Button variant="outline">
  Cancel
</Button>

// Ghost (Tertiary)
<Button variant="ghost">
  Learn More
</Button>

// With icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Create New App
</Button>
```

**Size Variants:**
- Small: `h-8 px-3 text-sm`
- Default: `h-10 px-4 text-base`
- Large: `h-12 px-6 text-lg`

#### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Total Apps</CardTitle>
    <CardDescription>Active applications</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">24</div>
    <p className="text-xs text-muted-foreground">
      +12% from last month
    </p>
  </CardContent>
</Card>
```

**Card Variants:**
- Default: White background (light), dark background (dark mode)
- Elevated: `shadow-md` for importance
- Bordered: `border` without shadow (minimal)

#### Badges

```tsx
// Success (Active)
<Badge variant="success">Active</Badge>

// Warning (Pending)
<Badge variant="warning">Pending</Badge>

// Destructive (Inactive)
<Badge variant="destructive">Inactive</Badge>

// Default (Neutral)
<Badge>Draft</Badge>
```

### 2.5 Dark Mode Toggle

**Location**: Top-right header, next to user menu

**Implementation** (from ui-ux-trends-2025.md):
```tsx
// components/theme-toggle.tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

**System Preference Detection:**
- Auto-detect user's OS preference on first visit
- Persist choice to `localStorage`
- Smooth 0.2s transition between modes

---

## 3. Information Architecture

### 3.1 Navigation Structure

```
SSO Admin Dashboard
│
├── Dashboard Overview (/)
│   ├── Metrics (4 cards: Total Apps, Active Apps, Logins Today, Total Users)
│   ├── Recent Activity (table)
│   └── Quick Actions (Create App, View Analytics)
│
├── Applications (/apps)
│   ├── Apps List (/apps)
│   ├── Create App (/apps/new)
│   ├── App Details (/apps/[id])
│   ├── Edit App (/apps/[id]/edit)
│   └── App Analytics (/apps/[id]/analytics)
│
├── Settings (/settings)
│   ├── Profile
│   ├── Team Members
│   └── Billing
│
└── Documentation (/docs)
    ├── Getting Started
    ├── API Reference
    └── SDKs
```

### 3.2 Sitemap

**Level 1: Main Navigation (Sidebar)**
1. Dashboard
2. Applications
3. Settings
4. Documentation (external link)

**Level 2: Sub-Pages**
- Applications
  - List view (default)
  - Create new
  - App details (dynamic)
  - Edit app (dynamic)
  - Analytics (dynamic)

**Modals (Overlay Navigation):**
- Regenerate Secret (triggered from App Details)
- Delete App (triggered from App Details or List)

### 3.3 User Flows

#### Flow 1: Create New Application

```
[Dashboard]
    ↓ Click "Create New App" button
[Create App Form]
    ↓ Fill fields (App Name, Description, URLs, Auth Method)
    ↓ Real-time validation as user types
    ↓ Click "Create Application"
[Processing]
    ↓ Success
[App Details Page]
    ↓ Modal automatically opens: "Save Your API Secret"
    ↓ User copies secret
    ↓ User checks "I've saved it"
    ↓ User clicks "Done"
[App Details Page]
    ↓ Secret now hidden forever (show-once pattern)
```

**Key Decision Points:**
- Validation errors → stay on form, show inline errors
- Network error → show toast notification, retry option
- Success → redirect + show secret modal

#### Flow 2: View App Analytics

```
[Dashboard] or [Apps List]
    ↓ Click on app name or "Analytics" button
[App Details]
    ↓ Click "Analytics" tab or button
[App Analytics Page]
    ↓ Default view: Last 7 days
    ↓ User selects date range (30d, 90d, custom)
    ↓ Charts update automatically
    ↓ User scrolls to "Error Log" section
    ↓ User clicks on error to see details
[Error Detail Modal]
    ↓ User sees stack trace, timestamp, user info
    ↓ User clicks "Copy Error Details"
    ↓ User closes modal
[App Analytics Page]
    ↓ User exports data as CSV (optional)
    ↓ User navigates back to Apps List
```

#### Flow 3: Regenerate API Secret (Critical Flow)

```
[App Details]
    ↓ User scrolls to "Danger Zone" section (red background)
    ↓ User clicks "Regenerate Secret" button
[Confirmation Modal]
    ↓ Warning: "Old secret will be invalid"
    ↓ User must type app name to confirm
    ↓ User types app name (real-time validation)
    ↓ "Regenerate" button becomes enabled
    ↓ User clicks "Regenerate Secret"
[Processing]
    ↓ Old secret invalidated
    ↓ New secret generated
[Show New Secret Modal]
    ↓ "IMPORTANT: This is the only time you'll see this secret"
    ↓ User clicks "Copy" button
    ↓ Toast: "Copied to clipboard"
    ↓ User must check "I've saved it" before closing
    ↓ User clicks "Done"
[App Details]
    ↓ Secret field shows "sk_prod_••••••••••••••••"
    ↓ Toast: "Secret regenerated successfully"
```

**Safety Measures:**
1. Double confirmation (modal + type app name)
2. Show-once pattern for new secret
3. Cannot close modal without checking "I've saved it"
4. Clear warning messages

---

## 4. Layout & Navigation

### 4.1 Overall Layout Structure

Based on Vercel/Supabase patterns (from competitor-analysis-2025.md):

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar (64px height)                                       │
│ [Logo] [Search ⌘K]        [Theme] [Notifications] [User]   │
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────────┐
│          │ Breadcrumbs                                      │
│          │ Dashboard > Applications > My App                │
│ Sidebar  ├──────────────────────────────────────────────────┤
│ (240px)  │                                                  │
│          │                                                  │
│ [Nav]    │          Main Content Area                      │
│ Links    │          (Full width - 240px)                   │
│          │                                                  │
│ [Footer] │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**ASCII Art Wireframe:**
```
┌────────────────────────────────────────────────────────────────┐
│ [≡ SSO Admin]          [🔍 Search]      [🌙] [🔔] [@User ▼]   │
├────────┬───────────────────────────────────────────────────────┤
│        │ Home > Applications                                   │
│ 🏠 Dash│                                                       │
│ 📱 Apps│                                                       │
│ ⚙ Sets │               MAIN CONTENT                           │
│ 📚 Docs│                                                       │
│        │                                                       │
│        │                                                       │
│ ───────│                                                       │
│ v1.0.0 │                                                       │
└────────┴───────────────────────────────────────────────────────┘
```

### 4.2 Sidebar Menu

**Menu Structure:**
```tsx
// Primary Navigation
{
  label: "Dashboard",
  icon: Home,
  href: "/",
  badge: null
}

{
  label: "Applications",
  icon: AppWindow,
  href: "/apps",
  badge: "24" // Total app count
}

// Divider

{
  label: "Settings",
  icon: Settings,
  href: "/settings",
  badge: null
}

{
  label: "Documentation",
  icon: BookOpen,
  href: "https://docs.example.com",
  external: true
}

// Bottom Section (Sticky)
{
  label: "Version 1.0.0",
  className: "text-xs text-muted-foreground"
}
```

**Active State:**
- Blue left border (4px)
- Light blue background (primary/10)
- Bold font weight

**Collapsed State (< 1024px):**
- Icon only (64px width)
- Tooltip on hover (desktop)
- Hamburger menu (mobile)

### 4.3 Top Bar Components

**Left Section:**
- Logo + "SSO Admin" text (clickable, goes to Dashboard)
- Collapse sidebar button (desktop only)

**Center:**
- Universal search (⌘K)
  - Placeholder: "Search apps, settings..."
  - Keyboard shortcut hint visible

**Right Section (right-aligned):**
1. Theme toggle (Sun/Moon icon)
2. Notifications bell
   - Badge with count (if unread)
   - Dropdown with recent notifications
3. User menu (Avatar + Name)
   - Dropdown:
     - Profile
     - Settings
     - Divider
     - Sign out

### 4.4 Breadcrumbs

**Location:** Below top bar, above main content

**Examples:**
```
Dashboard
Applications
Applications > My App
Applications > My App > Analytics
Settings > Profile
```

**Styling:**
- Separator: `/` or `>`
- Current page: Bold, not clickable
- Previous pages: Clickable links
- Truncate long names: "My Very Long Ap..." (max 20 chars)

### 4.5 Command Palette (⌘K)

Inspired by Vercel (from competitor-analysis-2025.md):

**Trigger:**
- Keyboard: `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
- Click search bar in top header

**Modal Design:**
```
┌─────────────────────────────────────────┐
│ 🔍 Search apps, settings...             │
├─────────────────────────────────────────┤
│ 🚀 Quick Actions                        │
│   Create New App                        │
│   View Analytics                        │
│                                         │
│ 📱 Applications                         │
│   My Production App                     │
│   Test App                              │
│                                         │
│ ⚙ Settings                              │
│   Profile Settings                      │
│   Team Members                          │
└─────────────────────────────────────────┘
```

**Features:**
- Fuzzy search (matches partial strings)
- Keyboard navigation (↑↓ arrows, Enter to select)
- Recent items shown first
- Grouped by category (Actions, Apps, Settings)
- Press `Esc` to close

**Searchable Items:**
- All applications (by name)
- Quick actions (Create App, etc.)
- Settings pages
- Documentation sections

---

## 5. Screen Wireframes

### 5.1 Screen 1: Dashboard Overview

**URL:** `/`
**Purpose:** High-level overview of all apps, recent activity, and quick actions

#### ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────┐
│ Dashboard                                                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │
│ │Total Apps │ │Active Apps│ │Logins     │ │Total Users│           │
│ │    24     │ │    22     │ │Today      │ │   1,234   │           │
│ │           │ │           │ │   156     │ │           │           │
│ │ +12% ↑    │ │ +2 this   │ │ +23% ↑    │ │ +5% ↑     │           │
│ │           │ │   week    │ │           │ │           │           │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘           │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Recent Activity                          [View All →]        │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ Event            App           User        Time              │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ ✅ Login Success My Prod App   john@ex..  2 mins ago        │   │
│ │ ✅ Login Success Test App      jane@ex..  5 mins ago        │   │
│ │ ❌ Login Failed  My Prod App   user@ex..  12 mins ago       │   │
│ │ ✅ App Created   New App       admin      1 hour ago        │   │
│ │ ⚠️  Key Rotated  Test App      admin      2 hours ago       │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌────────────────────────┐                                          │
│ │ Quick Actions          │                                          │
│ ├────────────────────────┤                                          │
│ │ [+ Create New App]     │                                          │
│ │ [📊 View Analytics]    │                                          │
│ │ [📚 Read Documentation]│                                          │
│ └────────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**Metrics Cards (4 total):**
- shadcn/ui: `Card`, `CardHeader`, `CardContent`
- Layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
- Each card contains:
  - Title (text-sm, muted-foreground)
  - Value (text-2xl font-bold)
  - Change percentage (text-xs with color: green for positive, red for negative)
  - Icon (TrendingUp or TrendingDown from lucide-react)

**Recent Activity Table:**
- shadcn/ui: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- Columns:
  - Event (with icon: CheckCircle for success, XCircle for error, AlertCircle for warning)
  - App Name (truncated to 20 chars)
  - User Email (truncated: "john@example.com" → "john@ex...")
  - Timestamp (relative: "2 mins ago")
- Max 5 rows shown
- "View All" link to full activity log

**Quick Actions Panel:**
- shadcn/ui: `Card` with `Button` components
- 3 primary actions:
  1. Create New App (primary button with Plus icon)
  2. View Analytics (outline button with BarChart icon)
  3. Read Documentation (ghost button with BookOpen icon, external link)

#### Interactions and States

**Loading State:**
- Skeleton loaders for metric cards:
  ```tsx
  <div className="h-24 bg-muted rounded animate-pulse" />
  ```
- Table skeleton: 5 rows of gray bars

**Empty State (No Apps):**
- Replace metrics with:
  ```
  ┌─────────────────────────────────────┐
  │        🚀                           │
  │  Welcome to SSO Admin!              │
  │  Create your first app to get       │
  │  started.                           │
  │                                     │
  │  [+ Create Your First App]          │
  └─────────────────────────────────────┘
  ```

**Error State:**
- Show alert banner at top:
  ```tsx
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error loading dashboard</AlertTitle>
    <AlertDescription>
      Failed to fetch metrics. <Button variant="link">Retry</Button>
    </AlertDescription>
  </Alert>
  ```

#### Responsive Considerations

**Mobile (< 640px):**
- Metrics cards: 1 column (stack vertically)
- Recent Activity: Show as cards instead of table
  ```
  ┌────────────────────────┐
  │ ✅ Login Success       │
  │ My Prod App            │
  │ john@example.com       │
  │ 2 mins ago             │
  └────────────────────────┘
  ```

**Tablet (640px - 1024px):**
- Metrics cards: 2 columns

**Desktop (> 1024px):**
- Metrics cards: 4 columns (as shown)

---

### 5.2 Screen 2: Apps List

**URL:** `/apps`
**Purpose:** View all OAuth applications in a sortable, filterable table

#### ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────┐
│ Applications                                      [+ Create New App] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ [🔍 Search apps...]         [Status: All ▼]       Showing 1-25 of 24│
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Name ▲      Status    Owner          Created       Actions   │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ My Prod App ✅ Active  john@ex.com   2 days ago   [⋮]        │   │
│ │ Test App    ✅ Active  admin@ex.com  5 days ago   [⋮]        │   │
│ │ Dev App     ⚫ Inactive jane@ex.com  1 week ago   [⋮]        │   │
│ │ API Gateway ✅ Active  dev@ex.com    2 weeks ago  [⋮]        │   │
│ │ Mobile App  ✅ Active  john@ex.com   1 month ago  [⋮]        │   │
│ │ ...                                                           │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│                    [← Previous]  [1] 2 3  [Next →]                  │
└──────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**Page Header:**
- Left: Page title ("Applications")
- Right: Primary CTA button
  ```tsx
  <Button>
    <Plus className="mr-2 h-4 w-4" />
    Create New App
  </Button>
  ```

**Filters Row:**
- Search input (shadcn/ui `Input`)
  - Placeholder: "Search apps..."
  - Icon: Search icon on left
  - Width: `max-w-sm`
- Status filter (shadcn/ui `Select`)
  - Options: All, Active, Inactive
  - Default: All
- Results count (text-sm text-muted-foreground)

**Data Table:**
- shadcn/ui: `Table` + TanStack Table
- Columns:
  1. **Name** (sortable, default sort)
     - Clickable link to App Details
     - Font: font-medium
  2. **Status** (filterable)
     - Badge component
     - Active: green badge
     - Inactive: gray badge
  3. **Owner** (sortable)
     - Email address
     - Truncate if > 20 chars
  4. **Created** (sortable)
     - Relative timestamp: "2 days ago"
     - Tooltip on hover shows full date
  5. **Actions**
     - Dropdown menu (shadcn/ui `DropdownMenu`)
     - Icon: MoreHorizontal (three dots)

**Actions Dropdown:**
```tsx
<DropdownMenuContent align="end">
  <DropdownMenuItem>
    <Eye className="mr-2 h-4 w-4" />
    View Details
  </DropdownMenuItem>
  <DropdownMenuItem>
    <Edit className="mr-2 h-4 w-4" />
    Edit
  </DropdownMenuItem>
  <DropdownMenuItem>
    <BarChart className="mr-2 h-4 w-4" />
    Analytics
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem className="text-destructive">
    <Trash2 className="mr-2 h-4 w-4" />
    Delete
  </DropdownMenuItem>
</DropdownMenuContent>
```

**Pagination:**
- shadcn/ui: Custom pagination component
- Previous/Next buttons (disabled when at edges)
- Page numbers (show max 5 pages)
- Page size selector: 25, 50, 100 rows

#### Interactions and States

**Search:**
- Debounced search (300ms delay)
- Filters table in real-time
- No results state:
  ```
  ┌─────────────────────────────────────┐
  │        🔍                           │
  │  No apps match your search          │
  │  "xyz"                              │
  │                                     │
  │  [Clear Search]                     │
  └─────────────────────────────────────┘
  ```

**Filter by Status:**
- Updates table instantly (no "Apply" button)
- Active filter shown as pill: `[Status: Active ×]`

**Sorting:**
- Click column header to toggle sort
- Icon changes: ArrowUp (asc), ArrowDown (desc), ArrowUpDown (unsorted)

**Row Hover:**
- Background: muted/50
- Actions dropdown icon becomes visible

**Empty State (No Apps Created):**
```
┌─────────────────────────────────────────┐
│              📱                         │
│   No Applications Yet                   │
│                                         │
│   Create your first OAuth application   │
│   to start integrating SSO.             │
│                                         │
│   [+ Create Your First Application]     │
│                                         │
│   [📚 Read Getting Started Guide]       │
└─────────────────────────────────────────┘
```

#### Responsive Considerations

**Desktop (> 768px):**
- Table view (as shown above)
- All columns visible

**Tablet (640px - 768px):**
- Hide "Owner" column
- Hide "Created" column
- Keep: Name, Status, Actions

**Mobile (< 640px):**
- Card transformation (table hidden)
  ```
  ┌────────────────────────────┐
  │ My Production App          │
  │ ✅ Active                  │
  │ Created 2 days ago         │
  │ [View] [Edit] [⋮]          │
  └────────────────────────────┘
  ```

---

### 5.3 Screen 3: Create App Form

**URL:** `/apps/new`
**Purpose:** Form to create a new OAuth application

#### ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────┐
│ Create New Application                                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Application Details                                          │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │                                                              │   │
│ │ App Name *                                                   │   │
│ │ [                                                    ]       │   │
│ │ Choose a unique name for your application                   │   │
│ │                                                              │   │
│ │ Description                                                  │   │
│ │ [                                                    ]       │   │
│ │ [                                                    ]       │   │
│ │ [                                                    ]       │   │
│ │ Briefly describe what this app does                         │   │
│ │                                                              │   │
│ │ ─────────────────────────────────────────────────────        │   │
│ │                                                              │   │
│ │ Redirect URLs *                                              │   │
│ │ [https://example.com/callback               ] [+ Add]       │   │
│ │ [https://example.com/auth                   ] [× Remove]     │   │
│ │ [                                            ] [+ Add]       │   │
│ │ Where to redirect users after authentication                │   │
│ │                                                              │   │
│ │ Allowed Origins (CORS) *                                     │   │
│ │ [https://example.com                        ] [+ Add]       │   │
│ │ [                                            ] [+ Add]       │   │
│ │ Domains allowed to make requests to this app                │   │
│ │                                                              │   │
│ │ ─────────────────────────────────────────────────────        │   │
│ │                                                              │   │
│ │ Authentication Method *                                      │   │
│ │ [OAuth 2.0                                   ▼]             │   │
│ │   Options: OAuth 2.0, SAML 2.0, OpenID Connect              │   │
│ │                                                              │   │
│ │ Owner Email                                                  │   │
│ │ [admin@example.com                           ▼]             │   │
│ │ Searchable dropdown (combobox)                              │   │
│ │                                                              │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│                            [Cancel] [Create Application]             │
└──────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**Form Container:**
- shadcn/ui: `Card` with `Form` from react-hook-form
- Max width: `max-w-2xl` (centered)
- Padding: `p-6`

**Form Fields:**

1. **App Name** (required)
   - shadcn/ui: `Input`
   - Validation: Min 3 chars, max 50 chars, alphanumeric + spaces/dashes
   - Error message: "App name must be at least 3 characters"

2. **Description** (optional)
   - shadcn/ui: `Textarea`
   - Rows: 3
   - Max length: 500 chars
   - Character counter: "124 / 500"

3. **Redirect URLs** (required, multi-input)
   - shadcn/ui: `Input` + custom array field
   - Validation: Must be valid HTTPS URL
   - Min 1 URL required
   - "Add" button: Adds new input row
   - "Remove" button: Removes that row (only if > 1)
   - Implementation: `useFieldArray` from react-hook-form

4. **Allowed Origins** (required, multi-input)
   - Same as Redirect URLs
   - Validation: Valid origin (https://example.com)

5. **Authentication Method** (required)
   - shadcn/ui: `Select`
   - Options:
     - OAuth 2.0 (default)
     - SAML 2.0
     - OpenID Connect
   - Helper text: Brief description of selected method

6. **Owner Email** (optional)
   - shadcn/ui: `Combobox` (searchable dropdown)
   - Options: List of team members
   - Default: Current user
   - Allows typing to filter

**Form Actions:**
- Cancel button (outline variant, navigates back)
- Create Application button (primary, disabled if form invalid)

#### Interactions and States

**Real-Time Validation:**
```tsx
// Example: App Name field
{errors.name && (
  <p className="text-sm text-destructive flex items-center gap-1">
    <AlertCircle className="h-4 w-4" />
    {errors.name.message}
  </p>
)}
```

**Validation Triggers:**
- On blur (when user leaves field)
- On submit (all fields)
- On change (for multi-input fields)

**Success State:**
- Form submits → shows loading spinner in button
- On success → redirects to App Details page
- Modal automatically opens showing API secret (see Screen 4)

**Error State:**
- Network error → toast notification
  ```tsx
  toast.error("Failed to create application", {
    description: "Please try again later or contact support."
  })
  ```
- Validation errors → inline below each field

**Loading State:**
```tsx
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isSubmitting ? "Creating..." : "Create Application"}
</Button>
```

#### Responsive Considerations

**Desktop:**
- Single column form
- Full-width inputs (within max-width container)

**Mobile:**
- Same layout (form is already single-column)
- Larger touch targets for buttons (min 44x44px)
- Multi-input fields stack vertically

---

### 5.4 Screen 4: App Details

**URL:** `/apps/[id]`
**Purpose:** View and manage a specific OAuth application

#### ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────┐
│ My Production App                                    [Edit] [⋮ More]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Application Info                               [🟢 Active]   │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ Name: My Production App                                     │   │
│ │ Description: OAuth app for production website               │   │
│ │ Auth Method: OAuth 2.0                                      │   │
│ │ Owner: john@example.com                                     │   │
│ │ Created: Jan 10, 2025, 3:42 PM                              │   │
│ │ Last Updated: Jan 12, 2025, 9:15 AM                         │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ API Credentials                                              │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ API Key (Public)                                             │   │
│ │ [sso_api_1a2b3c4d5e6f7g8h9i0j              ] [📋 Copy]      │   │
│ │ ✅ Safe to use in client-side code                          │   │
│ │                                                              │   │
│ │ API Secret (Private)                                         │   │
│ │ [sk_prod_••••••••••••••••••••••••••        ] [🔒 Hidden]    │   │
│ │ ⚠️  Never expose this secret client-side                    │   │
│ │ Last used: 2 hours ago                                       │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Configuration                                                │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ Redirect URLs:                                               │   │
│ │   • https://example.com/callback                            │   │
│ │   • https://example.com/auth                                │   │
│ │                                                              │   │
│ │ Allowed Origins:                                             │   │
│ │   • https://example.com                                     │   │
│ │   • https://www.example.com                                 │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Total Logins │ │Active Users │ │Last Login   │ │Error Rate   │   │
│ │   12,345    │ │     234     │ │ 2 mins ago  │ │    0.2%     │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                      │
│                                            [📊 View Full Analytics] │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ ⚠️  Danger Zone                                              │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ [🔄 Regenerate Secret]   [🗑️  Delete Application]           │   │
│ │                                                              │   │
│ │ These actions are irreversible. Proceed with caution.       │   │
│ └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**Page Header:**
- Left: App name (h1, text-3xl font-bold)
- Right: Action buttons
  - Edit button (outline)
  - More menu (dropdown):
    - Duplicate App
    - View Logs
    - Export Config

**Application Info Card:**
- shadcn/ui: `Card`
- Status badge (top-right corner):
  - Active: green badge with dot
  - Inactive: gray badge
- Fields (read-only):
  - Name
  - Description (if provided)
  - Auth Method
  - Owner
  - Created (full timestamp)
  - Last Updated

**API Credentials Card:**
- shadcn/ui: `Card` with warning styling for secret
- API Key (Public):
  - Read-only input with copy button
  - Success icon + text: "Safe to use in client-side code"
  - Monospace font
- API Secret (Private):
  - Masked: `sk_prod_••••••••••••••••••••••••••`
  - "Hidden" button (disabled, shows locked icon)
  - Warning icon + text: "Never expose this secret client-side"
  - Last used timestamp

**Configuration Card:**
- shadcn/ui: `Card`
- Redirect URLs: Bulleted list
- Allowed Origins: Bulleted list
- If lists are long (> 5 items), show "Show more" link

**Stats Cards (4 metrics):**
- Same as Dashboard metrics
- App-specific stats:
  1. Total Logins
  2. Active Users (last 30 days)
  3. Last Login (relative time)
  4. Error Rate (percentage)

**View Full Analytics Button:**
- Links to Analytics page (Screen 8)
- Outline variant with BarChart icon

**Danger Zone:**
- shadcn/ui: `Card` with red border and red background (danger/10)
- Alert icon + "Danger Zone" title
- Two destructive buttons:
  1. Regenerate Secret (orange/warning)
  2. Delete Application (red/destructive)
- Warning text below buttons

#### Interactions and States

**Copy API Key:**
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => {
    navigator.clipboard.writeText(apiKey)
    toast.success("API key copied to clipboard")
  }}
>
  <Copy className="h-4 w-4" />
</Button>
```

**Status Toggle:**
- Click badge to open dropdown:
  - Set Active
  - Set Inactive
- Confirmation required before changing

**Regenerate Secret Button:**
- Opens modal (Screen 6)
- See section 5.6 for full flow

**Delete Application Button:**
- Opens modal (Screen 7)
- See section 5.7 for full flow

**Loading State:**
- Skeleton loaders for all cards while fetching data

**Error State:**
- If app not found (404):
  ```
  ┌─────────────────────────────────────┐
  │        ⚠️                           │
  │   Application Not Found             │
  │                                     │
  │   This app may have been deleted.   │
  │                                     │
  │   [← Back to Apps List]             │
  └─────────────────────────────────────┘
  ```

#### Responsive Considerations

**Desktop:**
- Stats cards: 4 columns
- All sections visible

**Tablet:**
- Stats cards: 2 columns

**Mobile:**
- Stats cards: 1 column
- Danger Zone buttons stack vertically
- Long URLs in config wrap or truncate with tooltip

---

### 5.5 Screen 5: Edit App Form

**URL:** `/apps/[id]/edit`
**Purpose:** Edit existing OAuth application settings

#### ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────┐
│ Edit Application: My Production App                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Application Details                                          │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │                                                              │   │
│ │ App Name *                                                   │   │
│ │ [My Production App                               ]           │   │
│ │                                                              │   │
│ │ Description                                                  │   │
│ │ [OAuth app for production website                ]           │   │
│ │ [                                                 ]           │   │
│ │                                                              │   │
│ │ ─────────────────────────────────────────────────────        │   │
│ │                                                              │   │
│ │ Redirect URLs *                                              │   │
│ │ [https://example.com/callback               ] [× Remove]     │   │
│ │ [https://example.com/auth                   ] [× Remove]     │   │
│ │ [                                            ] [+ Add]       │   │
│ │                                                              │   │
│ │ Allowed Origins *                                            │   │
│ │ [https://example.com                        ] [× Remove]     │   │
│ │ [https://www.example.com                    ] [× Remove]     │   │
│ │ [                                            ] [+ Add]       │   │
│ │                                                              │   │
│ │ ─────────────────────────────────────────────────────        │   │
│ │                                                              │   │
│ │ Authentication Method * (Read-only)                          │   │
│ │ [OAuth 2.0                                   ] 🔒            │   │
│ │ Cannot be changed after creation                            │   │
│ │                                                              │   │
│ │ Owner Email                                                  │   │
│ │ [john@example.com                            ▼]             │   │
│ │                                                              │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ API Credentials (Read-only)                                  │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ API Key: sso_api_1a2b3c4d5e6f7g8h9i0j                       │   │
│ │ Secret: sk_prod_••••••••••••••••                            │   │
│ │                                                              │   │
│ │ ℹ️  Use "Regenerate Secret" to create a new secret.         │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Metadata                                                     │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ Created: Jan 10, 2025, 3:42 PM                              │   │
│ │ Last Updated: Jan 12, 2025, 9:15 AM                         │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│                            [Cancel] [Save Changes]                   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**Form Structure:**
- Same as Create App Form (Screen 3)
- Pre-filled with existing values
- Additional read-only sections

**Editable Fields:**
1. App Name (pre-filled)
2. Description (pre-filled)
3. Redirect URLs (pre-filled, can add/remove)
4. Allowed Origins (pre-filled, can add/remove)
5. Owner Email (pre-filled, can change)

**Read-Only Fields:**
1. Authentication Method (disabled select, lock icon)
   - Helper text: "Cannot be changed after creation"
2. API Credentials section (entire card is read-only)
   - Info alert: "Use 'Regenerate Secret' to create a new secret"

**Metadata Section:**
- Read-only card showing:
  - Created timestamp
  - Last Updated timestamp
  - Auto-updates after save

**Form Actions:**
- Cancel: Navigates back to App Details (no changes saved)
- Save Changes: Primary button, disabled if no changes or invalid

#### Interactions and States

**Dirty Form Detection:**
```tsx
const { formState: { isDirty, isValid } } = form
// Save button only enabled if isDirty && isValid
```

**Unsaved Changes Warning:**
- If user navigates away with unsaved changes:
  ```tsx
  <AlertDialog>
    <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
    <AlertDialogDescription>
      You have unsaved changes. Are you sure you want to leave?
    </AlertDialogDescription>
    <AlertDialogAction onClick={handleDiscard}>
      Discard Changes
    </AlertDialogAction>
    <AlertDialogCancel>Stay on Page</AlertDialogCancel>
  </AlertDialog>
  ```

**Success State:**
- On save → toast notification:
  ```tsx
  toast.success("Application updated successfully")
  ```
- Redirect to App Details page after 1 second

**Loading State:**
```tsx
<Button disabled={isSaving}>
  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isSaving ? "Saving..." : "Save Changes"}
</Button>
```

**Error State:**
- Network error → toast + stay on form
- Validation errors → inline (same as Create form)

#### Responsive Considerations

- Same as Create App Form (Screen 3)
- Mobile: Full-width form, larger touch targets

---

### 5.6 Screen 6: Regenerate Secret Modal

**Trigger:** Click "Regenerate Secret" in App Details Danger Zone
**Purpose:** Safely regenerate API secret with confirmation

#### ASCII Wireframe (Step 1: Confirmation)

```
┌──────────────────────────────────────────────────┐
│ ⚠️  Regenerate API Secret?              [×]     │
├──────────────────────────────────────────────────┤
│                                                  │
│ This action will invalidate your current secret │
│ and generate a new one.                         │
│                                                  │
│ ⚠️  Important:                                   │
│ • Your old secret will stop working immediately │
│ • All integrations using the old secret will    │
│   fail until updated                            │
│ • The new secret will be shown only once        │
│                                                  │
│ To confirm, type the app name below:            │
│                                                  │
│ App name:                                        │
│ [                                    ]           │
│                                                  │
│ Expected: "My Production App"                   │
│                                                  │
│            [Cancel] [Regenerate Secret]          │
│                     (disabled until typed)       │
└──────────────────────────────────────────────────┘
```

#### ASCII Wireframe (Step 2: Show New Secret)

```
┌──────────────────────────────────────────────────┐
│ ✅ New Secret Generated                 [×]     │
├──────────────────────────────────────────────────┤
│                                                  │
│ ⚠️  IMPORTANT: Copy this secret now!             │
│ You won't be able to see it again.              │
│                                                  │
│ New API Secret:                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ sk_prod_AbCdEfGh1234567890XyZ            │  │
│ │                                    [📋]   │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ Old secret (now invalid):                       │
│ sk_prod_OldKey123••••••••                       │
│                                                  │
│ ☐ I've saved the new secret in a safe place     │
│                                                  │
│                                    [Done]        │
│                              (disabled until ☑)  │
└──────────────────────────────────────────────────┘
```

#### Component Breakdown

**Step 1: Confirmation Dialog**
- shadcn/ui: `AlertDialog`
- Components:
  - Title: "Regenerate API Secret?" with warning icon
  - Description: Explanation of consequences (3 bullet points)
  - Confirmation input:
    ```tsx
    <Input
      placeholder="Type app name to confirm"
      value={confirmText}
      onChange={(e) => setConfirmText(e.target.value)}
    />
    ```
  - Expected value shown below input (text-sm, muted)
  - Actions:
    - Cancel (outline)
    - Regenerate (destructive, disabled until `confirmText === appName`)

**Step 2: Show New Secret**
- shadcn/ui: `Dialog` (cannot close with Esc or click outside)
- Components:
  - Title: "New Secret Generated" with success icon
  - Alert banner (warning variant):
    - "IMPORTANT: Copy this secret now!"
    - "You won't be able to see it again."
  - New secret display:
    - Monospace font
    - Copy button (large, prominent)
    - Background: muted/20 (highlighted)
  - Old secret (crossed out):
    - Partially masked
    - Text decoration: line-through
    - Text: muted-foreground
  - Checkbox:
    ```tsx
    <Checkbox
      id="saved-secret"
      checked={hasSaved}
      onCheckedChange={setHasSaved}
    />
    <Label htmlFor="saved-secret">
      I've saved the new secret in a safe place
    </Label>
    ```
  - Done button (primary, disabled until checkbox checked)

#### Interactions and States

**Confirmation Input Validation:**
```tsx
const isValid = confirmText.trim() === appName.trim()
// Regenerate button disabled if !isValid
```

**Real-Time Feedback:**
- If typed text doesn't match:
  - Input border: red
  - Helper text: "App name doesn't match" (red)
- If typed text matches:
  - Input border: green
  - Checkmark icon appears

**Copy Secret:**
```tsx
<Button onClick={handleCopy}>
  {copied ? (
    <>
      <Check className="mr-2 h-4 w-4" />
      Copied!
    </>
  ) : (
    <>
      <Copy className="mr-2 h-4 w-4" />
      Copy to Clipboard
    </>
  )}
</Button>
```

**Cannot Close Until Saved:**
- Close button (X) disabled until checkbox checked
- Click outside/Esc key: no effect
- Only "Done" button closes dialog

**Loading State (Between Steps):**
```
┌──────────────────────────────────────┐
│ 🔄 Regenerating Secret...            │
│                                      │
│ [Spinner animation]                  │
│                                      │
│ This may take a few seconds...       │
└──────────────────────────────────────┘
```

**Error State:**
- If API call fails:
  ```tsx
  toast.error("Failed to regenerate secret", {
    description: "Please try again or contact support."
  })
  // Modal stays open, user can retry
  ```

#### Responsive Considerations

**Mobile:**
- Modal takes full width (max-w-lg)
- Secret text wraps or scrolls horizontally
- Copy button below secret (not inline)

---

### 5.7 Screen 7: Delete App Modal

**Trigger:** Click "Delete Application" in App Details Danger Zone
**Purpose:** Safely delete app with confirmation

#### ASCII Wireframe

```
┌──────────────────────────────────────────────────┐
│ 🗑️  Delete Application?                 [×]     │
├──────────────────────────────────────────────────┤
│                                                  │
│ Are you sure you want to delete                 │
│ "My Production App"?                            │
│                                                  │
│ ⚠️  Warning:                                     │
│ • This action cannot be undone                  │
│ • All API keys will be invalidated immediately │
│ • Authentication will fail for all users        │
│ • Analytics data will be archived (90 days)    │
│                                                  │
│ Delete Type:                                     │
│ ○ Soft Delete (recommended)                     │
│   App disabled, can be restored for 30 days     │
│                                                  │
│ ● Hard Delete (permanent)                       │
│   App and all data deleted immediately          │
│                                                  │
│ To confirm hard delete, type the app name:      │
│                                                  │
│ App name:                                        │
│ [                                    ]           │
│                                                  │
│ Expected: "My Production App"                   │
│                                                  │
│            [Cancel] [Delete Application]         │
│                     (red, disabled until typed)  │
└──────────────────────────────────────────────────┘
```

#### Component Breakdown

**Delete Dialog:**
- shadcn/ui: `AlertDialog` with destructive styling
- Title: App name in quotes
- Warning section (Alert component, destructive variant):
  - 4 bullet points explaining consequences

**Delete Type Selection:**
- shadcn/ui: `RadioGroup`
- Options:
  1. **Soft Delete** (default selected)
     - Label: "Soft Delete (recommended)"
     - Description: "App disabled, can be restored for 30 days"
     - No confirmation text required
  2. **Hard Delete**
     - Label: "Hard Delete (permanent)"
     - Description: "App and all data deleted immediately"
     - Requires typing app name

**Confirmation Input (only for Hard Delete):**
```tsx
{deleteType === 'hard' && (
  <div className="space-y-2">
    <Label>To confirm hard delete, type the app name:</Label>
    <Input
      placeholder="Type app name to confirm"
      value={confirmText}
      onChange={(e) => setConfirmText(e.target.value)}
    />
    <p className="text-sm text-muted-foreground">
      Expected: "{appName}"
    </p>
  </div>
)}
```

**Actions:**
- Cancel (outline)
- Delete Application (destructive)
  - Disabled if:
    - Hard delete AND confirmText !== appName
    - API call in progress

#### Interactions and States

**Radio Group Change:**
```tsx
const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft')
// If soft → no confirmation needed
// If hard → show confirmation input
```

**Confirmation Validation (Hard Delete):**
- Same as Regenerate Secret modal
- Input must exactly match app name (case-sensitive)

**Delete Button:**
```tsx
<Button
  variant="destructive"
  disabled={deleteType === 'hard' && confirmText !== appName}
  onClick={handleDelete}
>
  {isDeleting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Deleting...
    </>
  ) : (
    <>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete Application
    </>
  )}
</Button>
```

**Success State:**
- Toast notification:
  ```tsx
  if (deleteType === 'soft') {
    toast.success("Application disabled", {
      description: "You can restore it from Trash within 30 days."
    })
  } else {
    toast.success("Application deleted permanently")
  }
  ```
- Redirect to Apps List

**Error State:**
- API error → toast notification
- Modal stays open
- User can retry

#### Responsive Considerations

**Mobile:**
- Modal takes full width
- Radio group labels wrap if needed
- Delete button full-width

---

### 5.8 Screen 8: App Analytics

**URL:** `/apps/[id]/analytics`
**Purpose:** Detailed analytics dashboard for a specific app

#### ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────┐
│ Analytics: My Production App                                        │
│                                                                      │
│ [Last 7 days ▼] [Last 30 days] [Last 90 days] [Custom]             │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Total Events │ │Logins       │ │Errors       │ │Unique Users │   │
│ │   12,456    │ │   10,234    │ │     45      │ │     567     │   │
│ │ +15% ↑      │ │ +12% ↑      │ │ -5% ↓       │ │ +8% ↑       │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Daily Logins Trend                                           │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │                                                              │   │
│ │  200┤                                                 ●      │   │
│ │     │                                             ●           │   │
│ │  150┤                                         ●               │   │
│ │     │                                     ●                   │   │
│ │  100┤                                 ●                       │   │
│ │     │                             ●                           │   │
│ │   50┤                         ●                               │   │
│ │     │                     ●                                   │   │
│ │    0└─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────         │   │
│ │         Mon   Tue   Wed   Thu   Fri   Sat   Sun              │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Events by Type                                               │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │                                                              │   │
│ │  Login Success   ████████████████████ 10,234                │   │
│ │  Token Refresh   ██████████ 2,145                           │   │
│ │  Login Failed    ███ 567                                    │   │
│ │  Logout          ██ 412                                     │   │
│ │  Session Expired █ 98                                       │   │
│ │                                                              │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Top Users (by login count)              [Export CSV]        │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ Email              Logins   Last Seen         Location      │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ john@example.com     234    2 mins ago        US, CA        │   │
│ │ jane@example.com     189    1 hour ago        UK, London    │   │
│ │ admin@example.com    156    5 hours ago       US, NY        │   │
│ │ dev@example.com      145    1 day ago         DE, Berlin    │   │
│ │ user@example.com     123    2 days ago        FR, Paris     │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Recent Errors                                [View All →]   │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ Time         Error                User           Details     │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ 2 mins ago   Invalid token       john@ex..     [🔍 View]    │   │
│ │ 15 mins ago  Rate limit exceeded jane@ex..     [🔍 View]    │   │
│ │ 1 hour ago   Invalid credentials user@ex..     [🔍 View]    │   │
│ │ 2 hours ago  Token expired       admin@ex..    [🔍 View]    │   │
│ │ 5 hours ago  Invalid redirect    dev@ex..      [🔍 View]    │   │
│ └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**Date Range Picker:**
- shadcn/ui: Custom tabs + `DatePickerWithRange` (from ui-ux-trends-2025.md)
- Preset tabs:
  - Last 7 days (default)
  - Last 30 days
  - Last 90 days
  - Custom (opens date picker modal)
- Custom date picker:
  - Calendar component for start/end dates
  - Max range: 1 year
  - Apply button to confirm

**Summary Cards (4 metrics):**
- Same component as Dashboard Overview
- App-specific metrics:
  1. Total Events (all event types)
  2. Logins (successful logins only)
  3. Errors (failed events)
  4. Unique Users (distinct user count)
- Each shows:
  - Current value (large, bold)
  - Percentage change from previous period
  - Trend icon (up/down arrow)

**Line Chart (Daily Logins Trend):**
- shadcn/ui: Recharts `LineChart`
- Implementation:
  ```tsx
  <Card>
    <CardHeader>
      <CardTitle>Daily Logins Trend</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={dailyData}>
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
    </CardContent>
  </Card>
  ```

**Bar Chart (Events by Type):**
- shadcn/ui: Recharts `BarChart`
- Horizontal bars (easier to read event names)
- Color-coded:
  - Login Success: green
  - Token Refresh: blue
  - Login Failed: red
  - Other: gray

**Top Users Table:**
- shadcn/ui: `Table` with `TableHeader`, `TableBody`
- Columns:
  1. Email (truncated if long)
  2. Login count (descending order)
  3. Last Seen (relative timestamp)
  4. Location (country, city)
- Max 5 rows shown
- "Export CSV" button in card header

**Recent Errors Table:**
- Same as Top Users table
- Columns:
  1. Time (relative)
  2. Error message (truncated to 30 chars)
  3. User email (truncated)
  4. Details button (opens modal)
- Max 5 rows shown
- "View All" link to full error log page

#### Interactions and States

**Date Range Change:**
- Updates all charts and metrics
- Shows loading skeletons during fetch
- URL updates: `?from=2025-01-01&to=2025-01-07`

**Export CSV:**
```tsx
<Button variant="outline" onClick={handleExport}>
  <Download className="mr-2 h-4 w-4" />
  Export CSV
</Button>
// Triggers download of CSV file with table data
```

**Error Details Modal:**
```
┌──────────────────────────────────────────┐
│ Error Details                    [×]     │
├──────────────────────────────────────────┤
│ Error: Invalid token                     │
│                                          │
│ User: john@example.com                   │
│ Time: Jan 12, 2025, 10:42 AM             │
│ Location: US, California                 │
│                                          │
│ Stack Trace:                             │
│ ┌────────────────────────────────────┐   │
│ │ TokenError: JWT expired            │   │
│ │   at verify (/lib/jwt.ts:45)       │   │
│ │   at authenticate (/api/auth.ts:12)│   │
│ └────────────────────────────────────┘   │
│                                          │
│           [📋 Copy Details] [Close]      │
└──────────────────────────────────────────┘
```

**Loading State:**
- Skeleton loaders for:
  - Metric cards
  - Charts (gray placeholder boxes)
  - Tables (5 skeleton rows)

**Empty State (No Data):**
```
┌─────────────────────────────────────┐
│              📊                     │
│   No data for selected period       │
│                                     │
│   Try a different date range or     │
│   check back later.                 │
└─────────────────────────────────────┘
```

#### Responsive Considerations

**Desktop (> 1024px):**
- Summary cards: 4 columns
- Charts: Full width
- Tables: All columns visible

**Tablet (768px - 1024px):**
- Summary cards: 2 columns
- Charts: Full width (might scroll horizontally)
- Tables: Hide "Location" column

**Mobile (< 768px):**
- Summary cards: 1 column
- Charts: Smaller height (250px), horizontal scroll if needed
- Tables: Card transformation (same as Apps List)
- Date range picker: Full-width modal

---

## 6. Component Mapping

### 6.1 shadcn/ui Components Required

**Installation Command:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card form input label select textarea \
  table dialog alert-dialog toast sonner badge avatar separator \
  dropdown-menu breadcrumb checkbox radio-group switch calendar \
  date-picker skeleton alert
```

### 6.2 Component to UI Element Mapping

| UI Element | shadcn/ui Component | Additional Libraries |
|------------|---------------------|----------------------|
| **Buttons** | `Button` | lucide-react (icons) |
| **Metric Cards** | `Card`, `CardHeader`, `CardContent` | - |
| **Data Tables** | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` | @tanstack/react-table |
| **Forms** | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` | react-hook-form, zod |
| **Text Inputs** | `Input` | - |
| **Textareas** | `Textarea` | - |
| **Dropdowns** | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | - |
| **Combobox** | `Combobox` (custom using `Popover` + `Command`) | cmdk |
| **Multi-Input** | Custom component using `Input` + `useFieldArray` | react-hook-form |
| **Modals** | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle` | - |
| **Confirmation Modals** | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel` | - |
| **Toast Notifications** | `Toaster` from sonner | sonner |
| **Badges** | `Badge` | - |
| **Status Indicators** | `Badge` with variant | - |
| **Charts** | Custom using Recharts primitives | recharts |
| **Date Pickers** | `DatePickerWithRange` | date-fns |
| **Skeletons** | `Skeleton` | - |
| **Alerts** | `Alert`, `AlertTitle`, `AlertDescription` | - |
| **Breadcrumbs** | `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbSeparator` | - |
| **Dropdown Menus** | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` | - |
| **Checkboxes** | `Checkbox` | - |
| **Radio Groups** | `RadioGroup`, `RadioGroupItem` | - |
| **Switch/Toggle** | `Switch` | - |
| **Avatars** | `Avatar`, `AvatarImage`, `AvatarFallback` | - |
| **Separators** | `Separator` | - |

### 6.3 Custom Components to Build

**1. MetricCard**
```tsx
// components/metric-card.tsx
interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
}

export function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={cn(
            "text-xs flex items-center gap-1",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive",
            trend === 'neutral' && "text-muted-foreground"
          )}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

**2. MultiInput (for Redirect URLs, Allowed Origins)**
```tsx
// components/multi-input.tsx
import { useFieldArray } from 'react-hook-form'

interface MultiInputProps {
  name: string
  control: any
  label: string
  placeholder: string
}

export function MultiInput({ name, control, label, placeholder }: MultiInputProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  })

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <Input
            {...control.register(`${name}.${index}.value`)}
            placeholder={placeholder}
          />
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
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: '' })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add
      </Button>
    </div>
  )
}
```

**3. CopyButton**
```tsx
// components/copy-button.tsx
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  value: string
}

export function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  )
}
```

**4. StatusBadge**
```tsx
// components/status-badge.tsx
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    active: 'success',
    inactive: 'secondary',
    pending: 'warning',
    error: 'destructive',
  }

  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    error: 'Error',
  }

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  )
}
```

### 6.4 Layout Components

**1. DashboardLayout**
```tsx
// components/layout/dashboard-layout.tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  )
}
```

**2. Sidebar**
```tsx
// components/layout/sidebar.tsx
export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card">
      <div className="p-6">
        <h2 className="text-xl font-bold">SSO Admin</h2>
      </div>
      <nav className="space-y-1 px-3">
        <SidebarLink href="/" icon={Home} label="Dashboard" />
        <SidebarLink href="/apps" icon={AppWindow} label="Applications" badge="24" />
        <Separator className="my-2" />
        <SidebarLink href="/settings" icon={Settings} label="Settings" />
        <SidebarLink href="/docs" icon={BookOpen} label="Documentation" external />
      </nav>
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
        Version 1.0.0
      </div>
    </aside>
  )
}
```

**3. TopBar**
```tsx
// components/layout/top-bar.tsx
export function TopBar() {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-8">
      <CommandPaletteTrigger />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  )
}
```

---

## 7. Interaction Patterns

### 7.1 Loading States

**Skeleton Loaders (Preferred):**
```tsx
// Metric Card Skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-24" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-3 w-20 mt-2" />
  </CardContent>
</Card>

// Table Skeleton
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {[...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Button Loading States:**
```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Creating..." : "Create App"}
</Button>
```

**Page-Level Loading:**
```tsx
// app/apps/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" /> {/* Page title */}
      <div className="grid grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" /> {/* Table */}
    </div>
  )
}
```

### 7.2 Error States

**Inline Form Errors:**
```tsx
<FormField
  control={form.control}
  name="appName"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>App Name</FormLabel>
      <FormControl>
        <Input
          {...field}
          className={fieldState.error ? "border-destructive" : ""}
        />
      </FormControl>
      <FormMessage /> {/* Auto-displays error */}
    </FormItem>
  )}
/>
```

**Page-Level Errors:**
```tsx
// app/apps/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

**Toast Notifications (Error):**
```tsx
import { toast } from "sonner"

// Error toast
toast.error("Failed to create application", {
  description: "Please check your inputs and try again.",
})

// Promise toast (auto-handles loading/success/error)
toast.promise(
  createApp(data),
  {
    loading: "Creating application...",
    success: "Application created successfully",
    error: "Failed to create application",
  }
)
```

### 7.3 Success Feedback

**Toast Notifications (Success):**
```tsx
toast.success("Application created successfully", {
  description: "You can now start integrating SSO.",
})

// With action
toast.success("Application deleted", {
  action: {
    label: "Undo",
    onClick: () => restoreApp(),
  },
})
```

**Inline Success (Forms):**
```tsx
{isSuccess && (
  <Alert variant="success">
    <CheckCircle className="h-4 w-4" />
    <AlertTitle>Success!</AlertTitle>
    <AlertDescription>
      Your changes have been saved.
    </AlertDescription>
  </Alert>
)}
```

**Visual Feedback (Buttons):**
```tsx
// Copy button success state
<Button onClick={handleCopy}>
  {copied ? (
    <>
      <Check className="mr-2 h-4 w-4 text-success" />
      Copied!
    </>
  ) : (
    <>
      <Copy className="mr-2 h-4 w-4" />
      Copy
    </>
  )}
</Button>
```

### 7.4 Confirmation Dialogs

**Destructive Actions:**
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete App</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete
        your application and remove all data.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground"
        onClick={handleDelete}
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**With Confirmation Input:**
```tsx
const [confirmText, setConfirmText] = useState('')
const isValid = confirmText === appName

<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete "{appName}"?</AlertDialogTitle>
      <AlertDialogDescription>
        Type the app name to confirm deletion.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <Input
      placeholder={`Type "${appName}" to confirm`}
      value={confirmText}
      onChange={(e) => setConfirmText(e.target.value)}
    />
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        disabled={!isValid}
        onClick={handleDelete}
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 7.5 Optimistic Updates

**Example: Toggle App Status**
```tsx
import { useOptimistic } from 'react'

function AppStatusToggle({ app }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(app.status)

  async function handleToggle() {
    const newStatus = optimisticStatus === 'active' ? 'inactive' : 'active'

    // Optimistically update UI
    setOptimisticStatus(newStatus)

    try {
      // Make API call
      await updateAppStatus(app.id, newStatus)
      toast.success(`App ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
    } catch (error) {
      // Revert on error
      setOptimisticStatus(app.status)
      toast.error("Failed to update status")
    }
  }

  return (
    <Switch
      checked={optimisticStatus === 'active'}
      onCheckedChange={handleToggle}
    />
  )
}
```

---

## 8. Accessibility

### 8.1 Keyboard Navigation

**Tab Order:**
- Natural tab order follows visual layout
- No `tabIndex` > 0 (anti-pattern)
- Skip links for main content:
  ```tsx
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
  >
    Skip to main content
  </a>
  ```

**Keyboard Shortcuts:**
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      openCommandPalette()
    }

    // Close modals
    if (e.key === 'Escape') {
      closeModal()
    }

    // Submit forms
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      submitForm()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

**Focus Management:**
```tsx
// Auto-focus first input in modal
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  if (isOpen) {
    inputRef.current?.focus()
  }
}, [isOpen])

<Dialog open={isOpen}>
  <DialogContent>
    <Input ref={inputRef} />
  </DialogContent>
</Dialog>
```

### 8.2 Focus Management

**Focus Visible States:**
```css
/* All interactive elements */
.focus-visible\:ring-2:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Buttons */
button:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Links */
a:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  text-decoration: underline;
}
```

**Focus Trap in Modals:**
- shadcn/ui Dialog automatically handles focus trapping
- Focus returns to trigger element on close

### 8.3 ARIA Labels

**Icon Buttons:**
```tsx
<Button variant="ghost" size="icon" aria-label="Copy API key">
  <Copy className="h-4 w-4" />
</Button>

<Button variant="ghost" size="icon" aria-label="Delete application">
  <Trash2 className="h-4 w-4" />
</Button>
```

**Form Fields:**
```tsx
<FormField
  control={form.control}
  name="appName"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="app-name">App Name</FormLabel>
      <FormControl>
        <Input
          id="app-name"
          {...field}
          aria-describedby="app-name-description"
          aria-invalid={!!errors.appName}
        />
      </FormControl>
      <FormDescription id="app-name-description">
        Choose a unique name for your application
      </FormDescription>
      {errors.appName && (
        <FormMessage role="alert" aria-live="polite">
          {errors.appName.message}
        </FormMessage>
      )}
    </FormItem>
  )}
/>
```

**Live Regions (for dynamic updates):**
```tsx
<div aria-live="polite" aria-atomic="true">
  {successMessage}
</div>

// Assertive for critical errors
<div aria-live="assertive" role="alert">
  {errorMessage}
</div>
```

**Table Accessibility:**
```tsx
<Table>
  <caption className="sr-only">List of OAuth applications</caption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Name</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Created</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {/* ... */}
  </TableBody>
</Table>
```

### 8.4 Color Contrast

**WCAG 2.1 AA Requirements:**
- Normal text (< 18px): 4.5:1 contrast ratio
- Large text (≥ 18px): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Verify Contrast:**
```tsx
// Good examples (from design system)
--foreground: 222.2 84% 4.9%;   /* Near black on white: 21:1 */
--muted-foreground: 215.4 16.3% 46.9%; /* Gray on white: 4.6:1 */
--primary: 221.2 83.2% 53.3%;   /* Blue on white: 4.5:1 */

// Dark mode adjustments
.dark {
  --foreground: 210 40% 98%;     /* Off-white on dark: 18:1 */
  --primary: 217.2 91.2% 59.8%;  /* Lighter blue on dark: 4.7:1 */
}
```

**Don't Rely on Color Alone:**
```tsx
// Bad: Color-only status
<span className="text-success">Active</span>

// Good: Color + icon + text
<Badge variant="success">
  <CheckCircle className="h-3 w-3 mr-1" />
  Active
</Badge>
```

### 8.5 Screen Reader Support

**Semantic HTML:**
```tsx
// Navigation
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Dashboard</a></li>
    <li><a href="/apps">Applications</a></li>
  </ul>
</nav>

// Main content
<main id="main-content">
  {/* Page content */}
</main>

// Complementary content
<aside aria-label="Quick actions">
  {/* Sidebar content */}
</aside>
```

**Hidden Content (for screen readers):**
```tsx
// Utility class from Tailwind
<span className="sr-only">
  Showing page 1 of 5
</span>

// Alternative with shadcn/ui
<VisuallyHidden>
  <h1>Dashboard Overview</h1>
</VisuallyHidden>
```

**Announcements:**
```tsx
import { toast } from "sonner"

// Toasts are automatically announced to screen readers
toast.success("Application created successfully")

// Custom live region
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

---

## 9. Responsive Design

### 9.1 Breakpoints

**TailwindCSS Breakpoints (from ui-ux-trends-2025.md):**
```
sm:  640px   (mobile landscape)
md:  768px   (tablet portrait)
lg:  1024px  (tablet landscape / small desktop)
xl:  1280px  (desktop)
2xl: 1536px  (large desktop)
```

### 9.2 Mobile Breakpoints

**Layout Transformations:**

| Component | Desktop (> 1024px) | Tablet (768-1024px) | Mobile (< 768px) |
|-----------|-------------------|---------------------|------------------|
| Sidebar | Fixed, 240px width | Collapsed, icon-only | Hamburger menu (overlay) |
| Metric Cards | 4 columns | 2 columns | 1 column |
| Data Table | Full table | Hide less important columns | Card transformation |
| Forms | Single column (max-w-2xl) | Full width | Full width, larger touch targets |
| Charts | Full width, 350px height | Full width, 300px height | Full width, 250px height |
| Modal | max-w-lg centered | max-w-lg centered | Full screen (mobile) |

### 9.3 Table to Card Transformation

**Desktop Table:**
```tsx
<div className="hidden md:block">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Owner</TableHead>
        <TableHead>Created</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {apps.map((app) => (
        <TableRow key={app.id}>
          <TableCell>{app.name}</TableCell>
          <TableCell><StatusBadge status={app.status} /></TableCell>
          <TableCell>{app.owner}</TableCell>
          <TableCell>{app.createdAt}</TableCell>
          <TableCell><ActionsMenu app={app} /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

**Mobile Cards:**
```tsx
<div className="md:hidden space-y-4">
  {apps.map((app) => (
    <Card key={app.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{app.name}</CardTitle>
          <StatusBadge status={app.status} />
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Owner</dt>
            <dd>{app.owner}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{app.createdAt}</dd>
          </div>
        </dl>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">View</Button>
          <Button variant="outline" size="sm">Edit</Button>
          <ActionsMenu app={app} />
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### 9.4 Sidebar Responsive Behavior

**Desktop Sidebar:**
```tsx
// components/layout/sidebar.tsx
export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
      {/* Sidebar content */}
    </aside>
  )
}
```

**Mobile Hamburger Menu:**
```tsx
// components/layout/mobile-nav.tsx
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <nav className="space-y-1">
          <SidebarLink href="/" icon={Home} label="Dashboard" />
          <SidebarLink href="/apps" icon={AppWindow} label="Applications" />
          <SidebarLink href="/settings" icon={Settings} label="Settings" />
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

### 9.5 Touch Targets

**Minimum Touch Target Size:**
```tsx
// All buttons on mobile: min 44x44px (Apple HIG)
<Button
  className="min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-auto"
>
  Click me
</Button>

// Icon buttons
<Button
  variant="ghost"
  size="icon"
  className="h-11 w-11 md:h-9 md:w-9"
>
  <Copy className="h-4 w-4" />
</Button>
```

**Spacing Between Targets:**
```tsx
// Buttons in a group: more spacing on mobile
<div className="flex gap-2 md:gap-1">
  <Button>Save</Button>
  <Button>Cancel</Button>
</div>
```

---

## Summary

This UI/UX design specification provides a complete blueprint for implementing the SSO Admin Dashboard with:

1. **8 Core Screens**: Dashboard, Apps List, Create App, App Details, Edit App, Regenerate Secret Modal, Delete App Modal, App Analytics
2. **Industry Best Practices**: Show-once API secrets (Stripe), Command palette (Vercel), Danger Zone (Auth0), Dark mode (all)
3. **Component-Based Architecture**: All UI elements mapped to shadcn/ui components
4. **Accessibility-First**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
5. **Responsive Design**: Mobile-first with card transformations, collapsible sidebar, touch-friendly targets

**Next Steps for Phase 2 Implementation:**
1. Set up Next.js 14 project with App Router
2. Install shadcn/ui and required components
3. Implement layout components (Sidebar, TopBar, Breadcrumbs)
4. Build 8 screens following wireframes
5. Add interactions (loading, error, success states)
6. Test accessibility with screen readers and keyboard
7. Optimize for mobile responsiveness

**Total Document Pages**: 35 pages (as requested)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-12
**Author**: Claude (ui-ux-designer)
**Purpose**: Complete visual specification for SSO Admin Dashboard Phase 2 implementation
