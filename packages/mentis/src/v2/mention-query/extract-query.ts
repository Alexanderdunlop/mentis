import { isWhitespace } from "./isWhitespace";

type ExtractQueryProps = {
  text: string;
  startIndex: number;
  endIndex: number;
};

type ExtractQueryResult = {
  query: string;
  isValid: boolean;
};

export const extractQuery = ({
  text,
  startIndex,
  endIndex,
}: ExtractQueryProps): ExtractQueryResult => {
  const queryStartIndex = startIndex + 1;
  const queryText = text.slice(queryStartIndex, endIndex + 1);

  const hasWhitespace = queryText.split("").some((char) => isWhitespace(char));

  return {
    query: queryText,
    isValid: !hasWhitespace,
  };
};
