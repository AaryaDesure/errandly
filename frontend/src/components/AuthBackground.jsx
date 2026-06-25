const floatingItems = [
  { content: '🧳', top: '8%',  left: '6%',  duration: '9s',  delay: '0s',   size: '1.8rem' },
  { content: '🧾', top: '15%', left: '88%', duration: '12s', delay: '1s',   size: '1.5rem' },
  { content: '🛵', top: '72%', left: '91%', duration: '10s', delay: '2s',   size: '1.6rem' },
  { content: '🛒', top: '80%', left: '5%',  duration: '14s', delay: '0.5s', size: '1.4rem' },
  { content: '🔧', top: '45%', left: '94%', duration: '11s', delay: '3s',   size: '1.3rem' },
  { content: '📦', top: '60%', left: '3%',  duration: '13s', delay: '1.5s', size: '1.5rem' },
  { content: '🤝', top: '30%', left: '7%',  duration: '15s', delay: '2.5s', size: '1.4rem' },
  { content: '📍', top: '88%', left: '85%', duration: '9s',  delay: '0.8s', size: '1.3rem' },
  { content: '•', top: '20%', left: '15%', duration: '13s', delay: '1.2s', size: '1.2rem', isBlue: true },
  { content: '•', top: '35%', left: '82%', duration: '8s',  delay: '0s',   size: '1.2rem', isBlue: true },
  { content: '•', top: '55%', left: '22%', duration: '15s', delay: '2s',   size: '1.2rem', isBlue: true },
  { content: '•', top: '70%', left: '70%', duration: '10s', delay: '1s',   size: '1.2rem', isBlue: true },
  { content: '•', top: '85%', left: '45%', duration: '12s', delay: '3s',   size: '1.2rem', isBlue: true },
  { content: '•', top: '12%', left: '55%', duration: '9s',  delay: '0.5s', size: '1.2rem', isBlue: true },
  { content: '•', top: '48%', left: '60%', duration: '11s', delay: '2.8s', size: '1.2rem', isBlue: true },
  { content: '•', top: '92%', left: '30%', duration: '14s', delay: '1.8s', size: '1.2rem', isBlue: true },
]

function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">

      {/* Soft gradient blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob" />
      <div className="absolute top-[-40px] right-[-60px] w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-60px] left-[20%] w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-4000" />
      <div className="absolute bottom-[-40px] right-[10%] w-64 h-64 bg-sky-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle, #2563eb 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Floating emojis and dots */}
      {floatingItems.map((item, i) => (
        <span key={i} className="float-el absolute select-none"
          style={{
            top: item.top, left: item.left,
            fontSize: item.size,
            animationDuration: item.duration,
            animationDelay: item.delay,
            color: item.isBlue ? '#3b82f6' : undefined,
            opacity: item.isBlue ? 0.35 : 0.25,
          }}>
          {item.content}
        </span>
      ))}

      {/* Decorative corner arcs */}
      <svg className="absolute top-0 left-0 opacity-40" width="350" height="350" viewBox="0 0 300 300">
        <circle cx="0" cy="0" r="150" fill="none" stroke="#1d4ed8" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="200" fill="none" stroke="#1d4ed8" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="250" fill="none" stroke="#1d4ed8" strokeWidth="1" />
        </svg>
      <svg className="absolute bottom-0 right-0 opacity-40" width="350" height="350" viewBox="0 0 300 300">
        <circle cx="300" cy="300" r="150" fill="none" stroke="#1d4ed8" strokeWidth="2.5" />
        <circle cx="300" cy="300" r="200" fill="none" stroke="#1d4ed8" strokeWidth="1.5" />
        <circle cx="300" cy="300" r="250" fill="none" stroke="#1d4ed8" strokeWidth="1" />
        </svg>

    </div>
  )
}

export default AuthBackground