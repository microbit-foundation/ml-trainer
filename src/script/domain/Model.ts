/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Readable,
  Subscriber,
  Unsubscriber,
  Writable,
  get,
  writable,
} from 'svelte/store';
import { TrainerConsumer } from '../repository/ClassifierRepository';
import MLModel from './MLModel';
import ModelTrainer from './ModelTrainer';

export enum TrainingStatus {
  Untrained,
  InProgress,
  Success,
  Failure,
}

export enum ModelType {
  LAYERS,
}

export type ModelData = {
  trainingStatus: TrainingStatus;
};

class Model implements Readable<ModelData> {
  private modelData: Writable<ModelData>;

  constructor(
    private trainerConsumer: TrainerConsumer,
    private mlModel: Readable<MLModel>,
  ) {
    this.modelData = writable({
      trainingStatus: TrainingStatus.Untrained,
    });
  }

  public async train<T extends MLModel>(modelTrainer: ModelTrainer<T>): Promise<void> {
    this.modelData.update(state => {
      state.trainingStatus = TrainingStatus.InProgress;
      return state;
    });
    try {
      await this.trainerConsumer(modelTrainer);
      this.modelData.update(state => {
        state.trainingStatus = TrainingStatus.Success;
        return state;
      });
    } catch (err) {
      this.modelData.update(state => {
        state.trainingStatus = TrainingStatus.Failure;
        return state;
      });
      console.error(err);
    }
  }

  public isTrained(): boolean {
    return get(this.modelData).trainingStatus === TrainingStatus.Success;
  }

  public async predict(inputData: number[]): Promise<number[]> {
    return await get(this.mlModel).predict(inputData);
  }

  subscribe(
    run: Subscriber<ModelData>,
    invalidate?: ((value?: ModelData | undefined) => void) | undefined,
  ): Unsubscriber {
    return this.modelData.subscribe(run, invalidate);
  }
}

export default Model;
