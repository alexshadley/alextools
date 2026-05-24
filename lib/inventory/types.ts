export type ChoiceOption = {
  value: number | string;
  label: string;
};

export type Question =
  | {
      id: string;
      prompt: string;
      type: 'multiple_choice' | 'scale';
      options: ChoiceOption[];
      batteryId?: string;
    }
  | {
      id: string;
      prompt: string;
      type: 'numeric';
      unit?: string;
      batteryId?: string;
    }
  | {
      id: string;
      prompt: string;
      type: 'free_text';
      batteryId?: string;
    };

export type AnswerValue =
  | { kind: 'choice'; value: number | string }
  | { kind: 'number'; value: number }
  | { kind: 'text'; value: string };

export type Battery = {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
  score: (answers: Record<string, AnswerValue>) => {
    total: number;
    interpretation?: string;
  };
};

export type CadenceItem =
  | { kind: 'battery'; batteryId: string; every: 'week' }
  | { kind: 'question'; questionId: string; every: 'week' };
