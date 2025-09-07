import React, { useCallback, useEffect, useRef, useState } from "react";
import { handleInput } from "../input/handle-input";
import { createContentEditable } from "../platform/content-editable";
import type { MentionCoreAPI, StateChangedEvent } from "../core/types";
import type { ContentEditableElement, MentionItem } from "../platform/types";
import { createMentionCore } from "../core/mention-core";
import { cn } from "../helpers/cn";
import { MentionModal } from "./MentionModal";

type MentionInputProps = {
  value?: string | undefined;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  trigger?: string;
  options: MentionItem[];
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

type MentionModalState =
  | {
      query: string;
    }
  | false;

export const MentionInputV2: React.FC<MentionInputProps> = ({
  value,
  className,
  style,
  placeholder,
  trigger,
  options,
  onChange,
  onFocus,
  onBlur,
}: MentionInputProps) => {
  const [modalState, setModalState] = useState<MentionModalState>(false);
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

  const handleInputEvent = useCallback(
    (e: Event) => {
      if (!contentEditableRef.current || !mentionCoreRef.current) return;
      // TODO: Should trigger be passed here?
      handleInput({
        e,
        contentEditable: contentEditableRef.current,
        core: mentionCoreRef.current,
      });
    },
    [trigger]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const initialValue = isControlled ? value : "";
    mentionCoreRef.current = createMentionCore({ value: initialValue });
    contentEditableRef.current = createContentEditable({
      container: containerRef.current,
      placeholder,
      className: cn("content-editable-input", className),
      style,
      trigger,
      options,
    });

    const core = mentionCoreRef.current;
    const contentEditable = contentEditableRef.current;

    contentEditable.api.setText(initialValue);

    const unsubscribeStateChanged = core.subscribe({
      event: "stateChanged",
      callback: (event: StateChangedEvent) => {
        const { newState } = event;

        if (isProgrammaticUpdateRef.current) {
          return;
        }

        contentEditable.api.setText(newState.text);
        contentEditable.api.setCursorPosition(newState.cursorPosition);

        onChange?.(newState.text);
      },
    });

    const unsubscribeMentionQueryDetected = core.subscribe({
      event: "mentionQueryDetected",
      callback: (event: any) => {
        setModalState({
          query: event.query,
        });
      },
    });
    const unsubscribeMentionQueryCleared = core.subscribe({
      event: "mentionQueryCleared",
      callback: () => {
        setModalState(false);
      },
    });

    contentEditable.api.addEventListener("beforeinput", handleInputEvent);
    contentEditable.api.addEventListener("focus", handleFocus);
    contentEditable.api.addEventListener("blur", handleBlur);

    return () => {
      unsubscribeStateChanged();
      unsubscribeMentionQueryDetected();
      unsubscribeMentionQueryCleared();
      if (!contentEditableRef.current) {
        return;
      }
      contentEditable.api.removeEventListener("beforeinput", handleInputEvent);
      contentEditable.api.removeEventListener("focus", handleFocus);
      contentEditable.api.removeEventListener("blur", handleBlur);
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

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <MentionModal options={options} modalState={modalState} />
    </div>
  );
};
