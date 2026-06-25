import BASE_URL from '../api'
import { SkeletonSection } from '../components/Skeleton'
import { useState, useEffect } from 'react'
import axios from 'axios'
import LocationInput from '../components/LocationInput'
import { useRazorpay } from '../hooks/useRazorpay'
import HelperProfileCard from '../components/HelperProfileCard'
import NotificationBell from '../components/NotificationBell'
import { useNavigate, Link } from 'react-router-dom'
import { downloadPdfReceipt } from '../components/PdfReceipt'
function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)}
          className={`text-2xl transition ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </button>
      ))}
    </div>
  )
}

function CustomerDashboard() {
  const [loading, setLoading] = useState(true)
  const name = localStorage.getItem('name')
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'carry',
    reward: '',
    location: ''
  })
  const [ratedTasks, setRatedTasks] = useState({})
  const [ratingForm, setRatingForm] = useState({})
  const [disputeForm, setDisputeForm] = useState({})
  const [showDisputeFor, setShowDisputeFor] = useState(null)
  const [showRatingFor, setShowRatingFor] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [expandedTask, setExpandedTask] = useState(null)
  const categories = ['carry', 'queue', 'delivery', 'shopping', 'other']
  const razorpayLoaded = useRazorpay()
  const [paymentLoading, setPaymentLoading] = useState(false)


  const fetchTasks = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/tasks/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setTasks(res.data)
res.data.filter(t => t.status === 'done').forEach(async (t) => {
  try {
    const r = await axios.get(`${BASE_URL}/ratings/check/${t.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setRatedTasks(prev => ({ ...prev, [t.id]: r.data.rated }))
  } catch (err) {}
})
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
    fetchTasks()
    const interval = setInterval(fetchTasks, 5000)
    return () => clearInterval(interval)
  }, [])
  const confirmTask = async (taskId) => {
  try {
    await axios.patch(`${BASE_URL}/tasks/${taskId}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setMessage('Task confirmed complete! ✅')
    setMessageType('success')
    fetchTasks()
  } catch (err) {
    setMessage('Could not confirm task.')
    setMessageType('error')
  }
}

const disputeTask = async (taskId) => {
  const reason = disputeForm[taskId] || ''
  if (!reason.trim()) { setMessage('Please select a dispute reason.'); setMessageType('error'); return }
  try {
    await axios.patch(`${BASE_URL}/tasks/${taskId}/dispute`,
      { dispute_reason: reason },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setMessage('Dispute raised.')
    setMessageType('error')
    setShowDisputeFor(null)
    fetchTasks()
  } catch (err) {
    setMessage('Could not raise dispute.')
    setMessageType('error')
  }
}
const cancelTask = async (taskId) => {
  try {
    await axios.patch(`${BASE_URL}/tasks/${taskId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setMessage('Task cancelled.')
    setMessageType('success')
    fetchTasks()
  } catch (err) {
    setMessage('Could not cancel task.', 'error')
  }
}

const submitRating = async (taskId) => {
  const rf = ratingForm[taskId] || {}
  if (!rf.stars) { setMessage('Please select a star rating.'); setMessageType('error'); return }
  try {
    await axios.post(`${BASE_URL}/ratings/`, {
      task_id: taskId, stars: rf.stars, review: rf.review || ''
    }, { headers: { Authorization: `Bearer ${token}` } })
    setMessage('Rating submitted! ⭐')
    setMessageType('success')
    setShowRatingFor(null)
    fetchTasks()
  } catch (err) {
    setMessage(err.response?.data?.error || 'Could not submit rating.')
    setMessageType('error')
  }
}

const downloadReceipt = (task) => downloadPdfReceipt(task)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  if (parseFloat(form.reward) <= 0) {
    setMessage('Reward must be greater than ₹0.'); setMessageType('error'); return
  }
  if (form.description.length < 20) {
    setMessage('Description must be at least 20 characters.'); setMessageType('error'); return
  }
  if (!form.location) {
    setMessage('Please select a location.'); setMessageType('error'); return
  }
  if (!razorpayLoaded) {
    setMessage('Payment gateway not loaded. Please refresh.'); setMessageType('error'); return
  }

  setPaymentLoading(true)

  try {
    // Step 1 — Create Razorpay order on backend
    const orderRes = await axios.post(`${BASE_URL}/payments/create-order`,
      { task_data: form },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const { order_id, amount, key_id } = orderRes.data

    // Step 2 — Open Razorpay checkout modal
    const options = {
      key: key_id,
      amount: amount,
      currency: 'INR',
      name: 'Errandly',
      description: form.title,
      order_id: order_id,
      theme: { color: '#2563eb' },
      prefill: {
        name: localStorage.getItem('name'),
      },
      handler: async (response) => {
        // Step 3 — Verify payment on backend
        try {
          await axios.post(`${BASE_URL}/payments/verify`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          }, { headers: { Authorization: `Bearer ${token}` } })

          setMessage('Payment successful! Task is now live ✅')
          setMessageType('success')
          setForm({ title: '', description: '', category: 'carry', reward: '', location: '' })
          fetchTasks()
        } catch (err) {
          setMessage(err.response?.data?.error || 'Payment verification failed.')
          setMessageType('error')
        }
      },
      modal: {
        ondismiss: () => {
          setMessage('Payment cancelled.')
          setMessageType('error')
          setPaymentLoading(false)
        }
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response) => {
      setMessage(`Payment failed: ${response.error.description}`)
      setMessageType('error')
      setPaymentLoading(false)
    })
    rzp.open()

  } catch (err) {
    setMessage(err.response?.data?.error || 'Could not initiate payment.')
    setMessageType('error')
  } finally {
    setPaymentLoading(false)
  }
}

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const statusConfig = {
  open: { label: 'Open', classes: 'bg-green-100 text-green-700' },
  assigned: { label: 'In Progress', classes: 'bg-yellow-100 text-yellow-700' },
  pending_confirmation: { label: 'Awaiting Your Confirmation', classes: 'bg-orange-100 text-orange-700' },
  disputed: { label: 'Disputed', classes: 'bg-red-100 text-red-600' },
  done: { label: 'Completed', classes: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelled', classes: 'bg-gray-100 text-gray-400' }
}

  const openTasks = tasks.filter(t => t.status === 'open')
  const activeTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'pending_confirmation')
  const doneTasks = tasks.filter(t => ['done', 'disputed', 'cancelled'].includes(t.status))

  const TaskCard = ({ task }) => {
  const isExpanded = expandedTask === task.id
  const isActive = ['assigned', 'pending_confirmation'].includes(task.status)

  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-3">
      {/* Header - always visible */}
      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
        <div className="flex-1 pr-4">
          <h3 className="font-semibold text-gray-800">{task.title}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">{task.category}</span>
            <span className="text-xs text-gray-400">📍 {task.location}</span>
          </div>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <p className="text-sm font-semibold text-blue-600">₹{task.reward}</p>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[task.status]?.classes}`}>
            {statusConfig[task.status]?.label}
          </span>
          <p className="text-xs text-gray-300 text-center w-full">{isExpanded ? '▲ less' : '▼ more'}</p>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-500">{task.description}</p>

          {/* Timestamps */}
          <div className="text-xs text-gray-400 space-y-0.5">
            {task.created_at && <p>📅 Posted: {task.created_at}</p>}
            {task.accepted_at && <p>✅ Accepted: {task.accepted_at}</p>}
            {task.completed_at && <p>🏁 Completed: {task.completed_at}</p>}
            {task.confirmed_at && <p>🎉 Confirmed: {task.confirmed_at}</p>}
          </div>

          {isActive && task.helper_id && (
          <HelperProfileCard userId={task.helper_id} compact={true} />
)}

          {/* Helper details for completed tasks */}
          {task.status === 'done' && task.helper_name && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 space-y-1">
              <p className="text-xs font-semibold text-gray-600">Completed by:</p>
              <p className="text-sm font-medium text-gray-800">👤 {task.helper_name}</p>
            </div>
          )}

          {/* Completion Note */}
          {task.completion_note && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-700">
              <span className="font-medium">Helper's note:</span> {task.completion_note}
            </div>
          )}

          {/* Dispute Reason */}
          {task.dispute_reason && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">
              <span className="font-medium">Dispute reason:</span> {task.dispute_reason}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {task.status === 'open' && (
              <button onClick={() => cancelTask(task.id)}
                className="text-xs text-red-500 hover:underline">
                Cancel Task
              </button>
            )}

            {task.status === 'pending_confirmation' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button onClick={() => confirmTask(task.id)}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
                    Confirm Complete ✅
                  </button>
                  <button onClick={() => setShowDisputeFor(showDisputeFor === task.id ? null : task.id)}
                    className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition">
                    Raise Dispute ⚠️
                  </button>
                </div>
                {showDisputeFor === task.id && (
                  <div className="space-y-2">
                    <select
                      value={disputeForm[task.id] || ''}
                      onChange={e => setDisputeForm({ ...disputeForm, [task.id]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                      <option value="">Select dispute reason...</option>
                      <option value="Work incomplete">Work incomplete</option>
                      <option value="Poor quality">Poor quality</option>
                      <option value="Wrong location">Wrong location</option>
                      <option value="Helper did not show up">Helper did not show up</option>
                      <option value="Other">Other</option>
                    </select>
                    <button onClick={() => disputeTask(task.id)}
                      className="w-full bg-red-500 text-white text-xs py-2 rounded-lg hover:bg-red-600 transition">
                      Submit Dispute
                    </button>
                  </div>
                )}
              </div>
            )}

            {task.status === 'done' && (
              <div className="space-y-2">
                <button onClick={() => downloadReceipt(task)}
                  className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                  ⬇️ Download Receipt
                </button>
                {!ratedTasks[task.id] && (
                  <div className="space-y-2">
                    <button onClick={() => setShowRatingFor(showRatingFor === task.id ? null : task.id)}
                      className="block text-xs text-blue-600 hover:underline font-medium">
                      ⭐ Rate this helper
                    </button>
                    {showRatingFor === task.id && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-medium text-gray-700">Rate your helper</p>
                        <StarRating
                          value={ratingForm[task.id]?.stars || 0}
                          onChange={stars => setRatingForm({ ...ratingForm, [task.id]: { ...ratingForm[task.id], stars } })}
                        />
                        <textarea
                          placeholder="Leave a review (optional)..."
                          rows={2}
                          value={ratingForm[task.id]?.review || ''}
                          onChange={e => setRatingForm({ ...ratingForm, [task.id]: { ...ratingForm[task.id], review: e.target.value } })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <button onClick={() => submitRating(task.id)}
                          className="w-full bg-yellow-400 text-white text-sm py-2 rounded-lg hover:bg-yellow-500 transition font-semibold">
                          Submit Rating
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {ratedTasks[task.id] && <p className="text-xs text-gray-400">⭐ You rated this task</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

  const Section = ({ title, tasks, emptyText }) => (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {title}
        <span className="ml-2 text-sm font-normal text-gray-400">({tasks.length})</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-4 md:px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Errandly</h1>
        <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:inline">Hi, {name}</span>
        <NotificationBell />
        <Link to="/payments"
        className="text-sm text-gray-500 hover:text-blue-600 transition">
       - Payments -
      </Link>
      <Link to="/referral" className="text-sm text-gray-500 hover:text-blue-600 transition hidden sm:inline">
       🎁 Refer & Earn 
    </Link>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
          Logout
        </button>
      </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8">

        {/* Post a Task */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Post a New Task</h2>

          {message && (
            <div className={`text-sm mb-4 px-4 py-3 rounded-lg border ${
              messageType === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="title"
              placeholder="Task title (e.g. Carry groceries from car)"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="description"
              placeholder="Describe the task in detail..."
              value={form.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <LocationInput
              value={form.location}
              onChange={(val) => setForm({ ...form, location: val })}
            />
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <input
                name="reward"
                type="number"
                placeholder="Reward (₹)"
                value={form.reward}
                onChange={handleChange}
                required
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Pay & Post Task
            </button>
          </form>
        </div>

        {/* Task Sections */}
        {loading ? (
    <>
      <SkeletonSection />
      <SkeletonSection />
    </>
    ) : (
    <>
      <Section title="In Progress" tasks={activeTasks} emptyText="No tasks currently being worked on." />
      <Section title="Open Tasks" tasks={openTasks} emptyText="No open tasks. Post one above!" />
      <Section title="Completed Tasks" tasks={doneTasks} emptyText="No completed tasks yet." />
    </>
)}

      </div>
    </div>
  )
}

export default CustomerDashboard