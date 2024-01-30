/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { alertUser, state } from './stores/uiStore';
import {
  bestPrediction,
  gestureConfidences,
  type GestureData,
  getPrevData,
  model,
  settings,
  TrainingStatus,
  trainingStatus,
} from './stores/mlStore';
import { FilterType, Axes, determineFilter, AxesType } from './datafunctions';
import { get, type Unsubscriber } from 'svelte/store';
import { t } from '../i18n';
import * as tf from '@tensorflow/tfjs';
import { LayersModel, SymbolicTensor, Tensor } from '@tensorflow/tfjs';
import { gestures } from './stores/Stores';
import Repositories from './repository/Repositories';
import { getPrediction } from './getPrediction';

let text: (key: string, vars?: object) => string;
t.subscribe(t => (text = t));

const smoothenTrainingData = true;
const smoothenTestData = true;

// Whenever model is trained, the settings at the time is saved in this variable
// Such that prediction continues on with the same settings as during training
let modelSettings: { axes: AxesType[]; filters: Set<FilterType> };

// Add parameter to allow unsubscribing from store, when predicting ends.
// Prevents memory leak.
let unsubscribeFromSettings: Unsubscriber | undefined = undefined;

// Variable for accessing the predictionInterval
let predictionInterval: NodeJS.Timeout | undefined = undefined;

function createModel(): LayersModel {
  const gestureData = get(gestures);
  const numberOfClasses: number = gestureData.length;
  const inputShape = [
    get(settings).includedFilters.size * get(settings).includedAxes.length,
  ];

  const input = tf.input({ shape: inputShape });
  const normalizer = tf.layers.batchNormalization().apply(input);
  const dense = tf.layers.dense({ units: 16, activation: 'relu' }).apply(normalizer);
  const softmax = tf.layers
    .dense({ units: numberOfClasses, activation: 'softmax' })
    .apply(dense) as SymbolicTensor;
  const model = tf.model({ inputs: input, outputs: softmax });

  model.compile({
    loss: 'categoricalCrossentropy',
    optimizer: tf.train.sgd(0.5),
    metrics: ['accuracy'],
  });

  return model;
}

export async function trainModel(): Promise<void> {
  state.update(obj => {
    obj.isTraining = true;
    return obj;
  });
  if (!isTrainingAllowed()) {
    state.update(obj => {
      obj.isTraining = false;
      return obj;
    });
    return;
  }

  // Freeze modelSetting untill next training
  modelSettings = {
    axes: get(settings).includedAxes,
    filters: get(settings).includedFilters,
  };

  // Fetch data
  const gestureData = get(gestures);
  const features: Array<number[]> = [];
  const labels: Array<number[]> = [];
  const numberofClasses: number = gestureData.length;

  console.log('smoothenTrainingData', smoothenTrainingData);

  gestureData.forEach((MLClass, index) => {
    MLClass.recordings.forEach(recording => {
      const recordingData = smoothenTrainingData
        ? smoothenInputs(recording.data)
        : recording.data;
      // prepare features
      const inputs: number[] = makeInputs(recordingData);
      features.push(inputs);

      // Prepare labels
      const label: number[] = new Array(numberofClasses) as number[];
      label.fill(0, 0, numberofClasses);
      label[index] = 1;
      labels.push(label);
    });
  });

  const tensorFeatures = tf.tensor(features);
  const tensorLabels = tf.tensor(labels);
  const nn: LayersModel = createModel();
  const totalNumEpochs = get(settings).numEpochs;

  nn.fit(tensorFeatures, tensorLabels, {
    epochs: totalNumEpochs,
    batchSize: 16,
    validationSplit: 0.1,
    callbacks: {
      onTrainEnd,
      onEpochEnd: (epoch: number) => {
        // Epochs indexed at 0
        updateTrainingProgress(epoch / (totalNumEpochs - 1));
      },
    },
  }).catch(err => {
    trainingStatus.set(TrainingStatus.Failure);
    console.error('tensorflow training process failed:', err);
  });

  trainingStatus.set(TrainingStatus.Success);
  model.set(nn);
}

export function isParametersLegal(): boolean {
  const s = get(settings);
  return s.includedAxes.length > 0 && s.includedFilters.size > 0;
}

// Assess whether
function isTrainingAllowed(messageUser = true) {
  const gestureData = get(gestures);

  // If less than two gestures
  if (!gestureData || gestureData.length < 2) {
    if (messageUser) {
      alertUser(text('alert.twoGestures'));
    }
    return false;
  }

  // If parameters aren't legal
  if (!isParametersLegal()) {
    if (messageUser) {
      alertUser(text('alert.oneDataRepresentation'));
    }
    return false;
  }

  // If gestures have less than three recordings per gesture.
  if (!sufficientGestureData(gestureData, messageUser)) {
    return false;
  }

  return true;
}

// Assess whether each gesture has sufficient data. (Limited by three)
export function sufficientGestureData(gestureData: GestureData[], messageUser: boolean) {
  let sufficientData = true;
  gestureData.forEach(gesture => {
    if (gesture.recordings.length < 3) {
      if (messageUser) {
        alertUser(text('alert.recordingsPerGesture'));
      }
      sufficientData = false;
    }
  });
  return sufficientData;
}

function updateTrainingProgress(progress: number) {
  state.update(obj => {
    obj.trainingProgress = progress;
    return obj;
  });
}

function onTrainEnd() {
  // Set state to not-Training and initiate prediction.
  state.update(obj => {
    obj.isTraining = false;
    obj.hasTrainedBefore = true;
    obj.trainingProgress = 0;
    return obj;
  });
  setupPredictionInterval();
}

interface Sample {
  x: number[];
  y: number[];
  z: number[];
}

// makeInput reduces array of x, y and z inputs to a single number array with values.
// Depending on user settings. There will be anywhere between 1-24 parameters in

function makeInputs(sample: Sample): number[] {
  const dataRep: number[] = [];

  if (!modelSettings) {
    throw new Error('Model settings not found');
  }

  // We use modelSettings to determine which filters to use. In this way the classify function
  // will be called with the same filters and axes untill the next training
  modelSettings.filters.forEach(filter => {
    const filterOutput = determineFilter(filter);
    if (modelSettings.axes.includes(Axes.X))
      dataRep.push(filterOutput.computeOutput(sample.x));
    if (modelSettings.axes.includes(Axes.Y))
      dataRep.push(filterOutput.computeOutput(sample.y));
    if (modelSettings.axes.includes(Axes.Z))
      dataRep.push(filterOutput.computeOutput(sample.z));
  });

  return dataRep;
}

const smoothen = (d: number[]) => {
  return d.map((v, idx) => {
    const prevValue = idx === 0 ? 0 : d[idx - 1];
    return v * 0.25 + prevValue * 0.75;
  });
};

// Smoothen data
export function smoothenInputs(sample: Sample): Sample {
  return {
    x: smoothen(sample.x),
    y: smoothen(sample.y),
    z: smoothen(sample.z),
  };
}

// Set the global state. Telling components, that the program is predicting
function setIsPredicting(isPredicting: boolean): void {
  state.update(s => {
    s.isPredicting = isPredicting;
    return s;
  });
}

// Setup prediction. Listens for user-settings (Updates pr second).
// Whenever this changes, the updatesPrSecond also changes.
function setupPredictionInterval(): void {
  // Set state and fetch updatesPrSecond.
  setIsPredicting(true);
  const updatesPrSecond = get(settings).updatesPrSecond;

  const classifyAutomatically = get(settings).automaticClassification;

  if (classifyAutomatically) {
    predictionInterval = setInterval(classify, 1000 / updatesPrSecond);
  }

  // When user changes settings
  unsubscribeFromSettings = settings.subscribe(update => {
    // Only if the updatesPrSecond changed or buttons changed
    // TODO: Change to early exit structure
    if (
      update.updatesPrSecond !== updatesPrSecond ||
      update.automaticClassification !== classifyAutomatically
    ) {
      if (predictionInterval !== undefined) {
        clearInterval(predictionInterval);
      }
      predictionInterval = undefined;
      setupPredictionInterval();
    }
  });
}

// Classify data
export function classify() {
  // Get currentState to check whether the prediction has been interrupted by other processes
  const currentState = get(state);
  const currentTrainingStatus = get(trainingStatus);
  const hasBeenInterrupted =
    !currentState.isPredicting ||
    currentState.isRecording ||
    currentState.isTraining ||
    currentTrainingStatus !== TrainingStatus.Success;

  if (hasBeenInterrupted) {
    if (predictionInterval !== undefined) {
      clearInterval(predictionInterval);
    }
    predictionInterval = undefined;
    setIsPredicting(false);
    unsubscribeFromSettings?.();
    // if (unsubscribeFromSettings) unsubscribeFromSettings();
    return;
  }

  if (!currentState.isInputConnected) return;

  // Get formatted version of previous data
  const data = getPrevData();
  if (data === undefined)
    throw new Error('Unsufficient amount of data to make prediction');

  console.log('smoothenTestData', smoothenTestData);
  const inputData = smoothenTestData ? smoothenInputs(data) : data;
  const input: number[] = makeInputs(inputData);
  const inputTensor = tf.tensor([input]);
  const prediction: Tensor = get(model).predict(inputTensor) as Tensor;
  prediction
    .data()
    .then(data => {
      tfHandlePrediction(data as Float32Array);
    })
    .catch(err => console.error('Prediction error:', err));
}

function tfHandlePrediction(result: Float32Array) {
  const gestureData = get(gestures);

  gestureData.forEach(({ ID }, index) => {
    Repositories.getInstance()
      .getModelRepository()
      .setGestureConfidence(ID, result[index]);
    gestureConfidences.update(confidenceMap => {
      confidenceMap[ID] = result[index];
      return confidenceMap;
    });
  });

  bestPrediction.set(getPrediction(get(gestures)));
}

state.subscribe(({ isInputConnected }) => {
  if (!isInputConnected) {
    const gestureData = get(gestures);
    gestureData.forEach(({ ID }) => {
      Repositories.getInstance().getModelRepository().setGestureConfidence(ID, 0);
      gestureConfidences.update(confidenceMap => {
        confidenceMap[ID] = 0;
        return confidenceMap;
      });
      bestPrediction.set(undefined);
    });
  }
});
