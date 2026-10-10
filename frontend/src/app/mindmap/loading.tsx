export default function MindmapLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-60 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4 w-72 bg-gray-100 dark:bg-zinc-850 rounded-lg" />
          </div>
          <div className="h-10 w-36 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
        </div>

        {/* Workspace Canvas Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[72vh]">
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-gray-200/60 dark:border-zinc-800 space-y-3">
            <div className="h-6 w-32 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-50 dark:bg-zinc-850 rounded-2xl p-3 border border-gray-100 dark:border-zinc-800" />
            ))}
          </div>
          <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/60 dark:border-zinc-800 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 bg-gray-100 dark:bg-zinc-800 rounded-2xl mx-auto" />
              <div className="h-5 w-48 bg-gray-200 dark:bg-zinc-800 rounded-lg mx-auto" />
              <div className="h-4 w-64 bg-gray-100 dark:bg-zinc-850 rounded-md mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
