export default function FocusLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] flex items-center justify-center p-6 animate-pulse">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200/60 dark:border-zinc-800 shadow-xl flex flex-col items-center gap-6">
        <div className="h-6 w-40 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-44 w-44 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          <div className="h-10 w-28 bg-gray-200 dark:bg-zinc-700 rounded-xl" />
        </div>
        <div className="flex gap-4 w-full">
          <div className="h-12 flex-1 bg-gray-200 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-12 w-14 bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
