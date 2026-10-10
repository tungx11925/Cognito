export default function ViewerLoading() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] overflow-hidden animate-pulse">
      {/* Top Navbar Skeleton */}
      <div className="h-14 border-b border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-5 w-48 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-gray-100 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-20 bg-gray-100 dark:bg-zinc-800 rounded-lg" />
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Content Skeleton */}
        <div className="flex-1 p-8 flex justify-center overflow-hidden">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-200/60 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="h-8 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4 w-full bg-gray-100 dark:bg-zinc-850 rounded-md" />
            <div className="h-4 w-5/6 bg-gray-100 dark:bg-zinc-850 rounded-md" />
            <div className="h-4 w-4/6 bg-gray-100 dark:bg-zinc-850 rounded-md" />
            <div className="h-48 w-full bg-gray-50 dark:bg-zinc-850 rounded-xl my-6" />
            <div className="h-4 w-full bg-gray-100 dark:bg-zinc-850 rounded-md" />
            <div className="h-4 w-3/4 bg-gray-100 dark:bg-zinc-850 rounded-md" />
          </div>
        </div>

        {/* Sidebar Assistant Skeleton */}
        <div className="w-96 border-l border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4 hidden md:flex flex-col">
          <div className="flex gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div className="h-8 w-16 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-8 w-16 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
            <div className="h-8 w-20 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
          </div>
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-16 w-3/4 bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
            <div className="h-20 w-4/5 bg-gray-100 dark:bg-zinc-800 rounded-2xl ml-auto" />
            <div className="h-24 w-full bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
          </div>
          <div className="h-12 w-full bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
