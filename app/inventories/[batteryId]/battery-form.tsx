'use client';

import { useMemo, useState, useTransition } from 'react';
import { saveAnswer } from '@/app/actions';
import { getBattery } from '@/lib/inventory/registry';
import type { AnswerValue, Question } from '@/lib/inventory/types';

type Status = 'idle' | 'saving' | 'saved' | 'error';

export function BatteryForm({
  batteryId,
  initial,
}: {
  batteryId: string;
  initial: Record<string, AnswerValue>;
}) {
  const battery = getBattery(batteryId);
  if (!battery) throw new Error(`Unknown battery: ${batteryId}`);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initial);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [, startTransition] = useTransition();

  const update = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setStatus((prev) => ({ ...prev, [questionId]: 'saving' }));
    startTransition(async () => {
      try {
        await saveAnswer(questionId, value);
        setStatus((prev) => ({ ...prev, [questionId]: 'saved' }));
      } catch (e) {
        console.error(e);
        setStatus((prev) => ({ ...prev, [questionId]: 'error' }));
      }
    });
  };

  const score = useMemo(() => {
    const answered = battery.questions.every((q) => answers[q.id] != null);
    if (!answered) return null;
    return battery.score(answers);
  }, [answers, battery]);

  return (
    <div className="flex flex-col gap-4">
      {battery.questions.map((q) => (
        <QuestionRow
          key={q.id}
          question={q}
          value={answers[q.id]}
          status={status[q.id] ?? 'idle'}
          onChange={(v) => update(q.id, v)}
        />
      ))}

      {score && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-medium">Score: {score.total}</div>
          {score.interpretation && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {score.interpretation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionRow({
  question,
  value,
  status,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  status: Status;
  onChange: (v: AnswerValue) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium">{question.prompt}</div>
        <StatusBadge status={status} />
      </div>
      <QuestionInput question={question} value={value} onChange={onChange} />
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'idle') return null;
  const text =
    status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Error';
  const cls =
    status === 'error'
      ? 'text-red-600 dark:text-red-400'
      : status === 'saved'
        ? 'text-green-600 dark:text-green-400'
        : 'text-zinc-400';
  return <span className={`shrink-0 text-xs ${cls}`}>{text}</span>;
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  if (question.type === 'multiple_choice' || question.type === 'scale') {
    const current =
      value?.kind === 'choice' ? value.value : undefined;
    return (
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => {
          const selected = current === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() =>
                onChange({ kind: 'choice', value: opt.value })
              }
              className={
                'rounded-md border px-3 py-1.5 text-sm transition-colors ' +
                (selected
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600')
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'numeric') {
    const current = value?.kind === 'number' ? value.value : '';
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          defaultValue={current}
          onBlur={(e) => {
            const raw = e.currentTarget.value;
            if (raw === '') return;
            const n = Number(raw);
            if (Number.isNaN(n)) return;
            onChange({ kind: 'number', value: n });
          }}
          className="w-32 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        />
        {question.unit && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {question.unit}
          </span>
        )}
      </div>
    );
  }

  // free_text
  const current = value?.kind === 'text' ? value.value : '';
  return (
    <textarea
      defaultValue={current}
      onBlur={(e) => onChange({ kind: 'text', value: e.currentTarget.value })}
      rows={3}
      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
    />
  );
}
