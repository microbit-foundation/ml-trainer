import {
  Connection,
  ConnectionStatus,
  ConnectionsState,
  ProgramType,
  RadioConnection,
} from "./connections-hooks";

export class Connections {
  constructor(
    private connections: ConnectionsState,
    private setConnections: (state: ConnectionsState) => void
  ) {}

  setConnection = (
    program: ProgramType,
    conn: {
      status?: ConnectionStatus;
      type?: "bluetooth" | "radio";
      remoteDeviceId?: RadioConnection["remoteDeviceId"];
    }
  ) => {
    const newConnection = {
      status: ConnectionStatus.Disconnected,
      ...this.connections[program],
      ...conn,
    } as Connection;
    if (
      !("status" in newConnection) ||
      !("type" in newConnection) ||
      !(
        newConnection.type === "bluetooth" ||
        (newConnection.type === "radio" && !!newConnection.remoteDeviceId)
      )
    ) {
      throw new Error(
        `Invalid new connection state: ${JSON.stringify(newConnection)}`
      );
    }
    this.setConnections({ [program]: newConnection });
  };

  getRemoteDeviceId = (
    programType: ProgramType
  ): RadioConnection["remoteDeviceId"] | undefined => {
    const inputConnection = this.connections[programType];
    return inputConnection?.type === "radio"
      ? inputConnection.remoteDeviceId
      : undefined;
  };

  isConnected = (programType: ProgramType): boolean => {
    return this.connections[programType]?.status === ConnectionStatus.Connected;
  };
}
