'use client';

import { useState, useTransition } from 'react';
import { saveAnswer } from '@/app/actions';
import type { AnswerValue, Question } from '@/lib/inventory/types';

type Status = 'idle' | 'saving' | 'saved' | 'error';

export function SingleQuestionForm({
  question,
  initial,
}: {
  question: Question;
  initial: AnswerValue | undefined;
}) {
  const [value, setValue] = useState<AnswerValue | undefined>(initial);
  const [status, setStatus] = useState<Status>('idle');
  const [, startTransition] = useTransition();

  const onChange = (v: AnswerValue) => {
    setValue(v);
    setStatus('saving');
    startTransition(async () => {
      try {
        await saveAnswer(question.id, v);
        setStatus('saved');
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <div className="flex justify-end">
        <StatusBadge status={status} />
      </div>
      <Input question={question} value={value} onChange={onChange} />
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
  return <span className={`text-xs ${cls}`}>{text}</span>;
}

function Input({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  if (question.type === 'multiple_choice' || question.type === 'scale') {
    const current = value?.kind === 'choice' ? value.value : undefined;
    return (
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => {
          const selected = current === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange({ kind: 'choice', value: opt.value })}
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
