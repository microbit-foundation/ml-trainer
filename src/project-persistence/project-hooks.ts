import { useContext } from "react";
import { ProjectStorageContext } from "./ProjectStorageProvider";

export const usePersistentProject = () => {

  const ctx = useContext(ProjectStorageContext);
  if (!ctx)
    throw new Error(
      "usePersistentProject must be used within a ProjectStorageProvider"
    );
  return ctx.projectAccessor;
}
