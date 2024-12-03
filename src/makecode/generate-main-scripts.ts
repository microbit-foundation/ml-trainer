import { Action } from "../model";
import { actionNamesFromLabels } from "./utils";
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export interface OnActionRecognisedConfig {
  name: string;
  iconName: string;
}

interface BlockPos {
  x: number;
  y: number;
}

const onMLEventBlock = (name: string, children: string, pos: BlockPos) => {
  let code = "";
  code += `<block type="ml_on_event_start" x="${pos.x}" y="${pos.y}">`;
  code += `<field name="event">ml.event.${name}</field>`;
  code += '<statement name="HANDLER">';
  code += children;
  code += "</statement>";
  code += "</block>";
  return code;
};

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
    showIcon: (iconName) => `\n    basic.showIcon(IconNames.${iconName})\n`,
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
  { iconName }: OnActionRecognisedConfig
) => {
  return iconName ? s.showIcon(iconName) : "";
};

export const getMainScript = (actions: Action[], lang: Language) => {
  const actionNames = actionNamesFromLabels(actions.map((a) => a.name));
  const configs = actions.map((g, idx) => ({
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
      .join(lang === "javascript" ? "\n" : "")
  );
};
