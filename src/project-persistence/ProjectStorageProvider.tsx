// ProjectContext.tsx
import React, { createContext, useCallback, useContext, useState } from "react";
import { ProjectList } from "./project-list-db";
import { DocAccessor } from "./project-list-hooks";
import { ProjectStoreYjs } from "./project-store-yjs";

interface ProjectContextValue {
  projectId: string | null;
  projectList: ProjectList | null;
  setProjectList: (projectList: ProjectList) => void;
  projectAccessor: DocAccessor | null;
  setProjectAccessor: (accessor: DocAccessor) => void;
  openProject: (
    projectId: string,
    onChangeObserver: () => void
  ) => Promise<DocAccessor>;
}

export const ProjectStorageContext = createContext<ProjectContextValue | null>(
  null
);

interface DocAccessorInternal extends DocAccessor {
  destroy: () => void;
  projectId: string;
}

/**
 * The ProjectStorageProvider is intended to be used only through the hooks in
 *
 * - project-list-hooks.ts: information about hooks that does not require an open project
 * - persistent-project-hooks.ts: manages a currently open project
 * - project-history-hooks.ts: manages project history and revisions
 *
 * This structure is helpful for working out what parts of project persistence are used
 * where.
 */
export function ProjectStorageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [projectList, setProjectList] = useState<ProjectList | null>(null);
  const [projectAccessor, setProjectAccessorImpl] =
    useState<DocAccessor | null>(null);
  const projectAccessorInternal = projectAccessor as DocAccessorInternal;
  const setProjectAccessor = useCallback(
    (newProjectStore: DocAccessor) => {
      if (projectAccessor) {
        projectAccessorInternal.destroy();
      }
      setProjectAccessorImpl(newProjectStore);
    },
    [projectAccessor]
  );

  const openProject = async (
    projectId: string,
    onChangeObserver: () => void
  ) => {
    const newProjectStore = new ProjectStoreYjs(projectId, onChangeObserver);
    await newProjectStore.persist();
    newProjectStore.startSyncing();
    const newProjectAccessor: DocAccessorInternal = {
      setDoc: (doc: string) => {
        const t = newProjectStore.ydoc.getText();
        t.delete(0, t.length);
        t.insert(0, doc);
      },
      getDoc: () => newProjectStore.ydoc.getText().toJSON(),
      destroy: () => newProjectStore.destroy(),
      projectId: newProjectStore.projectId,
    };
    return newProjectAccessor;
  };

  return (
    <ProjectStorageContext.Provider
      value={{
        projectId: projectAccessor ? projectAccessorInternal.projectId : null,
        projectList,
        setProjectList,
        projectAccessor,
        setProjectAccessor,
        openProject,
      }}
    >
      {children}
    </ProjectStorageContext.Provider>
  );
}

export function useProjectStorage() {
  const ctx = useContext(ProjectStorageContext);
  if (!ctx)
    throw new Error(
      "useProjectStorage must be used within a ProjectStorageProvider"
    );
  return ctx;
}
