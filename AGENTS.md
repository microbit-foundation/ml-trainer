# AI agent notes

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
2. Run `npm run i18n:reset-translations && npm run i18n:compile`. The reset step rewinds non-English translations to the last regular release tag (e.g. `v1.3.1`, ignoring pre-release suffixes like `-apps.internal.N`) so outdated text of an in-flight message is not preserved in translation bundles as we iterate; the compile step regenerates `src/messages/` via formatjs.

## Vitest

To run a subset of unit tests, pass a file pattern directly (not `--testPathPattern`):

```bash
npm test -- download-machine-browser-default
```

## Playwright

If you run the e2e tests, be sure to run them headlessly via `npm run test:e2e:headless`.

When updating `@playwright/test` in package.json, also update the Docker image version in `.github/workflows/build.yml` to match.
