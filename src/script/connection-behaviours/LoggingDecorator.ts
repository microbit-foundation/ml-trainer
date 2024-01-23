/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import MBSpecs from '../microbit-interfacing/MBSpecs';
import type ConnectionBehaviour from './ConnectionBehaviour';
import { MicrobitConnection } from '../microbit-interfacing/MicrobitConnection';
import { isDevMode } from '../environment';

/**
 * Used for logging / Decorator pattern
 */
abstract class LoggingDecorator implements ConnectionBehaviour {
  private enableLogging: boolean = isDevMode && true;

  // For preventing spam of accelerometer data
  private logTimer = new Date().getTime();
  private logInterval = 1000;

  onIdentifiedAsOutdated(): void {
    this.enableLogging && console.log(`Microbit identified as an outdated device!`);
  }

  onVersionIdentified(versionNumber: number): void {
    this.enableLogging &&
      console.log(`Microbit identified as version number ${versionNumber}`);
  }

  onIdentifiedAsProprietary(): void {
    this.enableLogging && console.log('Microbit identified as proprietary HEX');
  }

  onIdentifiedAsMakecode(): void {
    this.enableLogging && console.log('Microbit identified as makecode HEX');
  }

  onConnectionError(error?: unknown): void {
    this.enableLogging && console.log('An error occured while connecting.', error);
  }

  onGestureRecognized(id: number, gestureName: string): void {
    this.enableLogging &&
      console.log(`Gesture '${gestureName}' with id ${id} was recognized`);
  }

  onUartMessageReceived(message: string): void {
    this.enableLogging && console.log(`Message '${message}' was received`);
  }

  onReady(): void {
    this.enableLogging && console.log('Is ready!');
  }

  accelerometerChange(x: number, y: number, z: number): void {
    // this.enableLogging && this.logTimed("X:", x, "Y:", y,"Z:",z)
  }

  buttonChange(buttonState: MBSpecs.ButtonState, button: MBSpecs.Button): void {
    this.enableLogging && console.log('Button change', buttonState, button);
  }

  onAssigned(microbit: MicrobitConnection, name: string): void {
    this.enableLogging && console.log(name, ' was assigned ');
    this.enableLogging && console.log(microbit);
  }

  onCancelledBluetoothRequest(): void {
    this.enableLogging && console.log('Device request was cancelled');
  }

  onConnected(name: string): void {
    this.enableLogging && console.log(name, ' got connected via bluetooth');
  }

  onDisconnected(): void {
    this.enableLogging && console.log('disconnected via bluetooth');
  }

  onExpelled(manual?: boolean, bothExpelled?: boolean): void {
    this.enableLogging &&
      console.log('Was expelled manually?:', manual, 'both?:', bothExpelled);
  }

  private logTimed(...msg: (string | number)[]) {
    if (new Date().getTime() - this.logTimer > this.logInterval) {
      console.log(msg);
      this.logTimer = new Date().getTime();
    }
  }
}

export default LoggingDecorator;
