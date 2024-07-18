export const isArray = (v: unknown) =>
  typeof v === "object" && Array.isArray(v);
