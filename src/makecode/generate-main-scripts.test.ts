/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { Action } from "../model";
import { getMainScript } from "./generate-main-scripts";

describe("test generateMainScripts", () => {
  it("generates xml blocks", () => {
    const expected = `<xml xmlns="https://developers.google.com/blockly/xml"><variables></variables>
  <block type="ml_on_event_start" x="0" y="0">
    <field name="event">ml.event.Name</field>
    <statement name="HANDLER">
      <block type="basic_show_icon"><field name="i">IconNames.Heart</field></block>       
    </statement>
  </block>
</xml>`;
    const actions: Action[] = [{ name: "name", icon: "Heart", ID: 12 }];
    expect(getMainScript(actions, "blocks")).toEqual(expected);
  });

  it("generates js", () => {
    const expected =
      "ml.onStart(ml.event.Name, function () {basic.showIcon(IconNames.Heart)})";
    const actions: Action[] = [{ name: "name", icon: "Heart", ID: 12 }];
    expect(getMainScript(actions, "javascript")).toContain(expected);
  });
});
