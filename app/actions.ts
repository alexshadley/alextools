'use server';

import { db, questionAnswers } from '@/db';
import { getQuestion } from '@/lib/inventory/registry';
import type { AnswerValue } from '@/lib/inventory/types';
import { revalidatePath } from 'next/cache';

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function saveAnswer(
  questionId: string,
  value: AnswerValue,
): Promise<void> {
  const question = getQuestion(questionId);
  if (!question) throw new Error(`Unknown question: ${questionId}`);

  const forDate = todayISO();

  await db
    .insert(questionAnswers)
    .values({ questionId, forDate, value })
    .onConflictDoUpdate({
      target: [questionAnswers.questionId, questionAnswers.forDate],
      set: { value, answeredAt: new Date() },
    });

  if (question.batteryId) {
    revalidatePath(`/inventories/${question.batteryId}`);
  } else {
    revalidatePath(`/inventories/q/${questionId}`);
  }
}
