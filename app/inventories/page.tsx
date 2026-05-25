import Link from 'next/link';
import { batteries, standaloneQuestions } from '@/lib/inventory/registry';

export default function InventoriesPage() {
  return (
    <div className="flex flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventories</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pick an inventory to fill out. Answers save automatically.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Batteries
        </h2>
        <ul className="flex flex-col gap-2">
          {batteries.map((b) => (
            <li key={b.id}>
              <Link
                href={`/inventories/${b.id}`}
                className="flex flex-col gap-1 rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
              >
                <span className="text-sm font-medium">{b.name}</span>
                {b.description && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {b.description}
                  </span>
                )}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {b.questions.length} questions
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {standaloneQuestions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Single questions
          </h2>
          <ul className="flex flex-col gap-2">
            {standaloneQuestions.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/inventories/q/${q.id}`}
                  className="flex flex-col gap-1 rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                >
                  <span className="text-sm font-medium">{q.prompt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
