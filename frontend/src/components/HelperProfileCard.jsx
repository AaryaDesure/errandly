import { useState, useEffect } from 'react'
import axios from 'axios'
import BASE_URL from '../api'

function StarDisplay({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(star => (
        <span key={star} className={`text-sm ${star <= Math.round(value) ? 'text-yellow-400' : 'text-gray-200'}`}>
          ★
        </span>
      ))}
    </div>
  )
}

function HelperProfileCard({ userId, compact = false }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = userId
          ? `${BASE_URL}/users/profile/${userId}`
          : `${BASE_URL}/users/profile/me`
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setProfile(res.data)
      } catch (err) {
        console.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  if (loading) return (
    <div className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
    </div>
  )

  if (!profile) return null

  // Compact version — shown inside customer task card
  if (compact) return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
        Your task is being handled by
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{profile.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <StarDisplay value={profile.average_rating} />
            <span className="text-xs text-gray-500">
              {profile.average_rating > 0
                ? `${profile.average_rating} (${profile.total_ratings} reviews)`
                : 'No ratings yet'}
            </span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xl font-bold text-blue-600">{profile.total_completed}</p>
          <p className="text-xs text-gray-400">tasks done</p>
        </div>
      </div>
    </div>
  )

  // Full version — shown in helper's own dashboard
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shrink-0">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">{profile.name}</h2>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium capitalize">
              {profile.role}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Member since {profile.member_since}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{profile.total_completed}</p>
          <p className="text-xs text-gray-400 mt-0.5">Tasks Done</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-500">
            {profile.average_rating > 0 ? profile.average_rating : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Avg Rating</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{profile.total_ratings}</p>
          <p className="text-xs text-gray-400 mt-0.5">Reviews</p>
        </div>
      </div>

      {/* Rating Stars */}
      {profile.average_rating > 0 && (
        <div className="flex items-center gap-2">
          <StarDisplay value={profile.average_rating} />
          <span className="text-sm text-gray-500">
            {profile.average_rating} out of 5
          </span>
        </div>
      )}

      {/* Recent Reviews */}
      {profile.recent_reviews.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Recent Reviews</p>
          {profile.recent_reviews.map((r, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <StarDisplay value={r.stars} />
                <span className="text-xs text-gray-400">{r.created_at}</span>
              </div>
              {r.review && (
                <p className="text-xs text-gray-600 italic">"{r.review}"</p>
              )}
            </div>
          ))}
        </div>
      )}

      {profile.recent_reviews.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">
          No reviews yet — complete tasks to build your profile!
        </p>
      )}
    </div>
  )
}

export default HelperProfileCard