export const defaultProjectName = "Untitled";
export const validateProjectName = (name: string): boolean => {
  return name.trim().length > 0;
};
