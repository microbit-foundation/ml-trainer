import { TimeoutOptions } from "@capacitor-community/bluetooth-le";
import {
  AccelerometerData,
  DeviceConnectionEventMap,
  ServiceConnectionEventMap,
} from "@microbit/microbit-connection";
import { Device } from "./bluetooth";

const ACCELEROMETER_SERVICE = "e95d0753-251d-470a-a062-fa1922dfa9a8";
const DATA_CHARACTERISTIC = "e95dca4b-251d-470a-a062-fa1922dfa9a8";

// Copied types

type TypedServiceEvent = keyof (ServiceConnectionEventMap &
  DeviceConnectionEventMap);

type TypedServiceEventDispatcher = (
  _type: TypedServiceEvent,
  event: (ServiceConnectionEventMap &
    DeviceConnectionEventMap)[TypedServiceEvent]
) => boolean;

class AccelerometerDataEvent extends Event {
  constructor(public readonly data: AccelerometerData) {
    super("accelerometerdatachanged");
  }
}

export class AccelerometerService {
  constructor(
    private device: Device,
    dispatchTypedEvent: TypedServiceEventDispatcher
  ) {
    device.subscribe(ACCELEROMETER_SERVICE, DATA_CHARACTERISTIC, (data) => {
      const dataView = new DataView(data.buffer);
      dispatchTypedEvent(
        "accelerometerdatachanged",
        new AccelerometerDataEvent({
          x: dataView.getInt16(0, true),
          y: dataView.getInt16(2, true),
          z: dataView.getInt16(4, true),
        })
      );
    });
  }

  dispose() {}

  async startNotifications(options?: TimeoutOptions) {
    await this.device.startNotifications(
      ACCELEROMETER_SERVICE,
      DATA_CHARACTERISTIC,
      options
    );
  }

  async stopNotifications() {
    await this.device.stopNotifications(
      ACCELEROMETER_SERVICE,
      DATA_CHARACTERISTIC
    );
  }
}
