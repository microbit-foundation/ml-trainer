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
- `src/shared-ui/*.recipe.ts` = config recipes colocated with their components:
  `button` (11 variants), `heading` (+ `marketing` variant), `dialog` (slot
  recipe, incl. `full` size with safe-area/gradient), `menu` (slot recipe).
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
- **Cookie banner** appears in every fresh headless profile (localhost too).
  Decline non-essential: click "Manage cookies" then the save/confirm button.
- Reach real states, not just landing pages: create projects via the UI, name
  actions, open menus/dialogs/pickers, select checkboxes
  (`.click({ force: true })` — the input is visually hidden behind the styled
  control in both stacks), focus tooltips, resize the viewport for
  tablet/mobile variants. Screenshot each state on both sides.
- Beyond screenshots, `page.evaluate` probes settle disputes pixels can't:
  computed styles (e.g. corner radii at the SortInput seam), element sizes
  (the 0x0 emoji), and canvas `getImageData` painted-pixel counts (LiveGraph).
  When local and live disagree, probe *both* and diff the numbers.
- Watch `pageerror`/console in the probe scripts — a blank screenshot usually
  means a crash or suspended tree, not a style bug.

Process rules learned the hard way:
- **Run the full e2e suite only on a stable tree.** The Playwright webServer is
  a vite dev server; editing source (or regenerating Panda output) mid-run
  invalidates modules / re-optimises deps and produces bogus timeout failures.
  A new react-aria entry-point import also triggers a one-off dep
  re-optimisation — expect the first run after such a change to be flaky-slow.
- The radio reconnection specs are flaky under full parallel load on some
  machines (reproduced on unmodified main); rerun the failing spec in
  isolation before suspecting the migration.
- Fixes found by comparison so far: banner short-height breakpoint, helper
  text line-height, sort-control seam radii, missing extraction (exclude
  list), border shorthand colour, LiveGraph canvas timing — i.e. the loop
  catches real bugs; don't skip it. Formalising it is "Fidelity harness"
  below.

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
  before the team/CI can build the branded app. The dev server's `fs.allow`
  includes the theme package's realpath (vite.config.ts) because with a
  symlink the brand font/image assets resolve outside the project root and
  Vite would otherwise 403 them — dev-only, builds are unaffected.

## Next steps (recommended order)
1. ✅ **Settings + Help `Menu` → RAC** — done. shared-ui `Menu` (`MenuTrigger`/
   `MenuList`/`MenuItem`/`MenuDivider`) built on RAC, plus a shared-ui
   `IconButton` (square, `px:0`, `isRound`) for the action-bar triggers (see
   `ActionBar/action-bar-menu-button.ts` for the shared white/round/focus css).
   `SettingsMenu`/`LanguageMenuItem`/`SettingsMenuItem` and `HelpMenu`/
   `HelpMenuItems` migrated; link items use RAC `MenuItem` `href`/`target`/`rel`,
   actions use `onAction`. LanguageDialog focus hack removed (RAC restores focus
   to the trigger on close — verified).
1. ✅ **All remaining menus → RAC** — done; `components/Menu.tsx` (back-button
   wrapper) and the unused `ToolbarMenu` deleted. `DataSamplesMenu`,
   `ProjectCardActions`, `ActionDataSamplesCard` (record options) and
   `TestingModelPage` (MakeCode split button) use shared-ui `MenuTrigger`.
   `MoreMenuButton` rebuilt on shared-ui `IconButton` (divider is
   `1px solid` **currentColor** — Chakra's `borderLeft="1px"` resolved via the
   `borders` scale, so it reads white on filled variants). The split buttons
   keep Chakra `ButtonGroup isAttached` for now — its child selectors style the
   RAC trigger too. Notable:
   - shared-ui `MenuItem` now wraps an icon-item's children in a `flex:1`
     `label` slot span (Chakra parity), so block children (two stacked `Text`s
     in the record-options items) lay out vertically.
   - `LoadProjectMenuItem` deleted: the hidden `LoadProjectInput` must live
     *outside* the menu because RAC popovers unmount on close (Chakra kept the
     list mounted), which would drop the file input's change event mid-pick.
     `DataSamplesMenu` renders the input as a sibling and the item calls
     `chooseFile` via ref.
   - `DataSamplesMenu`'s Android save toast now uses shared-ui `useToast`;
     Chakra's `id`-dedup and per-call `position` aren't supported (region is
     top-centre; repeat saves within the timeout can stack duplicates).
1. ✅ **App shell** — done. shared-ui `Drawer` (`DrawerHeader`/`DrawerBody`;
   `Drawer.recipe.ts` slot recipe, `placement` left/right via `staticCss`) built
   on RAC ModalOverlay/Modal/Dialog; the drawer has no title so it takes a
   required `aria-label`. `onCloseComplete` (Chakra parity, used to defer
   navigation until the exit animation ends) is implemented with an
   unmount-callback sentinel inside the overlay — RAC keeps the tree mounted
   until the exit transition finishes. `NavigationDrawer` and
   `DefaultPageLayout` fully ported (incl. `ProjectToolbarItems`' native share
   menu, previously a raw Chakra Menu *without* back-button integration — now
   shared-ui `MenuTrigger`, so Android back works there too). shared-ui
   additions: `Divider`, Button `leftIcon`/`rightIcon` now wrapped in a
   Chakra-style spaced icon span (`marginEnd`/`marginStart` 2) — no more
   call-site `gap` compensation. `BackArrow` is a plain Panda-styled svg.
   `useNativeTabletBreakpoint` now uses shared-ui `useBreakpointValue`.
   Verified against live at desktop/tablet widths incl. both drawer placements.
1. ✅ **Self-contained dialogs** — done. `ConfirmDialog` (shared-ui Modal with
   `role="alertdialog"`, `isCentered`, `autoFocus` on the least-destructive
   button) and `NameProjectDialog` (first form) ported. shared-ui additions:
   - Modal grew `role`, `isCentered` (a `centered` recipe variant),
     `onCloseComplete` + `finalFocusRef` (unmount sentinel; final focus applied
     on rAF after RAC's own restore), and `ModalCloseButton` (closeTrigger
     slot; localised via `close-action` — Chakra's was hardcoded "Close").
   - `TextField` (+ `TextField.recipe.ts` `field` slot recipe): RAC
     TextField/Label/Input/Text/FieldError collapsing Chakra's
     FormControl/FormLabel/Input/FormHelperText/FormErrorMessage. Focus keys
     off `data-focused` (react-aria treats text-input focus as
     keyboard-visible, like Chakra's `_focusVisible` on inputs); focus ring
     wins over invalid styling, as in Chakra.
   - Button `warningSolid` variant (Chakra solid+red; same values as `record`
     today but separate so recording UI and destructive actions can diverge).
   - **RAC popovers have `role="dialog"`** (menus included, and they linger
     briefly with `data-exiting` while animating out), so a bare Playwright
     `getByRole("dialog")` can hit strict-mode ambiguity when a dialog opens
     from a menu. e2e page objects now use the `modalDialog()` helper
     (`src/e2e/app/shared.ts`) which scopes to `<section>` — both Chakra and
     shared-ui modals render on a section; popovers are divs.
   - Accepted interaction diff: the auto-focused Cancel button in
     `ConfirmDialog` shows its focus ring even after mouse interaction
     (Chakra focused it invisibly).
1. ✅ **HomePage** — done, bottom-up: carousel stack (`CarouselRow`,
   `SwiperCarousel`, `SwiperCarouselButtons`, `CarouselButton`),
   `ResourceCard`, `ClickableTooltip` (+`InfoToolTip`), `HomepageBanner`,
   `ProjectCard`, and the page. New shared-ui: `Card`/`CardBody`
   (`Card.recipe.ts`, elevated + outline), `LinkBox`/`LinkOverlay`, `Image`,
   `AspectRatio` re-export; Tooltip placements widened (`left/right top/bottom`).
   `ClickableTooltip` is now RAC-based (controlled shared-ui Tooltip + RAC
   `Focusable` around the trigger span; document-level Escape listener matches
   Chakra's closeOnEsc) — it's shared with DataSamples/Testing surfaces.
   Hard-won:
   - **Chakra's LinkOverlay-over-Button pattern needs two things in RAC-land**:
     (1) react-aria's usePress cancels presses that land outside the button's
     *bounding rect*, so an `_before` inset overlay silently doesn't work on a
     RAC `<Button>` — use a plain `<button>` with the `button` recipe class;
     (2) the button recipe's base sets `position: relative`, which re-anchors
     the overlay to the button itself — set `position: static` at the call
     site (this is exactly what Chakra's LinkOverlay did over its Button).
   - New `_shortHeight` preset condition (`@media (max-height: 800px)`)
     replaces `src/responsive.ts`'s cross-file constant, which Panda's
     extractor can't resolve. `HomepageBanner` keeps its own tighter local
     700px query (same-file consts do resolve).
   - Idiomatic-RAC follow-up (deferred, deliberate UX change): card
     collections as RAC `GridList` — whole-item press targets without the
     overlay hack, arrow-key navigation, and built-in multi-selection that
     would replace the projects page's checkbox + skip-to-toolbar wiring.
     Doesn't fit the Swiper-managed home carousel DOM; best tried on the
     projects page grid.
1. ✅ **ProjectsPage** — done: `ProjectsToolbar`, `Search`, `SortInput`, the
   page (grid via Panda `Grid`; Chakra `Slide` replaced with a fixed
   bottom-sheet div + transform transition), and the rest of
   `ProjectCardActions` (checkbox + skip-to-toolbar button; the skip button
   uses RAC `excludeFromTabOrder` instead of `tabIndex=-1`). GridList redesign
   stays parked until the migration is complete. New shared-ui, extracted
   after review feedback that the first pass leaned on call-site css:
   - `input` config recipe (Chakra outline field) shared by new `Input`,
     `NativeSelect` and TextField's input — selectors match both native
     pseudo-classes and RAC data attributes.
   - `InputGroup`/`InputLeftElement`/`InputRightElement`, `ButtonGroup`
     (`isAttached`; also replaced the two remaining Chakra ButtonGroups in the
     split buttons), `Checkbox` (Chakra md/blue; `borderColor: inherit` on the
     control so call sites tint via the root, like Chakra), and
     `LinkOverlayButton` (encapsulates the plain-button + `position: static` +
     `_before` overlay pattern and its rationale).
   Convention reminder: shared-ui components take a `css` prop / recipes;
   call-site `css()` is for page layout and true one-offs only.
1. ✅ **DataSamplesPage** — done (page, `DataSamplesTable`/`Row`, `HeadingGrid`
   (className API; TestingModelTable call site updated), `ActionNameCard`,
   `ActionDataSamplesCard` (Chakra-free; `Portal containerRef` →
   `createPortal` with a state ref), `DataSamplesTableHints`,
   `Emoji`/`EmojiArrow`/`UpCurveArrow`/`AlertIcon` (plain svgs),
   `LedIcon`/`LedIconSvg` (`token()` instead of `useToken`), `LedIconPicker`
   (RAC DialogTrigger/Popover), `LiveGraphPanel`/`LiveGraph`/`LiveGraphLabels`/
   `PredictedAction`, `ShowGraphsCheckbox`). Still-Chakra dialogs
   (Recording/TrainModelFlow/Welcome/ConnectFirst etc.) are a later pass.
   New shared-ui: `CloseButton` (plain button so pseudo-element hit areas
   work), Toast `id` dedup (Chakra parity for repeat-toast suppression).
   Emotion keyframes moved to preset `keyframes` (tada, spin3d,
   microbitWobble, ledTurnOn/Off, recordingFlash);
   `usePrefersReducedMotion` replaced with `prefers-reduced-motion` media
   queries in css. New `useElementSize` hook replaces Chakra's `useSize` —
   it must measure synchronously in a layout effect: LiveGraph paints its
   only frame while stopped, and an async first measure resizes (= clears)
   the canvas after that paint.
   Hard-won:
   - **Removing Emotion from a file isn't enough — also remove it from
     `panda.config.ts`'s `exclude` list**, or Panda silently skips extraction
     for the whole file — class names are applied but no CSS rules exist for
     them (found when the hints' Emoji svg rendered at 0x0: `w_16 h_16` in
     the class attribute, no matching rules in styled-system.css).
   - Border shorthand + separate `borderColor` in one css object is
     order-dependent (`border-top: 3px solid` implies currentColor); use
     width/style longhands with `borderColor`.
1. ✅ **TestingModelPage** — done (page remainder, `TestingModelTable`,
   `ActionCertaintyCard`, `PercentageMeter`/`PercentageDisplay`,
   `CodeViewCard`/`CodeViewDefaultBlockCard`/`CodeViewDefaultBlock`,
   `ButtonWithLoading`). New shared-ui: `Slider` (`Slider.recipe.ts`; RAC
   Slider with track/filledTrack/thumb slots and a `mark` shown on
   focus-within, Chakra md styling) and `Spinner` (border-based, sizes
   sm/md). `ButtonWithLoading` rebuilt on shared-ui Button + Spinner and
   keeps the `onClick` prop name so its four still-Chakra dialog consumers
   are untouched. New `usePrevious` hook replaces Chakra's.
   Verified Chakra-build vs Panda-build (this page is unreachable on live
   without a device): a temporary spec on the e2e mock fixtures screenshots
   the page before/after `git stash` — a working preview of the fidelity
   harness. Accepted diffs: the slider thumb shows its focus ring where
   Chakra's was invisible (same react-aria focus-visible class of diff as
   ConfirmDialog), ~3px internal shift in the certainty card, and the
   MakeCode loading skeleton is an opacity pulse rather than Chakra's
   shimmer.
1. **Dialog flows** (in progress) — chunk 1 ✅: the connection flow.
   Modal grew `motionless` (Chakra's motionPreset="none"; the connect flow
   steps between dialogs without animation) and `ModalHeader` a `level` prop;
   Chakra's `closeOnOverlayClick={false}` maps to `isDismissable={false}`
   (react-aria treats Escape separately, so it still closes, as in Chakra).
   Ported: `ConnectContainerDialog` (the shared shell for 12 step dialogs),
   all 12 step dialogs (DownloadChooseMicrobit's radio cards are RAC
   RadioGroup/Radio with render-prop state classes), the 10 error/
   troubleshoot dialogs (batch-converted: unwrap ModalOverlay/Content, map
   props, onClick→onPress — typecheck surfaced the rest), `ExternalLink`
   (Chakra's ExternalLinkIcon glyph inlined; uses shared-ui Link so
   jsx-no-target-blank recognises the rel) and `DialogFooterLink`.
   shared-ui additions: `UnorderedList`/`OrderedList`.
   Deferred within the flow: `BluetoothPatternInput` (301 lines of
   recently-reworked screen-reader-accessible radio machinery, #926 — its
   own pass).
   Chunk 2 (next): Recording, progress dialogs (needs a ProgressBar
   primitive), Save*/Download*/Loading*, Welcome/About/Settings/Feedback/
   TrainModel*, Tour, ImportError, NotCreateAiHex, MakeCodeLoadError,
   IncompatibleEditorDevice — then EditableName, ProjectPreview, the
   tour/animation components.
5. **Brand-diff** (see gotcha #6) — catalogue all OSS/private theme divergences
   and token-drive them up front.
6. **Fidelity harness**: a Playwright visual-regression pass (Chakra build vs
   Panda build) or a component gallery, to replace the manual screenshot loop.

## Key files
- `panda.config.ts`, `bin/gen-chakra-tokens.mjs`, `bin/unlayer-panda.mjs`,
  `bin/panda-dev.mjs`
- `src/deployment/default/{panda-preset,chakra-tokens}.ts`,
  `src/shared-ui/*.recipe.ts` (`Menu.recipe.ts` holds the `menu` slot recipe;
  `Button.recipe.ts` the `plain` button variant)
- `src/shared-ui/**` (incl. `Menu.tsx`)
- `src/components/LanguageDialog.tsx`, `src/components/ModalFooterContent.tsx`,
  `src/components/{SettingsMenu,LanguageMenuItem,SettingsMenuItem}.tsx`,
  `src/components/{HelpMenu,HelpMenuItems}.tsx`,
  `src/components/ActionBar/action-bar-menu-button.ts` (migrated);
  `src/App.tsx` (`ToastProvider` mounted, `ChakraProvider` retained)
- Private: `../ml-trainer-microbit/src/panda-preset.ts`, its `package.json`
  (`./panda-preset` export)
