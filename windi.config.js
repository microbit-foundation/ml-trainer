/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

//Ml-Machine colors
// @ts-check - enable TS check for js file
import { defineConfig } from 'windicss/helpers';

export default defineConfig({
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
        serif: ['serif'],
      },
      colors: {
        primary: '#2c92d6',
        primarytext: '#000000',
        secondary: '#00a000',
        secondarytext: '#FFFFFF',
        info: '#98A2B3',
        backgrounddark: '#F5F5F5',
        backgroundlight: '#ffffff',
        infolight: '#93c5fd',
        link: '#6c4bc1',
        warning: '#cd0365',
        disabled: '#8892A3',
        primaryborder: '#E5E7EB',
        infobglight: '#E7E5E4',
        infobgdark: '#57534E',
        infoiconlight: '#FFFFFF7F',
        infoicondark: '#787878',
        infotextlight: '#ffffff',
        infotextdark: '#787878',
      },
    },
  },
});
