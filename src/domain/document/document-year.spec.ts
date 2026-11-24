import { yearOf } from './document-year';

describe('yearOf', () => {
  it('reads a four digit year', () => {
    expect(yearOf('2025')).toBe(2025);
  });

  it.each([undefined, '', 'abc', '2025.5', '1899', '2101', '99999'])(
    'ignores %p',
    (value) => {
      expect(yearOf(value)).toBeUndefined();
    },
  );
});
