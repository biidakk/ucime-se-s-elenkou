import type { Exercise } from '@/lib/content';
import { BuildExerciseView } from './BuildExerciseView';
import { ChoiceExerciseView } from './ChoiceExerciseView';
import { FillExerciseView } from './FillExerciseView';
import { ListenExerciseView } from './ListenExerciseView';
import { MatchExerciseView } from './MatchExerciseView';
import { SpeakExerciseView } from './SpeakExerciseView';
import { TypeExerciseView } from './TypeExerciseView';
import type { ExerciseResult } from './types';

// Shows the right screen for each kind of exercise.
export function ExerciseView({ exercise, onResult }: { exercise: Exercise; onResult: (r: ExerciseResult) => void }) {
  switch (exercise.type) {
    case 'choice':
      return <ChoiceExerciseView exercise={exercise} onResult={onResult} />;
    case 'match':
      return <MatchExerciseView exercise={exercise} onResult={onResult} />;
    case 'type':
      return <TypeExerciseView exercise={exercise} onResult={onResult} />;
    case 'listen':
      return <ListenExerciseView exercise={exercise} onResult={onResult} />;
    case 'build':
      return <BuildExerciseView exercise={exercise} onResult={onResult} />;
    case 'fill':
      return <FillExerciseView exercise={exercise} onResult={onResult} />;
    case 'speak':
      return <SpeakExerciseView exercise={exercise} onResult={onResult} />;
  }
}
