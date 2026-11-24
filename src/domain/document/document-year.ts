const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export function yearOf(param?: string): number | undefined {
  const year = Number(param);
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR
    ? year
    : undefined;
}
