export default function AITestLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] p-6 lg:p-10 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-4 w-72 bg-gray-100 dark:bg-zinc-850 rounded-lg" />
        </div>
        <div className="h-44 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/60 dark:border-zinc-800 space-y-3" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/60 dark:border-zinc-800 space-y-3" />
          ))}
        </div>
      </div>
    </div>
  );
}
