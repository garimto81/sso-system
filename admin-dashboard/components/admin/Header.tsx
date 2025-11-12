'use client'

/**
 * Admin Header
 * User info and logout
 */

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {/* Breadcrumb or page title can go here */}
        </div>

        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="text-sm">
            <p className="font-medium text-gray-900">Admin User</p>
            <p className="text-gray-500">admin@example.com</p>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
