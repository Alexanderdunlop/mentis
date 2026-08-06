export interface MentionQuery {
  /** The trigger character that opened the query. */
  trigger: string;
  /** Text typed after the trigger, excluding it. */
  query: string;
  /**
   * Document range the mention would replace: the trigger through the caret. Passing
   * this straight to `insertMention` is what makes the trigger and query disappear.
   */
  from: number;
  to: number;
}

export interface MentionQueryOptions {
  /** Characters that open a query. Defaults to `["@"]`. */
  triggers?: string[];
  /**
   * Longest query to keep a dropdown open for. Guards against an unclosed trigger
   * keeping a menu alive across a whole paragraph.
   */
  maxQueryLength?: number;
}
