import type {
  DetectMentionQueryProps,
  MentionCoreAPI,
  MentionState,
  DetectMentionQueryResult,
  InsertTextProps,
  DeleteTextProps,
  SubscribeProps,
  EmitProps,
} from "./types";
import { detectMentionQuery } from "../mention-query/detect-query";

type CreateMentionCoreAPIProps = {
  state: MentionState;
  listeners: Map<string, Function[]>;
};

const createMentionCoreAPI = ({
  state,
  listeners,
}: CreateMentionCoreAPIProps): MentionCoreAPI => {
  const getState = (): MentionState => {
    return state;
  };

  const setState = (newState: Partial<MentionState>): void => {
    const oldState = { ...state };
    state = { ...state, ...newState };
    emit({ event: "stateChanged", data: { oldState, newState: state } });
  };

  const insertText = ({ text, position }: InsertTextProps): void => {
    const newText =
      state.text.slice(0, position) + text + state.text.slice(position);

    setState({
      text: newText,
      cursorPosition: position + text.length,
    });
  };

  const deleteText = ({ start, end }: DeleteTextProps): void => {
    const newText = state.text.slice(0, start) + state.text.slice(end);

    setState({
      text: newText,
      cursorPosition: start,
    });
  };

  const detectQuery = ({
    position,
    trigger,
  }: DetectMentionQueryProps): DetectMentionQueryResult => {
    console.log("state.text", state.text);
    return detectMentionQuery(state.text, position, trigger);
  };

  const subscribe = ({ event, callback }: SubscribeProps): (() => void) => {
    // Get or create listeners array for this event
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }

    const eventListeners = listeners.get(event)!;
    eventListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }

      // Clean up empty listener arrays
      if (eventListeners.length === 0) {
        listeners.delete(event);
      }
    };
  };

  const emit = ({ event, data }: EmitProps): void => {
    const eventListeners = listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  };

  return {
    getState,
    setState,
    insertText,
    deleteText,
    detectMentionQuery: detectQuery,
    subscribe,
    emit,
  };
};

type CreateMentionCoreProps = {
  value: string;
};

export const createMentionCore = ({
  value,
}: CreateMentionCoreProps): MentionCoreAPI => {
  const state: MentionState = {
    text: value,
    cursorPosition: value.length,
  };

  const listeners = new Map<string, Function[]>();

  return createMentionCoreAPI({ state, listeners });
};
