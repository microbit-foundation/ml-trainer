import { useStore } from "./store";
import { loadNewDoc } from "./store-persistence";
import { useProjectList } from "./project-persistence/project-list-hooks";

export const useStoreProjects = () => {
    // storeprojects relates to projects of type Store
    // projectstorage stores projects
    // simple?
    // TODO: improve naming
    const { newStoredProject, restoreStoredProject } = useProjectList();
    const newProject = async () => {
        const newProjectImpl = async () => {
            const { doc } = await newStoredProject();
            return doc;
        }
        await loadNewDoc(newProjectImpl());
        await useStore.persist.rehydrate();
    }
    const loadProject = async (projectId: string) => {
        const loadProjectImpl = async () => {
            const { doc } = await restoreStoredProject(projectId);
            return doc;
        }
        await loadNewDoc(loadProjectImpl());
        await useStore.persist.rehydrate();
    }
    return { loadProject, newProject };
}
