import type { MentionOption } from "../types/MentionInput.types";

export type MentionOptionWithoutFunction = Omit<MentionOption, "value"> & {
  value: string;
};

export const filterOutOptionFunctions = (
  options: MentionOption[]
): MentionOptionWithoutFunction[] => {
  const optionsWithoutFunctions: MentionOptionWithoutFunction[] = [];

  options.forEach((option) => {
    if (typeof option.value !== "function") {
      optionsWithoutFunctions.push({
        ...option,
        value: option.value,
      });
    }
  });

  return optionsWithoutFunctions;
};
