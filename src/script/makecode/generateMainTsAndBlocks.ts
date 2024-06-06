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
    ${configs
      .map((c, idx) =>
        onMLEventBlock({
          x: initPos.x + 300,
          y: initPos.y + idx * 200,
          ...c,
        }),
      )
      .join('\n')}
  </xml>`;
};

const getShowIconBlock = (iconName: string) => {
  return `<block type=\"basic_show_icon\"><field name=\"i\">IconNames.${iconName}</field></block>`;
};

interface OnGestureRecognisedBlock extends OnGestureRecognisedConfig {
  x: number;
  y: number;
}

const onMLEventBlock = ({ x, y, name, iconName }: OnGestureRecognisedBlock) => `
  <block type=\"mlrunner_on_ml_event\" x=\"${x}\" y=\"${y}\">
    <field name=\"this\">${actionLabel(name)}</field>
    <statement name="HANDLER">
      ${getShowIconBlock(iconName)}       
    </statement>
  </block>
`;
