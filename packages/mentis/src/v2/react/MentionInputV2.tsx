import React, { useCallback, useEffect, useRef } from "react";
import { handleInput } from "../input/handle-input";
import { createContentEditable } from "../platform/content-editable";
import type { MentionCoreAPI, StateChangedEvent } from "../core/types";
import type { ContentEditableElement } from "../platform/types";
import { createMentionCore } from "../core/mention-core";
import { cn } from "../helpers/cn";

// export type OldMentionInputProps = {
//     displayValue?: string;
//     dataValue?: string;
//     options: MentionOption[];
//     slotsProps?: SlotProps;
//     keepTriggerOnSelect?: boolean;
//     trigger?: string;
//     autoConvertMentions?: boolean;
//     onChange?: (value: MentionData) => void;
//     onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
//   };

type MentionInputProps = {
  value?: string | undefined;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export const MentionInputV2: React.FC<MentionInputProps> = ({
  value,
  className,
  style,
  placeholder,
  onChange,
  onFocus,
  onBlur,
}: MentionInputProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mentionCoreRef = useRef<MentionCoreAPI | null>(null);
  const contentEditableRef = useRef<ContentEditableElement | null>(null);
  const isProgrammaticUpdateRef = useRef<boolean>(false);

  const isControlled = value !== undefined;

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  const handleInputEvent = useCallback((e: Event) => {
    if (!contentEditableRef.current || !mentionCoreRef.current) return;
    handleInput({
      e,
      contentEditable: contentEditableRef.current,
      core: mentionCoreRef.current,
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const initialValue = isControlled ? value : "";
    mentionCoreRef.current = createMentionCore({ value: initialValue });
    contentEditableRef.current = createContentEditable({
      container: containerRef.current,
      placeholder,
      className: cn("content-editable-input", className),
      style,
    });

    const core = mentionCoreRef.current;
    const contentEditable = contentEditableRef.current;

    contentEditable.api.setText(initialValue);

    const unsubscribeStateChanged = core.subscribe(
      "stateChanged",
      (event: StateChangedEvent) => {
        const { newState } = event;

        if (isProgrammaticUpdateRef.current) {
          return;
        }

        contentEditable.api.setText(newState.text);
        contentEditable.api.setCursorPosition(newState.cursorPosition);

        onChange?.(newState.text);
      }
    );

    contentEditable.api.addEventListener("beforeinput", handleInputEvent);
    contentEditable.api.addEventListener("focus", handleFocus);
    contentEditable.api.addEventListener("blur", handleBlur);

    return () => {
      unsubscribeStateChanged();
      if (!contentEditableRef.current) {
        return;
      }
      const element = contentEditableRef.current.element;
      element.removeEventListener("beforeinput", handleInputEvent);
      element.removeEventListener("focus", handleFocus);
      element.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (
      !isControlled ||
      !mentionCoreRef.current ||
      !contentEditableRef.current
    ) {
      return;
    }

    const core = mentionCoreRef.current;
    const contentEditable = contentEditableRef.current;
    const currentState = core.getState();

    if (currentState.text === value) {
      return;
    }

    isProgrammaticUpdateRef.current = true;

    core.setState({
      text: value,
    });

    contentEditable.api.setText(value);

    Promise.resolve().then(() => {
      isProgrammaticUpdateRef.current = false;
    });
  }, [value, isControlled]);

  return <div ref={containerRef} />;
};
