# Analytics events

Analytics events emitted by the app.

## Overview

- Web build emits via gtag. GA4 Enhanced Measurement auto-collects `page_view`, `session_start`, `first_visit`, `user_engagement`, etc. — those are not redocumented here.
- Capacitor build emits via `@capacitor-firebase/analytics`. `screen_view` is emitted manually from the navigate hook (Firebase doesn't auto-collect it inside a WebView).
- Both backends use the same event names and param shapes. Backend code: `src/logging/web.ts`, `src/logging/native.ts`. Source-of-truth call sites are documented per event below.
- Names are snake_case, ≤40 chars (Firebase rule). Param values must be primitives (string ≤100 chars, number, or boolean).
- Every event automatically carries a **`product`** param injected by the logger from `BrandConfig.product`. It's not listed on individual event tables — assume it's always present. Lets dashboards split traffic by product when sibling apps share a GA4 property.

## User properties

Set once on app boot. Auto-attach to every subsequent event for the same user, available as user-scoped breakdowns in GA4.

| Name                     | Values       | Set when                 | Notes                                                                                                                   |
| ------------------------ | ------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `webusb_available`       | `yes` / `no` | App boot, web build only | From `"usb" in navigator`. Web build only — Capacitor uses native USB plugins, where this property would be misleading. |
| `webbluetooth_available` | `yes` / `no` | App boot, web build only | From `navigator.bluetooth.getAvailability()`. Web build only.                                                           |

## Device events

Two state machines drive the device flow: `data_connection` (connecting a micro:bit so the app can read live sensor data — recording, predictions) and `download` (flashing the user's program to a micro:bit). Both emit the same set of `device_*` events tagged with a `task` param so dashboards can split or compare across them. Step-tracking pattern: every user-meaningful state transition emits `device_step`; terminal outcomes get `device_success` / `device_failure`; explicit user closes get `device_exit`.

Every `device_*` event carries:

- **`task`** — `data_connection` / `download`. Which state machine the event came from.
- **`transport`** — the user's hardware/platform setup:

| Value              | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `web_bluetooth`    | Web build, bluetooth-supporting browser (USB-flash + Bluetooth-connect) |
| `native_bluetooth` | Capacitor native bluetooth on iOS/Android                      |
| `radio`            | Radio bridge flow (USB-flash both micro:bits, talk over radio) |

`transport` describes the user's overall setup, not the literal per-event transport. On `task: download` events the actual flash always happens over USB regardless of the value — the dimension is the user-mode lens (so a single `transport=web_bluetooth` filter covers all of that user's events across both state machines).

Browsers with neither WebBluetooth nor WebUSB can't use the connect flow at all. We emit no `device_*` events for that cohort — the `webusb_available` / `webbluetooth_available` user properties capture the segment, and GA4's auto-collected `page_view` records the screen visit.

### `device_step`

Fires on every user-meaningful state transition in either state machine.

| Param  | Type / values                                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `task` | `data_connection` / `download`                                                                                                               |
| `step` | The new step name (see step enum below)                                                                                                      |
| `from` | Previous `step` name, or `idle`                                                                                                              |
| `via`  | State-machine event type that caused the transition (e.g. `connect`, `next`, `back`, `tryAgain`, `deviceDisconnected`, `connectFlashFailure`) |
| `transport` | `web_bluetooth` / `native_bluetooth` / `radio`                                                                                               |

`step` values per task:

| Task | Step values |
| --- | --- |
| `data_connection` | `start`, `connect_cable`, `webusb_flashing_tutorial`, `connect_battery`, `enter_bluetooth_pattern`, `native_bluetooth_tutorial`, `webbluetooth_tutorial`, `bluetooth_connecting`, `connecting_microbits`, `flashing`, `native_bluetooth_troubleshooting`, `try_again_replug`, `try_again_close_tabs`, `try_again_webusb_select`, `try_again_bluetooth_select`, `connect_failed`, `pairing_lost`, `bad_firmware`, `microbit_unsupported`, `manual_flashing_tutorial`, `connection_lost`, `start_over`, `bluetooth_disabled`, `bluetooth_permission_denied`, `location_disabled` |
| `download` | `help`, `choose_microbit`, `connect_cable`, `webusb_flashing_tutorial`, `connect_radio_remote`, `manual_flashing_tutorial`, `enter_bluetooth_pattern`, `native_bluetooth_tutorial`, `native_bluetooth_troubleshooting`, `pairing_lost`, `bluetooth_searching`, `flashing`, `incompatible_device`, `connect_failed`, `unplug_radio_bridge`, `bluetooth_disabled`, `bluetooth_permission_denied`, `location_disabled` |

Source: `connectStepNames` and `flashStepNames` in `src/logging/step-tracking.ts`. Idle / success-marked-elsewhere / transient states are deliberately filtered out.

### `device_success`

Terminal success. Emitted when the state machine reaches its successful end state. Bounds the funnel with the step events.

| Param     | Type / values                                                          |
| --------- | ---------------------------------------------------------------------- |
| `task`    | `data_connection` / `download`                                         |
| `transport`    | `web_bluetooth` / `native_bluetooth` / `radio`                         |
| `actions` | int — count of actions in the trained model (download task only)       |
| `samples` | int — total sample count across all actions (download task only)       |

For `task: data_connection`, `actions` and `samples` aren't set — connecting doesn't carry that context. For `task: download`, they describe the program that was flashed.

### `device_failure`

Emitted alongside the step into a failure-state screen, so failure-rate analysis is a single query without joining step events to event payloads.

| Param     | Type / values                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task`    | `data_connection` / `download`                                                                                                                                                                                |
| `at_step` | The step the user was on when the failure was reported (or `unknown` if it fell from a transient/non-user-meaningful state)                                                                                   |
| `code`    | DeviceError code: `firmware-update-required`, `disabled`, `permission-denied`, `location-disabled`, `no-device-selected`, `device-in-use`, `pairing-information-lost`, etc. Falls back to `unknown` if unset. |
| `transport`    | `web_bluetooth` / `native_bluetooth` / `radio`                                                                                                                                                                |

### `device_exit`

User pressed close on the dialog mid-flow.

| Param     | Type / values                                  |
| --------- | ---------------------------------------------- |
| `task`    | `data_connection` / `download`                 |
| `at_step` | The step they exited from                      |
| `reason`  | `close` (only value emitted today)             |
| `transport`    | `web_bluetooth` / `native_bluetooth` / `radio` |

### `device_disconnect`

Fires when the data connection ends. Always tied to `data_connection` (downloads don't have a sustained connection to disconnect from), so no `task` param.

| Param    | Type / values                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------- |
| `reason` | `user` (LiveGraphPanel disconnect button) / `unknown` (state machine entered `ConnectionLost`) |
| `transport`   | `web_bluetooth` / `native_bluetooth` / `radio`                                                 |

`reason: unknown` covers user-perceived drops only — brief auto-reconnects that succeed don't trip it. Range / battery / reset / firmware causes can't be distinguished from JS today.

## Dataset events

| Event           | Params                        | When fired                                                             |
| --------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `dataset_save`  | `actions:int`, `samples:int`  | User saved the dataset to a `.json` file                               |
| `dataset_load`  | `source: drop \| file_picker` | User imported a `.json` dataset (actions-only replace)                 |
| `dataset_clear` | —                             | User cleared all actions/samples (the destructive "delete all" button) |
| `action_create` | —                             | User added a new action to the dataset                                 |
| `action_delete` | —                             | User deleted a single action and its samples                           |

## Model events

| Event         | Params                       | When fired                                                                                                                                                          |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model_train` | `actions:int`, `samples:int` | User started training a model. Fires at the start of training. |

## Project events

CRUD events from the home page and projects page carry a `surface` param so PMs can compare which entry point drives behaviour. Each event below lists which `surface` values are actually emitted today.

### `project_create`

| Param     | Values                                                                                   |
| --------- | ---------------------------------------------------------------------------------------- |
| `surface` | `home` (only value emitted today; ProjectsPage doesn't currently expose a Create action) |

### `project_save`

User saved the compiled `.hex` (their full work — program plus trained model) to disk or via the native share sheet. Distinct from `dataset_save`, which saves just the recorded movement data.

| Param         | Values                       |
| ------------- | ---------------------------- |
| `actions`     | int                          |
| `samples`     | int                          |
| `destination` | `download` / `share`         |

### `project_open`

| Param     | Values              |
| --------- | ------------------- |
| `surface` | `home` / `projects` |

### `project_rename`

| Param     | Values              |
| --------- | ------------------- |
| `surface` | `home` / `projects` |

### `project_duplicate`

| Param     | Values              |
| --------- | ------------------- |
| `surface` | `home` / `projects` |

### `project_delete`

Bulk-aware — `count` covers both single delete and multi-select bulk delete in one event.

| Param     | Values                                                     |
| --------- | ---------------------------------------------------------- |
| `count`   | int (1 for single delete; >1 for bulk, projects page only) |
| `surface` | `home` / `projects`                                        |

### `project_search`

Projects page only. Fires once per intentional search (debounced ~400ms after the last keystroke), not per keypress. No params.

### `project_sort`

Projects page only. Fires when the user changes sort field or direction.

| Param       | Values                                                                             |
| ----------- | ---------------------------------------------------------------------------------- |
| `field`     | `name` / `timestamp` (raw `OrderByField` values; `timestamp` = last-modified time) |
| `direction` | `asc` / `desc`                                                                     |

### `project_import`

User imported a `.hex` project from a file. Pairs with `dataset_load` (which fires on the `.json` branch). Logging is inside the parsed-format branch, so this only fires once the file is known to be a hex.

| Param    | Values                 |
| -------- | ---------------------- |
| `source` | `drop` / `file_picker` |

### `project_share_open`

Conversion event for share-link landings. Pair with auto-collected `page_view` of `/share/*` to compute conversion rate. No params.

### `project_share_failure`

Reliability signal for the share-link preview pipeline. Sentry has the full request URL and stack trace for individual debugging.

| Param    | Values                          |
| -------- | ------------------------------- |
| `reason` | `network` / `parse` / `unknown` |

## Editor events

| Event                 | Params | When fired                                                                  |
| --------------------- | ------ | --------------------------------------------------------------------------- |
| `editor_open`         | —      | User opened the MakeCode editor                                             |
| `editor_open_failure` | —      | MakeCode editor failed to load within the timeout. Pairs with `editor_open`. |

## Removed / migrated events

Migration notes from the previous (UA-shaped) events. Listed for grep-ability when reading old dashboards or PRs.

| Old name                                                                                                   | Status                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `boot`                                                                                                     | Dropped. Capability flags moved to `webusb_available` / `webbluetooth_available` user properties. `session_start` auto-fires. |
| `WebUSB-available`, `WebBluetooth-available`                                                               | Dropped (fan-outs from `boot`). Replaced by user properties.                                                                  |
| `connect-user`                                                                                             | Replaced by first emission of `device_step` with `task: data_connection`                                                      |
| `disconnect-user`                                                                                          | Renamed to `device_disconnect`; widened with `reason` param to also capture unexpected drops                                  |
| `dataset-save` / `model-train` / `hex-download` (plus their `-actions` / `-samples` fan-outs)              | Consolidated to a single event each with raw numeric params; UA-era bucketing removed                                         |
| `device_connect_*` / `device_flash_*` / `device_flash`                                                     | Collapsed to `device_step` / `device_success` / `device_failure` / `device_exit` with a `task` param distinguishing the state machine. `stage` dropped from failures (replaced by `at_step` which is finer-grained). |
| `hex-save`                                                                                                 | Renamed to `project_save`; consolidated from `-actions` / `-samples` fan-outs; `save_type` param renamed to `destination`     |
| `dataset-delete`                                                                                           | Renamed to `dataset_clear`                                                                                                    |
| `drop-load` / `file-upload`                                                                                | Split: `dataset_load` (`.json` branch) and `project_import` (`.hex` branch). Logging moved inside the parsed-format branches. |
| `session-open-new`                                                                                         | Renamed to `project_create`                                                                                                   |
| `import-shared-project-start` / `import-shared-project-preloaded`                                          | Dropped. `page_view` of `/share/*` covers landings; intermediate preview-success was not actionable enough to keep.           |
| `import-shared-project-failed`                                                                             | Renamed to `project_share_failure`; `share_id` dropped (Sentry has the request URL).                                          |
| `import-shared-project-complete`                                                                           | Renamed to `project_share_open`; `share_id` dropped (per-share cardinality not useful as a GA4 dimension).                    |
| `edit-in-makecode`                                                                                         | Renamed to `editor_open`                                                                                                      |
| `makecode-load-failed`                                                                                     | Renamed to `editor_open_failure`                                                                                              |
