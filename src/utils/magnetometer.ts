export const maxMagnetometer = 1;
export const maxmaxMagnetometerScaleForGraphs = 1.2;

const scaleMag = (value: number) => {
  const newMax = maxMagnetometer;
  const newMin = -maxMagnetometer;
  const currentMax = Math.sqrt(2 ** 15);
  const currentMin = Math.sqrt(2 ** 15) * -1;
  return (
    ((newMax - newMin) * (value - currentMin)) / (currentMax - currentMin) +
    newMin
  );
};

const signedSqrt = (value: number) =>
  Math.sign(value) * Math.sqrt(Math.abs(value));

export const processMagnetometerValue = (value: number) =>
  scaleMag(signedSqrt(value));
