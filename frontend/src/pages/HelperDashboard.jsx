import BASE_URL from '../api'
import { SkeletonSection } from '../components/Skeleton'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import HelperProfileCard from '../components/HelperProfileCard'
import NotificationBell from '../components/NotificationBell'
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function HelperDashboard() {
  const [loading, setLoading] = useState(true)
  const name = localStorage.getItem('name')
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [myActiveTasks, setMyActiveTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [accepting, setAccepting] = useState(null)
  const [activeTab, setActiveTab] = useState('tasks')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [completionNote, setCompletionNote] = useState('')
  const [showNoteFor, setShowNoteFor] = useState(null)
  

  const headers = { Authorization: `Bearer ${token}` }

  const fetchAll = async () => {
    try {
      const [openRes, activeRes, completedRes, statsRes] = await Promise.all([
      axios.get(`${BASE_URL}/tasks/?search=${search}&category=${filterCategory}&sort=${sort}`, { headers }),
      axios.get(`${BASE_URL}/tasks/accepted`, { headers }),
      axios.get(`${BASE_URL}/tasks/completed`, { headers }),
      axios.get(`${BASE_URL}/tasks/stats`, { headers })
      ])
      
      setTasks(openRes.data)
      setMyActiveTasks(activeRes.data)
      setCompletedTasks(completedRes.data)
      setStats(statsRes.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear()
        navigate('/login')
      }
    } finally {
  setTimeout(() => setLoading(false), 800)
    }
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [])

  const acceptTask = async (taskId) => {
    setAccepting(taskId)
    try {
      await axios.patch(`${BASE_URL}/tasks/${taskId}/accept`, {}, { headers })
      setMessage('Task accepted! Get to work 💪')
      setMessageType('success')
      fetchAll()
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not accept task.')
      setMessageType('error')
    } finally {
      setAccepting(null)
    }
  }

  const completeTask = async (taskId) => {
  try {
    await axios.patch(`${BASE_URL}/tasks/${taskId}/complete`,
      { completion_note: completionNote },
      { headers }
    )
    setMessage('Marked complete! Awaiting customer confirmation ⏳')
    setMessageType('success')
    setShowNoteFor(null)
    setCompletionNote('')
    fetchAll()
  } catch (err) {
    setMessage(err.response?.data?.error || 'Could not complete task.')
    setMessageType('error')
  }
}

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
        activeTab === id
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
      }`}>
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-4 md:px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Errandly</h1>
        <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:inline">Hi, {name} — Helper</span>
        <NotificationBell />
        <Link to="/referral" className="text-sm text-gray-500 hover:text-blue-600 transition hidden sm:inline">
          🎁 Refer & Earn
        </Link>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
          Logout
        </button>
      </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Profile Card */}
        <HelperProfileCard />

        {/* Summary Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <p className="text-xl md:text-3xl font-bold text-blue-600">{stats.total_tasks}</p>
              <p className="text-xs text-gray-500 mt-1">Tasks Completed</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <p className="text-xl md:text-3xl font-bold text-green-600">₹{stats.total_earned}</p>
              <p className="text-xs text-gray-500 mt-1">Total Earned</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <p className="text-xl md:text-3xl font-bold text-yellow-500">{myActiveTasks.length}</p>
              <p className="text-xs text-gray-500 mt-1">Active Now</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3">
          <TabButton id="tasks" label="Tasks" />
          <TabButton id="stats" label="Monthly Stats" />
        </div>

        {message && (
          <div className={`text-sm px-4 py-3 rounded-lg border ${
            messageType === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          loading ? (
            <>
              <SkeletonSection />
              <SkeletonSection />
            </>
          ) : (
          <div className="space-y-6">

            {/* Active Tasks */}
<div className="bg-white rounded-2xl shadow-sm p-6">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">
    Active Tasks
    <span className="ml-2 text-sm font-normal text-gray-400">
      ({myActiveTasks.length})
    </span>
  </h2>

  {myActiveTasks.length === 0 ? (
    <p className="text-sm text-gray-400">
      No active tasks right now.
    </p>
  ) : (
    <div className="space-y-4">
      {myActiveTasks.map(task => (
        <div
          key={task.id}
          className="border border-yellow-100 bg-yellow-50 rounded-xl p-4"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h3 className="font-semibold text-gray-800">
                {task.title}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {task.description}
              </p>

              <div className="flex flex-wrap gap-3 mt-2">
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full capitalize">
                  {task.category}
                </span>

                <span className="text-xs text-gray-500">
                  📍 {task.location}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-blue-600">
                ₹{task.reward}
              </p>

              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                {task.status === 'assigned'
                  ? 'In Progress'
                  : 'Waiting Confirmation'}
              </span>
            </div>
          </div>

          <div className="mt-4">
  {task.status === 'assigned' && (
    <div className="space-y-2">
      <button
        onClick={() => setShowNoteFor(showNoteFor === task.id ? null : task.id)}
        className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition">
        Mark Complete ✓
      </button>
      {showNoteFor === task.id && (
        <div className="space-y-2">
          <textarea
            placeholder="Add a completion note (e.g. 'Carried bags to 3rd floor, all done!')"
            value={completionNote}
            onChange={e => setCompletionNote(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={() => completeTask(task.id)}
            className="w-full bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 transition">
            Confirm & Submit ✓
          </button>
        </div>
      )}
    </div>
  )}
  {task.status === 'pending_confirmation' && (
    <span className="text-sm text-orange-600 font-medium">
      ⏳ Waiting for customer confirmation...
    </span>
  )}
</div>
        </div>
      ))}
    </div>
  )}
</div>
            {/* Search & Filter */}
            <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row flex-wrap gap-3">
              <input
                placeholder="Search tasks..."
                value={search}
                onChange={e => { setSearch(e.target.value); fetchAll() }}
                className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); fetchAll() }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
                <option value="">All Categories</option>
                {['carry','queue','delivery','shopping','other'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <select value={sort} onChange={e => { setSort(e.target.value); fetchAll() }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
                <option value="newest">Newest</option>
                <option value="highest">Highest Reward</option>
                <option value="lowest">Lowest Reward</option>
              </select>
            </div>

            {/* Available Tasks */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Available Tasks
                <span className="ml-2 text-sm font-normal text-gray-400">({tasks.length})</span>
              </h2>
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-400">No open tasks right now. Check back soon!</p>
              ) : (
                <div className="space-y-4">
                  {tasks.map(task => (
                    <div key={task.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                          <h3 className="font-semibold text-gray-800">{task.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          <span className="text-xs text-gray-400 capitalize">{task.category}</span>
                          <span className="text-xs text-gray-400 mt-0.5 block">📍 {task.location}</span>
                        </div>
                        <p className="text-sm font-semibold text-blue-600 shrink-0">₹{task.reward}</p>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => acceptTask(task.id)}
                          disabled={accepting === task.id}
                          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                          {accepting === task.id ? 'Accepting...' : 'Accept Task'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Tasks */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Completed Tasks
                <span className="ml-2 text-sm font-normal text-gray-400">({completedTasks.length})</span>
              </h2>
              {completedTasks.length === 0 ? (
                <p className="text-sm text-gray-400">No completed tasks yet.</p>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map(task => (
                    <div key={task.id} className="border border-gray-100 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-700">{task.title}</h3>
                        <span className="text-xs text-gray-400 capitalize">{task.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">+₹{task.reward}</p>
                        <span className="text-xs text-gray-300">{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          )
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">

            {/* Monthly Earnings Bar Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Monthly Earnings (₹)</h2>
              {stats.monthly.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet. Complete tasks to see your stats!</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.monthly}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(val) => `₹${val}`} />
                    <Bar dataKey="earned" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Monthly Tasks Bar Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Tasks Completed Per Month</h2>
              {stats.monthly.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.monthly}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tasks by Category Pie Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Tasks by Category</h2>
              {stats.by_category.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stats.by_category}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ category, percent }) =>
                        `${category} ${(percent * 100).toFixed(0)}%`
                      }>
                      {stats.by_category.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default HelperDashboard