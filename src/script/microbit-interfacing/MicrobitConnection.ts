/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import InputBehaviour from '../connection-behaviours/InputBehaviour';
import MBSpecs from './MBSpecs';

export interface MicrobitConnection {
  isSameDevice(other: MicrobitConnection): boolean;

  isConnected(): boolean;

  disconnect(): void;

  listenToInputServices(
    inputBehaviour: InputBehaviour,
    inputUartHandler: (data: string) => void,
  ): Promise<void>;

  listenToAccelerometer(
    onAccelerometerChanged: (x: number, y: number, z: number) => void,
  ): Promise<void>;

  listenToButton(
    buttonToListenFor: MBSpecs.Button,
    onButtonChanged: (state: MBSpecs.ButtonState, button: MBSpecs.Button) => void,
  ): Promise<void>;

  listenToUART(onDataReceived: (data: string) => void): Promise<void>;

  setLEDMatrix(matrix: number[][]): Promise<void>;

  setLEDMatrix(matrix: boolean[][]): Promise<void>;

  setLEDMatrix(matrix: unknown[][]): Promise<void>;

  getVersion(): MBSpecs.MBVersion;
}
