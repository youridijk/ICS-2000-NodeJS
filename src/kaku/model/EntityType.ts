// Typescript magic thanks to Matt Peacock https://www.youtube.com/watch?v=jjMbPt_H3RQ
export const Entity_Type = {
  Module: 'module',
  Group: 'group',
  Scene: 'scene',
} as const;

export type ObjectValues<T> = T[keyof T];
export type EntityType = ObjectValues<typeof Entity_Type>;
