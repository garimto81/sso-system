/**
 * Type Definitions
 * Shared types across the application
 */

// =====================================
// User Types
// =====================================

export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  role: UserRole
  display_name: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  role: UserRole
  display_name: string | null
  created_at: string
  updated_at: string
}

// =====================================
// App Types
// =====================================

export interface App {
  id: string
  name: string
  description: string | null
  api_key: string
  redirect_urls: string[]
  allowed_origins: string[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateAppInput {
  name: string
  description?: string
  redirect_urls: string[]
  allowed_origins: string[]
}

export interface UpdateAppInput {
  name?: string
  description?: string
  redirect_urls?: string[]
  allowed_origins?: string[]
  is_active?: boolean
}

export interface CreateAppResponse {
  app: App
  api_secret: string // ⚠️ Only returned on creation, NEVER stored/cached
}

export interface RegenerateSecretResponse {
  api_secret: string // ⚠️ Only returned on regeneration
  message: string
}

// =====================================
// Analytics Types
// =====================================

export type EventType =
  | 'app_created'
  | 'app_updated'
  | 'app_deleted'
  | 'secret_regenerated'
  | 'login'
  | 'token_exchange'
  | 'authorization'
  | 'error'

export interface AnalyticsEvent {
  id: string
  app_id: string | null
  event_type: EventType
  user_id: string | null
  metadata: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AppAnalytics {
  total_events: number
  login_count: number
  token_exchange_count: number
  error_count: number
  unique_users: number
  events_by_day: Array<{
    date: string
    count: number
  }>
  events_by_type: Array<{
    event_type: EventType
    count: number
  }>
}

export interface DashboardStats {
  total_apps: number
  active_apps: number
  total_users: number
  logins_today: number
  recent_events: AnalyticsEvent[]
}

// =====================================
// API Response Types
// =====================================

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface ListAppsResponse {
  apps: App[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface AppDetailsResponse {
  app: App
  stats: {
    total_logins: number
    total_token_exchanges: number
    last_activity: string | null
  }
}

// =====================================
// Authentication Types
// =====================================

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// =====================================
// Form Types
// =====================================

export interface FormErrors {
  [key: string]: string | undefined
}

export interface FormState<T> {
  data: T
  errors: FormErrors
  isSubmitting: boolean
}

// =====================================
// UI Component Types
// =====================================

export interface Option {
  label: string
  value: string
}

export interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (item: T) => React.ReactNode
}

export interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  isLoading?: boolean
  emptyMessage?: string
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// =====================================
// Filter/Search Types
// =====================================

export interface AppFilters {
  search?: string
  is_active?: boolean
  created_by?: string
  page?: number
  limit?: number
}

export interface AnalyticsFilters {
  app_id?: string
  event_type?: EventType
  start_date?: string
  end_date?: string
  days?: number
}

// =====================================
// Utility Types
// =====================================

export type SortOrder = 'asc' | 'desc'

export interface SortConfig<T> {
  key: keyof T
  order: SortOrder
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]
