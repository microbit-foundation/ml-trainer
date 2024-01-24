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
          50: '#d4eaf7', // 80% tint
          100: '#95caeb', // 50% tint
          200: '#6ab4e2', // 30% tint
          300: '#55a9de', // 20% tint
          400: '#3f9fda', // 10% tint
          // Brand color
          500: '#2a94d6',
          600: '#2685c1', // 10% shade
          700: '#2276ab', // 20% shade
          800: '#1d6896', // 30% shade
          900: '#154a6b', // 50% shade
          //950: '#081e2b', // 80% shade, too dark
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
