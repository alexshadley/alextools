import { burns } from './batteries/burns';
import type { Battery, CadenceItem, Question } from './types';

export const batteries: Battery[] = [burns];

export const standaloneQuestions: Question[] = [
  {
    id: 'hours_worked_week',
    prompt: 'How many hours did you work this week?',
    type: 'numeric',
    unit: 'hours',
  },
  {
    id: 'smoked_weed',
    prompt: 'Did you smoke weed?',
    type: 'multiple_choice',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
  },
];

export const cadence: CadenceItem[] = [
  { kind: 'battery', batteryId: 'burns', every: 'week' },
  { kind: 'question', questionId: 'hours_worked_week', every: 'week' },
];

const questionIndex = new Map<string, Question>();
for (const b of batteries) for (const q of b.questions) questionIndex.set(q.id, q);
for (const q of standaloneQuestions) questionIndex.set(q.id, q);

const batteryIndex = new Map(batteries.map((b) => [b.id, b]));

export const getQuestion = (id: string) => questionIndex.get(id);
export const getBattery = (id: string) => batteryIndex.get(id);
export const allQuestions = () => Array.from(questionIndex.values());
