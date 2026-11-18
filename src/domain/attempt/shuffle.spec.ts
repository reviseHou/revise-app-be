import { seededShuffle, seedOf } from './shuffle';

describe('seededShuffle', () => {
  const items = Array.from({ length: 20 }, (_, i) => i + 1);

  it('keeps every item exactly once', () => {
    const result = seededShuffle(items, seedOf(42));
    expect([...result].sort((a, b) => a - b)).toEqual(items);
  });

  it('returns the same order for the same seed', () => {
    expect(seededShuffle(items, seedOf(7))).toEqual(
      seededShuffle(items, seedOf(7)),
    );
  });

  it('returns different orders for different attempts', () => {
    const orders = new Set(
      [1, 2, 3, 4, 5].map((id) => seededShuffle(items, seedOf(id)).join(',')),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it('does not mutate the input', () => {
    const copy = [...items];
    seededShuffle(items, seedOf(1));
    expect(items).toEqual(copy);
  });
});
