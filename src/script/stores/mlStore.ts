/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { persistantWritable } from './storeUtil';
import { get, writable } from 'svelte/store';
import { LayersModel } from '@tensorflow/tfjs-layers';
import { state } from './uiStore';
import { AxesType, FilterType, Axes, Filters } from '../datafunctions';
import { PinTurnOnState } from '../../components/output/PinSelectorUtil';
import MBSpecs from '../microbit-interfacing/MBSpecs';
import { PersistantGestureData } from '../domain/Gestures';
import Gesture, { GestureID } from '../domain/Gesture';
import { gestures } from './Stores';
import { SampleRingBuffer } from './buffer';

export type RecordingData = {
  ID: number;
  data: {
    x: number[];
    y: number[];
    z: number[];
  };
};

export function loadDatasetFromFile(file: File) {
  const reader = new FileReader();
  reader.onload = function (e: ProgressEvent<FileReader>) {
    if (!e.target) {
      return;
    }
    const contents = e.target.result;
    if (typeof contents === 'string') {
      // TODO: fix the following really unsafe parsing and casting
      const gestureData: PersistantGestureData[] = JSON.parse(
        contents,
      ) as PersistantGestureData[];
      gestures.importFrom(gestureData);
    }
  };
  reader.readAsText(file as Blob);
}

export function downloadDataset() {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:application/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(get(gestures), null, 2)),
  );
  element.setAttribute('download', 'dataset');

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();
  document.body.removeChild(element);
}

// Delete this function!
export function clearGestures() {
  gestures.clearGestures();
}

export type GestureData = {
  name: string;
  ID: GestureID;
  recordings: RecordingData[];
  output: GestureOutput;
  confidence: {
    currentConfidence: number;
    requiredConfidence: number;
    isConfident: boolean;
  };
};

export type GestureOutput = {
  matrix?: boolean[];
  sound?: SoundData;
  outputPin?: { pin: MBSpecs.UsableIOPin; pinState: PinTurnOnState; turnOnTime: number };
};

export type SoundData = {
  name: string;
  id: string;
  path: string;
};

export type Sample = {
  x: number;
  y: number;
  z: number;
};

export enum TrainingStatus {
  Untrained,
  InProgress,
  Success,
  Failure,
}

type MlSettings = {
  duration: number; // Duration of recording
  numSamples: number; // number of samples in one recording (when recording samples)
  minSamples: number; // minimum number of samples for reliable detection (when detecting gestures)
  automaticClassification: boolean; // If true, automatically classify gestures
  updatesPrSecond: number; // Times algorithm predicts data pr second
  numEpochs: number; // Number of epochs for ML
  learningRate: number;
  includedAxes: AxesType[];
  includedFilters: Set<FilterType>;
};

const initialMLSettings: MlSettings = {
  duration: 1800,
  numSamples: 80,
  minSamples: 80,
  automaticClassification: true,
  updatesPrSecond: 4,
  numEpochs: 80,
  learningRate: 0.5,
  includedAxes: [Axes.X, Axes.Y, Axes.Z],
  includedFilters: new Set<FilterType>([
    Filters.MAX,
    Filters.MEAN,
    Filters.MIN,
    Filters.STD,
    Filters.PEAKS,
    Filters.ACC,
    Filters.ZCR,
    Filters.RMS,
  ]),
};

// Store with ML-Algorithm settings
export const settings = persistantWritable<MlSettings>('MLSettings', initialMLSettings);

// This is smoothed and is used for the visual displays.
export const currentData = writable<Sample>({
  x: 0,
  y: 0,
  z: 0,
});

// Store for current gestures
export const chosenGesture = writable<Gesture | null>(null);

function updateToUntrainedState() {
  state.update(s => {
    s.isPredicting = false;
    return s;
  });
  trainingStatus.set(TrainingStatus.Untrained);
}

// Delete this, maybe? updateToUntrainedState
export function addGesture(name: string): void {
  updateToUntrainedState();
  gestures.createGesture(name);
}

// Delete this, maybe? updateToUntrainedState
export function removeGesture(gesture: GestureData) {
  updateToUntrainedState();
  gestures.removeGesture(gesture.ID);
}

// Delete this, maybe? updateToUntrainedState
export function addRecording(gestureID: number, recording: RecordingData) {
  updateToUntrainedState();
  gestures.getGesture(gestureID).addRecording(recording);
}

// Delete this, maybe? updateToUntrainedState
export function removeRecording(gestureID: number, recordingID: number) {
  updateToUntrainedState();
  gestures.getGesture(gestureID).removeRecording(recordingID);
}

// Delete this, maybe? updateToUntrainedState
export function updateGestureSoundOutput(
  gestureID: number,
  sound: SoundData | undefined,
) {
  gestures.getGesture(gestureID).setSoundOutput(sound);
}

export function updateGesturePinOutput(
  gestureID: number,
  pin: MBSpecs.UsableIOPin,
  state: PinTurnOnState,
  time: number,
) {
  gestures.getGesture(gestureID).setIOPinOutput(pin, state, time);
}

export function updateGestureLEDOutput(gestureID: number, matrix: boolean[]) {
  gestures.getGesture(gestureID).setLEDOutput(matrix);
}

export const gestureConfidences = writable<{ [id: string]: number }>({});

// TODO: This is only used one place. Remove store and compute best prediction at said component?
export const bestPrediction = writable<GestureData | undefined>(undefined);

// Store for components to assess model status
export const model = writable<LayersModel>(undefined);

export const trainingStatus = writable<TrainingStatus>(TrainingStatus.Untrained);

// Stores and manages previous data-elements. Used for classifying current gesture
export const prevData = new SampleRingBuffer(get(settings).minSamples);
