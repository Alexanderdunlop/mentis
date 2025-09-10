import { useCallback, useEffect, useRef } from "react";
import type { ContentEditableElement, MentionItem } from "../../platform/types";
import { createContentEditable } from "../../platform/content-editable";
import { cn } from "../../helpers/cn";
import { createMentionCore } from "../../core/mention-core";
import type { MentionCoreAPI, StateChangedEvent } from "../../core/types";
import type { MentionQueryDetectedEvent } from "../../input/handle-input";

type InitializeContentEditableProps = {
  container: HTMLDivElement;
  placeholder: string | undefined;
  className: string;
  style: React.CSSProperties | undefined;
  trigger: string | undefined;
  options: MentionItem[];
};

type UseMentionCoreProps = {
  value: string | undefined;
  onFocus: () => void;
  onBlur: () => void;
  onInput: (
    e: Event,
    contentEditable: ContentEditableElement,
    core: MentionCoreAPI
  ) => void;
  onChange?: (text: string) => void;
  onMentionQueryDetected: (event: MentionQueryDetectedEvent) => void;
  onMentionQueryCleared: () => void;
};

export const useMentionCore = ({
  value,
  onFocus,
  onBlur,
  onInput,
  onChange,
  onMentionQueryDetected,
  onMentionQueryCleared,
}: UseMentionCoreProps) => {
  const contentEditableRef = useRef<ContentEditableElement | null>(null);
  const mentionCoreRef = useRef<MentionCoreAPI | null>(null);
  const isProgrammaticUpdateRef = useRef<boolean>(false);

  // Initialize the content editable element
  const initializeContentEditable = useCallback(
    ({
      container,
      placeholder,
      className,
      style,
      trigger,
      options,
    }: InitializeContentEditableProps) => {
      if (contentEditableRef.current) return;

      console.log("Initializing content editable");

      contentEditableRef.current = createContentEditable({
        container,
        placeholder,
        className: cn("content-editable-input", className),
        style,
        trigger,
        options,
      });

      const initialValue = value || "";
      mentionCoreRef.current = createMentionCore({ value: initialValue });
    },
    []
  );

  // Setup the mention core event listeners
  useEffect(() => {
    const contentEditable = contentEditableRef.current;
    const core = mentionCoreRef.current;
    if (!contentEditable || !core) return;

    console.log("Setting up mention core event listeners");

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
      callback: (event: MentionQueryDetectedEvent) => {
        onMentionQueryDetected?.(event);
      },
    });

    const unsubscribeMentionQueryCleared = core.subscribe({
      event: "mentionQueryCleared",
      callback: () => {
        onMentionQueryCleared?.();
      },
    });

    return () => {
      unsubscribeStateChanged();
      unsubscribeMentionQueryDetected();
      unsubscribeMentionQueryCleared();
    };
  }, [mentionCoreRef.current]);

  // Setup the content editable event listeners
  useEffect(() => {
    const contentEditable = contentEditableRef.current;
    const core = mentionCoreRef.current;
    if (!contentEditable || !core) return;

    console.log("Setting up content editable event listeners");

    contentEditable.api.addEventListener("beforeinput", (e: Event) =>
      onInput(e, contentEditable, core)
    );
    contentEditable.api.addEventListener("focus", onFocus);
    contentEditable.api.addEventListener("blur", onBlur);

    return () => {
      contentEditable.api.removeEventListener("beforeinput", (e: Event) =>
        onInput(e, contentEditable, core)
      );
      contentEditable.api.removeEventListener("focus", onFocus);
      contentEditable.api.removeEventListener("blur", onBlur);
    };
  }, [mentionCoreRef.current]);

  // Update the mention value programmatically
  const updateProgrammatically = useCallback((newValue: string) => {
    if (!mentionCoreRef.current || !contentEditableRef.current) return;

    const contentEditable = contentEditableRef.current;
    const core = mentionCoreRef.current;

    const currentState = core.getState();
    if (currentState.text === newValue) return;

    console.log("Updating mention value programmatically", newValue);

    isProgrammaticUpdateRef.current = true;

    core.setState({
      text: newValue,
    });

    contentEditable.api.setText(newValue);

    Promise.resolve().then(() => {
      isProgrammaticUpdateRef.current = false;
    });
  }, []);

  return {
    contentEditable: contentEditableRef.current,
    initializeContentEditable,
    updateProgrammatically,
  };
};
