# AI agent notes

## Formatting/style

Run `npm run format` to format code with Prettier.

When documenting properties/fields use the following style of comment:

```typescript
/**
 * Example comment text.
 */
```

## Internationalization (i18n)

To add or amend UI strings:

1. Edit `lang/ui.en.json`
2. Run `npm run i18n:compile` to update `src/messages/` via formatjs

## Playwright

If you run the e2e tests, be sure to run them headlessly via `npm run test:e2e:headless`.

When updating `@playwright/test` in package.json, also update the Docker image version in `.github/workflows/build.yml` to match.
