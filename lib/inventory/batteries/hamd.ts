import type { Battery, ChoiceOption, Question } from '../types';

const BATTERY_ID = 'hamd';

const scale = (max: 2 | 4): ChoiceOption[] =>
  Array.from({ length: max + 1 }, (_, i) => ({ value: i, label: String(i) }));

const q = (
  id: string,
  prompt: string,
  max: 2 | 4,
): Question => ({
  id: `${BATTERY_ID}_${id}`,
  prompt,
  type: 'scale',
  options: scale(max),
  batteryId: BATTERY_ID,
});

const questions: Question[] = [
  q('depressed_mood', '1. Depressed mood (sadness, hopelessness, helplessness, worthlessness)', 4),
  q('guilt', '2. Feelings of guilt', 4),
  q('suicide', '3. Suicide', 4),
  q('insomnia_early', '4. Insomnia: early (difficulty falling asleep)', 2),
  q('insomnia_middle', '5. Insomnia: middle (waking during the night)', 2),
  q('insomnia_late', '6. Insomnia: late (early morning waking)', 2),
  q('work_activities', '7. Work and activities', 4),
  q('retardation', '8. Retardation (slowness of thought, speech, movement)', 4),
  q('agitation', '9. Agitation', 4),
  q('anxiety_psychological', '10. Anxiety: psychological', 4),
  q('anxiety_somatic', '11. Anxiety: somatic (physical symptoms)', 4),
  q('somatic_gi', '12. Somatic symptoms: gastrointestinal', 2),
  q('somatic_general', '13. Somatic symptoms: general (heaviness, fatigability)', 2),
  q('genital', '14. Genital symptoms (loss of libido, menstrual issues)', 2),
  q('hypochondriasis', '15. Hypochondriasis', 4),
  q('weight_loss', '16. Loss of weight', 2),
  q('insight', '17. Insight', 2),
];

export const hamd: Battery = {
  id: BATTERY_ID,
  name: 'Hamilton Depression Rating Scale (HAM-D-17)',
  description: '17-item clinician-rated depression severity scale. Score range 0–52.',
  questions,
  score: (answers) => {
    let total = 0;
    for (const question of questions) {
      const a = answers[question.id];
      if (a?.kind === 'choice' && typeof a.value === 'number') total += a.value;
    }
    const interpretation =
      total <= 7 ? 'normal'
      : total <= 13 ? 'mild'
      : total <= 18 ? 'moderate'
      : total <= 22 ? 'severe'
      : 'very severe';
    return { total, interpretation };
  },
};
