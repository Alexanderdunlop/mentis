import { findTriggerBackward } from "./find-trigger-backward";
import { extractQuery } from "./extract-query";
import type { DetectMentionQueryResult } from "../core/types";

export const detectMentionQuery = (
  text: string,
  cursorPosition: number,
  trigger: string
): DetectMentionQueryResult => {
  if (text === "") {
    return {
      query: null,
      shouldShowModal: false,
    };
  }

  const findTriggerResult = findTriggerBackward({
    text,
    startPosition: cursorPosition,
    trigger,
  });

  if (!findTriggerResult.found) {
    return {
      query: null,
      shouldShowModal: false,
    };
  }

  const { query, isValid } = extractQuery({
    text,
    startIndex: findTriggerResult.position,
    endIndex: cursorPosition,
  });

  if (!isValid) {
    return {
      query: null,
      shouldShowModal: false,
    };
  }

  return {
    query: {
      query,
      startIndex: findTriggerResult.position,
    },
    shouldShowModal: true,
  };
};
