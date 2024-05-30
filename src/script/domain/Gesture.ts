/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Readable, Subscriber, Unsubscriber, Writable, derived, get } from 'svelte/store';
import {
  GestureData,
  GestureOutput,
  RecordingData,
  SoundData,
  getNewMatrix,
} from '../stores/mlStore';
import { PersistantGestureData } from './Gestures';
import { PinTurnOnState } from '../../components/output/PinSelectorUtil';
import MBSpecs from '../microbit-interfacing/MBSpecs';
import BindableValue from './BindableValue';
import GestureConfidence from './GestureConfidence';

export type GestureID = number;

class Gesture implements Readable<GestureData> {
  private store: Readable<GestureData>;

  constructor(
    private persistedData: Writable<PersistantGestureData>,
    private gestureConfidence: GestureConfidence,
  ) {
    this.store = this.deriveStore();
  }

  public subscribe(
    run: Subscriber<GestureData>,
    invalidate?: ((value?: GestureData | undefined) => void) | undefined,
  ): Unsubscriber {
    return this.store.subscribe(run, invalidate);
  }

  public getId(): GestureID {
    return get(this.store).ID;
  }

  public getRecordings(): RecordingData[] {
    return get(this.store).recordings;
  }

  public getOutput(): GestureOutput {
    return get(this.store).output;
  }

  public setName(newName: string): void {
    this.persistedData.update(val => {
      val.name = newName;
      return val;
    });
  }

  public getName(): string {
    return get(this.store).name;
  }

  public getMatrix(): boolean[] {
    return get(this.store).matrix;
  }

  public addRecording(recording: RecordingData) {
    this.persistedData.update(newVal => {
      newVal.recordings = [recording, ...newVal.recordings];
      return newVal;
    });
  }

  public removeRecording(recordingId: number) {
    this.persistedData.update(newVal => {
      newVal.recordings = newVal.recordings.filter(
        recording => recording.ID !== recordingId,
      );
      return newVal;
    });
  }

  public setSoundOutput(sound: SoundData | undefined) {
    this.persistedData.update(newVal => {
      newVal.output.sound = sound;
      return newVal;
    });
  }

  public setIOPinOutput(pin: MBSpecs.UsableIOPin, state: PinTurnOnState, time: number) {
    this.persistedData.update(newVal => {
      newVal.output.outputPin = {
        pin: pin,
        pinState: state,
        turnOnTime: time,
      };
      return newVal;
    });
  }

  public setLEDOutput(matrix: boolean[]) {
    this.persistedData.update(newVal => {
      newVal.output.matrix = matrix;
      return newVal;
    });
  }

  public setMatrix(matrix: boolean[]) {
    this.persistedData.update(newVal => {
      newVal.matrix = matrix;
      return newVal;
    });
  }

  public bindName(): BindableValue<string> {
    const setter = (val: string) => this.setName(val);
    const bindable = new BindableValue(
      setter,
      derived(this.store, s => s.name),
    );
    return bindable;
  }

  public getConfidence(): GestureConfidence {
    return this.gestureConfidence;
  }

  private deriveStore(): Readable<GestureData> {
    return derived([this.persistedData, this.gestureConfidence], stores => {
      const peristantData = stores[0];
      const confidenceData = stores[1];
      const derivedData: GestureData = {
        ID: peristantData.ID,
        matrix: peristantData.matrix ?? getNewMatrix(),
        name: peristantData.name,
        recordings: peristantData.recordings,
        output: peristantData.output,
        confidence: {
          currentConfidence: confidenceData.confidence,
          requiredConfidence: confidenceData.requiredConfidence,
          isConfident: confidenceData.isConfident,
        },
      };

      return derivedData;
    });
  }
}

export default Gesture;
