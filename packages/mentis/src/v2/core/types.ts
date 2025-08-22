export interface MentionState {
  text: string;
  // mentions: MentionData[];
  cursorPosition: number;
}

export interface StateChangedEvent {
  oldState: MentionState;
  newState: MentionState;
}

export interface MentionCoreAPI {
  // State access
  getState(): MentionState;
  setState(state: Partial<MentionState>): void;
  // Text operations
  insertText(text: string, position: number): void;
  deleteText(start: number, end: number): void;
  // // Mention operations
  // addMention(mention: Omit<MentionData, 'id'>): void;
  // removeMention(mentionId: string): void;
  // getMentionAt(position: number): MentionData | null;
  // // Query detection
  // detectMentionQuery(position: number, triggers: string[]): MentionQuery | null;
  // // Serialization
  // serialize(): string;
  // deserialize(data: string): void;
  // Events
  subscribe(event: string, callback: Function): () => void;
  emit(event: string, data: any): void;
}
