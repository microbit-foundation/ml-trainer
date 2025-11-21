import { useEffect, useState } from "react";
import { ActionDataY, RecordingDataY } from "./model";
import { useStore } from "./store";
import { BASE_DOC_NAME, loadNewDoc } from "./store-persistence";
import * as Y from "yjs";
import { useProjectList } from "./project-persistence/project-list-hooks";
import { usePersistentProject } from "./project-persistence/persistent-project-hooks";

export const useStoreProjects = () => {
    // storeprojects relates to projects of type Store
    // projectstorage stores projects
    // simple?
    // TODO: improve naming
    const { newStoredProject, restoreStoredProject } = useProjectList();
    const newProject = async () => {
        const newProjectImpl = async () => {
            const { ydoc } = await newStoredProject();
            ydoc.getText(BASE_DOC_NAME).insert(0, "{}");
            ydoc.getMap("files").set("actions", new Y.Array<ActionDataY>);
            return ydoc;
        }
        await loadNewDoc(newProjectImpl());
        // Needed to attach Y types
        await useStore.persist.rehydrate();
    }
    const loadProject = async (projectId: string) => {
        const loadProjectImpl = async () => {
            const { ydoc } = await restoreStoredProject(projectId);
            return ydoc;
        }
        await loadNewDoc(loadProjectImpl());
        await useStore.persist.rehydrate();
    }
    return { loadProject, newProject };
}

export const useActions = () => {
    const [actionsRev, setActionsRev] = useState(0);
    const { ydoc } = usePersistentProject();
    const actions = ydoc?.getMap("files").get("actions") as ActionDataY; // TODO: what happens when you don't got actions?
    useEffect(() => {
        const actionsInner = ydoc?.getMap("files").get("actions") as ActionDataY;
        if (!actionsInner) {
            return;
        }
        const observer = () => setActionsRev(actionsRev + 1);
        actionsInner.observeDeep(observer)
        return () => actionsInner.unobserveDeep(observer);
    }, [ydoc, actionsRev]);
    return actions;
}

export const useHasActions = () => {
    const actions = useActions();
    return (
        (actions.length > 0 && (actions.get(0).get("name") as string).length > 0) ||
        (actions.get(0).get("recordings") as RecordingDataY).length > 0
    );
};
