# AI agent notes

## Formatting

Run `npm run format` to format code with Prettier.

## Internationalization (i18n)

To add or amend UI strings:

1. Edit `lang/ui.en.json`
2. Run `npm run i18n:compile` to update `src/messages/` via formatjs

## Playwright

When updating `@playwright/test` in package.json, also update the Docker image version in `.github/workflows/build.yml` to match.
