import { Gesture } from "../gestures-hooks";
import { actionNamesFromLabels } from "./utils";
import upperFirst from "lodash.upperfirst";
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export interface OnGestureRecognisedConfig {
  name: string;
  iconName: string;
}

interface BlockPos {
  x: number;
  y: number;
}

const onMLEventBlock = (name: string, children: string, pos: BlockPos) => `
  <block type="mlrunner_on_ml_event" x="${pos.x}" y="${pos.y}">
    <field name="event">ml.event.${name}</field>
    <statement name="HANDLER">
      ${children}       
    </statement>
  </block>
`;

type Language = "blocks" | "javascript";

interface LanguageStatements {
  wrapper: (children: string) => string;
  showLeds: (ledPattern: string) => string;
  showIcon: (iconName: string) => string;
  clearDisplay: () => string;
  onMLEvent: (name: string, children: string, _pos: BlockPos) => string;
}

const statements: Record<Language, LanguageStatements> = {
  javascript: {
    wrapper: (children) => children,
    showLeds: (ledPattern) => `basic.showLeds(\`${ledPattern}\`)`,
    showIcon: (iconName) => `basic.showIcon(IconNames.${iconName})`,
    clearDisplay: () => "basic.clearScreen()",
    onMLEvent: (name, children) => {
      return `ml.onStart(ml.event.${name}, function () {${children}})`;
    },
  },
  blocks: {
    wrapper: (children) =>
      `<xml xmlns="https://developers.google.com/blockly/xml">${children}</xml>`,
    showLeds: (ledPattern) =>
      `<block type="device_show_leds"><field name="LEDS">\`${ledPattern}\`</field></block>`,
    showIcon: (iconName) =>
      `<block type="basic_show_icon"><field name="i">IconNames.${iconName}</field></block>`,
    clearDisplay: () => `<block type="device_clear_display"></block>`,
    onMLEvent: onMLEventBlock,
  },
};

const onMLEventChildren = (
  s: LanguageStatements,
  { iconName }: OnGestureRecognisedConfig
) => {
  if (iconName) {
    return s.showIcon(iconName);
  }
  return "";
};

const getMakeCodeGestureConfigs = (gs: Gesture[]) => {
  const actionNames = actionNamesFromLabels(gs.map((g) => g.name));
  return gs.map((g, idx) => ({
    name: actionNames[idx].actionVar,
    iconName: upperFirst(g.icon),
  }));
};

export const generateMainScript = (gs: Gesture[], lang: Language) => {
  const configs = getMakeCodeGestureConfigs(gs);
  const s = statements[lang];
  const initPos = { x: 0, y: 0 };
  return s.wrapper(`
  ${configs
    .map((c, idx) =>
      s.onMLEvent(c.name, onMLEventChildren(s, c), {
        x: initPos.x,
        y: initPos.y + idx * 350,
      })
    )
    .join("\n")}  `);
};
