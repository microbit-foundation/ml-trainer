import { BleClient } from "@capacitor-community/bluetooth-le";

/**
 * V1 changes the service it offers in application/bootloader mode.
 *
 * We don't trust Android to have an up-to-date copy of services so will fall back
 * to calling internal API via reflection if the desired/expected service is not
 * listed.
 *
 * It might be that this is only needed for older versions of Android where we
 * can't get service changed indications.
 */
export const refreshServicesForV1IfDesiredServiceMissing = async (
  deviceId: string,
  desiredServiceUuid: string
) => {
  const services = await BleClient.getServices(deviceId);
  const deviceHasService = services.some((s) => s.uuid === desiredServiceUuid);
  if (!deviceHasService) {
    // On Android this does use the refresh reflection hack.
    await BleClient.discoverServices(deviceId);
  }
};
