export default function ProgressLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] p-6 lg:p-10 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-52 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-4 w-72 bg-gray-100 dark:bg-zinc-850 rounded-lg" />
        </div>

        {/* 4 Cards Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-gray-200/60 dark:border-zinc-800 space-y-2">
              <div className="h-4 w-24 bg-gray-100 dark:bg-zinc-850 rounded-md" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="h-80 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/60 dark:border-zinc-800 flex items-center justify-center">
          <div className="h-48 w-full bg-gray-50 dark:bg-zinc-850 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
