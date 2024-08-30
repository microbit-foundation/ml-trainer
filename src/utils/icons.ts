import { MicrobitWebBluetoothConnection } from "@microbit/microbit-connection";

export const makecodeIcons = {
  Heart: "0101011111111110111000100",
  SmallHeart: "0000001010011100010000000",
  Happy: "0000001010000001000101110",
  Sad: "0000001010000000111010001",
  Confused: "0000001010000000101010101",
  Angry: "1000101010000001111110101",
  Asleep: "0000011011000000111000000",
  Surprised: "0101000000001000101000100",
  Silly: "1000100000111110001100011",
  Fabulous: "1111111011000000101001110",
  Meh: "1101100000000100010001000",
  Yes: "0000000001000101010001000",
  No: "1000101010001000101010001",
  Triangle: "0000000100010101111100000",
  LeftTriangle: "1000011000101001001011111",
  Chessboard: "0101010101010101010101010",
  Diamond: "0010001010100010101000100",
  SmallDiamond: "0000000100010100010000000",
  Square: "1111110001100011000111111",
  SmallSquare: "0000001110010100111000000",
  Scissors: "1100111010001001101011001",
  TShirt: "1101111111011100111001110",
  Rollerskate: "0001100011111111111101010",
  Duck: "0110011100011110111000000",
  House: "0010001110111110111001010",
  Tortoise: "0000001110111110101000000",
  Butterfly: "1101111111001001111111011",
  StickFigure: "0010011111001000101010001",
  Ghost: "0111010101111111111110101",
  Sword: "0010000100001000111000100",
  Giraffe: "1100001000010000111001010",
  Skull: "0111010101111110111001110",
  Umbrella: "0111011111001001010011100",
  Snake: "1100011011010100111000000",
  Rabbit: "1010010100111101101011110",
  Cow: "1000110001111110111000100",
  QuarterNote: "0010000100001001110011100",
  EighthNote: "0010000110001011110011100",
  Pitchfork: "1010110101111110010000100",
  Target: "0010001110110110111000100",
};

export const Off = "0000000000000000000000000";

export type MakeCodeIcon = keyof typeof makecodeIcons;

export const icons = {
  ...makecodeIcons,
  off: Off,
};

export type LedIconType = keyof typeof icons;

export const defaultIcons: MakeCodeIcon[] = [
  "House",
  "Duck",
  "Tortoise",
  "StickFigure",
  "Ghost",
  "Giraffe",
  "Umbrella",
  "Cow",
  "EighthNote",
  "Pitchfork",
];

// TODO: export this from the connection lib or give up and use boolean[][]
export type LedMatrix = Parameters<
  MicrobitWebBluetoothConnection["setLedMatrix"]
>[0];

export const iconToLedMatrix = (icon: MakeCodeIcon): LedMatrix => {
  return makecodeIcons[icon]
    .match(/.{5}/g)!
    .map((r) => r.split("").map((d) => d !== "0")) as LedMatrix;
};
