
export interface ProjectEntry {
  projectName: string;
  id: string;
  modifiedDate: number;
  parentRevision?: string;
}

export type ProjectList = ProjectEntry[];

export interface ProjectData {
  id: string;
  contents: string;
}

export enum ProjectDbTable {
  Projects = "projects",
  ProjectData = "projectData"
}

type ProjectDbWrapper = <T>(
  accessMode: "readonly" | "readwrite",
  callback: (projects: IDBObjectStore) => Promise<T>,
  tableName?: ProjectDbTable
) => Promise<T>;

export const withProjectDb: ProjectDbWrapper = async (accessMode, callback, tableName = ProjectDbTable.Projects) => {
  return new Promise((res, rej) => {
    // TODO: what if multiple users? I think MakeCode just keeps everything...
    const openRequest = indexedDB.open("UserProjects", 3);
    openRequest.onupgradeneeded = onUpgradeNeeded(openRequest);

    openRequest.onsuccess = async () => {
      const db = openRequest.result;

      const tx = db.transaction(tableName, accessMode);
      const store = tx.objectStore(tableName);
      tx.onabort = rej;
      tx.onerror = rej;

      const result = await callback(store);

      // got the result, but don't return until the transaction is complete
      tx.oncomplete = () => res(result);
    };

    openRequest.onerror = rej;
  });
};

export const modifyProject = async (id: string, extras?: Partial<ProjectEntry>) => {
  await withProjectDb("readwrite", async (store) => {
    await new Promise((res, _rej) => {
      const getQuery = store.get(id);
      getQuery.onsuccess = () => {
        const putQuery = store.put({
          ...getQuery.result,
          ...extras,
          modifiedDate: new Date().valueOf(),
        });
        putQuery.onsuccess = () => res(getQuery.result);
      };
    });
  });
}

const onUpgradeNeeded = (openRequest: IDBOpenDBRequest) => (evt: IDBVersionChangeEvent) => {
  const db = openRequest.result;
  // NB: a more robust way to write migrations would be to get the current stored
  // db.version and open it repeatedly with an ascending version number until the
  // db is up to date. That would be more boilerplate though.
  const tx = (evt.target as IDBOpenDBRequest).transaction;
  // if the data object store doesn't exist, create it

  let projectListStore: IDBObjectStore;
  if (!db.objectStoreNames.contains(ProjectDbTable.Projects)) {
    projectListStore = db.createObjectStore(ProjectDbTable.Projects, { keyPath: "id" });
  } else {
    projectListStore = tx!.objectStore(ProjectDbTable.Projects);
  }
  if (!projectListStore.indexNames.contains("modifiedDate")) {
    projectListStore.createIndex("modifiedDate", "modifiedDate");
    const now = new Date().valueOf();
    const updateProjectData = projectListStore.getAll();
    updateProjectData.onsuccess = () => {
      updateProjectData.result.forEach((project) => {
        if (!('modifiedDate' in project)) {
          projectListStore.put({ ...project, modifiedDate: now });
        }
      });
    };
  }

  if (!db.objectStoreNames.contains(ProjectDbTable.ProjectData)) {
    db.createObjectStore(ProjectDbTable.ProjectData, { keyPath: "id" });
  }
};
