/**
 * Character length of a subtree, counting a `<br>` as one newline.
 *
 * Deliberately not `Range.toString()`, which returns only Text data and ignores `<br>`
 * entirely — so `one<br>two` measures 6 where the same content as a string is 7, and
 * every offset after a line break is off by one.
 *
 * That a `<br>` is worth exactly one `\n` is a modelling commitment the document model
 * inherits, not merely a measurement detail:
 * docs/adr/0001-line-breaks-as-newline-characters.md
 */
export const textLength = (node: Node): number => {
  if (node.nodeType === Node.TEXT_NODE) return (node as Text).data.length;

  let total = 0;
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) total += (child as Text).data.length;
    else if (child.nodeName === "BR") total += 1;
    else total += textLength(child);
  }
  return total;
};
