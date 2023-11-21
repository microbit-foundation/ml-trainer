import {
  Readable,
  Subscriber,
  Unsubscriber,
  Writable,
  get,
  writable,
} from 'svelte/store';
import { TrainingStatus } from '../stores/mlStore';
import MLModel from './MLModel';
import ClassifierRepository, {
  TrainerConsumer,
} from '../repository/ClassifierRepository';
import ModelTrainer from './ModelTrainer';

export enum ModelType {
  LAYERS,
}

export type ModelData = {
  trainingStatus: TrainingStatus;
};

class Model implements Readable<ModelData> {
  private modelData: Writable<ModelData>;

  constructor(private trainerConsumer: TrainerConsumer, private mlModel: Readable<MLModel>) {
    this.modelData = writable({
      trainingStatus: TrainingStatus.Untrained,
    });
  }

  public async train<T extends MLModel>(modelTrainer: ModelTrainer<T>): Promise<void> {
    this.modelData.update(state => {
      state.trainingStatus = TrainingStatus.InProgress
      return state;
    })
    try {
      return await this.trainerConsumer(modelTrainer);
    } catch (err) {
      this.modelData.update(state => {
        state.trainingStatus = TrainingStatus.Failure;
        return state;
      })
      console.error(err);
    } finally {
      this.modelData.update(state => {
        state.trainingStatus = TrainingStatus.Success;
        return state;
      })
    }
  }

  public isTrained(): boolean {
    return get(this.modelData).trainingStatus === TrainingStatus.Success;
  }

  public predict(inputData: number[]) {
    get(this.mlModel).predict(inputData);
  }

  subscribe(
    run: Subscriber<ModelData>,
    invalidate?: ((value?: ModelData | undefined) => void) | undefined,
  ): Unsubscriber {
    return this.modelData.subscribe(run, invalidate);
  }
}

export default Model;
