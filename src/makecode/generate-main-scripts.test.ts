/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { Gesture } from "../gestures-hooks";
import { generateMainScript } from "./generate-main-scripts";

describe("test generateMainScripts", () => {
  it("generates xml blocks", () => {
    const expected = `<xml xmlns="https://developers.google.com/blockly/xml">
  
  <block type="ml_on_event_start" x="0" y="0">
    <field name="event">ml.event.Name</field>
    <statement name="HANDLER">
      <block type="basic_show_icon"><field name="i">IconNames.Heart</field></block>       
    </statement>
  </block>
  </xml>`;
    const gs: Gesture[] = [{ name: "name", icon: "Heart", ID: 12 }];
    expect(generateMainScript(gs, "blocks")).toEqual(expected);
  });

  it("generates js", () => {
    const expected =
      " ml.onStart(ml.event.Name, function () {basic.showIcon(IconNames.Heart)})";
    const gs: Gesture[] = [{ name: "name", icon: "Heart", ID: 12 }];
    expect(generateMainScript(gs, "javascript")).toContain(expected);
  });
});
