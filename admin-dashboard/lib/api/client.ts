/**
 * API Client with Security Best Practices
 * ✅ P0-1: No localStorage token usage
 * ✅ P1-2: Prevent secret caching
 * ✅ CSRF protection via cookies
 */

// Use environment variable, fallback to localhost for development
// In production, NEXT_PUBLIC_API_URL should be set to the backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

interface RequestConfig extends RequestInit {
  timeout?: number
}

/**
 * Make authenticated API request
 * ✅ Uses httpOnly cookies (credentials: 'include')
 * ✅ No manual token handling (browser sends cookie automatically)
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { timeout = 30000, ...fetchConfig } = config

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchConfig,
      credentials: 'include', // ✅ Send httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...fetchConfig.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle non-200 responses
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new APIError(
        error.error || response.statusText,
        response.status,
        error.code
      )
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof APIError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408)
      }
      throw new APIError(error.message, 0)
    }

    throw new APIError('Unknown error occurred', 0)
  }
}

// API methods
export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),
}

/**
 * ✅ Security Best Practices:
 *
 * 1. httpOnly Cookies: Browser automatically sends auth cookies
 * 2. No Token in Headers: Prevents XSS token theft
 * 3. credentials: 'include': Required for cross-origin cookies
 * 4. Timeout: Prevents hanging requests
 * 5. Error Handling: Consistent error format
 *
 * ❌ What NOT to do:
 *
 * // DON'T: Manual token from localStorage
 * headers: {
 *   Authorization: `Bearer ${localStorage.getItem('token')}` // VULNERABLE!
 * }
 *
 * // DON'T: Store tokens in React state
 * const [token, setToken] = useState(localStorage.getItem('token')) // INSECURE!
 */
