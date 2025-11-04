import { PersistStorage, StorageValue } from "zustand/middleware";
import * as Y from "yjs";
import { ActionData } from "./model";


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
    // TODO: testing accessing a Y.Text through Zustand
    if (!activeState.doc.getMap("files").has("actions2")) {
        activeState.doc.getMap("files").set("actions2", new Y.Text("defaultvalue"));
    }
}

// This storage system ignores that Zustand supports multiple datastores, because it exists
// in the specific context that we want to blend the existing Zustand data with a Y.js
// backend, and we know what the data should be so genericism goes out of the window.
// Anything that is not handled as a special case (e.g. actions are special) becomes a
// simple json doc in the same way that Zustand persist conventionally does it.
const BASE_DOC_NAME = "ml";

// TODO: Think about what versioning should relate to.
// The zustand store has a version, and this also has structurally-sensitive things in
// its storeState mapper.
export const projectStorage = <T>() => {

    const getItemImpl = (ydoc: Y.Doc) => {
        const doc = JSON.parse(ydoc.getText(BASE_DOC_NAME).toString()) as T;
        (doc as undefined as any).actions2 = ydoc.getMap("files").get("actions2");
        return doc;
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

    const setItem = (_name: string, value: StorageValue<T>) => {
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
        // TODO:
    }

    return {
        getItem,
        setItem,
        removeItem
    } as PersistStorage<T>;
}

interface CustomStructures {
    actions: ActionData[];
}

const storeState = (state: CustomStructures, doc: Y.Doc) => {
    const { actions, ...unfiltered } = state;
}
