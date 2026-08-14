# AI agent notes

## Styling / branded builds / verification

This app uses react-aria-components + Panda CSS via `@microbit/ui`.
**Read `../ui/docs/hints.md` before styling/theming/UI work.**

- **Branded build locally**: build the sibling `../ml-trainer-microbit`
  package (`npm run build` there → `dist/panda-preset.js`) and make it
  resolvable as `node_modules/@microbit-foundation/ml-trainer-microbit`
  (symlink or `npm link`). Without it you get the OSS default. CI installs
  the version pinned in `workflow-config.json`.
- **Local `@microbit/ui` development**: symlink `node_modules/@microbit/ui`
  to `../ui/packages/ui`; a plain `npm i` restores the registry version.
- **After bumping the pinned `@microbit/ui` version**, follow "Upgrading in
  an app" in `../ui/packages/ui/README.md`.
- **After changing or (re)linking either sibling package, do a _clean_
  Panda regen**: `rm -rf styled-system && npm run panda`. Incremental
  codegen doesn't detect external preset changes.
  Restart the dev server too, and `rm -rf node_modules/.vite`: Vite serves
  the old pre-bundle of the package otherwise, and a new export fails as
  "does not provide an export named X" on a blank page.
- Compare against the live branded deployment:
  `npm run build && npm run preview` vs https://createai.microbit.org/.
- E2e notes: run the full suite only on a stable tree (mid-run source or
  Panda regen edits invalidate modules → bogus timeouts); the radio
  reconnection specs are flaky under full parallel load on some machines —
  rerun a failing spec in isolation before suspecting a regression.

## Formatting/style

Run `npm run format` to format code with Prettier.

New files should have a copyright header with the current year which is 2026. Use an existing file as a template but update the year.

When documenting properties/fields use the following style of comment:

```typescript
/**
 * Example comment text.
 */
```

## Internationalization (i18n)

To add or amend UI strings:

1. Edit `lang/ui.en.json` (and `lang/ui.en-us.json` — we maintain the en-US copy manually).
2. Run `find lang -type f -not -name 'ui.en.json' -not -name 'ui.en-us.json' | while read n; do git checkout main -- $n; done && npm run i18n:compile` to update `src/messages/` via formatjs and ensure that outdated text of new message is not preserved in non-English translation bundles as we iterate on the text.

The compile also merges `@microbit/ui`'s shipped `lang/` catalogs into each locale's output, so `ui.*`-prefixed messages in `src/messages/` are expected and don't come from this repo's `lang/`.

## Vitest

To run a subset of unit tests, pass a file pattern directly (not `--testPathPattern`):

```bash
npm test -- download-machine-browser-default
```

## Playwright

If you run the e2e tests, be sure to run them headlessly via `npm run test:e2e:headless`.

When updating `@playwright/test` in package.json, also update the Docker image version in `.github/workflows/build.yml` to match.
