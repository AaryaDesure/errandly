import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import BASE_URL from '../api'
import NotificationBell from '../components/NotificationBell'

const statusConfig = {
  paid:    { label: 'Paid',    classes: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
  failed:  { label: 'Failed',  classes: 'bg-red-100 text-red-600' },
}

const taskStatusConfig = {
  open:                 'Open',
  assigned:             'In Progress',
  pending_confirmation: 'Awaiting Confirmation',
  done:                 'Completed',
  disputed:             'Disputed',
  cancelled:            'Cancelled',
}

function PaymentHistory() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const token = localStorage.getItem('token')
  const name = localStorage.getItem('name')
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/payments/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPayments(res.data)
        setTotal(res.data
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0))
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.clear(); navigate('/login')
        }
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleLogout = () => { localStorage.clear(); navigate('/') }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <Link to="/customer" className="text-xl font-bold text-blue-600">Errandly</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Hi, {name}</span>
          <NotificationBell />
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payment History</h1>
            <p className="text-sm text-gray-400 mt-1">All your Errandly transactions</p>
          </div>
          <Link to="/customer"
            className="text-sm text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Summary Card */}
        {!loading && payments.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-blue-600">{payments.length}</p>
              <p className="text-sm text-gray-400 mt-1">Total Payments</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-green-600">
                {payments.filter(p => p.status === 'paid').length}
              </p>
              <p className="text-sm text-gray-400 mt-1">Successful</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-gray-800">₹{total}</p>
              <p className="text-sm text-gray-400 mt-1">Total Spent</p>
            </div>
          </div>
        )}

        {/* Payments List */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Transactions</h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">💳</p>
              <p className="text-gray-400 text-sm">No payments yet. Post a task to get started!</p>
              <Link to="/customer"
                className="inline-block mt-4 text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
                Post a Task
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{p.task_title}</span>
                        {p.task_status && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {taskStatusConfig[p.task_status] || p.task_status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{p.created_at}</p>
                      {p.razorpay_payment_id && (
                        <p className="text-xs text-gray-300 mt-0.5 font-mono">
                          {p.razorpay_payment_id}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <p className="text-sm font-bold text-gray-800">₹{p.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[p.status]?.classes}`}>
                        {statusConfig[p.status]?.label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default PaymentHistory