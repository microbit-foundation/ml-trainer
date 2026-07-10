# Chakra → react-aria-components + Panda CSS migration

Status: **Chakra, Emotion and framer-motion are gone** — the kill-switch
(#8) is done, verified by the fidelity harness against the pre-flip commit
(17/18 states pixel-identical; one accepted 1px sub-pixel diff, see #8).
Remaining work: **private preset consumption** (#9) — now urgent, since
`npm install` deletes the local symlink (see #9). The private package repo
(`../ml-trainer-microbit`) has uncommitted changes that must land in
lockstep with this branch. This doc is the handover for continuing in a new
session; per-chunk history lives in git.

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
Panda generates CSS at build time from `panda.config.ts`. Vite uses the
LightningCSS transformer (PostCSS disabled), so Panda runs via its **CLI**,
not the PostCSS plugin:
- `npm run panda` → `panda codegen` (generates `styled-system/`) + `panda
  cssgen` (writes `src/styled-system.css`).
- `npm run panda:watch` → `panda cssgen --watch` (config edits are picked
  up; only new files in `styled-system/` need a one-shot `npm run panda`).
- Wired into `build`, `predev`, `postinstall`. `styled-system/` and
  `src/styled-system.css` are generated and git-ignored.
- `main.tsx` imports `./layers.css` (declares the document-wide layer order,
  including the `vendor` layer for third-party CSS — see gotcha #1) then
  `./styled-system.css`. `styled-system/*` is aliased in both
  `tsconfig.json` (paths) and `vite.config.ts`.
- `preflight: true`; Chakra-reset behaviours Panda's preflight lacks are in
  the preset's `globalCss` (see #8).

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

1. **CSS layer conflict (the big one).** Unlayered CSS always beats layered
   CSS regardless of specificity. During coexistence Chakra/Emotion were
   unlayered (fixed then by `bin/unlayer-panda.mjs`, deleted at the
   kill-switch). The rule now applies to **third-party stylesheets**: any
   unlayered vendor CSS beats every Panda rule — Swiper's `.swiper-slide {
   width: 100% }` collapsed the home carousels this way. Fix: import vendor
   stylesheets into the `vendor` cascade layer (`@import "..." layer(vendor)`
   — see `Carousel/swiper.css`), which `src/layers.css` orders between
   Panda's `reset` and `base` layers so vendor CSS beats the preflight but
   loses to app styling (the Chakra-era cascade shape). Any future
   third-party CSS import must do the same.
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
   (`ratio={30 / 25}`), custom-named object-literal JSX props (`barCss`,
   `contentCss` — sentinel-verified), and style props on components created
   with the `styled()` factory, cross-file (`Link`). What does NOT work:
   forwarding style props through a *plain* wrapper component
   (`<AppLogo transform="...">` generated no CSS) — give such wrappers a
   `css` prop instead. Coincidental classes from other call sites can mask a
   miss, so verify against the generated CSS, not the rendered page.
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
  `toast.update()` re-adds the toast, so it re-animates and restarts any
  timeout (Chakra updated in place).
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
2. ✅ **Mixed-tree components** — done: `RecordingGraph` (Panda Box; the
   SettingsDialog wrapper keeps the native `aspectRatio` property
   deliberately), `RecordingFingerprint` (data-driven `gridTemplateColumns`
   and cell colours via inline `style`, gotcha #9; the Grid pattern's
   `columns` sugar can't take runtime values and injects a default gap),
   `EditableName` (Chakra Editable rebuilt: preview button ↔ input swap;
   Enter/blur commits, Escape reverts, select-all on edit, focus returns to
   the button — behaviour probe-verified identical to live, both variants),
   `ProjectPreview`/`OpenSharedProjectPage` (array responsive props →
   object syntax; `BlocksLoadingSkeleton` extracted from CodeViewCard for
   the MakeCode loader), `ChooseDeviceOverlay`, `NativeConsentDialog`
   (initial-focus hack dropped per gotcha #14), `CodePage`, and the two
   Chakra `useToast` call sites. shared-ui additions: `VisuallyHidden`
   (Panda `srOnly` span, `as="div"` for block content — all raw
   `css({ srOnly: true })` call sites swept onto it) and Toast
   `isActive`/`update` + `duration: null` persistence for App.tsx's
   storage-error toast. Verified vs live: toolbar/drawer EditableName
   (editing state pixel-identical), shared-project preview page
   (pixel-identical incl. RecordingGraph data previews; blocks-frame
   computed styles match exactly).
3. ✅ **Leaf sweep** — done. `Link` wrapper (now `styled(RouterLinkAdapted)`;
   Panda extracts style props on styled-factory components cross-file, so
   its call sites work unchanged), `AppLogo` (style-prop forwarding through
   a plain component is NOT extracted — verified missing classes — so it
   takes a `css` prop now, call sites updated; the vertical divider is a
   one-off since shared-ui `Divider` is horizontal-only),
   `PreReleaseNotice`, `FileDropTarget`/`ProjectDropTarget` (dropped the
   unused BoxProps spread)/`LoadProjectInput` (plain hidden input),
   `icons/PauseIcon` (plain svg), `PauseResumeAnimationLink`,
   `ErrorPage`/`ErrorHandlerErrorView` (error surfaces now depend only on
   the static stylesheet — more robust than Emotion's runtime injection).
   **Deleted as dead code**: `NewPageChoice`, `StepByStepIllustration` (no
   importers; NewPage was removed with the multi-project work). Verified:
   404 page link computed styles identical to live; welcome-dialog pause
   link renders; drawer header strip byte-identical before/after the
   AppLogo port.
4. ✅ **Animation trees** — done (~30 files); **Emotion is gone from the
   codebase** and `panda.config.ts`'s `exclude` list is empty. Key moves:
   - All ~30 animation keyframes now live in the preset. Panda emits every
     preset keyframe unconditionally (sentinel-verified), so keyframes
     referenced only from runtime inline styles are safe.
   - **Runtime-parameterised Emotion keyframes → static keyframes over CSS
     custom properties**: Gauge's colour-parameterised segments
     (`gaugeSegment1..7` + `--gauge-*` vars), Signal's computed travel
     offset/per-dot opacities (`signalTravel`/`signalSettle` + `--signal-*`
     vars), GraphLines' breakpoint-dependent scroll (`waveScroll` +
     `--wave-window`). The vars are set as inline styles per instance.
   - New shared-ui `Svg` (styled svg, Chakra Icon base sizing) for
     custom-path icons; wrapper icon components take `css`/`style` props
     rather than forwarding style props (gotcha #9).
   - All `withPlayState(...)` animation shorthands are inline styles.
     CodeBlocks' per-breakpoint keyframe uses extracted
     `animationName: { base, sm }` + uniform longhands inline.
   - Verified by Chakra-build vs Panda-build stash-compare (live runs an
     older release with different animations, so live comparison is
     misleading here): welcome animation at a paused checkpoint, the
     connect-cable plug animation, and the native-flow reset-press
     animation (android flag + mockDevice cookie) all match frame-for-frame.
   - **Open eyeball item**: the A/B-hold pairing variant's button-label
     fill-up. The Chakra code interpolated a raw token name into a
     `linear-gradient`, which Chakra doesn't resolve — the fill was likely
     invisible. The port uses the resolved colour, so the fill now shows.
     Kept as a fix (matches evident intent); check it when the A/B-hold
     path (`PairingModeAnimation pairingMethod`) is next exercised.
5. ✅ **Tour** — done. Spotlighted steps are a RAC `Popover` with an external
   `triggerRef` (assigned during render so the keyed, remounted-per-step
   popover measures the fresh anchor on mount), `OverlayArrow` (white,
   shadowless, rotated per placement data-attribute),
   `shouldCloseOnInteractOutside={() => false}` for Chakra's
   `closeOnOverlayClick={false}`, and a default placement of `"bottom"`
   (RAC's default is `"top"`; Chakra popper defaulted bottom). Steps without
   a selector are a shared-ui Modal; Modal grew `overlayCss` so TourOverlay
   can own the dimming in multi-step tours without a double backdrop.
   TourOverlay's spotlight svg ported as-is (`createPortal`). Chakra's
   `returnFocusOnClose={false}` (Tab restarts from the top; avoids focusing
   the MakeCode iframe) is reproduced by blurring before each tour action —
   react-aria only restores focus on unmount when focus is still inside the
   dialog. Probe-verified on both builds: focus lands on `body` after close,
   popovers/arrows/spotlights match; accepted diff: RAC clamps popovers 12px
   from the viewport edge (`containerPadding` default) where popper sat
   flush. `model.ts` and `tours.tsx` no longer import Chakra (two kill-switch
   unpicks done early).
6. ✅ **BluetoothPatternInput** (#926) — done. Chakra `useRadioGroup`/
   `useRadio` → RAC `RadioGroup`/`Radio`; every accessibility contract is
   probe-verified identical: the ARIA tree (Playwright `ariaSnapshot`,
   Chakra vs Panda builds) is structurally byte-for-byte the same
   (radiogroup names, per-LED radio labels, checked semantics), keyboard
   (arrows change LED count, one tabstop per column), the e2e test-id
   contract, and pixels. The hard-won part is the **reactivate** affordance
   (clicking the checked topmost lit LED turns it off — radios fire no
   change event for that): RAC's press handling swallows the click before
   React's synthetic handlers see it, and worse, react-aria *re-selects the
   pressed value against current state* after any handler that runs
   earlier in the dispatch, silently reverting it. The fix is a native
   capture listener on the option wrapper that defers the reactivate write
   by a tick so it lands after react-aria's press processing (see the
   comment in the component). Worth remembering for any future
   "click the selected option again" interactions on RAC radios. A real
   screen-reader pass (VoiceOver) on device is still worth doing when the
   native flow is next tested by hand.
7. ✅ **Fidelity harness** — done, self-tested (working tree vs HEAD →
   zero diffs). Usage: `npm run fidelity [-- <ref>]` (default HEAD) runs
   `src/e2e/fidelity.spec.ts` (`--project=fidelity`) twice — baseline ref
   in a temp detached worktree (node_modules symlinked, Panda regenerated
   via `predev`, dev server on :5199), then the working tree — and the
   Playwright HTML report (`npx playwright show-report`) has the
   side-by-side diffs. ~43 screenshot states: home/projects/data-samples/
   testing-model at 1324/900/390, dialogs (new-project, how-it-works,
   settings, language, about, train-help), menus (settings, help, card,
   data actions), selection toolbar, delete confirm, the full web-Bluetooth
   connect flow incl. pattern input, the 3 Connect tour steps, connected
   state, drawer. Implementation notes beyond the agreed design:
   - **Determinism required stubbing in-page randomness**: a
     `context.addInitScript` in the spec replaces `Math.random` (seeded
     PRNG — mockUsb's random device id drives the suggested Bluetooth
     pattern) and `crypto.getRandomValues`/`crypto.randomUUID`. Without
     it, imports regenerate action/recording **uuids whose IndexedDB key
     order drives visible order** (card subtitles flipped "active,
     inactive"/"inactive, active"; recording previews shuffled within a
     row). Seeding alone is NOT enough for the uuids — async interleaving
     under load shifts how many random calls land between two `uuid()`
     calls, flipping their relative order (caught when the suite ran
     alongside the chromium project) — so `getRandomValues` writes a
     **monotonic per-call prefix** into the leading bytes: later uuids
     always sort after earlier ones, i.e. visible order == creation
     order, load-independent. (Chart.js previews were already
     `animation: false`; the reducedMotion context option pauses the
     welcome/how-it-works animation as designed.) Only `#smoothie-chart`
     (LiveGraph) is masked.
   - Screenshot assertions are `expect.soft` so one diff doesn't hide
     later states in the same flow.
   - **Cold dev servers flake**: first visits pay vite's on-demand
     compile (a training-navigation timeout and a blank-page render on
     the fresh worktree server). The fidelity project has `timeout:
     60_000, retries: 1` — the retry runs against a warm server.
   - `vite.config.ts` honours `VITE_CACHE_DIR` (set per side by the
     runner) so the worktree's server — whose default cache would resolve
     *through the node_modules symlink* into the shared
     `node_modules/.vite` — can't invalidate a concurrently running dev
     server's deps, and the two sides can't cross-contaminate.
   - The spec always runs from the **working tree** (both sides): only
     the app server differs, so the state list is identical across sides.
     Consequence: page-object/locator changes can't invalidate old
     baselines, but app changes that rename UI strings the spec relies on
     need the spec updated in the same tree.
   - `appUrl()` in `src/e2e/app/shared.ts` (reads `E2E_PORT`, default
     5173) replaced the hardcoded URLs in the seven page objects;
     `FIDELITY_NO_WEBSERVER=1` skips the config webServer;
     `snapshotPathTemplate` → `.fidelity/snapshots/` (git-ignored). The
     fidelity project only exists in the config when `FIDELITY=1` (the
     runner sets it) so a plain `playwright test` doesn't compare against
     stale baselines; ad-hoc spec runs are
     `FIDELITY=1 npx playwright test --project=fidelity`.
   - Still to do as part of the kill-switch review: run it twice (brand
     linked / OSS) for brand-split coverage. Keep it on-demand, not
     CI-gating (image baselines are font-rendering sensitive; if
     CI-gating later, run in the pinned Playwright container from
     build.yml).
8. ✅ **Kill-switch** — done. `ChakraProvider` removed; OSS Chakra theme
   files (`theme`/`colors`/`fonts`/`radii`/`shadows`/`components/*`) and
   `bin/{unlayer-panda,panda-dev,diff-chakra-themes}.mjs` deleted;
   `preflight: true`; Chakra/Emotion/framer-motion/`@chakra-ui/cli` deps
   and the `theme` scripts dropped (`bin/gen-chakra-tokens.mjs` kept for
   provenance; needs `npm i --no-save @chakra-ui/theme` to re-run).
   `BrandConfig` lost `chakraTheme`; logos are typed `LogoProps` (`h`,
   `color`) and render plain SVG with inline styles — brand packages are
   outside Panda's extraction scope. **The private package changed in
   lockstep** (chakraTheme/theme files removed, logos ported) — its repo
   has the matching uncommitted changes. Findings from the flip:
   - The preset's `globalCss` carries what ChakraProvider used to inject:
     theme `styles.global` (body font/colour/bg/line-height/transition,
     placeholder + border colours) **plus the Chakra-reset behaviours
     Panda's preflight lacks**: body `font-feature-settings: "kern"`, html
     `text-rendering: optimizeLegibility` (without these, glyph kerning
     shifts text page-wide), `touch-action: manipulation`, global
     `word-wrap: break-word`, body `position/min-height`, and `button,
     [role=button] { cursor: pointer }` (human-caught — **the screenshot
     harness can't see cursor, focus order, or selection behaviour**).
   - Swiper needed the `vendor` layer (gotcha #1's new form).
   - Verified: unit + full e2e green, branded build + preview eyeballed,
     fidelity vs the pre-flip commit **17/18 states pixel-identical**.
     Accepted diff: the About-dialog version table renders its rows
     ~0.7px shorter (sub-pixel line-box rounding; computed styles are
     identical), shifting the caption/Copy button 1px.
   - **Cross-boundary fidelity runs need paired sibling-package versions**:
     the baseline resolves the *current* private dist through the shared
     node_modules symlink, so after the private package dropped
     `chakraTheme` the baseline's `ChakraProvider theme={undefined}` fell
     back to the Chakra default theme (system font stack — every state
     diffed). Method that worked: stash the private repo, rebuild its old
     dist, run the harness for its baseline half; pop/rebuild, clean panda
     regen, then run the compare half manually (`FIDELITY=1 E2E_PORT=5199
     FIDELITY_NO_WEBSERVER=1 npx playwright test --project=fidelity`).
     Also: the baseline ref imports Chakra, so `npm i --no-save` the
     dropped deps first; plain `npm install` restores pristine state.
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
