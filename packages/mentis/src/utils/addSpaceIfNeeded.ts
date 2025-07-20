type AddSpaceIfNeededProps = {
  text: string;
  startIndex: number;
  matchLength: number;
};

export const addSpaceIfNeeded = ({
  text,
  startIndex,
  matchLength,
}: AddSpaceIfNeededProps): boolean => {
  const nextCharIndex = startIndex + matchLength;
  const nextChar = text.charAt(nextCharIndex);

  return nextChar !== " " && nextChar !== "\n" && nextChar !== "\t";
};
