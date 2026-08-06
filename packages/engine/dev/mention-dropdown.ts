import type { Person } from "./people";

/**
 * A plain-DOM dropdown. Deliberately part of the harness rather than the engine: the
 * engine is headless, and this is the job a framework adapter does at M7 — so building it
 * here is a rehearsal for that, not a shortcut.
 */
export interface Dropdown {
  open: (people: Person[], rect: DOMRect | null) => void;
  close: () => void;
  isOpen: () => boolean;
  move: (delta: number) => void;
  highlighted: () => Person | null;
  destroy: () => void;
}

interface Options {
  onSelect: (person: Person) => void;
}

export const createDropdown = ({ onSelect }: Options): Dropdown => {
  const element = document.createElement("div");
  element.className = "dropdown";
  element.hidden = true;
  document.body.appendChild(element);

  let people: Person[] = [];
  let index = 0;

  const paint = (): void => {
    element.replaceChildren();

    people.forEach((person, at) => {
      const row = document.createElement("button");
      row.className = at === index ? "dropdown-row is-active" : "dropdown-row";
      row.innerHTML =
        `<span class="dropdown-label"></span><span class="dropdown-value"></span>`;
      row.querySelector(".dropdown-label")!.textContent = person.label;
      row.querySelector(".dropdown-value")!.textContent = person.value;

      // mousedown, not click: click fires after blur, by which point the editor has lost
      // its selection and there is no range left to replace.
      row.addEventListener("mousedown", (event) => {
        event.preventDefault();
        onSelect(person);
      });

      element.appendChild(row);
    });
  };

  return {
    open: (next, rect) => {
      const changed =
        next.length !== people.length ||
        next.some((person, at) => person.value !== people[at]?.value);
      people = next;
      if (changed) index = 0;

      if (people.length === 0) {
        element.hidden = true;
        return;
      }

      paint();
      element.hidden = false;

      if (rect) {
        element.style.left = `${Math.round(rect.left)}px`;
        element.style.top = `${Math.round(rect.bottom + 4)}px`;
      }
    },
    close: () => {
      element.hidden = true;
      people = [];
      index = 0;
    },
    isOpen: () => !element.hidden && people.length > 0,
    move: (delta) => {
      if (people.length === 0) return;
      // Wraps, because a list that stops at the ends feels broken at four items.
      index = (index + delta + people.length) % people.length;
      paint();
    },
    highlighted: () => people[index] ?? null,
    destroy: () => element.remove(),
  };
};
