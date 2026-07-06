# Chakra → react-aria-components + Panda CSS migration

Status: **foundation + first screen (LanguageDialog) done and verified.** This
doc is the handover for continuing the migration in a new session.

## Goal

Replace Chakra UI with **react-aria-components (RAC)** for behaviour/accessibility
and **Panda CSS** for styling, building reusable primitives in `src/shared-ui/`
(intended for later extraction into a library shared across sibling apps). The
**visual result must match the current Chakra UI closely** (colours, spacing,
radii, shadows, type). Interaction details have some wiggle room; the look does
not. The OSS-vs-private brand split must be preserved.

Compare against the live branded deployment (https://createai.microbit.org/) —
the OSS default theme is a washed-out grey and hides real issues.

## Architecture

### Styling: Panda, build-time, no PostCSS
Chakra swaps a runtime theme via `ChakraProvider`; Panda generates CSS at build
time from `panda.config.ts`. Vite uses the LightningCSS transformer (PostCSS
disabled), so Panda runs via its **CLI**, not the PostCSS plugin:
- `npm run panda` → `panda codegen` (generates `styled-system/`) + `panda cssgen`
  (writes `src/styled-system.css`) + `bin/unlayer-panda.mjs` (see coexistence).
- `npm run panda:watch` → `bin/panda-dev.mjs` (watch + unlayer on each rebuild).
- Wired into `build`, `predev`, `postinstall`. `styled-system/` and
  `src/styled-system.css` are generated and git-ignored.
- `main.tsx` imports `./styled-system.css`. `styled-system/*` is aliased in both
  `tsconfig.json` (paths) and `vite.config.ts`.

### Tokens & the OSS/private preset split
- `bin/gen-chakra-tokens.mjs` snapshots the **exact** Chakra v2 default token
  scales from `@chakra-ui/theme` into `src/deployment/default/chakra-tokens.ts`
  (committed, generated — do not hand-edit; ignored by lint). This decouples the
  preset from Chakra for eventual removal.
- `src/deployment/default/panda-preset.ts` = **OSS preset**: the Chakra token
  set + this app's overrides (`gray` 10/25/500/600, `brand`→Chakra blue,
  `brand2`→Chakra gray, `radii.button` 2rem, `outline`/`outlineDark`/
  `outlineLight` shadows, Helvetica fonts, `display` font token), the recipes,
  and the RAC condition widening (below).
- `src/deployment/default/panda-recipes.ts` = config recipes: `button` (11
  variants), `heading` (+ `marketing` variant), `dialog` (slot recipe, incl.
  `full` size with safe-area/gradient).
- **Private preset**: `../ml-trainer-microbit/src/panda-preset.ts` (plain object,
  no `@pandacss/dev` dep) overrides the brand colour ramps
  (`brand`/`brand2`/`purple`/`teal`/`blue`/`pink`/`orange`) and the `display`
  font (GT Walsheim). Exported via the package's `./panda-preset` entry.
- `panda.config.ts` merges them: `presets: ["@pandacss/preset-base", ossPreset,
  brandPreset?]` with `eject: true` (drops Panda's default theme; keeps base
  utilities). `brandPreset` is resolved with `require(...)` guarded by try/catch
  — the build-time equivalent of the `theme-package` vite alias swap.

### shared-ui (`src/shared-ui/`)
`Button`, `Text`, `Heading`, `Link`, `Icon`, `CloseIcon`, `List`/`ListItem`,
`IconButton`, `Modal` (+ `ModalHeader`/`Body`/`Footer`), `Menu`
(`MenuTrigger`/`MenuList`/`MenuItem`/`MenuDivider`), `Tooltip`, `Toast`
(+ `ToastProvider`,
`useToast`), `useBreakpointValue`, and `system.ts` (re-exports Panda `css`/`cva`/
`sva`/`cx`/`token` + jsx patterns `Box`/`Flex`/`Stack`/`HStack`/`VStack`/`Grid`/
`GridItem`/`Center`/`Wrap`/`styled`). Layout uses Panda patterns directly
(Panda-native idiom); responsive props use object syntax `{ base, md }`.

## Hard-won patterns / gotchas (READ before continuing)

1. **CSS layer conflict (the big one).** Chakra/Emotion inject *unlayered* CSS;
   Panda emits into `@layer`, and unlayered CSS always beats layered regardless
   of specificity — so Chakra's reset `:where(*){border-width:0}` silently kills
   Panda component borders/padding. Fix: `bin/unlayer-panda.mjs` strips the
   `@layer` wrappers from the generated CSS during coexistence. **Temporary** —
   remove and set `preflight: true` once Chakra is gone.
2. **RAC interaction states.** The preset widens Panda's `hover`/`active`/
   `focusVisible`/`disabled` conditions to also match RAC's `data-*` attributes,
   so Chakra-shaped `_hover`/`_active` style objects work unchanged on RAC.
3. **`staticCss` for recipe variants.** shared-ui forwards `variant`/`size` as
   runtime props, so Panda's static analysis can't see which variants are used.
   `panda.config.ts` `staticCss` generates all recipe variants; the `dialog`
   size uses `responsive: true` because it's chosen via `{ base, md }` objects.
4. **Responsive recipe variants must be symmetric.** Panda applies the
   base-breakpoint variant's CSS unconditionally; if `full` sets more props than
   `4xl`, they leak into desktop. Every non-full dialog size restates the box
   props (`dialogBox`) so the larger breakpoint fully overrides `full`.
5. **`brand2` = Chakra's *unmodified* gray** in OSS (not the locally overridden
   `gray` whose 500 is the light brand grey). Getting this wrong made card text
   near-invisible.
6. **OSS vs private divergence → semantic tokens.** The only structural button
   difference is the `language` variant (OSS grey `brand2`, private blue `brand`).
   Driven by semantic tokens `languageText`/`languageTextHover` overridden in the
   private preset — keeps the recipe shared. The `marketing` heading font is the
   same idea via the `display` font token. **TODO:** do a full diff of the
   private Chakra theme vs OSS default and token-drive any other divergences.
7. **Icons inherit `currentColor`.** Don't pass `fill` to react-icons (it
   overrides their default `fill="currentColor"` → black). `Icon`/`CloseIcon` set
   `fill: currentColor` in CSS.
8. **Atomic overrides.** Panda longhand beats shorthand across separate `css()`
   calls (and utilities beat recipes only via source order). To override, merge
   into a *single* `css()` call (see `Tooltip`) or use matching longhands.
9. **Styles must be literals at the JSX/`css()` site.** Panda's static extractor
   only reads `css` prop object literals and `css()` call literals where they
   appear — it does *not* follow an object returned from a helper function. A
   helper like `const fooCss = () => ({ h: 12, ... })` used as `css={fooCss()}`
   silently generates *no* CSS for those tokens (unless the same class happens to
   be emitted elsewhere), and it fails quietly — no error, just missing styles,
   so you only catch it by measuring. To share trigger/element styling, wrap it
   in a **component** with an inline `css` literal (see `ActionBarMenuButton`),
   not a style-object helper. Prefer recipe variants (e.g. `size="lg"`) for
   dimensions over utility overrides — variants are generated via `staticCss` and
   don't depend on call-site extraction. This bit the action-bar menu triggers:
   the button silently fell back to `size:md` (40px), shrinking the focus ring.

## How to run / verify

- **Branded build locally**: build the sibling `ml-trainer-microbit` package
  (`npm run build` there → produces `dist/panda-preset.js`) and make it
  resolvable from `node_modules/@microbit-foundation/ml-trainer-microbit`
  (e.g. `npm link`). With it present, vite's `theme-package` alias and
  `panda.config.ts` both resolve CreateAI branding; without it you get the OSS
  default. (Currently a local symlink — see "Private preset consumption".)
- **After changing the private preset (or (re)linking it), do a *clean* Panda
  regen**: `rm -rf styled-system src/styled-system.css && npm run panda` (or
  `panda codegen --clean`). Incremental `panda codegen` does not detect changes
  in an *external* preset dependency, so it keeps stale (OSS) token values even
  though the config loads the new preset — the brand colours silently stay OSS
  (e.g. `brand2.500` grey `#718096` instead of green `#00a000`, `brand.500`
  `#3182ce` instead of `#007dbc`). A fresh checkout is unaffected (empty
  `styled-system/` → full gen). Vite's `theme-package` alias resolves at
  dev-server start, so also restart the dev server after (re)linking.
- `npm run build` then `npm run preview` → http://localhost:4173, then compare
  against the live deployment (see Goal).
- Chakra v2 is the parity source of truth for stock component styles
  (Button/Modal/Alert/CloseButton bases) — check `@chakra-ui/theme` and
  `@chakra-ui/components` in node_modules (or the Chakra v2 repo).
- `npm test`, `npm run test:e2e:headless`, `npm run typecheck`, `npm run lint`
  all green at this checkpoint.

## Coexistence shims to remove once Chakra is gone
- `bin/unlayer-panda.mjs` + `bin/panda-dev.mjs`; set Panda `preflight: true`.
- The Emotion `exclude` list in `panda.config.ts` (files still using Emotion
  `css`/`keyframes` that trip Panda's extractor).
- `BrandConfig.chakraTheme` and `<ChakraProvider>` in `App.tsx`.
- Chakra/Emotion/framer-motion deps.

## Known issues / decisions deferred
- **Toast** uses RAC's `UNSTABLE_Toast*` API (functional; behind `Toast.tsx`).
- **HomePage** is a composition root (`DefaultPageLayout`/`CarouselRow`/cards) —
  not a contained screen; migrate bottom-up.
- **Private preset consumption** is a local symlink — needs a real story
  (publish the `panda-preset` export, or a documented `npm link`/`file:` dep)
  before the team/CI can build the branded app.

## Next steps (recommended order)
1. ✅ **Settings + Help `Menu` → RAC** — done. shared-ui `Menu` (`MenuTrigger`/
   `MenuList`/`MenuItem`/`MenuDivider`) built on RAC, plus a shared-ui
   `IconButton` (square, `px:0`, `isRound`) for the action-bar triggers (see
   `ActionBar/action-bar-menu-button.ts` for the shared white/round/focus css).
   `SettingsMenu`/`LanguageMenuItem`/`SettingsMenuItem` and `HelpMenu`/
   `HelpMenuItems` migrated; link items use RAC `MenuItem` `href`/`target`/`rel`,
   actions use `onAction`. LanguageDialog focus hack removed (RAC restores focus
   to the trigger on close — verified). Remaining Chakra menus (`DataSamplesMenu`,
   `ToolbarMenu`, `MoreMenuButton`, `ProjectCardActions`, `TestingModelPage`)
   still use the old `components/Menu.tsx` back-button wrapper; port them onto
   shared-ui `MenuTrigger` next, then delete `components/Menu.tsx`.
2. **App shell**: `DefaultPageLayout`, `ActionBar`, `NavigationDrawer` (Drawer) —
   unblocks all pages.
3. **Self-contained dialogs**: `ConfirmDialog` (AlertDialog), `NameProjectDialog`
   (forms) — exercises patterns HomePage needs. Add `ModalCloseButton` (uses
   `CloseIcon`), `IconButton`, form controls, `Spinner`, `VisuallyHidden` on
   demand.
4. **Pages**: HomePage, then DataSamplesPage, etc.
5. **Brand-diff** (see gotcha #6) — catalogue all OSS/private theme divergences
   and token-drive them up front.
6. **Fidelity harness**: a Playwright visual-regression pass (Chakra build vs
   Panda build) or a component gallery, to replace the manual screenshot loop.

## Key files
- `panda.config.ts`, `bin/gen-chakra-tokens.mjs`, `bin/unlayer-panda.mjs`,
  `bin/panda-dev.mjs`
- `src/deployment/default/{panda-preset,panda-recipes,chakra-tokens}.ts`
  (`panda-recipes.ts` holds the `menu` slot recipe + `plain` button variant)
- `src/shared-ui/**` (incl. `Menu.tsx`)
- `src/components/LanguageDialog.tsx`, `src/components/ModalFooterContent.tsx`,
  `src/components/{SettingsMenu,LanguageMenuItem,SettingsMenuItem}.tsx`,
  `src/components/{HelpMenu,HelpMenuItems}.tsx`,
  `src/components/ActionBar/action-bar-menu-button.ts` (migrated);
  `src/App.tsx` (`ToastProvider` mounted, `ChakraProvider` retained)
- Private: `../ml-trainer-microbit/src/panda-preset.ts`, its `package.json`
  (`./panda-preset` export)
