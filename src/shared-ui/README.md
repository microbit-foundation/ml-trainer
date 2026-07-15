# shared-ui

react-aria-components + Panda CSS primitives replacing Chakra UI, designed for
extraction into a library shared across the micro:bit Foundation's sibling
apps. Visuals match the Chakra v2 theme; behaviour follows react-aria
patterns. See RAC-MIGRATION.md for the migration history, conventions and
hard-won gotchas (start with "Styles must be literals").

## App-side installation

Everything an app must set up to consume shared-ui:

1. **Panda preset stack** (`panda.config.ts`): `@pandacss/preset-base`, then
   the shared-ui core preset, then the micro:bit foundation preset, then the
   app preset, then an optional private brand preset. Later presets override
   earlier ones token-by-token. After changing an _external_ preset
   dependency, regenerate clean: `rm -rf styled-system src/styled-system.css
&& npm run panda`.
2. **Cascade layers** (`src/layers.css`): declares the document-wide layer
   order, including the `vendor` layer for third-party stylesheets — import
   any vendor CSS with `@import "..." layer(vendor)` so it beats the
   preflight but loses to app styling.
3. **`SharedUIProvider`** above any shared-ui usage: supplies the localized
   strings shared-ui needs internally (via the app's own i18n pipeline —
   shared-ui has no react-intl dependency) and, optionally, an overlay-close
   registrar so the app can dismiss open menus from outside the tree (e.g.
   the Android hardware back button). Re-renders with new strings on locale
   change.
4. **`ToastProvider`** once near the root, inside `SharedUIProvider`.

## The CSS-variable contract

Panda emits every token as a CSS custom property with its default naming —
`{category}-{path}` with dots become dashes, camelCase becomes kebab-case:

- `colors.brand.500` → `var(--colors-brand-500)`
- `colors.statusBarBg` → `var(--colors-status-bar-bg)`
- `fonts.display` → `var(--fonts-display)`

These names are **API** for styling that lives outside React/Panda — e.g.
CodeMirror highlight styles or xterm themes written as raw CSS. Two rules
keep them stable:

- Never set `hashing` or `prefix` in `panda.config.ts`.
- Brand/app presets may change token _values_, never token _names_.

Semantic tokens (`languageText`, `statusBarBg`, `danger.*`, `toast*Bg`,
`controlCheckedBg`, `focusBorder`, …) are the extension points brand presets
override; they resolve through var indirection, so overrides apply wherever
the token is consumed.

## Runtime token lookups

For values that feed _computation_ rather than stylesheets (canvas painting,
colour math, inline `style` for data-driven values — see gotcha #9 in
RAC-MIGRATION.md), import the runtime lookup:

```ts
import { token } from "../shared-ui"; // re-exports styled-system/tokens

token("colors.brand.500"); // "#007dbc" — raw value, safe for colour math
token("colors.statusBarBg"); // "var(--colors-brand2-500)" — CSS contexts only
```

Base tokens resolve to raw values; **semantic tokens resolve to `var()`
references**, which are only meaningful where the browser interprets CSS.
For computation, look up the base token the semantic one points at, or read
the computed style. `token.var("colors.x.y")` returns the variable reference
form explicitly.

## Strings

Components never hardcode user-facing text. The few strings shared-ui needs
internally (close-button labels, toast status announcements) come from
`SharedUIProvider`'s `strings`; everything else is passed in by the caller as
already-localized content.
