import { Link } from 'react-router-dom'

function ServerError() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">

      <div className="relative mb-8">
        <p className="text-9xl font-black text-gray-100 select-none">500</p>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-5xl">⚠️</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Something went wrong
      </h1>
      <p className="text-gray-400 text-sm max-w-sm mb-8">
        Our servers are having a moment. Please try again shortly.
      </p>

      <Link to="/"
        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
        Back to Home
      </Link>

    </div>
  )
}

export default ServerError