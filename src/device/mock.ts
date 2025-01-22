import {
  ConnectionStatus,
  DeviceConnection,
  DeviceConnectionEventMap,
  TypedEventTarget,
} from "@microbit/microbit-connection";

export class MockWebUSBConnection
  extends TypedEventTarget<DeviceConnectionEventMap>
  implements DeviceConnection
{
  status: ConnectionStatus = ConnectionStatus.CONNECTED;
}
