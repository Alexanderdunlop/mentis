// import type { MentionData } from "../..";
// import type { MentionData } from "../..";
import type { MentionCoreAPI, MentionState } from "./types";

type CreateMentionCoreAPIProps = {
  state: MentionState;
  listeners: Map<string, Function[]>;
};

const createMentionCoreAPI = ({
  state,
  listeners,
}: CreateMentionCoreAPIProps): MentionCoreAPI => {
  const getState = () => {
    return state;
  };

  const setState = (newState: Partial<MentionState>) => {
    const oldState = { ...state };
    state = { ...state, ...newState };
    emit("stateChanged", { oldState, newState: state });
  };

  const insertText = (text: string, position: number) => {
    const newText =
      state.text.slice(0, position) + text + state.text.slice(position);
    // TODO: Add mentions
    // Adjust mention positions
    // const adjustedMentions = state.mentions.map(mention => {
    //   if (mention.startIndex >= position) {
    //     return {
    //       ...mention,
    //       startIndex: mention.startIndex + text.length,
    //       endIndex: mention.endIndex + text.length
    //     };
    //   } else if (mention.endIndex > position) {
    //     // Text inserted inside mention - remove mention
    //     return null;
    //   }
    //   return mention;
    // }).filter(Boolean) as MentionData[];
    setState({
      text: newText,
      //   mentions: adjustedMentions,
      cursorPosition: position + text.length,
    });
  };

  const deleteText = (start: number, end: number) => {
    // const deletedLength = end - start;
    const newText = state.text.slice(0, start) + state.text.slice(end);

    // TODO: Add mentions
    // Adjust mention positions
    // const adjustedMentions = state.mentions.map(mention => {
    //   if (mention.endIndex <= start) {
    //     // Mention is before deletion
    //     return mention;
    //   } else if (mention.startIndex >= end) {
    //     // Mention is after deletion
    //     return {
    //       ...mention,
    //       startIndex: mention.startIndex - deletedLength,
    //       endIndex: mention.endIndex - deletedLength
    //     };
    //   } else {
    //     // Mention overlaps with deletion - remove mention
    //     return null;
    //   }
    // }).filter(Boolean) as MentionData[];

    setState({
      text: newText,
      //   mentions: adjustedMentions,
      cursorPosition: start,
    });
  };

  const subscribe = (event: string, callback: Function): (() => void) => {
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

  const emit = (event: string, data: any) => {
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
    // mentions: [],
    cursorPosition: value.length,
  };

  const listeners = new Map<string, Function[]>();

  return createMentionCoreAPI({ state, listeners });
};
