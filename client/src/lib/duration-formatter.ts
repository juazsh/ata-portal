/**
 * Formats duration in days to a human-readable string
 * @param days Number of days
 * @returns Formatted duration string
 */
export function formatDuration(days: number): string {
  if (days < 7) {
    return `${days} days`;
  } else if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    const years = Math.round(days / 365 * 10) / 10; // Round to 1 decimal
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
}