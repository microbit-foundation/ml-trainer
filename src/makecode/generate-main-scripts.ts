import { Gesture } from "../model";
import { actionNamesFromLabels } from "./utils";
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
  <block type="ml_on_event_start" x="${pos.x}" y="${pos.y}">
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
    wrapper: (children) => children + "\n",
    showLeds: (ledPattern) => `basic.showLeds(\`${ledPattern}\`)`,
    showIcon: (iconName) => `basic.showIcon(IconNames.${iconName})`,
    clearDisplay: () => "basic.clearScreen()",
    onMLEvent: (name, children) => {
      return `ml.onStart(ml.event.${name}, function () {${children}})`;
    },
  },
  blocks: {
    wrapper: (children) =>
      `<xml xmlns="https://developers.google.com/blockly/xml"><variables></variables>${children}</xml>`,
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
  return iconName ? s.showIcon(iconName) : "";
};

export const getMainScript = (gs: Gesture[], lang: Language) => {
  const actionNames = actionNamesFromLabels(gs.map((g) => g.name));
  const configs = gs.map((g, idx) => ({
    id: g.ID,
    name: actionNames[idx].actionVar,
    iconName: g.icon,
  }));
  const s = statements[lang];
  const initPos = { x: 0, y: 0 };
  return s.wrapper(
    configs
      .map((c, idx) =>
        s.onMLEvent(c.name, onMLEventChildren(s, c), {
          x: initPos.x,
          y: initPos.y + idx * 180,
        })
      )
      .join("\n")
  );
};
