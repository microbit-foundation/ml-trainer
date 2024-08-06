import Gesture from '../domain/Gesture';
import { matrixImages } from '../utils/matrixImages';
import { ActionName, actionNamesFromLabels, getKeyByValue } from './utils';

/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export interface OnGestureRecognisedConfig {
  name: string;
  iconName?: string;
  led?: boolean[];
}

export const getIconNameOrLed = (m: boolean[]) => {
  const name = getKeyByValue(matrixImages, m);
  if (!name) {
    return { led: m };
  }
  return { iconName: name };
};

export const getMakeCodeGestureConfig = (
  gestureId: number,
  actionVar: string,
  ledMatrix: boolean[],
) => ({
  gestureId,
  name: actionVar,
  ...getIconNameOrLed(ledMatrix),
});

interface BlockPos {
  x: number;
  y: number;
}

const onMLEventBlock = (name: string, children: string, pos: BlockPos) => `
  <block type=\"mlrunner_on_ml_event\" x=\"${pos.x}\" y=\"${pos.y}\">
    <field name=\"event\">ml.event.${name}</field>
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
      return `ml.onStart(ml.event.${name}, function () {${children}})`;
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

export const generateMakeCodeOutputMain = (
  gs: Gesture[],
  lang: Language,
  gestureIdRender?: number,
) => {
  const actionNames = actionNamesFromLabels(gs.map(g => g.getName()));
  const configs = gs
    .map((g, idx) =>
      getMakeCodeGestureConfig(g.getId(), actionNames[idx].actionVar, g.getMatrix()),
    )
    .filter(c => (gestureIdRender ? c.gestureId === gestureIdRender : false));

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
