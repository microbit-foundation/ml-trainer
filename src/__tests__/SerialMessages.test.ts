/**
 * @jest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { parseMessage } from "../script/microbit-interfacing/SerialMessages";

describe('parseMessage', () => {
    it('parses a serial message and converts it into a MicrobitState object', () => {
        const message = 'P[1A]AX[-408]AY[748]AZ[-1288]BA[0]BB[1]BL[0]';

        const parsedMessage = parseMessage(message);

        expect(parsedMessage).toEqual({
            X: -408,
            Y: 748,
            Z: -1288,
            ButtonA: false,
            ButtonB: true,
            ButtonLogo: false,
        });
    });
});

