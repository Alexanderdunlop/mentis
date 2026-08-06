/**
 * The text an input event is inserting.
 *
 * `event.data` is null for paste and drop, where the payload is on `dataTransfer`
 * instead. Reading it here — synchronously, off the event — is the whole reason the
 * engine never needs `navigator.clipboard.readText()`, which is async and requires
 * permission the user has to grant.
 */
export const inputText = (event: InputEvent): string | null => {
  if (event.data !== null) return event.data;

  const plain = event.dataTransfer?.getData("text/plain");
  return plain ? plain : null;
};
