export const findPositionsOfMatchingString = (
  text: string,
  string: string
): Array<number> => {
  const positions: Array<number> = [];
  let index = text.indexOf(string);
  while (index !== -1) {
    positions.push(index);
    index = text.indexOf(string, index + 1);
  }
  return positions;
};
