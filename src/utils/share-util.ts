import { Encoding, Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { HexData } from "../model";

export const shareHex = async (hex: HexData) => {
  const hexFilePath = `${hex.name}.hex`;
  const { uri: url } = await Filesystem.writeFile({
    path: hexFilePath,
    data: hex.hex,
    encoding: Encoding.UTF8,
    directory: Directory.Temporary,
  });

  await Share.share({
    title: `CreateAI ${hex.name}`,
    text: "Micro:bit CreateAI project: ${hex.name}",
    files: [url],
  });

  await Filesystem.deleteFile({
    path: hexFilePath,
    directory: Directory.Temporary,
  });
};
