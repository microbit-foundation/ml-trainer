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
import { liveData } from '../../../script/stores/Stores';
import LiveData from '../../../script/domain/LiveData';
import { MicrobitAccelerometerData } from '../../../script/livedata/MicrobitAccelerometerData';

type AccelerometerSynthesizerData = {
  intervalSpeed: number;
  xSpeed: number;
  ySpeed: number;
  zSpeed: number;
};

class AccelerometerSynthesizer implements Readable<AccelerometerSynthesizerData> {
  private interval: NodeJS.Timeout | undefined = undefined;
  private store: Writable<AccelerometerSynthesizerData>;

  constructor(private liveData: LiveData<MicrobitAccelerometerData>) {
    const defaultSpeed = 50;
    this.store = writable({
      intervalSpeed: defaultSpeed,
      xSpeed: 1,
      ySpeed: 1,
      zSpeed: 1,
    });
  }

  public subscribe(
    run: Subscriber<AccelerometerSynthesizerData>,
    invalidate?: ((value?: AccelerometerSynthesizerData | undefined) => void) | undefined,
  ): Unsubscriber {
    return this.store.subscribe(run, invalidate);
  }

  public updateInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      this.generateData();
    }, get(this.store).intervalSpeed);
  }

  public generateData() {
    const val = new Date().getTime();
    this.liveData.put({
      accelX: Math.sin(val * get(this.store).xSpeed),
      accelY: Math.sin(val * get(this.store).ySpeed),
      accelZ: Math.sin(val * get(this.store).zSpeed),
      smoothedAccelX: val,
      smoothedAccelY: val,
      smoothedAccelZ: val,
    });
  }

  public setXSpeed(value: number) {
    this.store.update(updater => {
      updater.xSpeed = value / 1000;
      return updater;
    });
  }

  public setYSpeed(value: number) {
    this.store.update(updater => {
      updater.ySpeed = value / 1000;
      return updater;
    });
  }

  public setZSpeed(value: number) {
    this.store.update(updater => {
      updater.zSpeed = value / 1000;
      return updater;
    });
  }

  public setIntervalSpeed(value: number) {
    this.store.update(updater => {
      updater.intervalSpeed = value;
      return updater;
    });
    this.updateInterval();
  }
}

const accelerometerSynthesizer = new AccelerometerSynthesizer(liveData);

export default accelerometerSynthesizer;
