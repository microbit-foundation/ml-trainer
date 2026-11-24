# Multiple projects: gaps to close from the Python editor work

This is an AI generated audit as a starting point for bug fix reuse across the
projects, not a plan you can follow blindly.

The Python editor's home page and multiple projects feature (python-editor-v3
PR #1333, merged as 8abae2a1) started from CreateAI's and had more detailed
review. This document lists what that review found that also applies to
ml-trainer, as a suggested sequence of PRs. Python commit hashes refer to
python-editor-v3; read the commit messages, which explain the bugs.

Each gap was checked against ml-trainer's code, but none has been reproduced.
Confirm each one before fixing it.

## Suggested PR sequence

Earlier PRs are small and independent. PR 1 adds the routing spec, and later
PRs extend it.

### 1. Replace history on redirects

Several redirects add a history entry instead of replacing the current one:

- the "no project" redirects in `DataSamplesPage`, `CodePage` and
  `TestingModelPage`
- the `DELETE_PROJECT` handler in `App.tsx`
- `ImportPage.handleOpenProject` and `OpenSharedProjectPage`, which open data
  samples

What users hit:

- Open `/data-samples` in a fresh tab. It sends you home. Back returns to
  `/data-samples`, which sends you home again, so you can't leave the app with
  Back.
- After an import, Back returns to the preview page. Pressing "Open project"
  again makes a duplicate.

The fix is `{ replace: true }` on each call.

Add a `routing.spec.ts` e2e spec:

- [ ] A fresh tab at `/data-samples` goes home, and Back leaves the app.
- [ ] Back after an import or share-open doesn't return to the preview.
- [ ] `/new` redirects home.
- [ ] A malformed share id shows not found.

Later, consider moving the "is there a project?" check into the route loaders
with `redirect()`, as Python's `router.tsx` does, so pages never render without
a project.

### 2. Go home with a message when a project can't be opened

`commonLoaderFunction` in `App.tsx` calls `getProject` on the tab's session
project id. If the project is missing, `assertData` throws and the generic
route error page appears. Reloading doesn't help, because the id stays in
session storage.

The project can be missing when:

- a tab missed the delete broadcast because the browser discarded it
- a duplicated tab copied the session, and the project was later deleted
- creating the project failed, because `newSession` stores the id before the
  write

Opening a project from `HomePage` or `ProjectsPage` has no error handling
either: the click does nothing and the error becomes an unhandled rejection.

Fix:

- Catch the failure, clear the session id, and go home with a toast. Python
  does this in 9cff3e54 and 8b735eac, and shows the toast even when the home
  page is already showing.
- Have the home and projects page opens show a toast and refresh the list.
- Store the session id in `newSession` only after the create succeeds.

Extend the routing spec:

- [ ] A deleted session project goes home with a toast.

Add a short "pages and routing" section to the tech docs covering which loader
redirects when, and the `loaderFuncCalled` guard. Python's version is in
b61798aa (`docs/tech-overview.md`).

### 3. Storage error handling

- **Web migration hang.** In `storage.ts` `getDb`, if `migrateFromLocalStorage`
  throws, `dbInitValuesPromise` never settles. Other callers then wait for ever,
  until the page is reloaded. The migration also doesn't await `tx.done`.
- **Native open stays broken.** In `sqlite-storage.ts`, `dbReady` keeps its
  first failure until the app restarts. Python forgets a failed initialisation
  so the next call retries (5605ecd0).
- **Sentry reports failures twice.** When a request in an `IdbDatabase` method
  rejects, the method throws before returning `tx.done`. `tx.done` then
  rejects with nothing listening, so the failure is reported again as an
  unhandled rejection. Python handles this with the `handled(tx)` helper in
  `projects-db.ts` (7f69fa76).
- **Orphaned rows after a delete (web).** `addAction`, `updateAction`,
  `updateMakeCodeProject` and similar write first and check the project exists
  afterwards. Throwing at that point doesn't abort the idb transaction, so a
  write racing a delete in another tab leaves rows nothing can reach. Check
  first, or abort on throw, and raise a distinct "project deleted" error for
  PR 4 to use. SQLite's foreign keys already prevent this on native.

### 4. Cross-tab sync

- **Renames and duplicates reach the wrong tabs.** `storageWithErrHandling` in
  `store.ts` always broadcasts this tab's open project id. Renaming or
  duplicating a different project from the home page doesn't reach the tab
  that has it open, and that tab can then write the old name back through its
  MakeCode header. Pass the affected id explicitly (compare Python 141d0583
  and 49af6315).
- **Settings changes are skipped.** The settings reload in the `App.tsx`
  listener is an `else if`, so it never runs in tabs that have the project
  open.
- **The reload handler has no error handling.** If the project was deleted or
  the read fails, the rejection is unhandled and the project-list refresh is
  skipped.
- **Deletes are silent.** When the open project is deleted in another tab, the
  tab goes home with no explanation. Python shows a message (facd7b1b).
- **Needs a decision.** Every `RELOAD_PROJECT` sets `isEditorOpen: false`.
  `CodePage` then moves to the testing model page, so any write in another tab
  closes MakeCode here, including the timestamp update when that tab just
  moves between pages. The redirect is deliberate for MakeCode being closed
  elsewhere. Decide whether a reload should close the editor at all, and
  whether moving between pages should broadcast.

### 5. Don't lose edits when a save fails

`storageWriteWithErrHandling` shows a toast and does nothing else, and nothing
listens for `beforeunload`. Each write sends only its own change, and nothing
retries it. With storage full, a new recording stays on screen, then
disappears on reload, project switch or closing the tab, with no warning.
Freeing space doesn't bring it back. Python's handling is in 7f69fa76 and
163b33a6, and `BeforeUnloadDirtyCheck.tsx`.

- [ ] Track "a write failed since the last good save", and warn on
      `beforeunload` while it's set. Small.
- [ ] Recover by writing the whole project after a failure, for example on the
      next edit or a retry action. `replaceActions` plus `saveModel` covers
      most of it. Medium.
- [ ] Stop opening a project from writing:

  - `getProject` is a readwrite transaction because it also sets the
    timestamp. Split the read from the timestamp update so a failed write
    can't fail the open.
  - The `useStore.subscribe` handler re-saves the model whenever it is loaded,
    on every open and every cross-tab reload.

  Both matter most when storage is full and the user is trying to sort things
  out.

- [ ] Before the cross-tab reload overwrites this tab's state, keep or flush
      any edit that failed to save (relates to PR 4).

Add e2e coverage alongside the existing `storage-errors.spec.ts`. Python's
`src/e2e/storage-errors.test.ts` is a template.

### 6. Show an error when importing from microbit.org fails

`ImportPage` catches a failed fetch or parse and only logs it. It builds the
`code-download-error` and `code-format-error` messages and then throws them
away. "Open project" then creates an empty project with the activity's name.
The blank fallback is deliberate, but the user should see the error. Reuse
`OpenSharedProjectPage`'s error state, and log a failure event with a reason,
as `project_share_failure` does.

### 7. Analytics: record where imports come from

- Add `surface` (`home`, `projects` or one of the editor pages) to
  `project_import` and `dataset_load`, matching the other `project_*` events
  (Python 80a518d7). This means threading it through `ProjectDropTarget` and
  `LoadProjectInput`.
- Correct `docs/analytics-events.md`: it describes `dataset_load` as replacing
  the actions, but a home-page pick or any drop creates a new project.
- Decide: dropping a `.json` on data samples makes a new project, but the same
  page's menu replaces the actions. Python made the rule explicit: a drop in
  the editor adds to the open project, a drop on other pages makes a new one.

### 8. Accessibility

- [ ] The header logo link in `DefaultPageLayout` is announced as
      "micro:bit CreateAI". Give it the label "Home" (`home-action`) and hide
      the logos from assistive technology (Python a1bebfa0).
- [ ] In `home-page-actions.spec.ts`, two axe scans run after the app has moved
      to data samples. Move or drop them.
- [ ] Add axe scans for the new-project name dialog, a project card's menu,
      and the rename and delete dialogs (Python c0a10a6a).

Fold in two small `ProjectsPage` fixes:

- `hasSearchQuery={!!query}` should use `query.trim()`.
- `toggleDirection` logs `project_sort` inside a state updater, which runs
  twice under StrictMode.

### 9. E2e fixtures

Python sets flags and cookies through the `context` fixture with
`addInitScript`, so they apply from the first load and survive navigation
(f7d57945).

In ml-trainer:

- `HomePage.goto` loads twice.
- `DataSamplesPage.goto` and `ProjectsPage.goto` set flags after the load, so
  the first load runs without them.
- `ProjectsPage.goto` defaults to an `"open"` flag that doesn't exist, and
  overwrites flags set earlier.
- Cookies are only set when the `homePage` fixture is used, and some specs call
  `setupContext()` again.

The work is a fixture refactor across about six page objects. It is
maintenance, with no user-facing effect.

## Later: shared UI

These are candidates for `@microbit/ui-patterns` and `@microbit/ui`. They need
agreement between the two apps rather than a fix in either.

- **Release notice.** Python's `PageReleaseNotice` is ml-trainer's
  `PreReleaseNotice` with a "Beta" badge, a link to the current release and
  wrapping on narrow screens (c4b7d08f). Share it, with the message, the
  feedback handler and an optional current-release link as props.
- **`ResourceCard`.** Python's version does everything ml-trainer's does and
  more:
  - an optional resource-type label (b69cb2f1)
  - a clamped description and a level indicator
  - `onClick` as an alternative to `url`
  - `imageFit`, and `wide` in place of a numeric aspect ratio
  - full width instead of `w={64}`
- **Near-identical components:**
  - `BackArrow` is byte-identical in both apps.
  - `ActionCard` differs only in taking `children` instead of `textId`.
  - `HomepageBanner` differs in copy and URL. Python uses `LinkButton`, which is
    the better base. ml-trainer combines recipe classes with a separate `css()`
    call, the pattern `ui/docs/hints.md` warns about.
  - `HomepageFooter`: make the app store badges optional props.
- **`ProjectCard` icon placement.** Both apps position the icon by hand
  relative to the checkbox strip (`hasCheckbox`, `short`), in different ways.
  `ProjectCard` could own that, so each app passes only its glyph.
- **`LinkOverlayButton` as title text.** Python's `ResourceCard` has to undo
  the button recipe's sizing to use it in a heading. Add a text variant, and
  combine base and override styles in a single `css()` call.

## Not applicable or low value

- **Safari's 7-day storage eviction (b2da7541).** Web Bluetooth and WebUSB
  aren't available in Safari, so CreateAI can't be used there. iOS users have
  the app, which stores data in SQLite.
- **Write batching and retry fixes (#1423 flush on unload, 141d0583,
  163b33a6).** ml-trainer writes each change immediately, so there is no queue
  to flush. The remaining risk is failed writes (PR 5).
- **Repeated create and duplicate toasts (e97b0122, ac482003).** These are
  specific to Python's idea dialog.
- **Flash of a new card (c78dc4c8).** `newSession` doesn't update the project
  list.
- **Distinct h1s (0660a850) and the toolbar border rule (5001b77a).**
  ml-trainer already has both.
- **Precaching images (96662253).** ml-trainer has no service worker.
- **Python-specific work:** project link renames and parsing, `is_default`,
  the breadcrumb and sidebar header, the Files tab URL, the MicroPython load
  retry, the session-storage migration, the "ideas are moving" notice, and the
  What's new dialog.
