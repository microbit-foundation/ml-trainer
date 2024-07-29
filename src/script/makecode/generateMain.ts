import Gesture from '../domain/Gesture';
import { matrixImages } from '../utils/matrixImages';
import { getKeyByValue, varFromActionLabel } from './utils';

/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
interface OnGestureRecognisedConfig {
  name: string;
  iconName?: string;
  led?: boolean[];
}

const getIconNameOrLed = (m: boolean[]) => {
  const name = getKeyByValue(matrixImages, m);
  if (!name) {
    return { led: m };
  }
  return { iconName: name };
};

export const getMakeCodeGestureConfig = (gesture: Gesture) => ({
  name: gesture.getName(),
  ...getIconNameOrLed(gesture.getMatrix()),
});

const actionLabel = (name: string) => `mlrunner.Action.${varFromActionLabel(name)}`;
interface BlockPos {
  x: number;
  y: number;
}

const onMLEventBlock = (name: string, children: string, pos: BlockPos) => `
  <block type=\"mlrunner_on_ml_event\" x=\"${pos.x}\" y=\"${pos.y}\">
    <field name=\"this\">${actionLabel(name)}</field>
    <statement name="HANDLER">
      ${children}       
    </statement>
  </block>
`;

type Language = 'blocks' | 'javascript';

interface LanguageStatements {
  wrapper: (children: string) => string;
  showLeds: (ledPattern: string) => string;
  showIcon: (iconName: string) => string;
  clearDisplay: () => string;
  onMLEvent: (name: string, children: string, _pos: BlockPos) => string;
}

const statements: Record<Language, LanguageStatements> = {
  javascript: {
    wrapper: children => children,
    showLeds: ledPattern => `basic.showLeds(\`${ledPattern}\`)`,
    showIcon: iconName => `basic.showIcon(IconNames.${iconName})`,
    clearDisplay: () => 'basic.clearScreen()',
    onMLEvent: (name, children, _pos) => {
      return `${actionLabel(name)}.onEvent(function () {${children}})`;
    },
  },
  blocks: {
    wrapper: children =>
      `<xml xmlns="https://developers.google.com/blockly/xml">${children}</xml>`,
    showLeds: ledPattern =>
      `<block type="device_show_leds"><field name="LEDS">\`${ledPattern}\`</field></block>`,
    showIcon: iconName =>
      `<block type=\"basic_show_icon\"><field name=\"i\">IconNames.${iconName}</field></block>`,
    clearDisplay: () => `<block type="device_clear_display"></block>`,
    onMLEvent: onMLEventBlock,
  },
};

const onMLEventChildren = (
  s: LanguageStatements,
  { iconName, led }: OnGestureRecognisedConfig,
) => {
  if (iconName) {
    return s.showIcon(iconName);
  }
  if (led) {
    const ledPattern = led
      .map((b, idx) => {
        const isNewLine = (idx + 1) % 5 === 0;
        return `${b ? '#' : '.'}  ${isNewLine ? '\n' : ''}`;
      })
      .join(' ');
    return s.showLeds(ledPattern);
  }
  return '';
};

export const generateMakeCodeOutputMain = (gs: Gesture[], lang: Language) => {
  const configs = gs.map(g => getMakeCodeGestureConfig(g));
  const s = statements[lang];
  const initPos = { x: 0, y: 0 };
  return s.wrapper(`
  ${configs
    .map((c, idx) =>
      s.onMLEvent(c.name, onMLEventChildren(s, c), {
        x: initPos.x,
        y: initPos.y + idx * 350,
      }),
    )
    .join('\n')}  `);
};

// TODO: Used in OutputProgramMicrobitView. May not be needed anymore
export const generateMakeCodeOutputMainDep = (
  configs: OnGestureRecognisedConfig[],
  lang: Language,
) => {
  const s = statements[lang];
  const initPos = { x: 0, y: 0 };
  return s.wrapper(`
  ${configs
    .map((c, idx) =>
      s.onMLEvent(c.name, onMLEventChildren(s, c), {
        x: initPos.x + 300,
        y: initPos.y + idx * 200,
      }),
    )
    .join('\n')}  `);
};
