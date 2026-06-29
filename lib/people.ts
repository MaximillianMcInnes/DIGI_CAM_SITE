import type { Person } from "@/lib/types";

export const allowedPeople: Person[] = [
  {
    id: "max",
    slug: "max",
    displayName: "Max",
    bio: "",
    mediaCount: 0,
  },
  {
    id: "eliza",
    slug: "eliza",
    displayName: "Eliza",
    bio: "",
    mediaCount: 0,
  },
];

export const allowedPersonSlugs = allowedPeople.map((person) => person.slug);

export function isAllowedPersonSlug(slug: string) {
  return allowedPersonSlugs.includes(slug.toLowerCase());
}

export function normaliseAllowedPeople(people: Person[]) {
  return allowedPeople.map((allowed) => people.find((person) => person.slug === allowed.slug) ?? allowed);
}

