import { ProjectDbTable, withProjectDb } from "./project-list-db";

export const writeProject = (projectId: string, contents: string) => withProjectDb("readwrite", (projects) =>

    new Promise<void>((res, _rej) => {
        const query = projects.put({ id: projectId, contents })
        query.onsuccess = () => res();
    })
    , ProjectDbTable.ProjectData);

export const readProject = (projectId: string) => withProjectDb("readonly", (projects) =>
    new Promise<string>((res, _rej) => {
        const query = projects.get(projectId)
        query.onsuccess = () => res(query.result as string);
    })
    , ProjectDbTable.ProjectData);