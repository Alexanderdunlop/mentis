export interface Person {
  label: string;
  value: string;
}

/**
 * Two of these share a label and differ only by value. In mentis v1 they are
 * indistinguishable, because it re-derives mentions from rendered text; here the value
 * is stored on the node, so the Model panel shows them apart.
 */
export const PEOPLE: Person[] = [
  { label: "@Alice", value: "user-1" },
  { label: "@Bob", value: "user-2" },
  { label: "@Alex", value: "user-3" },
  { label: "@Alex", value: "user-4" },
  { label: "@Charlie", value: "user-5" },
];

export const filterPeople = (query: string): Person[] => {
  if (query === "") return PEOPLE;
  const needle = query.toLowerCase();
  return PEOPLE.filter((person) =>
    person.label.toLowerCase().includes(needle)
  );
};
