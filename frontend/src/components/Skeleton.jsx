function SkeletonCard() {
  return (
    <div className="border border-gray-100 rounded-xl p-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-3 bg-gray-100 rounded w-full"></div>
          <div className="h-3 bg-gray-100 rounded w-1/3"></div>
        </div>
        <div className="space-y-2 shrink-0">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
          <div className="h-5 bg-gray-100 rounded-full w-16"></div>
        </div>
      </div>
    </div>
  )
}

function SkeletonSection() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

export { SkeletonCard, SkeletonSection }