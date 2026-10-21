export const PAGE_SIZE = 10;

export const offsetOf = (page: number) => (page - 1) * PAGE_SIZE;

export const likeOf = (keyword: string) =>
  `%${keyword.replace(/[\\%_]/g, (char) => '\\' + char)}%`;
