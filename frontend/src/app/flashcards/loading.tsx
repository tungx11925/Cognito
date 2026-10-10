export default function FlashcardsLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] p-6 lg:p-10 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4 w-72 bg-gray-100 dark:bg-zinc-850 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-10 w-36 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="h-12 w-full bg-gray-100 dark:bg-zinc-850 rounded-2xl border border-gray-200/50 dark:border-zinc-800" />

        {/* Deck Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/60 dark:border-zinc-800 space-y-4 shadow-xs">
              <div className="flex justify-between items-start">
                <div className="h-6 w-36 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-5 w-16 bg-gray-100 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-4 w-full bg-gray-100 dark:bg-zinc-850 rounded-md" />
              <div className="h-4 w-2/3 bg-gray-100 dark:bg-zinc-850 rounded-md" />
              <div className="pt-4 flex justify-between items-center border-t border-gray-100 dark:border-zinc-800">
                <div className="h-4 w-20 bg-gray-100 dark:bg-zinc-800 rounded-md" />
                <div className="h-8 w-24 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
