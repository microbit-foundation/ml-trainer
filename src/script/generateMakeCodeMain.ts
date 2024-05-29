import { compileModel } from 'ml4f';
import { model } from './stores/mlStore';
import { get } from 'svelte/store';

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
    'workaround.ts': generateWorkaroundTs(configs),
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
  return `basic.showLeds(IconNames.Heart)
    ${configs.map(
      ({ name, ledPattern }: OnGestureRecognisedConfig) => `
    machineLearningPoc.onActionEstimated("${name}", function () {
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
          <block type=\"basic_show_icon\"><field name=\"i\">IconNames.Heart</field></block>        
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

const onGestureRecognisedBlock = ({
  x,
  y,
  name,
  ledPattern,
}: OnGestureRecognisedBlock) => `
  <block type=\"machineLearningPoc_onActionEstimated\" x=\"${x}\" y=\"${y}\">
    <field name=\"NAME\">MlAction.${name}</field>
    <statement name="HANDLER">
      <block type="device_show_leds">
        <field name="LEDS">\`${ledPattern}\`</field>
      </block>
    </statement>
  </block>
`;

interface OnGestureRecognisedBlock extends OnGestureRecognisedConfig {
  x: number;
  y: number;
}

const createActionEnum = (actions: string[]) => {
  let code = '';
  actions.forEach((action, idx) => {
    code += `    ${action} = ${idx},${idx === actions.length - 1 ? '' : '\n'}`;
  });
  return code;
};

// TODO: Throwing errors
const getModelAsHexString = () => {
  const m = get(model);
  const result = compileModel(m, {});
  return Array.from(result.machineCode, i => i.toString(16).padStart(2, '0')).join('');
};

export const generateWorkaroundTs = (configs: OnGestureRecognisedConfig[]) => {
  const actions = configs.map(c => c.name);

  return `// Auto-generated. Do not edit.
  enum MlAction {
  ${createActionEnum(actions)}
  }
  
  namespace machineLearningPoc {
      //% block="on|%NAME|action estimated"
      //% icon="\uf192" blockGap=8
      export function onActionEstimated(action: MlAction, body: () => void): void {
        eventHandlers[action] = body;
      }
  
      actions = ${JSON.stringify(actions)};
      // modelBlob = hex\`getModelAsHexString()\`;
      simulatorRegister();
  }
  
  // Auto-generated. Do not edit. Really.
  `;
};
