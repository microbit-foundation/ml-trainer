/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Static configuration values. These values are not expected to change, while the application is running.
 */
import { PinTurnOnState } from './components/output/PinSelectorUtil';
import MBSpecs from './script/microbit-interfacing/MBSpecs';
import { HexOrigin } from './script/microbit-interfacing/Microbits';

class StaticConfiguration {
  public static readonly connectTimeoutDuration: number = 10000;

  // After how long should we consider the connection lost if ping was not able to conclude?
  public static readonly connectionLostTimeoutDuration: number = 3000;

  // Which pins are supported?
  public static supportedPins: MBSpecs.UsableIOPin[] = [0, 1, 2];
  public static readonly defaultOutputPin: MBSpecs.UsableIOPin = 0; // Which pin should be selected by default?
  // In milliseconds, after turning on, how long should an output be on for?
  public static readonly defaultPinToggleTime = 1500;
  public static readonly defaultPinTurnOnState: PinTurnOnState = PinTurnOnState.X_TIME;
  public static readonly pinIOEnabledByDefault: boolean = true;

  // How long may gesture names be?
  public static readonly gestureNameMaxLength = 18;

  // Default required confidence level
  public static readonly defaultRequiredConfidence = 0.8;

  // Duration before assuming the microbit is outdated? (in milliseconds)
  public static readonly versionIdentificationTimeoutDuration = 4000;

  // Link to the MakeCode firmware template
  public static readonly makecodeFirmwareUrl =
    'https://makecode.microbit.org/#pub:54705-16835-80762-83855';

  public static readonly isMicrobitOutdated = (origin: HexOrigin, version: number) => {
    // Current versions, remember to update these, whenever changes to firmware are made!
    if (origin === HexOrigin.UNKNOWN) return true;

    const versionNumbers = new Map();
    versionNumbers.set(HexOrigin.MAKECODE, 1);
    versionNumbers.set(HexOrigin.PROPRIETARY, 1);
    return versionNumbers.get(origin) !== version;
  };
}
export default StaticConfiguration;
