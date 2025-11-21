import { PersistStorage, StorageValue } from "zustand/middleware";
import { DocAccessor } from "./project-persistence/project-list-hooks";


interface ProjectState {
    doc: DocAccessor | null;
    loadingPromise: Promise<DocAccessor> | null;
}

const activeState: ProjectState = {
    doc: null,
    loadingPromise: null
}

export const loadNewDoc = async (loadingPromise: Promise<DocAccessor>) => {
    activeState.doc = null;
    activeState.loadingPromise = loadingPromise;
    activeState.doc = await loadingPromise;
}

// This storage system ignores that Zustand supports multiple datastores, because it exists
// in the specific context that we want to blend the existing Zustand data with a Y.js
// backend, and we know what the data should be so genericism goes out of the window.
// Anything that is not handled as a special case (e.g. actions are special) becomes a
// simple json doc in the same way that Zustand persist conventionally does it.
export const BASE_DOC_NAME = "ml";

// TODO: Think about what versioning should relate to.
// The zustand store has a version, and this also has structurally-sensitive things in
// its storeState mapper.
// store.ts currently has a lot of controller logic, and it could be pared out and synced
// more loosely with the yjs-ified data. E.g. project syncing could be done at a level above
// the store, with a subscription.
export const projectStorage = <T>() => {
    const getItem = (_name: string) => {
        const unpackResult = (result: string | Promise<string>) => {
            if (typeof result === "string") {
                return JSON.parse(result) as T;
            } else {
                return async () => JSON.parse(await activeState.doc!.getDoc()) as T;
            }
        }
        if (activeState.doc) {
            return unpackResult(activeState.doc.getDoc());
        } else {
            return async () => {
                await activeState.loadingPromise;
                return unpackResult(activeState.doc!.getDoc());
            }
        }
    }

    const setItem = (_name: string, value: StorageValue<T>) => {
        if (activeState.doc) {
            activeState.doc.setDoc(JSON.stringify(value));
        } else {
            return async () => {
                await activeState.loadingPromise;
                activeState.doc!.setDoc(JSON.stringify(value));
            }
        }
    }
    const removeItem = (_name: string) => {
        // Don't remove things through Zustand, use ProjectStorage
    }

    return {
        getItem,
        setItem,
        removeItem
    } as PersistStorage<T>;
}