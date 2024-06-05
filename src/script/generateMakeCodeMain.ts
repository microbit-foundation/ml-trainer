/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { compileModel } from 'ml4f';
import { model } from './stores/mlStore';
import { get } from 'svelte/store';

interface OnGestureRecognisedConfig {
  name: string;
  ledPattern: string;
}

// TODO: Can possibly write a test for this
export const generateMakeCodeMain = (configs: OnGestureRecognisedConfig[]) => {
  return {
    'main.blocks': generateMakeCodeMainBlocksXml(configs),
    'main.ts': generateMakeCodeMainTs(configs),
    'Machine_Learning_POC.ts': generateWorkaroundTs(configs),
  };
};

export const generateRandomLedPattern = () => {
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
  return `basic.showIcon(IconNames.Heart)
  ${configs
    .map(
      ({ name, ledPattern }: OnGestureRecognisedConfig) => `
mlrunner.onMlEvent(MlRunnerLabels.${name}, function () {
  basic.showLeds(\`${ledPattern}\`)
})`,
    )
    .join(`\n    `)}`;
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
  <block type=\"mlrunner_on_ml_event\" x=\"${x}\" y=\"${y}\">
    <field name=\"value\">MlRunnerLabels.${name}</field>
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
    code += `
    //% block="${action}"
    ${action} = ${idx},
    `;
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
  enum MlRunnerLabels {${createActionEnum(actions)}}
  
  actions = ${JSON.stringify(actions)}

  getModelBlob = (): Buffer =>  {
    const result = hex\`${getModelAsHexString()}\`;
    return result
  }
  
  mlrunner.simulatorSendData()

  // Auto-generated. Do not edit. Really.
  `;
};
