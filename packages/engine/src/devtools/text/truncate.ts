/** Keeps the full length visible, because a truncated string hides how much was cut. */
export const truncate = (text: string, max = 80): string =>
  text.length <= max ? text : `${text.slice(0, max)}…(${text.length})`;
