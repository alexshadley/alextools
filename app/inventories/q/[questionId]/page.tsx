import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { db, questionAnswers } from '@/db';
import { getQuestion } from '@/lib/inventory/registry';
import type { AnswerValue } from '@/lib/inventory/types';
import { SingleQuestionForm } from './single-question-form';

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default async function SingleQuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const question = getQuestion(questionId);
  if (!question) notFound();

  const forDate = todayISO();
  const [row] = await db
    .select({ value: questionAnswers.value })
    .from(questionAnswers)
    .where(
      and(
        eq(questionAnswers.forDate, forDate),
        eq(questionAnswers.questionId, questionId),
      ),
    )
    .limit(1);

  const initial: AnswerValue | undefined = row?.value;

  return (
    <div className="flex flex-col gap-6 p-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/inventories"
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Inventories
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {question.prompt}
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">For {forDate}</p>
      </div>

      <SingleQuestionForm question={question} initial={initial} />
    </div>
  );
}
