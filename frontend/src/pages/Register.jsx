import BASE_URL from '../api'
import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import AuthBackground from '../components/AuthBackground'

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${BASE_URL}/auth/register`, form)
      navigate('/login')
    } catch (err) {
      setError('Registration failed. Email may already exist.')
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
        <h1 className="text-xl font-black text-blue-600 tracking-tight">Errandly</h1>
        <p className="text-xs text-gray-400 mt-0.5">Hyperlocal Task Platform</p>
      </div>

      <h2 className="text-xl font-bold text-gray-800">Create an account</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Full name"
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="space-y-2">
  <p className="text-sm font-medium text-gray-700">I want to...</p>
  <div className="flex gap-3">
    <button
      type="button"
      onClick={() => setForm({ ...form, role: 'customer' })}
      className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition
        ${form.role === 'customer'
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}>
      Hire Help (Customer)
    </button>
    <button
      type="button"
      onClick={() => setForm({ ...form, role: 'helper' })}
      className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition
        ${form.role === 'helper'
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}>
      Earn Money (Helper)
    </button>
  </div>
</div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            Create account
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register