import type { Battery, Question } from '../types';

const BATTERY_ID = 'burns';

const ANCHORS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Somewhat' },
  { value: 2, label: 'Moderately' },
  { value: 3, label: 'A lot' },
  { value: 4, label: 'Extremely' },
];

const q = (id: string, prompt: string): Question => ({
  id: `${BATTERY_ID}_${id}`,
  prompt,
  type: 'scale',
  options: ANCHORS,
  batteryId: BATTERY_ID,
});

const questions: Question[] = [
  // Thoughts and Feelings
  q('sad', '1. Feeling sad or down in the dumps'),
  q('unhappy', '2. Feeling unhappy or blue'),
  q('crying', '3. Crying spells or tearfulness'),
  q('discouraged', '4. Feeling discouraged'),
  q('hopeless', '5. Feeling hopeless'),
  q('low_self_esteem', '6. Low self-esteem'),
  q('worthless', '7. Feeling worthless or inadequate'),
  q('guilt', '8. Guilt or shame'),
  q('self_criticism', '9. Criticizing yourself or blaming others'),
  q('indecisive', '10. Difficulty making decisions'),
  // Activities and Personal Relationships
  q('loss_of_interest_people', '11. Loss of interest in family, friends or colleagues'),
  q('loneliness', '12. Loneliness'),
  q('less_time_with_people', '13. Spending less time with family or friends'),
  q('motivation', '14. Loss of motivation'),
  q('loss_of_interest_work', '15. Loss of interest in work or other activities'),
  q('avoiding_work', '16. Avoiding work or other activities'),
  q('loss_of_pleasure', '17. Loss of pleasure or satisfaction in life'),
  // Physical Symptoms
  q('tired', '18. Feeling tired'),
  q('sleep', '19. Difficulty sleeping or sleeping too much'),
  q('appetite', '20. Decreased or increased appetite'),
  q('libido', '21. Loss of interest in sex'),
  q('health_worry', '22. Worrying about your health'),
  // Suicidal Urges
  q('suicidal_thoughts', '23. Do you have any suicidal thoughts?'),
  q('end_life', '24. Would you like to end your life?'),
  q('suicide_plan', '25. Do you have a plan for harming yourself?'),
];

export const burns: Battery = {
  id: BATTERY_ID,
  name: "Burns Depression Checklist",
  description:
    '25-item self-report depression checklist. Score range 0–100. Bands: 0–5 no depression, 6–10 normal but unhappy, 11–25 mild, 26–50 moderate, 51–75 severe, 76–100 extreme.',
  questions,
  score: (answers) => {
    let total = 0;
    for (const question of questions) {
      const a = answers[question.id];
      if (a?.kind === 'choice' && typeof a.value === 'number') total += a.value;
    }
    const interpretation =
      total <= 5 ? 'no depression'
      : total <= 10 ? 'normal but unhappy'
      : total <= 25 ? 'mild depression'
      : total <= 50 ? 'moderate depression'
      : total <= 75 ? 'severe depression'
      : 'extreme depression';
    return { total, interpretation };
  },
};
