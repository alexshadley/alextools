export default function Home() {
  return (
    <div className="flex h-full flex-col gap-6 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your overview will appear here.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
        No dashboards yet.
      </div>
    </div>
  );
}
