import { Link } from 'react-router-dom'

function NotFound() {
  const role = localStorage.getItem('role')
  const dashboardLink = role === 'customer' ? '/customer' : role === 'helper' ? '/helper' : '/'

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">

      {/* Animated number */}
      <div className="relative mb-8">
        <p className="text-9xl font-black text-gray-100 select-none">404</p>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-5xl">🔍</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Page not found
      </h1>
      <p className="text-gray-400 text-sm max-w-sm mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex gap-3">
        <Link to={dashboardLink}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          Go to Dashboard
        </Link>
        <Link to="/"
          className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
          Home
        </Link>
      </div>

    </div>
  )
}

export default NotFound