// Check for single @ (not part of multiple consecutive @'s)
export function isSingleAtMention(val: string, atIndex: number): boolean {
  return (
    atIndex !== -1 &&
    (atIndex === 0 || val[atIndex - 1] !== "@") &&
    (atIndex === val.length - 1 || val[atIndex + 1] !== "@")
  );
}
