/*
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * PostCSS runs because vite.config.ts uses Vite's default CSS transformer
 * rather than lightningcss (which disables PostCSS). lightningcss is kept only
 * as the minifier.
 *
 * postcss-cascade-layers rewrites @layer blocks into equivalent unlayered
 * rules using :not(#\#) specificity bumps, so browsers without cascade-layer
 * support (Safari <15.4, and equivalents) still receive the library's styles
 * instead of falling back to unstyled UA defaults. Panda wraps ALL of its
 * output in @layer, so without this such browsers get essentially no styling.
 *
 * Vite runs this per CSS module. Panda's generated styled-system.css is
 * self-contained (it carries its own `@layer reset, base, ...` order
 * statement), so flattening it in isolation is correct. NOTE: this app also
 * declares a cross-file `vendor` layer for Swiper (src/layers.css +
 * Carousel/swiper.css via `@import ... layer(vendor)`); per-module processing
 * cannot see that interleave, so on non-supporting browsers Swiper's cascade
 * position relative to Panda's layers may be slightly off. That is an
 * acceptable style nit here (this app already floors at Safari 15.4 via
 * BroadcastChannel); a plain consuming app with no other @layer sources needs
 * only this config with no caveats.
 */
module.exports = {
  plugins: {
    "@csstools/postcss-cascade-layers": {},
  },
};
