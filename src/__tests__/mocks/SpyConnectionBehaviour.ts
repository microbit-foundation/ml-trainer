/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import type ConnectionBehaviour from '../../script/connection-behaviours/ConnectionBehaviour';
import MicrobitBluetooth from '../../script/microbit-interfacing/MicrobitBluetooth';
import MBSpecs from '../../script/microbit-interfacing/MBSpecs';

/**
 * Use this for checking the micro:bit behaviour.
 */
class SpyConnectionBehaviour implements ConnectionBehaviour {
  onIdentifiedAsOutdated(): void {
    // This happens in the tests due to async code that's not waited
    // for. The test Bluetooth code doesn't ever send a version.
    // Making a no-op for now.
  }
  onVersionIdentified(versionNumber: number): void {
    throw new Error('Method not implemented.');
  }
  onIdentifiedAsProprietary(): void {
    throw new Error('Method not implemented.');
  }
  onIdentifiedAsMakecode(): void {
    throw new Error('Method not implemented.');
  }
  onUartMessageReceived(message: string): void {
    throw new Error('Method not implemented.');
  }

  private hasConnected = false;
  private hasDisconnected = false;
  private wasExpelled = false;
  private wasManualExpel = false;
  private wasBothExpelled = false;
  private hasFailedConnection = false;
  private connectedName: string | undefined = undefined;
  private connectedMicrobit: MicrobitBluetooth | undefined = undefined;

  onGestureRecognized(id: number, gestureName: string): void {
    throw new Error('Method not implemented.');
  }

  onConnected(name: string): void {
    this.hasConnected = true;
  }
  onDisconnected(): void {
    this.hasDisconnected = true;
  }

  accelerometerChange(x: number, y: number, z: number): void {
    /* Empty */
  }

  onAssigned(microbitBluetooth: MicrobitBluetooth, name: string): void {
    this.hasConnected = true;
    this.connectedName = name;
    this.connectedMicrobit = microbitBluetooth;
  }

  onCancelledBluetoothRequest(): void {
    this.hasFailedConnection = true;
  }

  onExpelled(manual?: boolean, bothExpelled?: boolean): void {
    this.wasExpelled = true;
    if (manual) {
      this.wasManualExpel = manual;
    }
    if (bothExpelled) {
      this.wasBothExpelled = bothExpelled;
    }
  }

  buttonChange(buttonState: MBSpecs.ButtonState, button: MBSpecs.Button): void {
    /* Empty */
  }

  isAssigned(): boolean {
    return false;
  }

  wasBothDisconnected(): boolean {
    return this.wasBothExpelled;
  }

  wasManuallyDisconnected(): boolean {
    return this.wasManualExpel;
  }

  hasConnectFired() {
    return this.hasConnected;
  }

  wasDisconnected() {
    return this.hasDisconnected;
  }

  didFailConnection() {
    return this.hasFailedConnection;
  }

  getConnectedName() {
    return this.connectedName;
  }

  onReady(): void {
    /* Empty */
  }

  onConnectionError(error?: unknown): void {
    this.hasFailedConnection = true;
  }
}

export default SpyConnectionBehaviour;
