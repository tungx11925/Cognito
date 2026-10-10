export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] p-6 lg:p-10 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Profile Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200/60 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-6 shadow-xs">
          <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-zinc-800" />
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="h-7 w-48 bg-gray-200 dark:bg-zinc-800 rounded-xl mx-auto md:mx-0" />
            <div className="h-4 w-64 bg-gray-100 dark:bg-zinc-850 rounded-lg mx-auto md:mx-0" />
            <div className="flex gap-2 justify-center md:justify-start pt-2">
              <div className="h-6 w-20 bg-gray-100 dark:bg-zinc-800 rounded-full" />
              <div className="h-6 w-24 bg-gray-100 dark:bg-zinc-800 rounded-full" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-200/60 dark:border-zinc-800 space-y-2">
              <div className="h-4 w-20 bg-gray-100 dark:bg-zinc-850 rounded-md" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
