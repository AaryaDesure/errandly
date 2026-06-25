import BASE_URL from '../api'
import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import AuthBackground from '../components/AuthBackground'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const navigate = useNavigate()
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!role) {
      setError('Please select whether you are a Customer or Helper.')
      return
    }
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, form)
      if (res.data.role !== role) {
        const correct = res.data.role
        setError(`This email is registered as a ${correct.charAt(0).toUpperCase() + correct.slice(1)}, not a ${role}.`)
        setSuggestion(correct)
        return
      }
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('name', res.data.name)
      setSuggestion('')
      setError('')
      if (res.data.role === 'customer') navigate('/customer')
      else navigate('/helper')
    } catch (err) {
      setError('Invalid email or password.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center px-4 py-8 relative">
  <AuthBackground />
      <div className="relative z-10 bg-white p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5">

      {/* Errandly Branding */}
      <div className="text-center pb-2 border-b border-gray-100">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl mb-3">
          <span className="text-white text-xl font-black">E</span>
        </div>
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">Errandly</h1>
        <p className="text-xs text-gray-400 mt-0.5">Hyperlocal Task Platform</p>
      </div>

      <h2 className="text-xl font-bold text-gray-800">Welcome back</h2>
        {/* Role Selector */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-gray-700">I am logging in as a...</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setRole('customer'); setError(''); setSuggestion('') }}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition
                ${role === 'customer'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : suggestion === 'customer'
                  ? 'bg-blue-50 text-blue-600 border-blue-400 ring-2 ring-blue-300'
                  : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}>
              Customer
              {suggestion === 'customer' && (
                <span className="block text-xs font-normal mt-0.5">← select this</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setRole('helper'); setError(''); setSuggestion('') }}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition
                ${role === 'helper'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : suggestion === 'helper'
                  ? 'bg-blue-50 text-blue-600 border-blue-400 ring-2 ring-blue-300'
                  : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}>
              Helper
              {suggestion === 'helper' && (
                <span className="block text-xs font-normal mt-0.5">← select this</span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <span className="text-red-400 mt-0.5">⚠️</span>
            <div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <p className="text-xs text-red-400 mt-0.5">Please select the correct account type above.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            Log in
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Sign up</Link>
        </p>

      </div>
    </div>
  )
}

export default Login