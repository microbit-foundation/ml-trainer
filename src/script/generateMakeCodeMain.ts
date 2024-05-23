const generateRandomLedPattern = () => {
  const genRandomLedRow = () =>
    Array.from({ length: 5 }, () => (Math.floor(Math.random() * 2) == 0 ? '#' : '.'));
  const newLine = `
        `;
  return (
    newLine +
    Array.from({ length: 5 }, () => genRandomLedRow().join(' ')).join(newLine) +
    newLine
  );
};

const onGestureRecognisedScript = (gestureName: string) => `
MLMachine.onGestureRecognized("${gestureName}", function () {
  basic.showLeds(\`${generateRandomLedPattern()}\`)
})`;

export const generateMakeCodeMain = (names: string[]) =>
  `MLMachine.showPairingPattern()
    ${names.map(n => onGestureRecognisedScript(n)).join(`
    `)}`;
