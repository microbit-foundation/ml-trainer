# Chakra → react-aria-components + Panda CSS migration

Status: **complete.** The migration (Chakra, Emotion and framer-motion are
gone), the library extraction, and the consumption flip are all done: this
app consumes **`@microbit/ui`** (the `../ui` monorepo), with its app preset
in `src/deployment/default/panda-preset.ts` and the private CreateAI brand
preset in `../ml-trainer-microbit` (branch-published, pinned via
`workflow-config.json`).

The reusable method has moved out of this doc into the **migration
playbook** at `../ui/docs/migration-playbook.md` — the per-app sequence,
the gotcha catalog (numbering preserved: #1–#16 from this migration,
#17–#18 from the extraction), the fidelity/verification recipes, the kit
scripts (`../ui/bin/`), and the family roadmap including the classroom and
data-microbit-org censuses. The python-editor-v3 census moved to that
repo's own `RAC-MIGRATION.md`. Consumption setup lives in
`../ui/packages/ui/README.md`. Everything under "Archive" below is the
frozen record of this app's migration and extraction; per-chunk history
lives in git.

## Open items

- **Land the branch (extraction plan Phase 0)**: merge this repo's and
  `../ml-trainer-microbit`'s `experiment-rai` branches, republish the
  theme package from its main line, and bump `workflow-config.json`.
- **Crowdin (or equivalent) for the `@microbit/ui` catalogs** — new
  package strings currently require editing every
  `../ui/packages/ui/lang/*.json` by hand, then this app's
  `npm run i18n:compile`.
- **Projects-page GridList** (parked; a deliberate UX change, not
  parity): RAC `GridList` for card collections — whole-item press
  targets without the overlay hack, arrow-key navigation, and built-in
  multi-selection replacing the checkbox + skip-to-toolbar wiring.
  Doesn't fit the Swiper-managed home carousel DOM; best tried on the
  projects page grid. GridList is also on the library roadmap
  (classroom's hand-rolled version promotes first).
- **A/B-hold pairing fill-up**: the ported button-label fill now renders
  visibly (the Chakra code interpolated an unresolved token name into a
  `linear-gradient`, so it was likely invisible); eyeball it when
  `PairingModeAnimation`'s A/B-hold path is next exercised.
- **VoiceOver pass** on BluetoothPatternInput when the native flow is
  next tested by hand.

## How to run / verify

- **Branded build locally**: build the sibling `ml-trainer-microbit`
  package (`npm run build` there → `dist/panda-preset.js`) and make it
  resolvable as `node_modules/@microbit-foundation/ml-trainer-microbit`
  (e.g. a symlink or `npm link`). With it present, vite's `theme-package`
  alias and `panda.config.ts` both resolve CreateAI branding; without it
  you get the OSS default. CI installs it at the version pinned in
  `workflow-config.json`.
- **Local `@microbit/ui` development**: symlink
  `node_modules/@microbit/ui` to `../ui/packages/ui`; a plain `npm i`
  restores the registry version.
- **After changing or (re)linking either sibling package, do a _clean_
  Panda regen**: `rm -rf styled-system && npm run panda` (or `panda
codegen --clean`). Incremental codegen does not detect changes in an
  _external_ preset dependency — brand token values silently stay stale.
  Restart the dev server too; the `theme-package` alias resolves at
  server start.
- `npm run build` then `npm run preview` → http://localhost:4173, and
  compare against the live branded deployment
  (https://createai.microbit.org/).
- **Fidelity harness**: `npm run fidelity [-- <ref>]` (default HEAD)
  screenshot-diffs ~43 app states between a baseline ref and the working
  tree; view via `npx playwright show-report`. Implementation:
  `bin/fidelity.mjs` + `src/e2e/fidelity.spec.ts`; the pattern and its
  determinism tricks are documented in the playbook. Runs against
  pre-flip refs need paired sibling-package versions — see "Remaining
  work" #8 in the archive.
- `npm test`, `npm run test:e2e:headless`, `npm run typecheck`,
  `npm run lint`.
- E2e suite notes: run the full suite only on a stable tree — editing
  source or regenerating Panda output mid-run invalidates modules and
  produces bogus timeout failures, and a new react-aria entry-point
  import makes the first run after it flaky-slow. The radio reconnection
  specs are flaky under full parallel load on some machines (reproduced
  on unmodified main) — rerun the failing spec in isolation before
  suspecting a regression.

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

## Key files

- `panda.config.ts` (preset stack + `@microbit/ui` source include),
  `bin/fidelity.mjs`
- **`../ui` monorepo**: `docs/migration-playbook.md` (method, gotchas,
  family roadmap), `packages/ui/` (components + colocated recipes +
  `base-preset.ts`; `README.md` = consumption setup + CSS-var contract),
  `bin/` (migration kit: `diff-chakra-themes.mjs`, `unlayer-panda.mjs`,
  `panda-dev.mjs`, `gen-chakra-tokens.mjs`)
- `src/deployment/default/panda-preset.ts` (app preset:
  led/record/secondary-disabled vocabulary + animations)
- `src/layers.css` (cascade layer order incl. `vendor`),
  `src/components/Carousel/swiper.css`
- `bin/compile-lang.mjs` (compiles app + package `lang/` catalogs
  together into `src/messages/`)
- `src/e2e/app/shared.ts` (`modalDialog()`/`appUrl()` helpers),
  `src/e2e/fidelity.spec.ts`
- `src/App.tsx` (`SharedUIConfig` + `ToastProvider` mounted)
- Private: `../ml-trainer-microbit/src/panda-preset.ts`, its
  `package.json` (`./panda-preset` export)

---

# Archive — migration & extraction record (July 2026)

The frozen record of how this app got here; not maintained. Sections that
became reusable method live in the playbook instead (the gotcha catalog,
the visual-comparison workflow and fidelity pattern, the sibling-app
censuses, roadmap phases 3–4, and the per-app sequence). Gotcha numbers
referenced below resolve against the playbook's catalog.

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

Panda generates CSS at build time from `panda.config.ts`:

- `npm run panda` → `panda codegen` generates the `styled-system/` helpers
  (needed before `tsc`); wired into `build`, `predev`, `postinstall`.
- The CSS is generated by `@pandacss/dev/postcss` (see `postcss.config.cjs`),
  which injects it into the cascade-layer declaration in `src/layers.css`
  during the Vite build. Vite keeps its default PostCSS transformer;
  LightningCSS is the minifier only. Two temporary legacy plugins run after
  Panda's for Safari <15 support — see `postcss.config.cjs`.
- `main.tsx` imports `./layers.css` (declares the document-wide layer order,
  including the `vendor` layer for third-party CSS — see gotcha #1), which is
  also Panda's injection entry. `styled-system/*` is aliased in both
  `tsconfig.json` (paths) and `vite.config.ts`.
- `styled-system/` is generated and git-ignored.
- `preflight: true`; Chakra-reset behaviours Panda's preflight lacks are in
  the preset's `globalCss` (see #8).

### Tokens & the preset stack (post Phase-1 split)

- `bin/gen-chakra-tokens.mjs` snapshots the **exact** Chakra v2 default token
  scales from `@chakra-ui/theme` into `src/shared-ui/chakra-tokens.ts`
  (committed, generated — do not hand-edit; ignored by lint). This decouples the
  preset from Chakra for eventual removal.
- The OSS side is now **three presets**, merged in order (later wins):
  - `src/shared-ui/panda-preset.ts` = **shared-ui core** (the future
    library preset): the Chakra token scales + default fonts, the recipe
    registrations, the RAC condition widening (gotcha #2) + `forcedColors`,
    the `focusShadow` utility, the Chakra-reset-parity `globalCss`, the
    `staticCss` (in the preset so no consumer can silently lose
    runtime-prop variants), and the component semantic tokens
    (`controlCheckedBg`/`focusBorder`/`sliderFilledTrack`/
    `progressFilledTrack`/`danger.*`). Its recipes consume brand-contract
    tokens the outer presets must define (see `src/shared-ui/README.md`).
  - `src/deployment/default/microbit-preset.ts` = **micro:bit foundation**:
    the 4/4-census vocabulary — `brand`→Chakra blue / `brand2`→Chakra gray
    OSS aliases, `gray` 10/25, `radii.button` 2rem, `outline*` shadows,
    Helvetica fonts + `display` slot, `languageText*`/`toast*Bg`/
    `statusBarBg` semantic tokens, and the `language`/`toolbar` button
    variants (merged into the core recipe via `theme.extend`).
  - `src/deployment/default/panda-preset.ts` = **app preset**: the ~30
    animation keyframes (minus `spin`, which Spinner owns in core), `gray`
    500/600 overrides, the `shortHeight` condition, and the app button
    vocabulary (`led`/`record`/`recordOutline`/`secondary-disabled`).
    The split regenerated byte-equivalent CSS (ordering-only diffs) and was
    fidelity-verified.
- `src/shared-ui/*.recipe.ts` = config recipes colocated with their components
  (`button`, `heading`, `input`, and the slot recipes `dialog`, `drawer`,
  `menu`, `card`, `checkbox`, `field`, `slider`, `switchRecipe`, `toast`).
  **Convention**: new shared-ui config recipes go in `<Component>.recipe.ts`
  next to the component (named after the component, e.g. `Modal.recipe.ts`
  exports `dialog`) and must be registered in the shared-ui core preset's
  `recipes`/`slotRecipes` to take effect; foundation/app presets extend
  variants via `theme.extend.recipes`. These files are build-time only
  (imported by the preset, run during Panda codegen) — components consume the
  generated `styled-system/recipes` output, never the `.recipe.ts` file, and
  recipe files must not import app code. Use config recipes for shared-ui
  primitives (preset-extensible, `recipes` layer is overridable by call-site
  style props); use colocated `cva`/`sva` for one-off feature-component styling.
- **Private preset**: `../ml-trainer-microbit/src/panda-preset.ts` (plain object,
  no `@pandacss/dev` dep) overrides the brand colour ramps
  (`brand`/`brand2`/`purple`/`teal`/`blue`/`pink`/`orange`) and the `display`
  font (GT Walsheim). Exported via the package's `./panda-preset` entry.
- `panda.config.ts` merges them: `presets: ["@pandacss/preset-base",
sharedUiPreset, microbitPreset, appPreset, brandPreset?]` with `eject: true`
  (drops Panda's default theme; keeps base utilities). `brandPreset` is
  resolved with `require(...)` guarded by try/catch — the build-time
  equivalent of the `theme-package` vite alias swap.

### shared-ui (`src/shared-ui/`)

See `index.ts` for the full export list. Highlights: `Button` (+`ButtonGroup`,
`IconButton`, `LinkOverlayButton`), `Modal` (+ header/body/footer/close-button
slots), `Drawer`, `Menu`, `Tooltip`, `Toast` (+`ToastProvider`/`useToast`),
form primitives (`TextField`, `Input`, `InputGroup`, `NativeSelect`,
`Checkbox`, `Switch`, `Slider`), `Slide`, `ProgressBar`, `Spinner`, `Card`,
`LinkBox`/`LinkOverlay`, typography (`Text`/`Heading`/`Link`), `Icon`/
`CloseIcon`/`CloseButton`, `Divider`, `List`, `Image`, `useBreakpointValue`,
and `system.ts` (re-exports Panda `css`/`cva`/`sva`/`cx`/`token` + jsx patterns
`Box`/`Flex`/`Stack`/`HStack`/`VStack`/`Grid`/`GridItem`/`Center`/`Wrap`/
`styled`). Layout uses Panda patterns directly (Panda-native idiom); responsive
props use object syntax `{ base, md }`.

Conventions: shared-ui components take a `css` prop / recipe variants;
call-site `css()` is for page layout and true one-offs only. A shared-ui
primitive that accepts style overrides must merge them into a _single_
`css(base, cssProp)` call (gotcha #8). Focus rings are the preset's
`focusShadow` utility (`_focusVisible: { focusShadow:
"outline" | "outlineDark" | "outlineLight" }` — emits the shadow token plus
a transparent outline for forced-colors modes; named to dodge preset-base's
`focusRing`), not hand-written `boxShadow: "outline"`. Reduced-motion
styling uses the `_motionReduce` condition, never a raw
`@media (prefers-reduced-motion: reduce)` key.

## Hard-won patterns / gotchas

Moved to the playbook's gotcha catalog
(`../ui/docs/migration-playbook.md`), numbering preserved — #1–#16
originated here.

## How it was verified

The per-screen visual-comparison workflow (identical scripted Playwright
flows against the local branded preview and the live deployment, plus
`page.evaluate` probes) and the process rules it taught moved to the
playbook. The loop caught real bugs throughout: banner breakpoint,
helper-text line-height, seam radii, missing extraction, border colour,
LiveGraph timing, the Spinner/ProgressBar override races, the AspectRatio
gap.

## Remaining work (agreed order)

1. ✅ **Brand-diff audit** (see gotcha #6) — done; **no uncovered
   divergences**. `bin/diff-chakra-themes.mjs` (delete at kill-switch) diffs
   the _resolved_ OSS vs private Chakra themes — source text is quote-style
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
   _absent_ `_hover.color`), and the private-only `marketing` heading variant
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
   React's synthetic handlers see it, and worse, react-aria _re-selects the
   pressed value against current state_ after any handler that runs
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
     _through the node_modules symlink_ into the shared
     `node_modules/.vite` — can't invalidate a concurrently running dev
     server's deps, and the two sides can't cross-contaminate.
   - The spec always runs from the **working tree** (both sides): only
     the app server differs, so the state list is identical across sides.
     Consequence: page-object/locator changes can't invalidate old
     baselines, but app changes that rename UI strings the spec relies on
     need the spec updated in the same tree.
   - `appUrl()` in `src/e2e/app/shared.ts` (reads `E2E_PORT`, default 5173) replaced the hardcoded URLs in the seven page objects;
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
   lockstep** (chakraTheme/theme files removed, logos ported) — committed
   on its `experiment-rai` branch and published (see #9). Findings from
   the flip:
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
     the baseline resolves the _current_ private dist through the shared
     node_modules symlink, so after the private package dropped
     `chakraTheme` the baseline's `ChakraProvider theme={undefined}` fell
     back to the Chakra default theme (system font stack — every state
     diffed). Method that worked: stash the private repo, rebuild its old
     dist, run the harness for its baseline half; pop/rebuild, clean panda
     regen, then run the compare half manually (`FIDELITY=1 E2E_PORT=5199
FIDELITY_NO_WEBSERVER=1 npx playwright test --project=fidelity`).
     Also: the baseline ref imports Chakra, so `npm i --no-save` the
     dropped deps first; plain `npm install` restores pristine state.
9. ✅ **Private preset consumption** — done via the established
   theme-package mechanism: the private repo's changes are committed on
   its `experiment-rai` branch and published as
   `0.2.0-experiment.rai.130`; `workflow-config.json` pins that version
   and the CI workflows `npm install --no-save` it (build.yml,
   android-build.yml, ios-build.yml). Follow-up when this branch merges:
   merge the private branch too, publish from its main line, bump
   `workflow-config.json`. Note the dev server's `fs.allow` includes the
   theme package's realpath (vite.config.ts) because with a symlinked/
   linked package the brand font/image assets resolve outside the project
   root and Vite would otherwise 403 them — dev-only, builds are
   unaffected.

## Library extraction (medium-term plan + review findings)

Intent: extract `src/shared-ui/` as a design-system library and migrate the
other Chakra UI sibling apps onto it via the same Chakra → RAC/Panda path,
with minimal visual impact per app. A full review of shared-ui against that
goal (July 2026, post-kill-switch) found the architecture sound — extraction
is mostly _factoring_, not rework — with the following inventory.

### Direction: a monorepo spanning design-system → app-level packages

Agreed July 2026: the extraction target is a **workspace monorepo** holding a
spectrum of packages, from design-system-y (primitives, foundation preset,
migration/dev tooling) up to app-level common pieces — the sibling apps share
whole UX territories beyond components, e.g. micro:bit connection flows,
which differ per app but share UI elements and dialogs. Not an initial goal
(the design system extracts first), but it shapes decisions made at
extraction time:

- **Start as a monorepo even with one package** — converting later churns
  every consumer; it also gives the migration kit (token snapshotter,
  resolved-theme differ, fidelity-harness pattern) a home as a tools package.
- **Pick the i18n mechanism for the end state**: app-level packages are
  dense with translated strings, so "require the label as a prop" doesn't
  scale — per-package message catalogs with namespaced ids feeding each
  app's formatjs pipeline (or equivalent) should be chosen up front.
- **The ship-as-source/importMap styling setup is a repo-wide convention**,
  documented once for any package that styles anything; `staticCss` moves
  into the preset (non-negotiable with multiple consumers).
- **Explicit dependency direction**: app-level packages may depend on the
  design system and domain libraries (device connection, Capacitor);
  design-system packages on neither. The planned inversions (e.g. the
  overlay-dismissal context) are the installation seams. Brand presets stay
  in private sibling repos consuming the documented preset contract; the
  monorepo is OSS.

First app-level candidates: **animations, illustrations, and error-scenario
handling** from the connection flows — leafy visual pieces, not flow
orchestration/state machines, which would freeze the wrong seams if
extracted early. To be kicked off with a **separate census** of the four
apps' connection UIs, same method as the Chakra censuses below.

### Why the architecture already fits

- The Chakra-v2 token snapshot + Chakra-ported recipes make the library
  effectively "Chakra v2's design language on RAC/Panda": any sibling app's
  Chakra theme is expressible as a preset over the same base, exactly as the
  CreateAI brand preset works today.
- Config recipes are preset-extensible (`theme.extend.recipes.*`) and
  call-site-overridable via layer order — the app/brand extension mechanism
  already exists and is proven.
- `system.ts` is the single import seam; components are otherwise clean of
  app dependencies (react-aria-components + react-icons only), with the
  exceptions below.
- The migration kit transfers per app: `bin/gen-chakra-tokens.mjs`, the
  resolved-theme differ (deleted at the kill-switch; in git at `4c012bd4`),
  and the fidelity-harness pattern.

### Blockers (hard app couplings) — ✅ resolved (Phase 1)

Both inverted behind `SharedUIProvider` (`src/shared-ui/SharedUIProvider.tsx`;
installed by `SharedUIConfig` in App.tsx):

- Menu no longer imports Capacitor or `../back-button`; the app passes
  `setActiveMenuClose` as the optional `overlayCloseRegistrar` on native
  platforms and MenuTrigger runs controlled only when a registrar exists.
  (Dialogs/drawers still close via app state, so they don't use it.)
- The close label (and the toast status announcements) come from the
  provider's required `strings` — the "message map" option won: call sites
  stay clean, apps localize via their own pipeline, shared-ui has no
  react-intl dependency left.

### App decisions living in shared code (move to app/brand presets)

- Button recipe: `led`, `record`, `recordOutline`, `language` (+ the
  `languageText` semantic tokens), `toolbar`, `secondary-disabled` (a state
  as a variant) are ml-trainer vocabulary. Library core: `primary/
secondary/ghost/link/plain/unstyled` + sizes. `defaultVariants:
secondary` is also an app choice (Chakra's default is solid).
- Modal's `full` size bakes in the Capacitor shell: safe-area insets, the
  `brand2.500` status-bar gradient "matching ActionBar",
  `--window-controls-left`. Decouple via a semantic token (`statusBarBg`)
  or app-side recipe extension.
- Toast is the least library-ready: inline `cva` (invisible to brand
  presets), info/success/warning all teal (only error differs), single
  fixed top-centre region, `update()` re-animates. Needs the slot-recipe
  treatment + status colours as semantic tokens.
- Tooltip/Spinner/ProgressBar/CloseButton colours are component-inline
  (deliberate, for the single-`css()` merge rule) — lift the colour
  decisions to semantic tokens even if structural CSS stays inline.
- `useBreakpointValue` duplicates the breakpoint scale as literals; derive
  from `token("breakpoints.*")` instead.

### Packaging decisions (make at extraction time)

- **The `styled-system` import problem**: components import the per-app
  generated `styled-system/*`. Panda's library pattern: ship the package as
  source, consumers add it to `include`, and `importMap` resolves the
  library's styled-system imports onto the consumer's outdir.
- ✅ **`staticCss` now lives in the shared-ui core preset** (done in
  Phase 1) so no consumer can silently lose runtime-prop variants — this
  migration's signature failure class.
- ✅ **The preset split is done** (Phase 1; see "Tokens & the preset
  stack"). At extraction the core preset moves out with the components;
  the foundation preset is the seed of the private foundation package's
  OSS default.
- The `layers.css` `vendor`-layer convention and the brand semantic-token
  contract (`brand`/`brand2` ramps, `radii.button`, `display` font,
  `outline*` shadows, `languageText`-style extension points) become
  documented parts of the library's consumption setup.
- Peer deps: react, react-aria-components, react-icons; `@pandacss/dev` at
  dev/build time. No Capacitor.

### Surface gaps — measure before building

Known narrowings: Divider is horizontal-only; Menu lacks sections/checkable
items/submenus; no shared Radio/RadioGroup (BluetoothPatternInput uses RAC
raw); no Tabs/Accordion/Popover-as-primitive/non-native Select/Textarea/
NumberInput. Don't build speculatively — run a **Chakra-usage census across
the target apps** (grep `@chakra-ui/react` imports + resolved-theme diffs,
like the brand audit) to define the v1 surface and decide which ml-trainer
variants generalise.

### Censuses: python-editor-v3, data-microbit-org, classroom

Taken here in July 2026; moved out. The python-editor-v3 census lives in
that repo's `RAC-MIGRATION.md`; the data-microbit-org and classroom
censuses live in the playbook's family roadmap. Their family-wide
conclusions (the 4/4 cross-app vocabulary — `radii.button: 2rem`, the
`outline*` shadow names, the `language` button variant; per-app
`defaultVariants`; the two coexisting palette generations) are folded into
the playbook and the base preset's design.

### Pre-extraction accessibility tasks — ✅ done (Phase 1)

All items shipped; see the Phase 1 entry in the plan below for the
implementation notes (focusShadow in recipes + Switch forced-colors,
NativeSelect chevron, Toast status announcement + undismissable guard,
DrawerTitle, Slider formatOptions, Icon aria defaults). Still open, by
design — component-default choices to revisit deliberately at extraction:
Link underlines only on hover (colour-only differentiation for in-prose
links, WCAG 1.4.1), Tooltip's global `delay={0}` (Chakra-parity override
of RAC's ~1500ms warmup), and Modal naming stays runtime-enforced
(react-aria's dev warning) since header presence isn't statically
knowable.

### Colour audit (July 2026) — actionable findings

Review of non-brand, non-greyscale colours across shared-ui and the app
(graph/data-viz colours deliberately out of scope). All pre-date the
migration.

All actionable findings ✅ fixed in Phase 1 (see the plan entry below):
the three "likely mistakes" (RecordingFingerprint's hardcoded private
brand hex → runtime token lookup; the chevrons' off-palette slate default
→ `currentColor` with the slate pinned at CarouselButton pending a design
pass; the pairing-lost ⓘ → fixed iOS system blue) and the
`blue.*`/`red.*`/toast-teal semantic-token conversions. Note `teal` _is_ a
brand-overridden ramp, so branded toasts recolour by ramp side-effect —
unchanged behaviour, now via `toast*Bg` indirection. Graph/data-viz
colours stay out of scope.

### Extraction & family-migration plan (July 2026, post-census)

Sequenced plan to bring all four apps onto shared-ui. Each phase gates
the next; within a phase, items are parallelisable. The censuses above
are the evidence base; the a11y/colour/packaging subsections are inputs.

**Phase 0 — land ml-trainer.** #9 is done (branch-published theme
package pinned via `workflow-config.json`); what remains is merging
both repos' `experiment-rai` branches, then re-publishing the theme
package from its main line and bumping the pin. Everything else builds
on a merged, branded ml-trainer.

**Phase 1 — make shared-ui library-ready in place** — ✅ **done (July 2026)**; every step fidelity-verified zero-diff. What shipped, with
deviations from the plan noted:

- ✅ Both Blockers via `SharedUIProvider` (see the Blockers section).
- ✅ **Three-way preset split** as designed (see "Tokens & the preset
  stack"). Extras beyond the plan: the app button vocabulary
  (`led`/`record*`/`secondary-disabled`) also moved out of the core
  recipe into the app preset; `staticCss` moved into the core preset.
  `defaultVariants: secondary` stays in the core recipe for now —
  python-editor needs it preset-overridable at migration time.
- ✅ Toast slot recipe + `toast*Bg` status tokens; visually-hidden status
  text (new `toast-status-*` messages via SharedUIProvider strings);
  a persistent toast forces its close button on. The fidelity spec
  gained a `language-toast` state to lock the pixels.
- ✅ Semantic-token conversions: `controlCheckedBg`/`controlCheckedHoverBg`/
  `focusBorder`/`sliderFilledTrack`/`progressFilledTrack` (blue.\*),
  `danger.50/100/500/600/700` (warning button variants, field errors,
  toast error), `statusBarBg` (ActionBar + Modal `full` gradient).
  Colour-audit "likely mistakes" fixed too: RecordingFingerprint seeds
  from runtime `token("colors.brand.500")`, chevrons follow
  `currentColor` (slate pinned at CarouselButton pending design),
  pairing-lost ⓘ is fixed iOS system blue.
- ✅ A11y list: recipes on `focusShadow` (+ a `forcedColors` condition and
  a Switch forced-colors treatment), NativeSelect draws its chevron
  (suppression is the `hideChevron` opt-in), Icon defaults `aria-hidden`
  when unlabelled / `role="img"` when labelled, `DrawerTitle` labels
  drawers (Drawer `aria-label` now optional; react-aria's dev warning is
  the runtime enforcement — RAC labels by `aria-label` over the title
  slot, so ml-trainer's logo-only drawer is unaffected), Slider exposes
  `formatOptions` (`getValueLabel` no longer exists in RAC 1.19; the
  certainty slider announces percentages). The mark-reveal concern was
  moot: RAC focuses the thumb's input on pointer drag, so
  `:focus-within` already shows the mark for pointer users.
- ✅ **CSS-var contract + runtime `token()` pattern** documented in
  `src/shared-ui/README.md` (naming stability rules, base-vs-semantic
  token resolution, the provider installation steps).
- ✅ `useBreakpointValue` reads `token("breakpoints.*")`.

**Phase 2 — extract.** Library ships as **source** with `importMap`
(see Packaging decisions); peer deps react/RAC/react-icons. Two
packages: the OSS library, and one **private foundation-preset package**
consolidating what today is scattered across the per-app `*-microbit`
theme halves (ramps, GT Walsheim/Helvetica Now font files, semantic
token values). Decide then whether thin per-app private presets remain
(ml-trainer's CreateAI ramps suggest yes, as extensions of the
foundation package). ml-trainer becomes the first consumer — fidelity
zero-diff proves the packaging. Document the consumption setup:
`layers.css` order + `vendor` layer, brand semantic-token contract,
the staticCss-in-preset requirement, clean-regen rule for external
preset changes.

_Status (July 2026): the monorepo exists_ — `../ui`, npm workspaces,
mirroring microbit-connection's conventions, committed on `main`.
Decisions taken: extract from this branch without waiting for Phase 0;
one package, **`@microbit/ui`** (components + preset + generated
`chakra-tokens`, exports `./base-preset`, `./chakra-tokens`,
`./messages`). **Preset naming settled on a single `base-preset`**: the
in-repo core+foundation+app three-way split collapsed to one **base
preset** — the complete brand-independent design system _plus_ the OSS
default brand values (brand/brand2 ramps + display font). Rationale:
"foundation/micro:bit-brand" now names only the _private_ branded
presets (not in this repo); a separate OSS/foundation preset had no
unique consumer (every branded build overrode it, an OSS build gets the
defaults from base), so the stack is just `base [+ app] [+ private
brand]`. The base preset alone is a complete, working OSS-look design
system; a private preset merged last overrides the brand token values.
(No non-micro:bit consumers are planned, so the Chakra-core-vs-vocabulary
distinction wasn't worth a separate layer — re-splittable later.) The
per-repo app preset (`src/deployment/default/panda-preset.ts`) keeps
ml-trainer's led/record/secondary-disabled vocabulary + animations.
Thin per-app private brand presets stay for now; **react-intl from the
start** (namespaced `ui.*` ids with inline English `defaultMessage`, so
English needs no catalog merge; `lang/ui.en.json` is the source and
`@microbit/ui/messages` exports compiled catalogs) — `SharedUIProvider`
now carries only the overlay-close registrar and is optional. Ship-as-
source works without `importMap`: consumers add the package source to
Panda `include` and alias `styled-system` (tsconfig + bundler) as we
already do. **Storybook** (not a demo app) is the component harness,
in `packages/ui` (config `.storybook/`, stories `packages/ui/stories/`),
using the base preset alone (OSS look); it's the CI build target.
Branded Storybook is deferred until the private presets consolidate into
a sibling package, where an optional guarded private preset would wire
in.
Direction noted for after the family migration (not yet): treat the
Chakra token snapshot as a **malleable base** — it is a parity
constraint only while Chakra apps remain the comparison point; once
everything is migrated, evolving the scales/values in place is fair
game.
Two new gotchas found: (1) Panda extracts _utility-named props with
literal values from any capitalized JSX component_ (partially
contradicting gotcha #9's AppLogo observation), so Tooltip's `content`
prop emitted a broken CSS `content` rule — renamed to `label` (Chakra's
name; fold the call-site rename into the consumption diff); (2) an
`include` glob that matches nothing fails silently and recipe styling
still works via preset staticCss, so a wrong path shows up only as
broken non-recipe styling — in npm workspaces the hoisted package isn't
under the app's `node_modules`, hence the demo includes
`../../packages/ui/src` while standalone consumers use
`./node_modules/@microbit/ui/src`.

_The consumption flip is done too_ — this repo consumes `@microbit/ui`
(local `node_modules/@microbit/ui` symlink to `../ui/packages/ui`, like
the theme package's link workflow), `src/shared-ui`/`microbit-preset.ts`
deleted, **fidelity vs the pre-flip commit: no visual differences**.
Symlink-consumption wiring worth knowing: vite `resolve.dedupe`
(react/react-dom/RAC/react-icons/react-intl) and tsconfig `paths`
pinning `react`/`react-dom` types, because the linked package's files
resolve bare imports through the _sibling's_ node_modules (duplicate
React breaks hooks/contexts; duplicate csstype breaks CSSProperties);
`fs.allow` gains the symlink realpath. **The package ships translated
catalogs as source** (`lang/ui.<locale>.json`, formatjs extracted
format, 12 locales seeded from this app's translations, exported at
`@microbit/ui/lang/*`); this app's `i18n:compile`
(`bin/compile-lang.mjs`) compiles each locale's app + package catalogs
together into `src/messages/`, so package strings ride the existing
lazy per-locale chunks. This replaced an earlier eager
`@microbit/ui/messages` catalog-of-all-locales export merged at runtime
— fine at 5 messages but the wrong shape for string-dense packages,
where every visitor would download every locale in the main chunk; the
compile-time merge is the pattern for future package catalogs
(`ui.*`-style namespaced ids can't collide with app ids, and formatjs
`compile` accepts multiple input files). English still needs no catalog
anywhere: components carry inline `defaultMessage` (`uiMessage`, still
at `@microbit/ui/messages`). No Crowdin wiring for the package yet —
new strings need every `lang/*.json` edited, then app-side recompile.
_Publishing is done_: the monorepo lives at
github.com/microbit-foundation/ui and its build workflow publishes
`@microbit/ui` to npm on release creation (public package, version
stamped from the release tag). This app depends on an exact-pinned
version like any other dependency — no CI pin mechanism needed, and a
fresh `npm i` just works. For local package development, symlink
`node_modules/@microbit/ui` to `../ui/packages/ui` (then clean-regen
Panda — external preset changes aren't detected incrementally — and
restart the dev server); `npm i` restores the registry version.
Remaining for Phase 2: Crowdin (or equivalent) for the package catalog.

**Phases 3–4** (v1 surface, app migration order), the **per-app
playbook**, and the **decisions to front-load** moved to the playbook's
family roadmap.
