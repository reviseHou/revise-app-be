export const PAGE_SIZE = 10;

export const offsetOf = (page: number) => (page - 1) * PAGE_SIZE;

/** LIKE pattern for a user-typed keyword, escaping the wildcards % and _. */
export const likeOf = (keyword: string) =>
  `%${keyword.replace(/[\\%_]/g, (char) => '\\' + char)}%`;
