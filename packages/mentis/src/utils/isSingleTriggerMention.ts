// TODO: This isn't being used bring it back in.
export function isSingleTriggerMention(
  val: string,
  triggerIndex: number,
  trigger: string
): boolean {
  if (trigger.length === 0) return false;

  if (
    triggerIndex === -1 ||
    val.slice(triggerIndex, triggerIndex + trigger.length) !== trigger
  )
    return false;

  const before =
    triggerIndex === 0
      ? undefined
      : val.slice(triggerIndex - trigger.length, triggerIndex);

  const after = val.slice(
    triggerIndex + trigger.length,
    triggerIndex + 2 * trigger.length
  );
  return (
    (triggerIndex === 0 || before !== trigger) &&
    (triggerIndex + trigger.length === val.length || after !== trigger)
  );
}
