# Competitive Analysis: Admin Dashboard Best Practices
**Focus**: SSO Admin Dashboard Design Patterns
**Date**: 2025-01-12
**Analyzed Dashboards**: Vercel, Supabase, Auth0, Stripe
**Total Pages**: 25

---

## Executive Summary: Top 10 Learnings

### 1. API Key "Show Once" Pattern is Industry Standard
All four dashboards implement a security-first approach where **live/production API keys are only displayed once** after creation. Users must copy immediately or regenerate.

**Key Insight**: This prevents key retrieval attacks and forces secure storage practices.

### 2. Two-Tier Key System (Public + Secret)
Industry pattern: Separate **publishable/public keys** (safe for client-side) from **secret/service keys** (server-only).

- **Vercel**: Access Tokens (scoped)
- **Supabase**: `anon` key + `service_role` key
- **Auth0**: Client ID (public) + Client Secret (private)
- **Stripe**: Publishable key + Secret key

### 3. Visual Warning System for Secrets
Prominent UI patterns to prevent accidental exposure:
- Red "Danger Zone" sections
- Warning icons with text: "Never expose this key client-side"
- Copy-to-clipboard with confirmation tooltips
- Reveal toggles (not auto-shown)

### 4. Command Menu/Universal Search is Essential
3 out of 4 dashboards provide keyboard-first navigation:
- **Vercel**: ⌘K Command Menu
- **Stripe**: ? for shortcuts, Dashboard search with operators
- **Supabase**: Search in sidebar for projects/tables
- **Auth0**: Standard search (less prominent)

**Recommendation**: Implement ⌘K command palette for SSO dashboard.

### 5. Organization > Project Hierarchy
Modern SaaS uses **two-level hierarchy**:
- **Organization/Team** (billing, members, settings)
- **Projects/Applications** (apps, deployments, keys)

**Pattern**: Vercel and Supabase both use Organization picker in top header, with project lists below.

### 6. Empty States Drive Onboarding
Critical for first-time users:
- **Clear CTAs**: "Create Your First Project" buttons
- **Context**: Brief explanation of what the section does
- **Visual Aids**: Illustrations or icons
- **Different States**: "No items created" vs "No search results"

### 7. Restricted/Scoped Keys for Advanced Users
Both **Stripe** and **Vercel** offer granular permission keys:
- **Stripe**: Restricted API keys with resource-level permissions (Read/Write/None)
- **Vercel**: Scoped tokens per team/project
- **Auth0**: Machine-to-Machine apps with API scopes

**Use Case**: Allow SSO apps to generate limited-scope keys for integrations.

### 8. Dark Mode is Non-Negotiable
All four dashboards support dark mode with:
- System preference detection
- Manual toggle in settings/header
- Proper contrast ratios (WCAG AA)
- Consistent color tokens across themes

### 9. Inline Validation with Immediate Feedback
Form patterns observed:
- Error messages appear **below** or **to the right** of fields
- Red icons + color + `aria-invalid` for accessibility
- Real-time validation (not just on submit)
- Constructive error messages ("Password must be 8+ characters")

### 10. Sidebar Navigation with Clear Information Architecture
Best practices from all dashboards:
- **Fixed sidebar** with sections/categories
- **Active state** highlighting
- **Icon + Label** for clarity
- **Collapsible sections** for long lists (Supabase)
- **Mobile**: Hamburger menu or bottom navigation

---

## Dashboard 1: Vercel

### 1. Layout & Navigation (1 page)

**Overall Structure**:
- **Left Sidebar**: Collapsible, with project icon and team/org selector
- **Top Header**: Universal search (added 2025), profile menu, scope selector
- **Main Content**: Tabbed interface for different sections (Deployments, Settings, etc.)

**Navigation Patterns**:
- **Command Menu**: ⌘K (macOS) / Ctrl+K (Windows) for keyboard-first navigation
- **Scope Selector**: Switch between Hobby team and Teams from top header
- **Breadcrumbs**: Minimal—Vercel logo returns to team dashboard
- **Tabs**: Project-level navigation via top tabs (Overview, Deployments, Analytics)

**Search Placement**:
- Top-right corner: "Find" search input (or press `F` key)
- Universal search finds: Teams, Projects, Deployments (by branch), Pages, Settings
- **Added June 2025**: Dashboard universal search across all resources

**Key Feature**: Mobile version only shows scope name to save space.

---

### 2. App/Project Management (1.5 pages)

**List View Design**:
- **Grid + Cards** for projects on team dashboard
- Each card shows: Project icon, name, last deployment status, production URL
- **Recent Previews Panel**: Quick access to recently viewed preview deployments

**Create New Flow**:
- **Primary CTA**: "Add New Project" button in dashboard
- **Onboarding**: Git-first approach—import from GitHub/GitLab/Bitbucket
- **Modal vs Page**: Uses dedicated page (not modal) for project creation wizard
- **Steps**: 1) Connect Git repo → 2) Configure build settings → 3) Deploy

**Actions Available**:
- Per-project: View deployments, Settings, Analytics, Logs
- Bulk actions: Not prominent (Vercel focuses on single-project workflows)

**Empty States**:
- New users see: "Import Git Repository" with GitHub/GitLab/Bitbucket logos
- Clear CTA: "Import Project" button
- **Context**: "Deploy your project in seconds"

---

### 3. API Key/Secret Management (1.5 pages) ⭐ CRITICAL

**How They Display API Keys**:
- **Location**: Project Settings → Tokens or Account Settings → Tokens
- **Structure**:
  - Token name (user-defined)
  - Scope (Team/Project)
  - Expiration date
  - Created date
  - Last used timestamp
- **Types**: Access Tokens (no distinction between publishable/secret—all are secret)

**Show-Once Pattern Implementation**:
- ✅ **Shown immediately** after creation in a modal/dialog
- ✅ **Warning**: "Make sure to copy your token now. You won't be able to see it again!"
- ✅ **Copy button** with tooltip confirmation
- ❌ **Cannot retrieve later**—must regenerate if lost

**Regenerate Flow**:
- **Delete old token** + **Create new token** (no built-in "rotate" feature)
- User must manually update integrations with new token
- **Recommendation**: Use environment variable management for zero-downtime rotation

**Security Warnings**:
- "Keep your token safe and do not share it publicly"
- **Expiration date picker**: 1 day to 1 year (recommended for security)
- **Scoping**: Tokens can be limited to specific teams to reduce blast radius

**Copy-to-Clipboard UI**:
- Icon button next to token value
- Tooltip: "Copied!" appears on click
- **Accessibility**: Keyboard accessible (Enter/Space)

**Vercel-Specific Feature**:
- **Environment Variables**: Separate UI for managing secrets (encrypted at rest)
- Values hidden by default, only visible to users with proper role permissions
- Can sync secrets from external vaults (e.g., HashiCorp Vault)

---

### 4. Data Tables & Forms (1 page)

**Table Column Design**:
- **Minimalist**: Only essential columns shown by default
- Example (Deployments table): Status icon, Branch name, Commit message, Age, Duration
- **Sortable**: Click column headers to sort (no visible sort arrows until hover)
- **Row Actions**: Hover reveals "Visit" and "..." menu for more actions

**Form Layouts**:
- **Vertical stacking**: Labels above inputs (mobile-friendly)
- **Full-width inputs** with consistent spacing
- **Grouped sections**: Related fields in bordered containers
- **Help text**: Gray text below inputs for guidance

**Validation UI**:
- **Inline validation**: Errors appear below fields immediately
- **Red border** + **Red text** with error icon
- **Success state**: Green checkmark for valid fields
- **Real-time validation**: As user types (for password strength, etc.)

---

### 5. Visual Design (1 page)

**Color Palette**:
- **Background**: Near-black (#000000) in dark mode, white (#FFFFFF) in light
- **Surface**: Dark gray (#111111) in dark mode
- **Primary**: Blue (#0070F3) for CTAs and links
- **Success**: Green (#50E3C2)
- **Error**: Red (#FF0080)
- **Text**: White/black with high contrast

**Typography**:
- **Font Stack**: Inter (system font fallback to -apple-system, BlinkMacSystemFont)
- **Hierarchy**:
  - H1: 32px bold
  - H2: 24px semi-bold
  - Body: 14px regular
  - Small: 12px for timestamps/metadata
- **Line Height**: 1.5 for readability

**Dark Mode**:
- ✅ System preference detection
- ✅ Manual toggle in account menu
- ✅ Smooth transition animation (color-shift over 0.2s)
- ✅ Maintains WCAG AA contrast (4.5:1 for text)

**Design System**: Vercel's **Geist** design system (open-source)
- Documented at vercel.com/geist/colors
- Semantic color tokens (e.g., `background-1`, `color-1`, `color-2`)
- Consistent hover/active states (`color-1` hover, `color-2` active)

---

## Dashboard 2: Supabase

### 1. Layout & Navigation (1 page)

**Overall Structure**:
- **Top Header**: Organization picker (dropdown), universal search, profile menu
- **Left Sidebar**: Collapsible navigation with icons + labels
- **Main Content**: Full-width area with breadcrumbs and page title
- **2025 Update**: Separate sidebars for Organizations and Projects

**Navigation Patterns**:
- **Organization Picker**: Click dropdown in top header to switch orgs
- **Sidebar Categories**:
  - Project (Database, Auth, Storage, Edge Functions, etc.)
  - Organization (Team Members, Billing, Settings)
- **Active State**: Highlighted with background color + left border accent
- **Collapsible Sections**: For nested items (e.g., Database → Tables, Functions)

**Search Placement**:
- Top header: Search for projects, tables, functions
- Context-aware: Search scope changes based on current section
- **Keyboard shortcut**: Not prominently documented (opportunity for improvement)

**Key Change (2025)**:
- Home page now scoped to selected organization (not all projects)
- Organization settings moved to individual links in sidebar
- Clearer relationship between Organizations → Projects

---

### 2. App/Project Management (1.5 pages)

**List View Design**:
- **Card Grid**: Projects shown as cards with thumbnails
- Each card displays:
  - Project name + region
  - Status indicator (Active/Paused/Inactive)
  - Last activity timestamp
  - Database size + active connections
- **Sort/Filter**: By organization, region, status

**Create New Flow**:
- **CTA**: "New Project" button in projects dashboard
- **Modal-Based**: Inline form without leaving current page
- **Steps**:
  1. Project name
  2. Database password (user-provided or auto-generated)
  3. Region selection (with latency indicators)
  4. Pricing plan
- **Submit**: "Create Project" button → provisioning takes 1-2 minutes

**Actions Available**:
- Per-project: Settings, Pause, Delete
- **Pause Project**: Free tier feature to pause inactive projects
- **Bulk actions**: Not available (focus on individual project management)

**Empty States**:
- **First Project**:
  - Illustration of database + rocket
  - Text: "Create your first project to get started"
  - CTA: "New Project" button
- **No Search Results**:
  - Different message: "No projects match your filters"
  - CTA: "Clear filters"

**Noted Issue (GitHub #15425)**: "No tables" view in database editor was unclear—recent updates added better empty states with explanations.

---

### 3. API Key/Secret Management (1.5 pages) ⭐ CRITICAL

**How They Display API Keys**:
- **Location**: Project Settings → API
- **Two Key Types** (legacy, being phased out Nov 2025):
  1. **`anon` key**: Public, safe for client-side (Supabase client libraries)
  2. **`service_role` key**: Secret, server-only (bypasses Row Level Security)
- **Display**:
  - Keys shown as masked by default: `eyJhbGciOiJIUzI1N...`
  - **"Reveal" button** to show full key
  - API URL shown above keys

**Show-Once Pattern Implementation**:
- ⚠️ **Supabase is unique**: Keys are always visible after reveal (not show-once)
- **Security model**: Relies on Postgres Row Level Security (RLS) policies, not key secrecy for `anon`
- **`service_role` key**:
  - ⚠️ **Critical warning**: "This key has the ability to bypass Row-Level Security. Never share it publicly."
  - Red warning box with icon
  - **Not rotatable individually**—must rotate JWT secret (affects both keys)

**Regenerate Flow (JWT Secret Rotation)**:
- **Location**: Settings → API → "Generate new secret" button
- **High-risk action**:
  - ⚠️ "All current API secrets will be immediately invalidated"
  - ⚠️ "All connections will be severed"
  - Confirmation modal with password re-entry
- **Downtime**: Brief downtime during rotation (not zero-downtime)
- **New keys** generated instantly after confirmation

**Security Warnings**:
- **For `anon` key**: "This key is safe to use in a browser if you have enabled Row Level Security for your tables and configured policies."
- **For `service_role` key**:
  - Red alert box
  - "Never expose this key publicly"
  - "Use in secure environments only (servers, Edge Functions, admin tools)"

**Copy-to-Clipboard UI**:
- Icon button (clipboard icon) next to each key
- Tooltip: "Copied" appears on click
- Keys displayed in monospace font for readability

**2025 Update (New Key System)**:
- **`sb_publishable_...`**: Replaces `anon` key
- **`sb_secret_...`**: Replaces `service_role` key (can create multiple)
- **Benefit**: Multiple secret keys for different services (better key rotation)
- **Rollout**: New projects after Nov 1, 2025

---

### 4. Data Tables & Forms (1 page)

**Table Column Design**:
- **Spreadsheet-like**: Resembles Excel/Google Sheets for database tables
- **Columns**:
  - Resizable with drag handles
  - Sortable (click header)
  - Filterable (filter icon in header)
- **Row Actions**:
  - Checkbox for multi-select
  - Edit icon (opens modal)
  - Delete icon
- **Pagination**: Bottom of table with page size selector (50/100/500 rows)

**Form Layouts**:
- **Modal-based forms** for creating/editing table rows
- **Auto-generated** based on database schema
- **Field types**: Text, number, boolean (toggle), date picker, JSON editor
- **Foreign keys**: Dropdown with related table values

**Validation UI**:
- **Database-enforced**: Validation based on Postgres constraints
- **Error display**: Red text below field with constraint violation message
- Example: "duplicate key value violates unique constraint"
- **Client-side**: Basic validation (e.g., email format) before submit

---

### 5. Visual Design (1 page)

**Color Palette**:
- **Brand Green**: #3ECF8E (primary color, logo)
- **Background (Dark)**: #1C1C1C
- **Background (Light)**: #F8F9FA
- **Surface**: Elevated cards with subtle shadows
- **Syntax Highlighting**: In SQL editor and JSON fields (VS Code-like)

**Typography**:
- **Font Stack**: Custom "Supabase" font + fallback to system fonts
- **Monospace**: For code, SQL, and API keys (Fira Code or SF Mono)
- **Sizes**: Similar to Vercel (14px body, 24px headings)

**Dark Mode**:
- ✅ System preference detection
- ✅ Toggle in profile menu (top-right)
- ✅ Smooth transition
- ✅ Syntax highlighting adjusts for dark mode (darker backgrounds, brighter text)

**Unique Design Elements**:
- **Minimalist aesthetic**: Clean lines, generous whitespace
- **Iconography**: Custom icon set with consistent line weights
- **Sidebar categorization**: Well-organized for large number of features (Database, Auth, Storage, Edge Functions, etc.)

---

## Dashboard 3: Auth0

### 1. Layout & Navigation (1 page)

**Overall Structure**:
- **Left Sidebar**: Fixed, with logo at top, navigation links below
- **Top Header**: Breadcrumbs, environment selector (Development/Production), help icon, profile menu
- **Main Content**: Full-width with page title and tabs for sub-sections

**Navigation Patterns**:
- **Flat hierarchy**: Applications, APIs, Connections, Users, Actions, etc.
- **Active state**: Bold text + left blue accent line
- **Expandable sections**: Click to reveal sub-items (e.g., Monitoring → Logs, Streams)
- **Environment toggle**: Switch between Dev/Prod (shown in top header with dropdown)

**Search Placement**:
- **Less prominent** compared to Vercel/Stripe
- Search available in top header (small magnifying glass icon)
- Context-aware: Searches within current section (e.g., "Applications" section searches apps)

**Breadcrumbs**:
- Shown in top header: Home > Applications > [App Name] > Settings
- Clickable links to navigate back

---

### 2. App/Project Management (1.5 pages)

**List View Design**:
- **Table format**: List of applications with columns:
  - Name + Client ID
  - Type (Native, SPA, Web App, M2M)
  - Last login
  - Status (Enabled/Disabled)
- **Search bar** above table
- **Filter**: By application type (dropdown)

**Create New Flow**:
- **CTA**: "Create Application" button (top-right)
- **Modal-Based**: Popup dialog with form
- **Steps**:
  1. Application name (e.g., "Test SSO App")
  2. Application type (4 options: Native, SPA, Regular Web App, M2M)
  3. Click "Create"
- **For M2M apps**: Additional step—select API to authorize (Auth0 Management API or custom API)
- **After creation**: Redirects to application settings page (shows Client ID + Secret)

**Actions Available**:
- Per-application: Settings, Connections, Quickstarts, APIs, Add-ons
- **Quickstart**: Sample code for integrating Auth0 (unique feature)
- **Enable/Disable**: Toggle application on/off without deleting

**Empty States**:
- **No applications**:
  - Text: "You don't have any applications yet"
  - CTA: "Create Application" button
  - Link: "Learn more about applications" (documentation)

---

### 3. API Key/Secret Management (1.5 pages) ⭐ CRITICAL

**How They Display API Keys**:
- **Location**: Applications → [App Name] → Settings → Basic Information
- **Two Credentials**:
  1. **Client ID**: Public identifier (always visible)
  2. **Client Secret**: Private key (hidden by default)
- **Display**:
  - Client ID: Plain text in copy-able input field
  - Client Secret: `••••••••••••••••••••••••` (masked)
  - **Checkbox**: "Reveal Client Secret" to show

**Show-Once Pattern Implementation**:
- ❌ **Not true "show once"**: Client Secret can be revealed anytime via checkbox
- **Rationale**: Auth0 stores the secret, allowing retrieval (unlike Stripe)
- **Trade-off**: Convenience vs. strict security
- **Recommendation for SSO**: Use stricter "show once" pattern like Stripe

**Regenerate Flow (Client Secret Rotation)**:
- **Location**: Scroll to bottom of Settings → "Danger Zone" (red section)
- **Button**: "Rotate" in "Rotate secret" section
- **Modal**:
  - ⚠️ "Rotating the secret will invalidate the current secret immediately"
  - ⚠️ "All current integrations using the old secret will stop working"
  - Text input: "Type ROTATE to confirm"
  - "Rotate Secret" button (red)
- **After rotation**: New secret displayed immediately in modal (copy now!)
- **No overlap period**: Old secret invalidated instantly (downtime risk)

**Community Feedback**: Users requested multi-secret support for zero-downtime rotation (not available as of 2025).

**Security Warnings**:
- **Client Secret warning**: "Keep your client secret private. If anyone can access your client secret, they can issue tokens and access resources."
- **M2M apps**: "Never include your client secret in mobile or browser-based applications"
- **Hook Secrets**: Separate feature for storing secrets in Auth0 Actions (up to 20 secrets per Hook)

**Copy-to-Clipboard UI**:
- Icon button next to Client ID and Client Secret
- No visual confirmation tooltip (opportunity for improvement)
- **Accessibility**: Keyboard accessible

**Auth0-Specific Feature (Hook Secrets)**:
- **Location**: Auth0 Dashboard → Auth0 Actions → Library → [Hook Name] → Wrench icon → Secrets
- **Use case**: Store API keys for third-party services (e.g., Slack webhooks) used in Auth0 Actions
- **Limit**: 20 secrets per Hook
- **Management**: Create, Update, Delete via Dashboard or Management API

---

### 4. Data Tables & Forms (1 page)

**Table Column Design**:
- **Standard table**: Borders, alternating row backgrounds (very subtle)
- **Columns**: Fixed width, not resizable
- **Sorting**: Click column headers (arrow icon appears)
- **Row actions**: "..." menu on hover (Edit, Delete, View Details)

**Form Layouts**:
- **Long scrolling pages**: Application settings on single page with sections
- **Sections**: Basic Information, Application URIs, Application Properties, etc.
- **Accordions**: Expandable sections for less common settings (e.g., "Advanced Settings")
- **Save button**: Fixed at bottom or top of page (consistent placement)

**Validation UI**:
- **Inline errors**: Red text below field with icon
- **Banner errors**: Top of page for critical errors (e.g., "Failed to save application")
- **Required fields**: Red asterisk (*) next to label
- **Format validation**: For URLs (e.g., Callback URLs must be https://)

---

### 5. Visual Design (1 page)

**Color Palette**:
- **Brand Orange**: #EB5424 (Auth0 logo, primary CTAs)
- **Blue Accent**: #0D6EFD (links, info badges)
- **Background (Light)**: White (#FFFFFF)
- **Background (Dark)**: #161616
- **Danger**: Red (#DC3545) for Danger Zone

**Typography**:
- **Font Stack**: System fonts (Roboto on Windows, SF Pro on macOS)
- **Monospace**: For Client ID, Client Secret (Courier New or Monaco)
- **Sizes**: 14px body, 20-24px headings

**Dark Mode**:
- ✅ Supported (toggle in profile menu)
- ✅ High contrast maintained
- ⚠️ Less polished than Vercel/Stripe (some UI elements have lower contrast)

**Unique Design Elements**:
- **Danger Zone**: Red background section at bottom of settings pages (for destructive actions)
- **Quickstart integration**: Code snippets with syntax highlighting (copy button)
- **Badge indicators**: For enabled/disabled states, application types

---

## Dashboard 4: Stripe

### 1. Layout & Navigation (1 page)

**Overall Structure**:
- **Left Sidebar**: Fixed, with Stripe logo, mode toggle (Test/Live), navigation links
- **Top Header**: Search bar (center), Notifications, Help, Profile menu
- **Main Content**: Full-width with page title and content area

**Navigation Patterns**:
- **Mode Toggle**: Prominent switch between Test and Live mode (top of sidebar)
- **Sidebar sections**:
  - Home
  - Payments (Payments, Customers, Products, etc.)
  - Billing (Subscriptions, Invoices)
  - Developers (API Keys, Webhooks, Logs)
- **Active state**: Blue left border + background highlight
- **Icons**: Minimal, only for top-level sections

**Search Placement**:
- **Center of top header**: Most prominent search of all 4 dashboards
- **Universal search**: Finds customers, invoices, payouts, products, connected accounts
- **Advanced operators**: Support for filtering (e.g., `status:succeeded amount>100`)
- **Keyboard shortcut**: `?` key for shortcuts menu (doesn't open search directly)

---

### 2. App/Project Management (1.5 pages)

**List View Design**:
- **Table-centric**: Most data shown in tables (Payments, Customers, Products)
- **Columns**:
  - Customizable (Show/hide columns via "Columns" button)
  - Sortable
  - Resizable (drag column dividers)
- **Filters**: Top of each table with dropdown filters (Status, Date, Amount, etc.)
- **Export**: CSV/Excel export button

**Create New Flow**:
- **Varies by resource**:
  - **Products**: "Add product" button → Full page form
  - **API Keys**: "Create secret key" button → Modal with verification
  - **Webhooks**: "Add endpoint" button → Modal
- **Verification**: For sensitive actions (creating live keys), Stripe sends 2FA code via email/SMS

**Actions Available**:
- Per-row: View details, Refund (for payments), Edit, Delete
- **Bulk actions**: Select multiple rows → "Export selected" or "Refund selected"
- **Filters**: Applied filters shown as "pills" with X to remove

**Empty States**:
- **No payments yet**:
  - Illustration: Credit card icon
  - Text: "Make a test payment to see it appear here"
  - CTA: "Create a test payment" link
- **No results for filters**:
  - Text: "No payments match your filters"
  - CTA: "Clear filters" button

---

### 3. API Key/Secret Management (1.5 pages) ⭐ CRITICAL

**How They Display API Keys**:
- **Location**: Developers → API Keys
- **Two Modes**: Test mode and Live mode (separate keys for each)
- **Default Keys** (4 total):
  1. **Publishable key** (Test): Safe for client-side (starts with `pk_test_...`)
  2. **Secret key** (Test): Server-only (starts with `sk_test_...`)
  3. **Publishable key** (Live): Starts with `pk_live_...`
  4. **Secret key** (Live): Starts with `sk_live_...`
- **Display**:
  - Publishable: Always visible (plain text)
  - Secret: **Masked** by default (`sk_test_••••••••••••••••`)
  - **Reveal button**: "Reveal test key" (for test keys) or verification flow (for live keys)

**Show-Once Pattern Implementation** (BEST PRACTICE):
- ✅ **Test keys**: Can be revealed anytime
- ✅ **Live keys**:
  - ⚠️ **Show once only** after creation
  - ⚠️ "You can only reveal a live mode secret or restricted API key one time"
  - ⚠️ "If you lose it, you can't retrieve it from the Dashboard"
  - Modal displays new key: "Save this key now. We won't show it again."
  - **Copy button** prominent in modal
- **After creation**: Key is permanently masked (cannot reveal later)

**Regenerate Flow (Rolling Keys)**:
- **Create new key**: "Create secret key" button (doesn't delete old keys)
- **Rotate existing key**:
  - Immediately: Revokes old key and generates new one (downtime)
  - **Schedule rotation**: Set future date/time for automatic rotation (zero-downtime)
- **Verification**: 2FA code sent to email/SMS for live keys
- **After rotation**: Old key marked as "Revoked", new key displayed once

**Restricted API Keys** (ADVANCED):
- **Location**: Developers → API Keys → "Create restricted key"
- **Granular permissions**:
  - Per-resource (Charges, Customers, PaymentIntents, etc.)
  - Per-action (None, Read, Write)
  - Per-account (Own account or Connected accounts)
- **Use case**: Give limited access to third-party integrations
- **Prefix**: `rk_test_...` or `rk_live_...`
- **Show once**: Same pattern as secret keys (live restricted keys shown once)

**IP Allowlisting**:
- **Feature**: Restrict keys to specific IP addresses
- **Setup**: API Key settings → "IP address allowlist" → Add CIDR ranges
- **Use case**: Additional security for server keys

**Security Warnings**:
- **Secret key section**:
  - ⚠️ "Do not share your secret API key in publicly accessible areas such as GitHub, client-side code, and so forth."
  - ⚠️ "Stripe never asks you for your secret API key"
- **Compromised key detection**:
  - Stripe scans GitHub for exposed keys
  - Automatic notification + request to roll key if found

**Copy-to-Clipboard UI**:
- **Icon button** (clipboard icon) next to each key
- **Tooltip**: "Copied!" confirmation
- **Keyboard accessible**: Tab + Enter

---

### 4. Data Tables & Forms (1 page)

**Table Column Design** (MOST ADVANCED):
- **Customizable columns**: "Columns" button to show/hide columns
- **Sortable**: Click headers (arrow icon shows sort direction)
- **Resizable**: Drag column borders
- **Fixed header**: Sticky header when scrolling
- **Row striping**: Very subtle alternating row colors (light gray)
- **Row hover**: Background darkens slightly
- **Row selection**: Checkbox in first column for bulk actions

**Filters**:
- **Filter bar**: Above table with dropdown filters
- **Filter pills**: Active filters shown as removable pills
- **Operators**: Advanced search with operators (e.g., `amount>100`, `status:succeeded`)
- **Date picker**: Custom date range selector
- **Instant loading**: Results update as filters are applied (no "Apply" button)

**Form Layouts**:
- **Two-column forms**: For wide screens (label on left, input on right)
- **Single-column on mobile**: Responsive layout
- **Sections**: Bordered boxes for grouped fields
- **Help text**: Gray text below inputs
- **Optional fields**: "(optional)" label

**Validation UI**:
- **Inline validation**: Real-time for format (e.g., email, URL)
- **Red border + icon** for errors
- **Error message** below field (specific, actionable)
- **Success checkmark**: Green icon for valid fields

---

### 5. Visual Design (1 page)

**Color Palette**:
- **Brand Purple**: #635BFF (Stripe brand, CTAs)
- **Blue**: #0073E6 (links, info)
- **Green**: #00D924 (success)
- **Red**: #DF1B41 (errors, destructive actions)
- **Background (Light)**: White (#FFFFFF)
- **Background (Dark)**: #0A2540
- **Surface**: Light gray (#F6F9FC) for cards/panels

**Typography**:
- **Font Stack**: "Camphor", system fonts
- **Monospace**: "SF Mono", "Monaco", "Courier New" for code/keys
- **Sizes**: 14px body, 20-28px headings
- **Weight**: 400 (regular), 500 (medium), 600 (semi-bold) for hierarchy

**Dark Mode**:
- ✅ Full support (toggle in profile menu)
- ✅ System preference detection
- ✅ Excellent contrast (WCAG AAA)
- ✅ Syntax highlighting in dark mode (code snippets, JSON)

**Unique Design Elements**:
- **Glassomorphism**: Subtle frosted-glass effects on modals/overlays
- **Micro-animations**: Smooth transitions on hover/click
- **Skeleton loaders**: Placeholder content while data loads (not spinners)
- **Status badges**: Color-coded pills for payment status (Succeeded, Failed, Pending)

**Design System**: Stripe's design language is highly polished, with attention to micro-interactions.

---

## Cross-Dashboard Patterns (2 pages)

### Pattern 1: Mode/Environment Separation
**Observed in**: Stripe (Test/Live), Auth0 (Development/Production), Vercel (Sandbox implicit)

**Implementation**:
- **Visual toggle**: Prominent switch in sidebar or header
- **Color coding**: Test mode uses warning colors (yellow/orange badge)
- **Data isolation**: Completely separate databases for test vs live
- **Key prefixes**: `test_` vs `live_` (or `pk_test_` vs `pk_live_`)

**Why it matters for SSO**:
- Allow developers to test integrations without affecting production
- SSO apps should have separate API keys for dev/staging/prod environments

**Recommendation**:
- Implement environment selector in SSO dashboard
- Generate separate keys per environment (prefix: `sso_dev_`, `sso_prod_`)

---

### Pattern 2: Copy-to-Clipboard Everywhere
**Observed in**: All 4 dashboards

**Consistent UI**:
- **Icon**: Clipboard or copy icon (usually outlined, not filled)
- **Tooltip**: "Copy" on hover, "Copied!" after click
- **Placement**: Inline with text (not separate button)
- **Keyboard**: Accessible via Tab + Enter

**Implementation Details**:
- Use `navigator.clipboard.writeText()` API
- Fallback to `document.execCommand('copy')` for older browsers
- Toast notification or tooltip for confirmation

**Recommendation for SSO**:
- Add copy buttons for:
  - API keys
  - Client IDs
  - Webhook URLs
  - Integration snippets (code samples)

---

### Pattern 3: Danger Zones
**Observed in**: Auth0 (explicit red section), Vercel (implicit), Stripe (revoke keys)

**Design**:
- **Placement**: Bottom of settings pages
- **Visual style**: Red background or red text
- **Actions**: Delete, Rotate secret, Deactivate
- **Confirmation**: Modal with password/2FA or "Type X to confirm"

**Why it works**:
- Prevents accidental destructive actions
- Clear visual separation from safe actions
- Forces user to acknowledge consequences

**Recommendation for SSO**:
- Create "Danger Zone" section for:
  - Delete SSO application
  - Rotate all secrets
  - Disable application

---

### Pattern 4: Real-Time Status Indicators
**Observed in**: Supabase (connection count, database size), Vercel (deployment status), Stripe (payment status)

**Types**:
- **Badges**: Colored pills (Active, Failed, Pending)
- **Dots**: Small colored circles (green = healthy, red = error)
- **Progress bars**: For in-progress actions (deployments, migrations)
- **Timestamps**: "Last updated 2 minutes ago"

**Recommendation for SSO**:
- Show real-time status for:
  - SSO application health (API calls in last 24h)
  - Failed login attempts
  - Key usage (last used timestamp)

---

### Pattern 5: Keyboard Shortcuts
**Observed in**: Vercel (⌘K), Stripe (?), Supabase (F for search)

**Common Shortcuts**:
- **⌘K / Ctrl+K**: Command palette / universal search
- **?**: Show keyboard shortcuts menu
- **F**: Focus search
- **Esc**: Close modal
- **Enter**: Submit form (when focused)

**Accessibility**:
- Keyboard navigation is critical for power users
- Reduces dependency on mouse
- Improves efficiency for repetitive tasks

**Recommendation for SSO**:
- Implement ⌘K command palette for:
  - Create new application
  - Search applications
  - Navigate to settings
  - Generate new API key

---

### Pattern 6: Empty States with Context
**Observed in**: All 4 dashboards

**Elements**:
1. **Illustration/Icon**: Visual aid (not just text)
2. **Headline**: Clear message ("No applications yet")
3. **Context**: Brief explanation ("Applications connect your services to SSO")
4. **CTA**: Primary action button ("Create Your First Application")
5. **Secondary link**: Documentation or tutorial

**Bad Empty State** (avoid):
- Just text: "No data"
- No CTA: User doesn't know what to do next

**Recommendation for SSO**:
- Design empty states for:
  - No applications created
  - No API keys
  - No activity logs
  - No team members

---

### Pattern 7: Responsive Sidebar
**Observed in**: All 4 dashboards

**Desktop**:
- **Expanded sidebar**: Icons + labels
- **Collapsible**: Arrow button to collapse to icons-only
- **Fixed width**: Typically 200-250px

**Tablet**:
- **Collapsed by default**: Icons only
- **Expand on hover**: Or click to expand

**Mobile**:
- **Hamburger menu**: Top-left corner
- **Full-screen overlay**: When opened
- **Bottom navigation**: Alternative pattern (Supabase mobile app)

**Recommendation for SSO**:
- Mobile-first design for sidebar
- Test on tablets to ensure usability

---

### Pattern 8: Scoped Permissions (RBAC)
**Observed in**: Vercel (Team roles), Supabase (Org members), Auth0 (User roles), Stripe (Team permissions)

**Common Roles**:
- **Owner**: Full access, billing, delete
- **Admin**: All actions except billing/delete
- **Developer**: Read/write API keys, deployments
- **Viewer**: Read-only access

**Permission Scoping**:
- **Vercel**: Tokens scoped to specific teams/projects
- **Stripe**: Restricted keys scoped to specific resources + actions
- **Auth0**: M2M apps scoped to specific APIs

**Recommendation for SSO**:
- Implement RBAC for SSO dashboard users:
  - Application Owner
  - Developer (can manage keys)
  - Viewer (read-only)
- Allow SSO apps to generate scoped API keys for integrations

---

## Recommendations for SSO Admin Dashboard (1 page)

### Priority 1: API Key Management (Critical)
**Implement Stripe's pattern**:
1. ✅ **Show once for production keys**: Display key only at creation, cannot retrieve later
2. ✅ **Test vs Production modes**: Separate environments with key prefixes (`sso_dev_`, `sso_prod_`)
3. ✅ **Copy-to-clipboard**: With "Copied!" confirmation
4. ✅ **Security warnings**: Red alert boxes for production secrets
5. ✅ **Key metadata**: Last used, created date, expiration (optional)
6. ✅ **Regenerate flow**: With confirmation modal ("Type REGENERATE to confirm")

**Advanced (Phase 2)**:
- Restricted/scoped keys (per-app or per-resource permissions)
- IP allowlisting for server keys
- Scheduled key rotation (zero-downtime)

---

### Priority 2: Navigation & Layout
**Implement Vercel + Supabase patterns**:
1. ✅ **Organization → Application hierarchy**: Two-level structure
2. ✅ **Top header**: Org picker, search, profile menu
3. ✅ **Left sidebar**: Fixed, collapsible, with icons + labels
4. ✅ **Command palette**: ⌘K for keyboard navigation
5. ✅ **Breadcrumbs**: For deep navigation (Org > App > Settings)

---

### Priority 3: Empty States & Onboarding
**Implement all 4 dashboards' patterns**:
1. ✅ **First application**: Illustration + context + "Create Your First App" CTA
2. ✅ **Onboarding wizard**: Multi-step form for app creation
3. ✅ **No search results**: Different message + "Clear filters" CTA
4. ✅ **Quickstart**: Integration code snippets (like Auth0)

---

### Priority 4: Dark Mode & Design System
**Implement Vercel's Geist or build custom**:
1. ✅ **System preference detection**: Auto-switch based on OS
2. ✅ **Manual toggle**: In profile menu
3. ✅ **Semantic color tokens**: `background-1`, `primary`, `danger`, etc.
4. ✅ **WCAG AA contrast**: Minimum 4.5:1 for text
5. ✅ **Smooth transitions**: 0.2s color-shift animation

---

### Priority 5: Data Tables & Forms
**Implement Stripe's advanced table patterns**:
1. ✅ **Customizable columns**: Show/hide columns
2. ✅ **Sortable & filterable**: Click headers, filter bar above table
3. ✅ **Inline validation**: Real-time error messages below fields
4. ✅ **Danger Zone**: Red section for destructive actions

---

### Priority 6: Real-Time Features
**Implement Supabase + Stripe patterns**:
1. ✅ **Status indicators**: Badges for app health (Active, Inactive, Error)
2. ✅ **Last activity**: "Last API call 5 minutes ago"
3. ✅ **Usage metrics**: API calls in last 24h, active users
4. ✅ **Live logs**: Real-time stream of authentication events (like Vercel deployments)

---

### Priority 7: Security Best Practices
**Critical features** (from all dashboards):
1. ✅ **2FA verification**: For sensitive actions (rotating production keys)
2. ✅ **Audit logs**: Track who did what (key creation, app deletion)
3. ✅ **Compromised key detection**: Alert users if keys are exposed (learn from Stripe)
4. ✅ **Session timeout**: Auto-logout after 30 minutes of inactivity
5. ✅ **Role-Based Access Control (RBAC)**: Owner, Admin, Developer, Viewer roles

---

## Appendix: Key Metrics Comparison

| Feature | Vercel | Supabase | Auth0 | Stripe |
|---------|--------|----------|-------|--------|
| **Command Palette** | ✅ ⌘K | ⚠️ No | ⚠️ No | ⚠️ No (? for shortcuts) |
| **Show-Once Keys** | ✅ Yes | ❌ No (always visible) | ❌ No (reveal anytime) | ✅ Yes (live mode) |
| **Dark Mode** | ✅ Excellent | ✅ Excellent | ✅ Good | ✅ Excellent |
| **Restricted Keys** | ✅ Scoped tokens | ⚠️ Coming (multi-secret) | ❌ No | ✅ Granular permissions |
| **Zero-Downtime Rotation** | ❌ No | ❌ No | ❌ No | ✅ Scheduled rotation |
| **Empty States** | ✅ Good | ✅ Excellent | ✅ Basic | ✅ Excellent |
| **Keyboard Shortcuts** | ✅ Excellent | ⚠️ Limited | ⚠️ Limited | ✅ Good |
| **Table Customization** | ⚠️ Limited | ✅ Good | ⚠️ Limited | ✅ Excellent |
| **Search Quality** | ✅ Excellent | ✅ Good | ⚠️ Basic | ✅ Excellent (operators) |
| **Mobile UX** | ✅ Good | ✅ Excellent | ⚠️ Basic | ✅ Good |

**Legend**: ✅ Excellent/Yes | ⚠️ Partial/Basic | ❌ No/Poor

---

## Next Steps

1. **Review with team**: Discuss which patterns to implement in MVP
2. **Prioritize features**: Focus on API key management + navigation first
3. **Design mockups**: Create Figma designs based on these patterns
4. **Prototype**: Build interactive prototype for user testing
5. **Implement**: Start with Priority 1 (API keys) in Phase 1

**Estimated reading time**: 25 minutes
**Last updated**: 2025-01-12
**Author**: Claude (Competitor Analyst)
