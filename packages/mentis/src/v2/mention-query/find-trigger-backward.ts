import { isWhitespace } from "./isWhitespace";

type FindTriggerProps = {
  text: string;
  startPosition: number;
  trigger: string;
};

type FindTriggerResult =
  | {
      found: true;
      position: number;
    }
  | {
      found: false;
    };

export const findTriggerBackward = ({
  text,
  startPosition,
  trigger,
}: FindTriggerProps): FindTriggerResult => {
  for (let i = startPosition - 1; i >= 0; i--) {
    const char = text[i];

    if (isWhitespace(char)) {
      return { found: false };
    }

    if (char === trigger) {
      return {
        found: true,
        position: i,
      };
    }
  }

  return { found: false };
};
