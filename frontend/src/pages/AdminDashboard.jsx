import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import BASE_URL from '../api'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const statusColors = {
  open:                 'bg-green-900/30 text-green-400',
  assigned:             'bg-yellow-900/30 text-yellow-400',
  pending_confirmation: 'bg-orange-900/30 text-orange-400',
  done:                 'bg-gray-700 text-gray-400',
  disputed:             'bg-red-900/30 text-red-400',
  cancelled:            'bg-gray-700 text-gray-500',
  paid:                 'bg-green-900/30 text-green-400',
  pending:              'bg-yellow-900/30 text-yellow-400',
  failed:               'bg-red-900/30 text-red-400',
  customer:             'bg-blue-900/30 text-blue-400',
  helper:               'bg-purple-900/30 text-purple-400',
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <p className={`text-3xl font-bold ${color || 'text-white'}`}>{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function Badge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[status] || 'bg-gray-700 text-gray-400'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-3">
      <p className="text-xs text-gray-500">
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex gap-2">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-600 transition">
          ← Prev
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`px-3 py-1 text-xs rounded-lg transition ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {p}
            </button>
          )
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-600 transition">
          Next →
        </button>
      </div>
    </div>
  )
}

function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div className="flex gap-2 items-center">
      <input type="date" value={startDate} onChange={e => onStartChange(e.target.value)}
        className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <span className="text-gray-500 text-xs">to</span>
      <input type="date" value={endDate} onChange={e => onEndChange(e.target.value)}
        className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

function AdminDashboard() {
  const [section, setSection] = useState('overview')
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [aiInsights, setAiInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [payments, setPayments] = useState([])
  const [disputes, setDisputes] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [resolveNote, setResolveNote] = useState({})
  const [resolveMsg, setResolveMsg] = useState('')
  const navigate = useNavigate()
  const token = localStorage.getItem('admin_token')
  const headers = { Authorization: `Bearer ${token}` }
  const PER_PAGE = 10

  const apiFetch = async (url) => {
    setLoading(true)
    try {
      const res = await axios.get(url, { headers })
      return res.data
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('admin_token')
        navigate('/admin/login')
      }
      return null
    } finally {
      setLoading(false)
    }
  }

  const buildQuery = (base, extras = {}) => {
    const params = new URLSearchParams({
      search, status: filterStatus, role: filterRole,
      category: filterCategory, start_date: startDate,
      end_date: endDate, page, per_page: PER_PAGE, ...extras
    })
    return `${BASE_URL}${base}?${params}`
  }

  const loadSection = async (s, p = 1) => {
    setPage(p)
    if (s === 'overview') {
      const data = await apiFetch(`${BASE_URL}/admin/stats`)
      if (data) setStats(data)
    } else if (s === 'analytics') {
      const data = await apiFetch(`${BASE_URL}/admin/analytics`)
      if (data) setAnalytics(data)
    } else if (s === 'users') {
      const data = await apiFetch(buildQuery('/admin/users', { page: p }))
      if (data) { setUsers(data.data); setTotal(data.total) }
    } else if (s === 'tasks') {
      const data = await apiFetch(buildQuery('/admin/tasks', { page: p }))
      if (data) { setTasks(data.data); setTotal(data.total) }
    } else if (s === 'payments') {
      const data = await apiFetch(buildQuery('/admin/payments', { page: p }))
      if (data) { setPayments(data.data); setTotal(data.total) }
    } else if (s === 'disputes') {
      const data = await apiFetch(`${BASE_URL}/admin/disputes`)
      if (data) setDisputes(data)
    } else if (s === 'leaderboard') {
      const data = await apiFetch(`${BASE_URL}/admin/leaderboard`)
      if (data) setLeaderboard(data)
    } else if (s === 'logs') {
      const data = await apiFetch(`${BASE_URL}/admin/logs?page=${p}&per_page=${PER_PAGE}`)
      if (data) { setLogs(data.data); setTotal(data.total) }
    }
  }

  useEffect(() => {
    setSearch(''); setFilterStatus(''); setFilterRole('')
    setFilterCategory(''); setStartDate(''); setEndDate('')
    setPage(1); setTotal(0)
    loadSection(section, 1)
  }, [section])

  useEffect(() => {
    if (!['overview', 'analytics', 'disputes', 'leaderboard'].includes(section)) {
      loadSection(section, 1)
    }
  }, [search, filterStatus, filterRole, filterCategory, startDate, endDate])

  const handleExport = (type) => {
    window.open(`${BASE_URL}/admin/export/${type}?token=${token}`, '_blank')
    const link = document.createElement('a')
    link.href = `${BASE_URL}/admin/export/${type}`
    const req = new XMLHttpRequest()
    req.open('GET', `${BASE_URL}/admin/export/${type}`, true)
    req.setRequestHeader('Authorization', `Bearer ${token}`)
    req.responseType = 'blob'
    req.onload = () => {
      const url = window.URL.createObjectURL(req.response)
      const a = document.createElement('a')
      a.href = url
      a.download = `errandly_${type}.csv`
      a.click()
    }
    req.send()
  }

  const resolveDispute = async (taskId, resolution) => {
    try {
      await axios.patch(`${BASE_URL}/admin/disputes/${taskId}/resolve`,
        { resolution, note: resolveNote[taskId] || '' },
        { headers }
      )
      setResolveMsg('Dispute resolved successfully ✅')
      loadSection('disputes', 1)
      setTimeout(() => setResolveMsg(''), 3000)
    } catch (err) {
      setResolveMsg('Failed to resolve dispute.')
    }
  }

  const fetchAiInsights = async () => {
    setAiLoading(true)
    try {
      const data = await apiFetch(`${BASE_URL}/admin/ai-insights`)
      if (data) setAiInsights(data)
    } finally {
      setAiLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  const navItems = [
    { id: 'overview',    icon: '📊', label: 'Overview' },
    { id: 'analytics',   icon: '📈', label: 'Analytics' },
    { id: 'ai',          icon: '🤖', label: 'AI Insights' },
    { id: 'users',       icon: '👥', label: 'Users' },
    { id: 'tasks',       icon: '📋', label: 'Tasks' },
    { id: 'payments',    icon: '💳', label: 'Payments' },
    { id: 'disputes',    icon: '⚠️', label: 'Disputes' },
    { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
    { id: 'logs',        icon: '📝', label: 'Activity Log' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-200 shrink-0`}>
        <div className="px-4 py-5 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && (
            <div>
              <h1 className="text-sm font-bold text-white">Errandly</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition text-sm">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${section === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="px-2 pb-4">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-gray-700 transition">
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">
            {navItems.find(n => n.id === section)?.icon}{' '}
            {navItems.find(n => n.id === section)?.label}
          </h2>
          <div className="flex items-center gap-3">
            {['users','tasks','payments'].includes(section) && (
              <button onClick={() => handleExport(section === 'users' ? 'users' : section === 'tasks' ? 'tasks' : 'payments')}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                ⬇️ Export CSV
              </button>
            )}
            <span className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">Admin</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          )}

          {/* Overview */}
          {section === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats.users.total} color="text-blue-400"
                  sub={`${stats.users.customers} customers · ${stats.users.helpers} helpers`} />
                <StatCard label="Total Tasks" value={stats.tasks.total} color="text-green-400"
                  sub={`${stats.tasks.open} open · ${stats.tasks.completed} done`} />
                <StatCard label="Total Revenue" value={`₹${stats.payments.revenue}`} color="text-yellow-400"
                  sub={`${stats.payments.total} paid transactions`} />
                <StatCard label="Avg Rating" value={stats.ratings.average > 0 ? `⭐ ${stats.ratings.average}` : '—'}
                  color="text-orange-400" sub={`${stats.ratings.total} reviews`} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Open Tasks" value={stats.tasks.open} color="text-green-400" />
                <StatCard label="Completed" value={stats.tasks.completed} color="text-gray-300" />
                <StatCard label="Disputed" value={stats.tasks.disputed} color="text-red-400" />
                <StatCard label="Cancelled" value={stats.tasks.cancelled} color="text-gray-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Tasks</h3>
                  <div className="space-y-3">
                    {stats.recent_tasks.map(t => (
                      <div key={t.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-white">{t.title}</p>
                          <p className="text-xs text-gray-500">{t.created_at}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm text-blue-400">₹{t.reward}</p>
                          <Badge status={t.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Payments</h3>
                  <div className="space-y-3">
                    {stats.recent_payments.map(p => (
                      <div key={p.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-white">Payment #{p.id}</p>
                          <p className="text-xs text-gray-500">{p.created_at}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm text-green-400">₹{p.amount}</p>
                          <Badge status={p.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics */}
          {section === 'analytics' && analytics && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Daily Revenue — Last 30 Days</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analytics.daily_revenue}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#e5e7eb' }} formatter={v => [`₹${v}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Daily Tasks — Last 30 Days</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.daily_tasks}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                    <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Tasks by Category</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={analytics.by_category} dataKey="count" nameKey="category"
                        cx="50%" cy="50%" outerRadius={70}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                        {analytics.by_category.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Monthly User Growth</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.monthly_users}>
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                      <Bar dataKey="users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {section === 'ai' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI Platform Analysis</h3>
                    <p className="text-xs text-gray-400 mt-1">Powered by Claude — real-time insights based on your platform data</p>
                  </div>
                  <button onClick={fetchAiInsights} disabled={aiLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl transition disabled:opacity-50 flex items-center gap-2">
                    {aiLoading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                    ) : (
                      <><span>🤖</span> Generate Insights</>
                    )}
                  </button>
                </div>

                {!aiInsights && !aiLoading && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-4xl mb-3">🤖</p>
                    <p className="text-sm">Click "Generate Insights" to get AI-powered recommendations for your platform</p>
                  </div>
                )}

                {aiInsights && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-blue-400">{aiInsights.stats_used.total_users}</p>
                        <p className="text-xs text-gray-400">Users Analyzed</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-green-400">{aiInsights.stats_used.completion_rate}%</p>
                        <p className="text-xs text-gray-400">Completion Rate</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-red-400">{aiInsights.stats_used.dispute_rate}%</p>
                        <p className="text-xs text-gray-400">Dispute Rate</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-yellow-400">⭐ {aiInsights.stats_used.avg_rating}</p>
                        <p className="text-xs text-gray-400">Avg Rating</p>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-xl p-5 border border-gray-600">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-semibold text-blue-400">🤖 Claude's Analysis</p>
                        <p className="text-xs text-gray-500">Generated: {aiInsights.generated_at}</p>
                      </div>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {aiInsights.insights}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users */}
          {section === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-48" />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="helper">Helper</option>
                </select>
              </div>
              <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                      <th className="px-4 py-3 text-left">Activity</th>
                      <th className="px-4 py-3 text-left">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3"><Badge status={u.role} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{u.member_since}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {u.role === 'customer' ? `${u.tasks_posted} posted` : `${u.tasks_done} done`}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {u.role === 'helper' && u.avg_rating > 0 ? `⭐ ${u.avg_rating} (${u.total_ratings})` : '—'}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && !loading && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={total} perPage={PER_PAGE} onChange={p => loadSection('users', p)} />
            </div>
          )}

          {/* Tasks */}
          {section === 'tasks' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-48" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="">All Statuses</option>
                  {['open','assigned','pending_confirmation','done','disputed','cancelled'].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                  ))}
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="">All Categories</option>
                  {['carry','queue','delivery','shopping','other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <DateRangeFilter startDate={startDate} endDate={endDate}
                  onStartChange={setStartDate} onEndChange={setEndDate} />
              </div>
              <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                      <th className="px-4 py-3 text-left">Task</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Reward</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Helper</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{t.title}</p>
                          <p className="text-xs text-gray-400 capitalize">{t.category} · 📍{t.location}</p>
                        </td>
                        <td className="px-4 py-3"><Badge status={t.status} /></td>
                        <td className="px-4 py-3 text-blue-400 font-semibold">₹{t.reward}</td>
                        <td className="px-4 py-3">
                          <p className="text-white text-xs">{t.customer_name}</p>
                          <p className="text-gray-500 text-xs">{t.customer_email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{t.helper_name}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{t.created_at}</td>
                      </tr>
                    ))}
                    {tasks.length === 0 && !loading && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No tasks found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={total} perPage={PER_PAGE} onChange={p => loadSection('tasks', p)} />
            </div>
          )}

          {/* Payments */}
          {section === 'payments' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by customer..."
                  className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-2 text-sm focus:outline-none flex-1 min-w-48" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="">All</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <DateRangeFilter startDate={startDate} endDate={endDate}
                  onStartChange={setStartDate} onEndChange={setEndDate} />
              </div>
              <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                      <th className="px-4 py-3 text-left">Payment ID</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Task</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                          {(p.razorpay_payment_id || p.razorpay_order_id)?.slice(0, 18)}...
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white text-xs">{p.customer_name}</p>
                          <p className="text-gray-500 text-xs">{p.customer_email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{p.task_title}</td>
                        <td className="px-4 py-3 text-green-400 font-semibold">₹{p.amount}</td>
                        <td className="px-4 py-3"><Badge status={p.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{p.created_at}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && !loading && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No payments found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={total} perPage={PER_PAGE} onChange={p => loadSection('payments', p)} />
            </div>
          )}

          {/* Disputes */}
          {section === 'disputes' && (
            <div className="space-y-4">
              {resolveMsg && (
                <div className="bg-green-900/30 border border-green-700 text-green-400 text-sm px-4 py-3 rounded-lg">
                  {resolveMsg}
                </div>
              )}
              {disputes.length === 0 && !loading && (
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-10 text-center">
                  <p className="text-3xl mb-3">✅</p>
                  <p className="text-gray-400">No active disputes</p>
                </div>
              )}
              {disputes.map(d => (
                <div key={d.id} className="bg-gray-800 rounded-2xl border border-red-800/40 p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{d.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">📍 {d.location} · ₹{d.reward}</p>
                    </div>
                    <Badge status="disputed" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1 font-semibold uppercase">Customer</p>
                      <p className="text-sm text-white">{d.customer_name}</p>
                      <p className="text-xs text-gray-400">{d.customer_email}</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1 font-semibold uppercase">Helper</p>
                      <p className="text-sm text-white">{d.helper_name}</p>
                      <p className="text-xs text-gray-400">{d.helper_email}</p>
                    </div>
                  </div>
                  {d.dispute_reason && (
                    <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3">
                      <p className="text-xs text-red-400 font-semibold mb-1">Dispute Reason</p>
                      <p className="text-sm text-gray-300">{d.dispute_reason}</p>
                    </div>
                  )}
                  {d.completion_note && (
                    <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-3">
                      <p className="text-xs text-blue-400 font-semibold mb-1">Helper's Note</p>
                      <p className="text-sm text-gray-300">{d.completion_note}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <textarea
                      placeholder="Admin resolution note (optional)..."
                      value={resolveNote[d.id] || ''}
                      onChange={e => setResolveNote({ ...resolveNote, [d.id]: e.target.value })}
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-3">
                      <button onClick={() => resolveDispute(d.id, 'favor_customer')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition font-medium">
                        ✅ Resolve — Customer's Favor
                      </button>
                      <button onClick={() => resolveDispute(d.id, 'favor_helper')}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded-lg transition font-medium">
                        ✅ Resolve — Helper's Favor
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard */}
          {section === 'leaderboard' && (
            <div className="space-y-4">
              {leaderboard.map(h => (
                <div key={h.id}
                  className={`bg-gray-800 rounded-2xl border p-5 flex items-center gap-5
                    ${h.rank === 1 ? 'border-yellow-600/50' : h.rank === 2 ? 'border-gray-500/50' : h.rank === 3 ? 'border-orange-700/50' : 'border-gray-700'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shrink-0
                    ${h.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' : h.rank === 2 ? 'bg-gray-500/20 text-gray-300' : h.rank === 3 ? 'bg-orange-700/20 text-orange-400' : 'bg-gray-700 text-gray-400'}`}>
                    {h.rank <= 3 ? ['🥇','🥈','🥉'][h.rank-1] : `#${h.rank}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{h.name}</p>
                    <p className="text-xs text-gray-400">{h.email} · Since {h.member_since}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center shrink-0">
                    <div>
                      <p className="text-xl font-bold text-blue-400">{h.tasks_done}</p>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-yellow-400">{h.avg_rating > 0 ? h.avg_rating : '—'}</p>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-400">₹{h.total_earned}</p>
                      <p className="text-xs text-gray-500">Earned</p>
                    </div>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && !loading && (
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-10 text-center">
                  <p className="text-3xl mb-3">🏆</p>
                  <p className="text-gray-400">No helpers yet</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Log */}
          {section === 'logs' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                      <th className="px-4 py-3 text-left">Action</th>
                      <th className="px-4 py-3 text-left">Details</th>
                      <th className="px-4 py-3 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                        <td className="px-4 py-3 font-medium text-white text-xs">{l.action}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{l.details || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{l.created_at}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && !loading && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No activity yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={total} perPage={PER_PAGE} onChange={p => loadSection('logs', p)} />
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default AdminDashboard