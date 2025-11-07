import { PersistStorage, StorageValue } from "zustand/middleware";
import * as Y from "yjs";


interface ProjectState {
    doc: Y.Doc | null;
    loadingPromise: Promise<Y.Doc> | null;
}

let activeState : ProjectState = {
    doc: null,
    loadingPromise: null
}

export const loadNewDoc = async (loadingPromise : Promise<Y.Doc>) => {
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

    const getItemImpl = (ydoc: Y.Doc) => {
        const state = JSON.parse(ydoc.getText(BASE_DOC_NAME).toString()) as T;
        (state as undefined as any).actions = ydoc.getMap("files").get("actions");
        return { state, version: 2 };
    }

    const getItem = (_name: string) => {
        if (activeState.doc) {
            return getItemImpl(activeState.doc);
        } else {
            return async () => {
                await activeState.loadingPromise;
                return getItemImpl(activeState.doc!);
            }
        }
    }

    const setItem = (_name: string, valueFull: StorageValue<T>) => {
        const { state: { actions, ...state }, version } = valueFull as StorageValue<T & { actions: any }>;

        const value = { state, version };

        if (activeState.doc) {
            const storeText = activeState.doc.getText(BASE_DOC_NAME);
            storeText.delete(0, storeText.length);
            storeText.insert(0, JSON.stringify(value));
        } else {
            return async () => {
                await activeState.loadingPromise;
                const storeText = activeState.doc!.getText(BASE_DOC_NAME);
                storeText.delete(0, storeText.length);
                storeText.insert(0, JSON.stringify(value));
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