import { PersistStorage, StorageValue } from "zustand/middleware";
import * as Y from "yjs";

/*
type PersistImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  options: PersistOptions<T, T>,
) => StateCreator<T, [], []>

interface Storable {

}
*/

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

export const projectStorage = <T>() => {

    const getItem = (name: string) => {
        if (activeState.doc) {
            const result = JSON.parse(activeState.doc.getText(name).toString()) as T
            return result;
        } else {
            return async () => {
                await activeState.loadingPromise;
                const result = JSON.parse(activeState.doc!.getText(name).toString()) as T
                return result
            }
        }
    }

    const setItem = (name: string, value: StorageValue<T>) => {
        if (activeState.doc) {
            const storeText = activeState.doc.getText(name);
            storeText.delete(0, storeText.length);
            storeText.insert(0, JSON.stringify(value));
        } else {
            return async () => {
                await activeState.loadingPromise;
                const storeText = activeState.doc!.getText(name);
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
