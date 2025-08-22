export const cn = (...classes: (string | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};
