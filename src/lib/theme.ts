// Shared colours and sizes, so every screen looks the same.
// Sizes are larger than usual on purpose: the app is made for an older learner too.
// The course colour (accent) comes from the language being learned: see useAccent() in course.tsx.

export const colors = {
  primary: '#1E5AA8', // app colour before a course is chosen (blue, from the Czech flag)
  primaryDark: '#123E78',
  primaryLight: '#E8F0FB',
  success: '#1F7A45',
  successLight: '#E3F5EA',
  successBorder: '#2E9E5B',
  error: '#B3261E',
  errorLight: '#FDE8E8',
  errorBorder: '#D7141A',
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#1A1D24',
  textMuted: '#4F5663', // still 7:1 contrast on white
  border: '#D3DAE5',
  tipBackground: '#FFF7E0',
  tipBorder: '#F1DFA6',
  tipLabel: '#8A5F00',
  star: '#F2B705',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { md: 14, lg: 22 };

export const font = { small: 16, body: 19, large: 22, title: 28, huge: 36 };

// Minimum height for anything tappable (Apple recommends at least 44; we go bigger).
export const tapTarget = 60;
