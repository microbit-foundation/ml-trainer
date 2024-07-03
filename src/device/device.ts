export type MicrobitVersion = 1 | 2;

export type Button = "A" | "B";

export type ButtonState =
  | ButtonStates.Released
  | ButtonStates.Pressed
  | ButtonStates.LongPressed;

export enum ButtonStates {
  Released,
  Pressed,
  LongPressed,
}

export const microbitServicesUUID = {
  uart: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  accelerometer: "e95d0753-251d-470a-a062-fa1922dfa9a8",
  deviceInfo: "0000180a-0000-1000-8000-00805f9b34fb",
  led: "e95dd91d-251d-470a-a062-fa1922dfa9a8",
  io: "e95d127b-251d-470a-a062-fa1922dfa9a8",
  button: "e95d9882-251d-470a-a062-fa1922dfa9a8",
};

export const microbitCharacteristicsUUID = {
  buttonA: "e95dda90-251d-470a-a062-fa1922dfa9a8",
  buttonB: "e95dda91-251d-470a-a062-fa1922dfa9a8",
  accelerometer: "e95dca4b-251d-470a-a062-fa1922dfa9a8",
  // TODO: To remove io? Used for controlling pins
  ioData: "e95d8d00-251d-470a-a062-fa1922dfa9a8",
  // Allows the state of any|all LEDs in the 5x5 grid to be set to on or off with a single GATT operation.
  ledMatrixState: "e95d7b77-251d-470a-a062-fa1922dfa9a8",
  modelNumber: "00002a24-0000-1000-8000-00805f9b34fb",
  // Used to listen for data from the micro:bit.
  uartDataTX: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
  // Used for sending data to the micro:bit
  uartDataRX: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
};
