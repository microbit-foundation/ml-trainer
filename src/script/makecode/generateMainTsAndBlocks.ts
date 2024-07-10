/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { actionLabel } from './utils';
interface OnGestureRecognisedConfig {
  name: string;
  iconName: string;
}

// Generate main.ts

const onMLEvent = ({ name, iconName }: OnGestureRecognisedConfig) => `
mlrunner.Action.None.onEvent(function () {\n    basic.clearScreen()\n})
${actionLabel(name)}.onEvent(function () {
basic.showIcon(IconNames.${iconName})
})`;

export const generateMakeCodeMainTs = (configs: OnGestureRecognisedConfig[]) => {
  return `${configs.map(onMLEvent).join(`\n    `)}`;
};

// Generate main.blocks

export const generateMakeCodeMainBlocksXml = (configs: OnGestureRecognisedConfig[]) => {
  const initPos = { x: 0, y: 0 };
  return `
  <xml xmlns="https://developers.google.com/blockly/xml">
    ${onMLEventBlock({
      ...initPos,
      name: 'None',
      statementBlock: '<block type="device_clear_display"></block>',
    })}
    ${configs
      .map(({ name, iconName }, idx) =>
        onMLEventBlock({
          x: initPos.x + 300,
          y: initPos.y + idx * 200,
          name,
          statementBlock: getShowIconBlock(iconName),
        }),
      )
      .join('\n')}
  </xml>`;
};

const getShowIconBlock = (iconName: string) => {
  return `<block type=\"basic_show_icon\"><field name=\"i\">IconNames.${iconName}</field></block>`;
};

interface OnMLEventBlock {
  name: string;
  x: number;
  y: number;
  statementBlock: string;
}

const onMLEventBlock = ({ x, y, name, statementBlock }: OnMLEventBlock) => `
  <block type=\"mlrunner_on_ml_event\" x=\"${x}\" y=\"${y}\">
    <field name=\"this\">${actionLabel(name)}</field>
    <statement name="HANDLER">
      ${statementBlock}       
    </statement>
  </block>
`;
