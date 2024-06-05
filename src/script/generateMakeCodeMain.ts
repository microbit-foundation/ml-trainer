/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { compileModel } from 'ml4f';
import { model } from './stores/mlStore';
import { get } from 'svelte/store';
import { generateBlob } from 'ml-header-generator';
import { iconNames } from './iconNames';
interface OnGestureRecognisedConfig {
  name: string;
  iconName: string;
}

// TODO: Can possibly write a test for this
export const generateMakeCodeMain = (actionNames: string[]) => {
  const configs = actionNames.map((name, idx) => ({
    name,
    iconName: iconNames[idx % iconNames.length],
  }));

  return {
    'main.blocks': generateMakeCodeMainBlocksXml(configs),
    'main.ts': generateMakeCodeMainTs(configs),
    'Machine_Learning_POC.ts': generateCustomTs(configs),
  };
};

export const generateMakeCodeMainTs = (configs: OnGestureRecognisedConfig[]) => {
  return `
  ${configs
    .map(
      ({ name, iconName }: OnGestureRecognisedConfig) => `
      mlrunner.Action.${name}.onEvent(function () {
  basic.showIcon(IconNames.${iconName})
})`,
    )
    .join(`\n    `)}`;
};

const getShowIconBlock = (iconName: string) => {
  return `<block type=\"basic_show_icon\"><field name=\"i\">IconNames.${iconName}</field></block>`;
};

export const generateMakeCodeMainBlocksXml = (configs: OnGestureRecognisedConfig[]) => {
  const onStartPos = { x: 0, y: 0 };
  return `
    <xml xmlns="https://developers.google.com/blockly/xml">
      ${configs.map((c, idx) =>
        onGestureRecognisedBlock({
          x: onStartPos.x + 300,
          y: onStartPos.y + idx * 200,
          ...c,
        }),
      ).join(`
      `)}
    </xml>`;
};

const onGestureRecognisedBlock = ({ x, y, name, iconName }: OnGestureRecognisedBlock) => `
  <block type=\"mlrunner_on_ml_event\" x=\"${x}\" y=\"${y}\">
    <field name=\"this\">mlrunner.Action.${name}</field>
    <statement name="HANDLER">
      ${getShowIconBlock(iconName)}       
    </statement>
  </block>
`;

interface OnGestureRecognisedBlock extends OnGestureRecognisedConfig {
  x: number;
  y: number;
}

const createMlEvents = (actions: string[]) => {
  let code = '';
  actions.forEach((action, idx) => {
    code += `    //% fixedInstance\n`;
    code += `    export const ${action} = new MlEvent(${idx + 2}, "${action}");\n`;
  });
  return code;
};

const arrayBufferToHexString = (input: Uint8Array): string =>
  Array.from(input, i => i.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

const getModelHexString = (actionNames: string[]) => {
  const customHeaderBlob = generateBlob({
    samples_period: 25,
    samples_length: 80,
    sample_dimensions: 3,
    labels: actionNames,
  });
  const headerHexString = arrayBufferToHexString(new Uint8Array(customHeaderBlob));
  const m = get(model);
  const { machineCode } = compileModel(m, {});
  const modelHexString = arrayBufferToHexString(machineCode);
  return headerHexString + modelHexString;
};

export const generateCustomTs = (configs: OnGestureRecognisedConfig[]) => {
  const actions = configs.map(c => c.name);

  return `// Auto-generated. Do not edit.
  namespace mlrunner {
    export namespace Action {
  ${createMlEvents(actions)}
      actions = [None,${actions.toString()}];
    }
  }
  
  getModelBlob = (): Buffer =>  {
    const result = hex\`${getModelHexString(actions)}\`;
    return result;
  }
  
  mlrunner.simulatorSendData();
  
  // Auto-generated. Do not edit. Really.
  `;
};
