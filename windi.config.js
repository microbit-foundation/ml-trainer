/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

//Ml-Machine colors

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
        serif: ['serif'],
      },
      colors: {
        brand: {
          // Produced with using the hue from the brand blue at 400 but adjusting 500
          // to be an acceptable button background color with white text at all sizes
          // (WCGA AA 4.5)
          // https://huetone.ardov.me/
          50: '#edf7ff',
          100: '#c1e1fb',
          200: '#94ccf6',
          300: '#62b3ed',
          // Brand colour, but too light for white
          400: '#2a94d6',
          // 4.5 contrast with white
          500: '#007dbc',
          600: '#0071aa',
          700: '#16567e',
          800: '#1d4662',
          900: '#023a5a',
        },
        primary: '#2a94d6',
        primarytext: '#000000',
        secondary: '#00a000',
        secondarytext: '#FFFFFF',
        info: '#98A2B3',
        backgrounddark: '#F5F5F5',
        backgroundlight: '#ffffff',
        infolight: '#93c5fd',
        link: '#6c4bc1',
        disabled: '#8892A3',
        primaryborder: '#E5E7EB',
        infobglight: '#E7E5E4',
        infobgdark: '#57534E',
        infoiconlight: '#FFFFFF7F',
        infoicondark: '#787878',
        infotextlight: '#ffffff',
        infotextdark: '#787878',
        ring: 'rgba(66, 153, 255, 0.6)',
        ringBright: 'rgb(66, 153, 255)',
      },

    },
  },
};
