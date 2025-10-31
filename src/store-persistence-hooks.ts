import { useProjectStorage } from "./project-persistence/ProjectStorageProvider";
import { useStore } from "./store";
import { loadNewDoc } from "./store-persistence";

export const useStoreProjects = () => {
    // storeprojects relates to projects of type Store
    // projectstorage stores projects
    // simple?
    // TODO: improve naming
    const proj = useProjectStorage();
    // TODO: hooks that
    // Y - create new project
    // - attach to the new project button
    // - load most recent project
    // - ensure runs on startup
    // new hooks must prompt zustand to hydrate, though they live underneath it?
    // possibly split this file out into store-persistence and store-persistence-hooks?
    // Y TODO: see if CreateAI can be made to boot up with no project
    // Y disable hydrate on first load, as there is no current project!

    const newProject = async () => {
        const newProjectImpl = async () => {
            const { ydoc } = await proj.newStoredProject();
            return ydoc;
        }
        const newProjectPromise = newProjectImpl();
        loadNewDoc(newProjectPromise);
        await newProjectPromise;
        // TODO: currently the new session setup is done from within NewPage
        // seems like it could be here...
    }
    const loadProject = async (projectId: string) => {
        const loadProjectImpl = async () => {
            const { ydoc } = await proj.restoreStoredProject(projectId);
            return ydoc;
        }
        const loadProjectPromise = loadProjectImpl();
        loadNewDoc(loadProjectPromise);
        await loadProjectPromise;
        useStore.persist.rehydrate(); // TODO: better type?
        let unregister: () => void;
        await new Promise(res => unregister = useStore.persist.onFinishHydration(res));
        unregister!();
    }
    return {loadProject, newProject};
}