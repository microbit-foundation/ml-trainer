export const defaultProjectNameId = "default-project-name";
export const validateProjectName = (name: string): boolean => {
  return name.trim().length > 0;
};
