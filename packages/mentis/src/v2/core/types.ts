export interface MentionState {
  text: string;
  // mentions: MentionData[];
  cursorPosition: number;
}

export interface StateChangedEvent {
  oldState: MentionState;
  newState: MentionState;
}

export interface DetectMentionQueryProps {
  position: number;
  trigger: string;
}

export interface InsertTextProps {
  text: string;
  position: number;
}

export interface DeleteTextProps {
  start: number;
  end: number;
}

export interface MentionQuery {
  query: string;
  startIndex: number;
}

export interface DetectMentionQueryResult {
  query: MentionQuery | null;
  shouldShowModal: boolean;
}

export interface SubscribeProps {
  event: string;
  callback: Function;
}

export interface EmitProps {
  event: string;
  data: any;
}

export interface MentionCoreAPI {
  // State access
  getState(): MentionState;
  setState(state: Partial<MentionState>): void;
  // Text operations
  insertText({ text, position }: InsertTextProps): void;
  deleteText({ start, end }: DeleteTextProps): void;
  // Mention operations
  // addMention(mention: Omit<MentionData, 'id'>): void;
  // removeMention(mentionId: string): void;
  // getMentionAt(position: number): MentionData | null;
  // Query detection
  detectMentionQuery({
    position,
    trigger,
  }: DetectMentionQueryProps): DetectMentionQueryResult;
  // Serialization
  // serialize(): string;
  // deserialize(data: string): void;
  // Events
  subscribe({ event, callback }: SubscribeProps): () => void;
  emit({ event, data }: EmitProps): void;
}
