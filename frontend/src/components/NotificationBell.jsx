import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import BASE_URL from '../api'

import {
  FaCheckCircle,
  FaFlagCheckered,
  FaExclamationTriangle,
  FaTimesCircle,
  FaCreditCard,
  FaBell,
  FaBellSlash,
  FaThumbtack,
  FaRegSmile
} from 'react-icons/fa'

const typeConfig = {
  task_accepted: {
    icon: FaCheckCircle,
    color: 'text-green-600'
  },
  task_completed: {
    icon: FaFlagCheckered,
    color: 'text-blue-600'
  },
  task_confirmed: {
    icon: FaRegSmile,
    color: 'text-green-600'
  },
  task_disputed: {
    icon: FaExclamationTriangle,
    color: 'text-red-600'
  },
  task_cancelled: {
    icon: FaTimesCircle,
    color: 'text-gray-500'
  },
  payment_success: {
    icon: FaCreditCard,
    color: 'text-blue-600'
  }
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const token = localStorage.getItem('token')
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(res.data.notifications)
      setUnread(res.data.unread_count)
    } catch (err) {}
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = async () => {
    setOpen(!open)
    if (!open && unread > 0) {
      try {
        await axios.patch(`${BASE_URL}/notifications/read-all`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUnread(0)
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      } catch (err) {}
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition">
        <FaBell className="text-xl text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400">{notifications.length} total</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FaBellSlash className="text-3xl text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const config = typeConfig[n.type] || {
                icon: FaThumbtack,
                color: 'text-gray-500'
                }
                return (
                  <div key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 flex gap-3 items-start transition
                      ${n.is_read ? 'bg-white' : 'bg-blue-50'}`}>
                    <div className={`text-lg shrink-0 mt-0.5 ${config.color}`}>
                    <config.icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.is_read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.created_at}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell