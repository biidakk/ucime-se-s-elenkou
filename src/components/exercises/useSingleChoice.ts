import { useMemo, useState } from 'react';
import { shuffle } from '@/lib/shuffle';
import type { OptionState } from './OptionButton';
import type { ExerciseResult } from './types';

// Shared logic for "pick one answer" exercises (multiple choice, listen, fill the gap).
export function useSingleChoice(
  allOptions: string[],
  answer: string,
  onResult: (result: ExerciseResult) => void,
) {
  const options = useMemo(() => shuffle(allOptions), [allOptions]);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const select = (option: string) => {
    if (!checked) setSelected(option);
  };

  const check = () => {
    if (!selected || checked) return;
    setChecked(true);
    onResult({ correct: selected === answer, correctAnswer: answer });
  };

  const stateFor = (option: string): OptionState => {
    if (!checked) return option === selected ? 'selected' : 'idle';
    if (option === answer) return 'correct';
    if (option === selected) return 'wrong';
    return 'dimmed';
  };

  return { options, selected, checked, select, check, stateFor };
}
