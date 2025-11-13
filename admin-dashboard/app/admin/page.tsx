/**
 * Admin Dashboard Home
 * Overview and statistics
 */

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Apps" value="0" />
        <StatCard title="Active Apps" value="0" />
        <StatCard title="Total Users" value="0" />
        <StatCard title="Logins Today" value="0" />
      </div>

      {/* Welcome Message */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Welcome to SSO Admin Dashboard</h2>
        <p className="text-gray-600">
          Manage your authentication system, applications, and users from here.
        </p>
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
