/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

/* eslint-disable @typescript-eslint/no-namespace */
/**
 * References to the Bluetooth Profile UUIDs.
 */

namespace MBSpecs {
  /**
   * The UUIDs of the services available on the micro:bit.
   */
  export namespace Services {
    /**
     * The UUID of the micro:bit's UART service.
     */
    export const UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    /**
     * The micro:bits accelerometer service.
     */
    export const ACCEL_SERVICE = 'e95d0753-251d-470a-a062-fa1922dfa9a8';
    /**
     * The device information service. Exposes information about manufacturer, vendor, and firmware version.
     */
    export const DEVICE_INFO_SERVICE = '0000180a-0000-1000-8000-00805f9b34fb';
    /**
     * Used for controlling the LEDs on the micro:bit.
     */
    export const LED_SERVICE = 'e95dd91d-251d-470a-a062-fa1922dfa9a8';
    /**
     * The UUID of the micro:bit's IO service.
     */
    export const IO_SERVICE = 'e95d127b-251d-470a-a062-fa1922dfa9a8';
    /**
     * Service for buttons on the micro:bit.
     */
    export const BUTTON_SERVICE = 'e95d9882-251d-470a-a062-fa1922dfa9a8';
    /**
     * The micro:bits magnetometer service.
     */
    export const MAGNETOMETER_SERVICE = 'e95df2d8-251d-470a-a062-fa1922dfa9a8';
  }

  /**
   * The UUIDs of the characteristics available on the micro:bit.
   */
  export namespace Characteristics {
    /**
     * Characteristic for the A button.
     */
    export const BUTTON_A = 'e95dda90-251d-470a-a062-fa1922dfa9a8';
    /**
     * Characteristic for the B button.
     */
    export const BUTTON_B = 'e95dda91-251d-470a-a062-fa1922dfa9a8';
    /**
     * The accelerometer data characteristic.
     */
    export const ACCEL_DATA = 'e95dca4b-251d-470a-a062-fa1922dfa9a8';
    /**
     * IO data characteristic. Used for controlling IO pins on the micro:bit.
     */
    export const IO_DATA = 'e95d8d00-251d-470a-a062-fa1922dfa9a8';
    /**
     * Allows the state of any|all LEDs in the 5x5 grid to be set to on or off with a single GATT operation.
     *
     * Octet 0, LED Row 1: bit4 bit3 bit2 bit1 bit0
     *
     * Octet 1, LED Row 2: bit4 bit3 bit2 bit1 bit0
     *
     * Octet 2, LED Row 3: bit4 bit3 bit2 bit1 bit0
     *
     * Octet 3, LED Row 4: bit4 bit3 bit2 bit1 bit0
     *
     * Octet 4, LED Row 5: bit4 bit3 bit2 bit1 bit0
     */
    export const LED_MATRIX_STATE = 'e95d7b77-251d-470a-a062-fa1922dfa9a8';

    /**
     * The model number of the micro:bit as a string.
     */
    export const MODEL_NUMBER = '00002a24-0000-1000-8000-00805f9b34fb';
    /**
     * The UUID of the micro:bit's UART TX characteristic.
     * Used to listen for data from the micro:bit.
     */
    export const UART_DATA_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
    /**
     * The UUID of the micro:bit's UART RX characteristic.
     * Used for sending data to the micro:bit.
     */
    export const UART_DATA_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
    /**
     * The magnetometer data characteristic.
     */
    export const MAGNETOMETER_DATA = 'e95dfb11-251d-470a-a062-fa1922dfa9a8';
  }

  export namespace USBSpecs {
    export const PRODUCT_ID = 516;
    export const VENDOR_ID = 3368;
    export const FICR = 0x10000000;
    export const DEVICE_ID_1 = 0x064;
    export const MICROBIT_NAME_LENGTH = 5;
    export const MICROBIT_NAME_CODE_LETTERS = 5;
  }

  /**
   * The buttons on the micro:bit.
   */
  export type Button = 'A' | 'B';

  export type MBVersion = 1 | 2;

  /**
   * The state of the buttons on the micro:bit. Becomes LongPressed when the button is held for more than ~2 second.
   */
  export type ButtonState =
    | ButtonStates.Released
    | ButtonStates.Pressed
    | ButtonStates.LongPressed;

  /**
   * The state of the buttons on the micro:bit. Becomes LongPressed when the button is held for more than ~2 second.
   */
  export enum ButtonStates {
    Released,
    Pressed,
    LongPressed,
  }

  /**
   * Ordered list of all IO pins. Such as 0, 2, '3V', 'GND', etc.
   */
  export const IO_PIN_LAYOUT: IOPin[] = [
    3,
    0,
    4,
    5,
    6,
    7,
    1,
    8,
    9,
    10,
    11,
    12,
    2,
    13,
    14,
    15,
    16,
    17,
    '3V',
    18,
    19,
    20,
    21,
    'GND',
    24,
  ];

  export type IOPin =
    | 3
    | 0
    | 4
    | 5
    | 6
    | 7
    | 1
    | 8
    | 9
    | 10
    | 11
    | 12
    | 2
    | 13
    | 14
    | 15
    | 16
    | 17
    | '3V'
    | 18
    | 19
    | 20
    | 21
    | 'GND'
    | 24;

  export type UsableIOPin = 0 | 1 | 2;

  /**
   * Utilities for working with the micro:bit's Bluetooth Profile.
   */
  export class Utility {
    private static CODEBOOK_USB = [
      ['z', 'v', 'g', 'p', 't'],
      ['u', 'o', 'i', 'e', 'a'],
      ['z', 'v', 'g', 'p', 't'],
      ['u', 'o', 'i', 'e', 'a'],
      ['z', 'v', 'g', 'p', 't'],
    ];

    /**
     *  This is a version of the microbit codebook, where the original codebook is transposed
     *  and the rows are flipped. This gives an easier to use version for the bluetooth pattern
     *  connection.
     *  This could be done programatically, but having it typed out hopefully helps
     *  with the understanding of pattern <-> friendly name conversion
     */
    private static CODEBOOK_BLUETOOTH: string[][] = [
      ['t', 'a', 't', 'a', 't'],
      ['p', 'e', 'p', 'e', 'p'],
      ['g', 'i', 'g', 'i', 'g'],
      ['v', 'o', 'v', 'o', 'v'],
      ['z', 'u', 'z', 'u', 'z'],
    ];

    /**
     * Converts a micro:bit serial number to it's corresponding friendly name
     * @param {number} serialNo The serial number of the micro:bit
     * @returns {string} the name of the micro:bit.
     */
    public static serialNumberToName(serialNo: number): string {
      let d = USBSpecs.MICROBIT_NAME_CODE_LETTERS;
      let ld = 1;
      let name = '';

      for (let i = 0; i < USBSpecs.MICROBIT_NAME_LENGTH; i++) {
        const h = Math.floor((serialNo % d) / ld);
        serialNo -= h;
        d *= USBSpecs.MICROBIT_NAME_CODE_LETTERS;
        ld *= USBSpecs.MICROBIT_NAME_CODE_LETTERS;
        name = Utility.CODEBOOK_USB[i][h] + name;
      }
      return name;
    }

    public static messageToDataview(message: string, delimiter = '#'): DataView {
      if (delimiter.length != 1) {
        throw new Error('The delimiter must be 1 character long');
      }
      const fullMessage = `${message}${delimiter}`;
      const view = new DataView(new ArrayBuffer(fullMessage.length));
      for (let i = 0; i < fullMessage.length; i++) {
        view.setUint8(i, fullMessage.charCodeAt(i));
      }
      return view;
    }

    /**
     * Converts a pairing pattern to a name.
     * See guide on microbit names to understand how a pattern is turned into a name
     * https://support.microbit.org/support/solutions/articles/19000067679-how-to-find-the-name-of-your-micro-bit
     * @param {boolean[]} pattern The pattern to convert.
     * @returns {string} The name of the micro:bit.
     */
    public static patternToName(pattern: boolean[]): string {
      const code: string[] = [' ', ' ', ' ', ' ', ' '];

      for (let col = 0; col < USBSpecs.MICROBIT_NAME_LENGTH; col++) {
        for (let row = 0; row < USBSpecs.MICROBIT_NAME_LENGTH; row++) {
          if (pattern[row * USBSpecs.MICROBIT_NAME_LENGTH + col]) {
            // Find the first vertical on/true in each column
            code[col] = this.CODEBOOK_BLUETOOTH[row][col]; // Use code-book to find char
            break; // Rest of column is irrelevant
          }
          // If we get to here the pattern is not legal, and the returned name
          // will not match any microbit.
        }
      }

      return code.join('');
    }

    public static isPairingPattermValid(pattern: boolean[]): boolean {
      for (let col = 0; col < USBSpecs.MICROBIT_NAME_LENGTH; col++) {
        let isAnyHighlighted = false;
        for (let row = 0; row < USBSpecs.MICROBIT_NAME_LENGTH; row++) {
          if (pattern[row * USBSpecs.MICROBIT_NAME_LENGTH + col]) {
            isAnyHighlighted = true;
          }
        }
        if (!isAnyHighlighted) {
          return false;
        }
      }
      return true;
    }

    /**
     * Converts a name to a pairing pattern.
     * IMPORTANT: Assumes correct microbit name. Not enough error handling for
     * 						incorrect names.
     * @param {string} name The name of the micro:bit
     * @returns {boolean[]} The pairing pattern
     */
    public static nameToPattern(name: string): boolean[] {
      const pattern: boolean[] = new Array<boolean>(25).fill(true);

      // if wrong name length, return empty pattern
      if (name.length != USBSpecs.MICROBIT_NAME_LENGTH) {
        return pattern.map(() => false);
      }

      for (let column = 0; column < USBSpecs.MICROBIT_NAME_LENGTH; column++) {
        for (let row = 0; row < USBSpecs.MICROBIT_NAME_LENGTH; row++) {
          if (this.CODEBOOK_BLUETOOTH[row][column] === name.charAt(column)) {
            break;
          }
          pattern[5 * row + column] = false;
        }
      }

      return pattern;
    }

    /**
     * Converts a binary number represented as an array of numbers into an octet.
     * @param {number[]} array Bitmap array to convert.
     * @returns {number} The octet.
     */
    public static arrayToOctet(array: number[]): number;

    /**
     * Converts a binary number represented as an array of boolean into an octet.
     * @param {boolean[]} array Bitmap array to convert.
     * @returns {number} The octet.
     */
    public static arrayToOctet(array: boolean[]): number;

    /**
     * Converts a binary number represented as an array of numbers into an octet.
     *
     * @param array Bitmap array to convert.
     * @returns {number} The octet.
     */
    public static arrayToOctet(array: unknown[]): number {
      let numArray: number[] = array as number[];
      if (typeof array[0] === 'boolean') {
        const typedArray = array as boolean[];
        numArray = typedArray.map((value: boolean) => (value ? 1 : 0));
      }
      let sum = 0;
      // We track the bit pos because the value of the octet, will just be the decimal value of the bit representation.
      let bitPos = 0;
      // Walk in reverse order to match the order of the micro:bit.
      for (let i = numArray.length - 1; i >= 0; i--) {
        // Just calculate the decimal value of the bit position and add it to the sum.
        sum += numArray[i] * Math.pow(2, bitPos);
        bitPos++;
      }
      return sum;
    }
  }
}

export default MBSpecs;
