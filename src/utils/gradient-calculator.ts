export const calculateGradientColor = (hexColor: string, value: number) => {
  const minLightness = 10;
  const maxLightness = 90;
  const diffLightness = maxLightness - minLightness;
  return `hsl(from ${hexColor} h s ${
    minLightness + (1 - value) * diffLightness
  }%)`;
};