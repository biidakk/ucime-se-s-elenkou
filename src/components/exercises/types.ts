// What an exercise reports back to the lesson screen once the user has answered.
export type ExerciseResult = {
  correct: boolean;
  correctAnswer: string; // shown to the user when they were wrong
  note?: string; // extra hint shown even when correct (e.g. about accents)
};
