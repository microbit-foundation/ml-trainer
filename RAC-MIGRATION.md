# Chakra → react-aria-components + Panda CSS migration

Status: **all pages, menus, the app shell and every dialog are ported.**
Remaining: the brand-diff audit, a tail of leaf/animation components, Tour,
BluetoothPatternInput, the fidelity harness, then the Chakra kill-switch —
see "Remaining work" for the agreed order. This doc is the handover for
continuing in a new session; per-chunk history lives in git.

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
  (writes `src/styled-system.css`) + `bin/unlayer-panda.mjs` (see gotcha #1).
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
  and the RAC condition widening (gotcha #2).
- `src/shared-ui/*.recipe.ts` = config recipes colocated with their components
  (`button`, `heading`, `input`, and the slot recipes `dialog`, `drawer`,
  `menu`, `card`, `checkbox`, `field`, `slider`, `switchRecipe`).
  **Convention**: new shared-ui config recipes go in `<Component>.recipe.ts`
  next to the component (named after the component, e.g. `Modal.recipe.ts`
  exports `dialog`) and must be registered in the OSS preset's
  `recipes`/`slotRecipes` to take effect. These files are build-time only
  (imported by the preset, run during Panda codegen) — components consume the
  generated `styled-system/recipes` output, never the `.recipe.ts` file, and
  recipe files must not import app code. Use config recipes for shared-ui
  primitives (preset-extensible, `recipes` layer is overridable by call-site
  style props); use colocated `cva`/`sva` for one-off feature-component styling.
- **Private preset**: `../ml-trainer-microbit/src/panda-preset.ts` (plain object,
  no `@pandacss/dev` dep) overrides the brand colour ramps
  (`brand`/`brand2`/`purple`/`teal`/`blue`/`pink`/`orange`) and the `display`
  font (GT Walsheim). Exported via the package's `./panda-preset` entry.
- `panda.config.ts` merges them: `presets: ["@pandacss/preset-base", ossPreset,
  brandPreset?]` with `eject: true` (drops Panda's default theme; keeps base
  utilities). `brandPreset` is resolved with `require(...)` guarded by try/catch
  — the build-time equivalent of the `theme-package` vite alias swap.

### shared-ui (`src/shared-ui/`)
See `index.ts` for the full export list. Highlights: `Button` (+`ButtonGroup`,
`IconButton`, `LinkOverlayButton`), `Modal` (+ header/body/footer/close-button
slots), `Drawer`, `Menu`, `Tooltip`, `Toast` (+`ToastProvider`/`useToast`),
form primitives (`TextField`, `Input`, `InputGroup`, `NativeSelect`,
`Checkbox`, `Switch`, `Slider`), `ProgressBar`, `Spinner`, `Card`,
`LinkBox`/`LinkOverlay`, typography (`Text`/`Heading`/`Link`), `Icon`/
`CloseIcon`/`CloseButton`, `Divider`, `List`, `Image`, `useBreakpointValue`,
and `system.ts` (re-exports Panda `css`/`cva`/`sva`/`cx`/`token` + jsx patterns
`Box`/`Flex`/`Stack`/`HStack`/`VStack`/`Grid`/`GridItem`/`Center`/`Wrap`/
`styled`). Layout uses Panda patterns directly (Panda-native idiom); responsive
props use object syntax `{ base, md }`.

Conventions: shared-ui components take a `css` prop / recipe variants;
call-site `css()` is for page layout and true one-offs only. A shared-ui
primitive that accepts style overrides must merge them into a *single*
`css(base, cssProp)` call (gotcha #8).

## Hard-won patterns / gotchas (READ before continuing)

1. **CSS layer conflict (the big one).** Chakra/Emotion inject *unlayered* CSS;
   Panda emits into `@layer`, and unlayered CSS always beats layered regardless
   of specificity — so Chakra's reset `:where(*){border-width:0}` silently kills
   Panda component borders/padding. Fix: `bin/unlayer-panda.mjs` strips the
   `@layer` wrappers from the generated CSS during coexistence. **Temporary** —
   remove and set `preflight: true` once Chakra is gone (kill-switch).
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
   same idea via the `display` font token. The full audit is "Remaining work" #1.
7. **Icons inherit `currentColor`.** Don't pass `fill` to react-icons (it
   overrides their default `fill="currentColor"` → black). `Icon`/`CloseIcon` set
   `fill: currentColor` in CSS.
8. **Atomic overrides: same-property conflicts across separate `css()` calls
   race on stylesheet order** — cx'ing a base class with an override class does
   NOT mean the override wins; the winner is whichever atomic rule happens to be
   emitted later (this silently shrank LoadingOverlay's 166px spinner to 24px
   and turned progress-bar fills Chakra-blue). Merge base + overrides into a
   *single* `css(base, cssProp)` call so conflicts resolve at merge time (see
   `Tooltip`/`Spinner`/`ProgressBar`). Related: longhand beats shorthand across
   calls; and a border shorthand plus separate `borderColor` in one object is
   order-dependent (`border-top: 3px solid` implies currentColor) — use
   width/style longhands with `borderColor`.
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
   don't depend on call-site extraction. The same applies to **computed prop
   values** (`rowSpan={n + 1}`, `` w={`${x}px`} ``, `` w={`calc(...)`} ``): no
   CSS is generated, and it can even *look* fine if another call site happens to
   emit the identical class. Use an inline `style` (with a runtime `token()`
   lookup for token values — see RecordingDialog's countdown), and after porting
   a file, grep it for style props whose value is not a literal. What *does*
   work: same-file consts, ternaries of literals, literal arithmetic
   (`ratio={30 / 25}`), and custom-named object-literal JSX props (`barCss`,
   `contentCss` — sentinel-verified; coincidental classes from other call sites
   can mask a miss, so verify against the generated CSS, not the rendered page).
10. **Removing Emotion from a file isn't enough — also remove it from
    `panda.config.ts`'s `exclude` list**, or Panda silently skips extraction for
    the whole file — class names are applied but no CSS rules exist for them
    (found when a hint svg rendered at 0x0: `w_16 h_16` in the class attribute,
    no matching rules in styled-system.css).
11. **Panda's `AspectRatio` pattern positions its child via a `&>*` selector
    that a still-Chakra child's own `position` style beats** (Emotion injects
    later at equal specificity; Chakra's own AspectRatio used a
    higher-specificity `& > *:not(style)`). Symptom: the ::before padding
    spacer stacks above an in-flow child (was a big gap over SettingsDialog's
    graph preview). Use the native `aspectRatio` css property instead when the
    child is still Chakra-styled — arguably the better permanent form anyway;
    the pattern's padding hack predates browser `aspect-ratio` support.
12. **RAC popovers unmount on close** (Chakra kept the list mounted), so a
    hidden file input must live *outside* a menu or its change event is dropped
    mid-pick — `DataSamplesMenu` renders `LoadProjectInput` as a sibling and
    the item calls `chooseFile` via ref.
13. **RAC popovers have `role="dialog"`** (menus included, and they linger
    briefly with `data-exiting` while animating out), so a bare Playwright
    `getByRole("dialog")` can hit strict-mode ambiguity when a dialog opens
    from a menu. e2e page objects use the `modalDialog()` helper
    (`src/e2e/app/shared.ts`), which scopes to `<section>` — both Chakra and
    shared-ui modals render on a section; popovers are divs.
14. **react-aria's focus defaults replace Chakra-era hacks — don't port them.**
    RAC focuses the dialog element itself on open (verified:
    `section.dialog__inner` is the active element), so initial-focus
    workarounds like SettingsDialog's focus-the-heading (stopping the first
    `<select>` opening its picker on mobile) were dropped, and LanguageDialog's
    restore-focus hack too (RAC restores focus to the trigger on close). Also:
    react-aria's usePress cancels presses outside the button's bounding rect,
    so Chakra's LinkOverlay-over-Button pattern needs a plain `<button>` +
    `position: static` — encapsulated with rationale in `LinkOverlayButton`.

## How to run / verify

- **Branded build locally**: build the sibling `ml-trainer-microbit` package
  (`npm run build` there → produces `dist/panda-preset.js`) and make it
  resolvable from `node_modules/@microbit-foundation/ml-trainer-microbit`
  (e.g. `npm link`). With it present, vite's `theme-package` alias and
  `panda.config.ts` both resolve CreateAI branding; without it you get the OSS
  default. (Currently a local symlink — see "Remaining work" #9.)
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

### Visual comparison workflow (what has worked well)

Each ported screen is verified by driving the **local branded preview**
(`npm run build && npm run preview` → :4173) and the **live Chakra deployment**
through an *identical* scripted flow with headless Playwright, then eyeballing
the screenshot pairs. Throwaway scripts, parameterised on
`(baseUrl, outPrefix)` so the same file captures both sides:

```js
import { createRequire } from "node:module";
const require = createRequire("<repo>/package.json"); // resolves @playwright/test
const { chromium } = require("@playwright/test");
const [url, outPrefix] = process.argv.slice(2);
const page = await (await chromium.launch()).newPage({
  viewport: { width: 1324, height: 745 }, // plus 900/390 for tablet/mobile states
});
process.on("uncaughtException", async (e) => {   // screenshot on failure
  console.error("FAILED:", e.message.split("\n")[0]);
  await page.screenshot({ path: `${outPrefix}-error.png` });
  process.exit(1);
});
```

Flow notes that save time:
- **Cookie banner**: pre-seed the `MBCC` cookie instead of clicking through it
  (see `src/e2e/app/home-page.ts` for the exact value) — works on localhost and
  live.
- Headless Chrome negotiates **en-US**, so match text with locale-agnostic
  regexes (`/colou?r/`), and expect the app's actual strings (check
  `src/messages/ui.en.json`), not what you'd guess.
- Reach real states, not just landing pages: create projects via the UI, name
  actions, open menus/dialogs/pickers, select checkboxes
  (`.click({ force: true })` — the input is visually hidden behind the styled
  control in both stacks), focus tooltips, resize the viewport for
  tablet/mobile variants. Screenshot each state on both sides.
- Beyond screenshots, `page.evaluate` probes settle disputes pixels can't:
  computed styles, element sizes, `document.activeElement` (focus behaviour),
  and canvas `getImageData` painted-pixel counts (LiveGraph). When local and
  live disagree, probe *both* and diff the numbers.
- Watch `pageerror`/console in the probe scripts — a blank screenshot usually
  means a crash or suspended tree, not a style bug (a `pageerror` also caught
  AboutDialog's unhandled clipboard rejection).

Process rules learned the hard way:
- **Run the full e2e suite only on a stable tree.** The Playwright webServer is
  a vite dev server; editing source (or regenerating Panda output) mid-run
  invalidates modules / re-optimises deps and produces bogus timeout failures.
  A new react-aria entry-point import also triggers a one-off dep
  re-optimisation — expect the first run after such a change to be flaky-slow.
- The radio reconnection specs are flaky under full parallel load on some
  machines (reproduced on unmodified main); rerun the failing spec in
  isolation before suspecting the migration.
- The loop catches real bugs (banner breakpoint, helper-text line-height,
  seam radii, missing extraction, border colour, LiveGraph timing, the
  Spinner/ProgressBar override races, the AspectRatio gap) — don't skip it.
  Formalising it is "Remaining work" #7.

## Accepted differences from Chakra

Consolidated for review time; all deliberate:
- react-aria shows focus rings after mouse interaction in places Chakra hid
  them (ConfirmDialog's auto-focused Cancel, the slider thumb).
- Dialogs open with focus on the dialog element itself (announces the title;
  a11y improvement) rather than the first focusable control.
- Toast: single top-centre region; no per-call `position`/`variant`
  (`id`-dedup is supported). Repeat Android saves within the timeout can stack.
- MakeCode loading skeleton is an opacity pulse rather than Chakra's shimmer;
  ~3px internal shift in the certainty card.
- Toast is built on RAC's `UNSTABLE_Toast*` API (functional; the surface is
  small and contained behind `Toast.tsx`).

## Remaining work (agreed order)

1. ✅ **Brand-diff audit** (see gotcha #6) — done; **no uncovered
   divergences**. `bin/diff-chakra-themes.mjs` (delete at kill-switch) diffs
   the *resolved* OSS vs private Chakra themes — source text is quote-style
   noise — with both bundled via esbuild (packages external) so they share
   this repo's hoisted Chakra, as vite's alias does at runtime; style-config
   functions are evaluated against the same base theme so ramp-driven
   divergence stays as token strings. Findings: 70 token deltas, all in the
   seven colour ramps the private preset overrides
   (`brand`/`brand2`/`blue`/`purple`/`teal`/`pink`/`orange`), and the script
   mechanically confirms the Panda preset pair reproduces every one
   ((private-panda − oss-panda) == (private-chakra − oss-chakra)). Exactly 3
   structural diffs, all already token-driven: the `language` button colour
   (`languageText`), its hover (`languageTextHover` — private encodes
   "no hover change" as hover==rest, matching the private Chakra theme's
   *absent* `_hover.color`), and the private-only `marketing` heading variant
   (`display` font). fonts/radii/shadows are byte-identical across sides;
   `withDefaultVariant` and defaultProps diff clean. Rerun the script after
   any theme or preset change while Chakra remains.
2. **Mixed-tree components** — the still-Chakra components rendered *inside*
   already-ported screens, where cross-stack CSS races live (gotcha #11):
   `RecordingGraph` (also lets the SettingsDialog aspect-ratio wrapper slim
   down; keep the native `aspectRatio` property, don't return to the pattern),
   `RecordingFingerprint`, `EditableName`, `ProjectPreview`,
   `ChooseDeviceOverlay`, `NativeConsentDialog`, the trivial `CodePage` and
   `OpenSharedProjectPage`, and the two remaining Chakra `useToast` call
   sites (`App.tsx` update toast, `project-hooks`).
3. **Leaf sweep** (mechanical batch): `Link` wrapper, `AppLogo`,
   `PreReleaseNotice`, `NewPageChoice`, `FileDropTarget`/`ProjectDropTarget`/
   `LoadProjectInput`, `icons/PauseIcon`, `PauseResumeAnimationLink`,
   `StepByStepIllustration`, `ErrorPage`/`ErrorHandlerErrorView` (port these
   last-mentioned two carefully — error surfaces shouldn't depend on newly
   fragile styling paths).
4. **Animation trees** (~26 files, volume over risk): `HowItWorksAnimation/*`,
   `PairingModeAnimation/*`, `PlugMicrobitAnimation`, `LoadingAnimation`,
   `ArrowOne`/`ArrowTwo`, `AnimationProvider`. Remember gotcha #10: as each
   file drops Emotion, drop it from `panda.config.ts`'s `exclude` list too —
   that list should be empty when this pass ends.
5. **Tour** (`src/pages/Tour.tsx` + `TourOverlay.tsx` + `tours.tsx` content):
   needs a positioning decision — RAC `Popover` with an external
   `triggerRef` pointing at the spotlighted element is the idiomatic
   replacement for Chakra's `usePopper` (arrow via `OverlayArrow`); the
   spotlight svg overlay is stack-agnostic and ports as-is. Preserve the
   `returnFocusOnClose={false}` behaviour (see comment in Tour.tsx for why).
6. **BluetoothPatternInput** (#926) — its own careful pass; recently
   reworked screen-reader-accessible radio machinery, so verify with AT.
7. **Fidelity harness** — build *before* the kill-switch: the
   `preflight: true` flip changes global styles everywhere at once, and a
   Chakra-build vs Panda-build screenshot diff turns that from
   eyeball-everything into a reviewable diff. The TestingModelPage
   stash-compare spec (screenshotting the e2e mock fixtures before/after
   `git stash`) is the working prototype.
8. **Kill-switch**: remove `ChakraProvider`/`BrandConfig.chakraTheme`,
   delete `src/deployment/default/{theme,colors}.ts` etc., unpick the
   type-only imports (`model.ts` `PlacementWithLogical`/`ThemingProps`,
   `deployment/index.ts` `BoxProps`), set `preflight: true`, delete
   `bin/unlayer-panda.mjs`/`bin/panda-dev.mjs` watch shim + the `exclude`
   list, drop Chakra/Emotion/framer-motion deps. Full fidelity-harness +
   e2e pass.
9. **Private preset consumption** — replace the local symlink with a real
   mechanism (publish the `panda-preset` export or a documented
   `file:`/`npm link` story) so team/CI can build the branded app. Gates
   merging; independent of the passes above, can run in parallel. Note the
   dev server's `fs.allow` includes the theme package's realpath
   (vite.config.ts) because with a symlink the brand font/image assets
   resolve outside the project root and Vite would otherwise 403 them —
   dev-only, builds are unaffected.

Parked beyond the migration (deliberate UX change, not parity): card
collections as RAC `GridList` — whole-item press targets without the overlay
hack, arrow-key navigation, and built-in multi-selection that would replace
the projects page's checkbox + skip-to-toolbar wiring. Doesn't fit the
Swiper-managed home carousel DOM; best tried on the projects page grid.

## Key files
- `panda.config.ts`, `bin/gen-chakra-tokens.mjs`, `bin/unlayer-panda.mjs`,
  `bin/panda-dev.mjs`
- `src/deployment/default/{panda-preset,chakra-tokens}.ts`
- `src/shared-ui/**` (components + colocated `*.recipe.ts`)
- `src/e2e/app/shared.ts` (`modalDialog()` helper)
- `src/App.tsx` (`ToastProvider` mounted, `ChakraProvider` retained until the
  kill-switch)
- Private: `../ml-trainer-microbit/src/panda-preset.ts`, its `package.json`
  (`./panda-preset` export)
