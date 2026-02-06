// ProjectContext.tsx
import React, { createContext, useCallback, useContext, useState } from "react";
import { ProjectData, ProjectList } from "./project-list-db";
import { DocAccessor } from "./project-list-hooks";
import { writeProject, readProject } from "./project-store-idb";

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
      if (projectAccessorInternal) {
        projectAccessorInternal.destroy();
      }
      setProjectAccessorImpl(newProjectStore);
    },
    [projectAccessorInternal]
  );

  const openProject = (projectId: string, onChangeObserver: () => void) => {
    const newProjectAccessor: DocAccessorInternal = {
      setDoc: async (doc: string) => {
        await writeProject(projectId, doc);
        onChangeObserver(); // Fine here, because we only use it to trigger modified behaviour, but...
        // TODO: handle synchronisation from other DB changes
      },
      getDoc: async () => {
        return (await readProject(projectId)).contents;
      },
      destroy: () => {},
      projectId,
    };
    return Promise.resolve(newProjectAccessor);
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
