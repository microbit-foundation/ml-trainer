/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { PersistantGestureData } from '../domain/Gestures';
import Gesture from '../domain/Gesture';
import ControlledStorage from '../ControlledStorage';
import {
  Readable,
  Subscriber,
  Unsubscriber,
  Writable,
  get,
  writable,
} from 'svelte/store';
import ClassifierRepository from './ClassifierRepository';

class GestureRepository implements Readable<Gesture[]> {
  private readonly LOCAL_STORAGE_KEY = 'gestureData';
  private static gestureStore: Writable<Gesture[]>;
  constructor(private modelRepository: ClassifierRepository) {
    GestureRepository.gestureStore = writable([]);
    GestureRepository.gestureStore.set(this.getPersistedGestures());
  }

  public getGesture(gestureId: number) {
    const gestures = get(GestureRepository.gestureStore);
    const gestureIndex = gestures.findIndex(gesture => gesture.getId() === gestureId);
    if (gestureIndex === -1) {
      throw new Error(`Could not find gesture with id '${gestureId}'`);
    }
    return gestures[gestureIndex];
  }

  public subscribe(
    run: Subscriber<Gesture[]>,
    invalidate?: ((value?: Gesture[] | undefined) => void) | undefined,
  ): Unsubscriber {
    return GestureRepository.gestureStore.subscribe(run, invalidate);
  }

  public clearGestures(): void {
    GestureRepository.gestureStore.set([]);
    this.saveCurrentGestures();
  }

  public addGesture(gestureData: PersistantGestureData): Gesture {
    const gesture = this.buildGesture(gestureData);
    GestureRepository.gestureStore.update(arr => {
      arr.push(gesture);
      return arr;
    });
    this.saveCurrentGestures();
    return gesture;
  }

  public removeGesture(gestureId: number) {
    GestureRepository.gestureStore.update(arr => {
      return arr.filter(gesture => gesture.getId() !== gestureId);
    });
    this.saveCurrentGestures();
  }

  private buildPersistedGestureStore(
    gestureData: PersistantGestureData,
  ): Writable<PersistantGestureData> {
    const store = writable(gestureData);

    return {
      subscribe: store.subscribe,
      set: val => {
        store.set(val);
        GestureRepository.gestureStore.update(val => val);
        this.saveCurrentGestures();
      },
      update: updater => {
        store.update(updater);
        GestureRepository.gestureStore.update(val => val);
        this.saveCurrentGestures();
      },
    };
  }

  private saveCurrentGestures() {
    const gestures = get(GestureRepository.gestureStore);
    const data = gestures.map(gesture => this.getPersistantValues(gesture));
    ControlledStorage.set<PersistantGestureData[]>(this.LOCAL_STORAGE_KEY, data);
  }

  private getPersistantValues(gesture: Gesture): PersistantGestureData {
    return {
      ID: gesture.getId(),
      name: gesture.getName(),
      matrix: gesture.getMatrix(),
      recordings: gesture.getRecordings(),
      output: gesture.getOutput(),
    };
  }

  private getPersistedGestures() {
    const resultFromFetch: PersistantGestureData[] = this.getPersistedData();
    return resultFromFetch.map(persistedData => this.buildGesture(persistedData));
  }

  private buildGesture(persistedData: PersistantGestureData) {
    const store = this.buildPersistedGestureStore(persistedData);

    return new Gesture(store, this.modelRepository.getGestureConfidence(get(store).ID));
  }

  private getPersistedData(): PersistantGestureData[] {
    const result = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    if (!result) {
      return [];
    }
    return ControlledStorage.get(this.LOCAL_STORAGE_KEY);
  }
}

export default GestureRepository;
