interface OnGestureRecognisedConfig {
  name: string;
  ledPattern: string;
}

// TODO: Can possibly write a test for this
export const generateMakeCodeMain = (names: string[]) => {
  const configs = names.map(name => ({
    name,
    ledPattern: generateRandomLedPattern(),
  }));
  return {
    'main.blocks': generateMakeCodeMainBlocksXml(configs),
    'main.ts': generateMakeCodeMainTs(configs),
  };
};

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

export const generateMakeCodeMainTs = (configs: OnGestureRecognisedConfig[]) => {
  return `MLMachine.showPairingPattern()
    ${configs.map(
      ({ name, ledPattern }: OnGestureRecognisedConfig) => `
    MLMachine.onGestureRecognized("${name}", function () {
      basic.showLeds(\`${ledPattern}\`)
    })`,
    ).join(`
    `)}`;
};

export const generateMakeCodeMainBlocksXml = (configs: OnGestureRecognisedConfig[]) => {
  const onStartPos = { x: 0, y: 0 };
  return `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="pxt-on-start" x="${onStartPos.x}" y="${onStartPos.y}">
        <statement name="HANDLER">
          <block type="MLMachine_showPairingPattern"></block>
        </statement>
      </block>

      ${configs.map((c, idx) =>
        onGestureRecognisedBlock({
          x: onStartPos.x + 300,
          y: onStartPos.y + idx * 400,
          ...c,
        }),
      ).join(`
      `)}
    </xml>`;
};

interface OnGestureRecognisedBlock extends OnGestureRecognisedConfig {
  x: number;
  y: number;
}

const onGestureRecognisedBlock = ({
  x,
  y,
  name,
  ledPattern,
}: OnGestureRecognisedBlock) => `
  <block type="MLMachine_onGestureRecognized" x="${x}" y="${y}">
  <value name="gesture">
    <shadow type="text"><field name="TEXT">${name}</field></shadow>
  </value>
  <statement name="HANDLER">
    <block type="device_show_leds">
      <field name="LEDS">\`${ledPattern}\`</field>
    </block>
  </statement>
  </block>
`;
