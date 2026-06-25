import { Link } from 'react-router-dom'

const categories = [
  { icon: '🧳', label: 'Carry Bags', desc: 'Heavy luggage, groceries, and more' },
  { icon: '🧾', label: 'Stand in Queue', desc: 'Tickets, government offices, banks' },
  { icon: '🛵', label: 'Delivery', desc: 'Drop off items across the city' },
  { icon: '🛒', label: 'Shopping', desc: 'Pick up items from stores for you' },
  { icon: '🔧', label: 'Other Tasks', desc: 'Anything else you need help with' },
]

const steps = [
  { step: '01', title: 'Post a Task', desc: 'Describe what you need done and set a reward.' },
  { step: '02', title: 'A Helper Accepts', desc: 'A nearby helper picks up your task.' },
  { step: '03', title: 'Task Completed', desc: 'Helper marks it done, you get it done.' },
]

const floatingItems = [
  { content: '🧳', size: '1.8rem', top: '10%', left: '5%', duration: '9s', delay: '0s' },
  { content: '🧾', size: '1.4rem', top: '20%', left: '88%', duration: '12s', delay: '1s' },
  { content: '🛵', size: '1.6rem', top: '55%', left: '92%', duration: '10s', delay: '2s' },
  { content: '🛒', size: '1.5rem', top: '70%', left: '4%', duration: '14s', delay: '0.5s' },
  { content: '🔧', size: '1.3rem', top: '85%', left: '80%', duration: '11s', delay: '3s' },
  { content: '•', size: '0.6rem', top: '15%', left: '30%', duration: '13s', delay: '1.5s', isBlue: true },
  { content: '•', size: '0.5rem', top: '40%', left: '75%', duration: '8s', delay: '0s', isBlue: true },
  { content: '•', size: '0.7rem', top: '65%', left: '20%', duration: '15s', delay: '2s', isBlue: true },
  { content: '•', size: '0.5rem', top: '80%', left: '55%', duration: '10s', delay: '1s', isBlue: true },
  { content: '•', size: '0.6rem', top: '30%', left: '50%', duration: '12s', delay: '3s', isBlue: true },
  { content: '•', size: '0.8rem', top: '10%', left: '60%', duration: '9s', delay: '0.5s', isBlue: true },
  { content: '•', size: '0.5rem', top: '50%', left: '10%', duration: '11s', delay: '2.5s', isBlue: true },
  { content: '•', size: '0.6rem', top: '75%', left: '40%', duration: '14s', delay: '1s', isBlue: true },
  { content: '•', size: '0.7rem', top: '25%', left: '85%', duration: '10s', delay: '3.5s', isBlue: true },
  { content: '•', size: '0.5rem', top: '90%', left: '70%', duration: '8s', delay: '0.8s', isBlue: true },
]

function FloatingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
      {floatingItems.map((item, i) => (
        <span key={i} className="float-el" style={{
          top: item.top, left: item.left,
          fontSize: item.size,
          animationDuration: item.duration,
          animationDelay: item.delay,
          color: item.isBlue ? '#3b82f6' : undefined,
          opacity: 0.4,
        }}>
          {item.content}
        </span>
      ))}
    </div>
  )
}

function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-800">

      {/* Navbar */}
      <nav className="px-5 md:px-8 py-4 flex justify-between items-center border-b border-gray-100">
        <h1 className="text-lg md:text-xl font-bold text-blue-600">Errandly</h1>
        <div className="flex gap-2 md:gap-3">
          <Link to="/login"
            className="text-xs md:text-sm text-gray-600 px-3 md:px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            Log In
          </Link>
          <Link to="/register"
            className="text-xs md:text-sm text-white bg-blue-600 px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 md:px-6 py-16 md:py-24 text-center">
        <FloatingBackground />
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="animate-fade-up delay-1 inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            Hyperlocal Task Platform
          </span>
          <h2 className="animate-fade-up delay-2 text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Get everyday tasks done{' '}
            <span className="text-blue-600">by real people near you</span>
          </h2>
          <p className="animate-fade-up delay-3 text-base md:text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Need someone to carry your bags, stand in a queue, or run a quick errand?
            Post a task, set a reward, and let a helper take care of it.
          </p>
          <div className="animate-fade-up delay-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm md:text-base">
              Post a Task
            </Link>
            <Link to="/register"
              className="border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition text-sm md:text-base">
              Become a Helper
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16 md:py-20 px-5 md:px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-10 md:mb-12">
            How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <span className="text-3xl font-bold text-blue-300">{step}</span>
                <h4 className="text-base font-semibold text-gray-800 mt-2">{title}</h4>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-20 px-5 md:px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-10 md:mb-12">
            What can you get done?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {categories.map(({ icon, label, desc }) => (
              <div key={label} className="border border-gray-100 rounded-2xl p-4 md:p-5 hover:shadow-sm transition">
                <span className="text-2xl">{icon}</span>
                <h4 className="text-sm font-semibold text-gray-800 mt-3">{label}</h4>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16 md:py-20 px-5 md:px-6 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to get started?</h3>
        <p className="text-blue-100 mb-8 text-sm md:text-base">
          Join Errandly as a customer or helper today.
        </p>
        <Link to="/register"
          className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-sm md:text-base">
          Create an Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-5 md:px-8 py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        © 2026 Errandly. Built with React & Flask.
      </footer>

    </div>
  )
}

export default Landing