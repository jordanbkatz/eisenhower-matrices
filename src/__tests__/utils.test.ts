import { cn } from '../lib/utils';
import { quadrantColor } from '../components/EisenhowerMatrix';

describe('eisenhower-matrices utils', () => {
  test('cn merges tailwind classes properly', () => {
    const result = cn('bg-red-500', 'p-4', false && 'hidden');
    expect(result).toBe('bg-red-500 p-4');
  });

  test('quadrantColor returns purple primary accent color for exact center (50, 50)', () => {
    expect(quadrantColor(50, 50)).toBe('var(--primary)');
  });

  test('quadrantColor returns proper colors for quadrants', () => {
    expect(quadrantColor(75, 75)).toBe('var(--q1)');
    expect(quadrantColor(25, 75)).toBe('var(--q2)');
    expect(quadrantColor(75, 25)).toBe('var(--q3)');
    expect(quadrantColor(25, 25)).toBe('var(--q4)');
  });
});
