# Analytics events

Analytics events emitted by the app.

## Overview

- Web build emits via gtag. GA4 Enhanced Measurement auto-collects `page_view`, `session_start`, `first_visit`, `user_engagement`, etc. — those are not redocumented here.
- Capacitor build emits via `@capacitor-firebase/analytics`. `screen_view` is emitted manually from the navigate hook (Firebase doesn't auto-collect it inside a WebView).
- Both backends use the same event names and param shapes. Backend code: `src/logging/web.ts`, `src/logging/native.ts`. Source-of-truth call sites are documented per event below.
- Names are snake_case, ≤40 chars (Firebase rule). Param values must be primitives (string ≤100 chars, number, or boolean).

## User properties

Set once on app boot. Auto-attach to every subsequent event for the same user, available as user-scoped breakdowns in GA4.

| Name                     | Values       | Set when                 | Notes                                                                                                                   |
| ------------------------ | ------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `webusb_available`       | `yes` / `no` | App boot, web build only | From `"usb" in navigator`. Web build only — Capacitor uses native USB plugins, where this property would be misleading. |
| `webbluetooth_available` | `yes` / `no` | App boot, web build only | From `navigator.bluetooth.getAvailability()`. Web build only.                                                           |

## Device events

The connect and flash flows are driven by state machines. Step-tracking pattern: every user-meaningful state transition emits a `*_step` event; terminal outcomes get `_success` / `_failure` events; explicit user closes get `_exit`.

Every `device_*` event carries a **`flow`** param identifying the transport in use. This is the primary cohort dimension for reliability analysis:

| Value              | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `web_bluetooth`    | WebBluetooth API on web (USB-flash + Bluetooth-connect)        |
| `native_bluetooth` | Capacitor native bluetooth on iOS/Android                      |
| `radio`            | Radio bridge flow (USB-flash both micro:bits, talk over radio) |

Browsers with neither WebBluetooth nor WebUSB can't use the connect flow at all. We emit no `device_*` events for that cohort — the `webusb_available` / `webbluetooth_available` user properties capture the segment, and GA4's auto-collected `page_view` records the screen visit.

### `device_connect_step`

Fires on every user-meaningful transition in the data-connection flows.

| Param  | Type / values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `step` | One of: `start`, `connect_cable`, `webusb_flashing_tutorial`, `connect_battery`, `enter_bluetooth_pattern`, `native_bluetooth_tutorial`, `webbluetooth_tutorial`, `bluetooth_connecting`, `connecting_microbits`, `flashing`, `native_bluetooth_troubleshooting`, `try_again_replug`, `try_again_close_tabs`, `try_again_webusb_select`, `try_again_bluetooth_select`, `connect_failed`, `pairing_lost`, `bad_firmware`, `microbit_unsupported`, `manual_flashing_tutorial`, `connection_lost`, `start_over`, `bluetooth_disabled`, `bluetooth_permission_denied`, `location_disabled` |
| `from` | Previous `step` name, or `idle`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `via`  | State-machine event type that caused the transition (e.g. `connect`, `next`, `back`, `tryAgain`, `deviceDisconnected`, `connectFlashFailure`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `flow` | `web_bluetooth` / `native_bluetooth` / `radio`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Source: `connectStepNames` in `src/logging/step-tracking.ts`. `Idle`, `Connected`, and `WebUsbChooseMicrobit` are deliberately filtered out (idle / success-marked-elsewhere / transient OS dialog).

### `device_connect_success`

Terminal success. Emitted when the state machine enters `Connected`. Bounds the funnel with the step events.

| Param  | Type / values                                  |
| ------ | ---------------------------------------------- |
| `flow` | `web_bluetooth` / `native_bluetooth` / `radio` |

### `device_connect_failure`

Emitted alongside the step into a failure-state screen. Failure-rate-by-stage analysis is a single GA4 query without joining step events to event payloads.

| Param   | Type / values                                                                                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stage` | `connect` (from `connectFlashFailure`) / `flash` (from `flashFailure`) / `data` (from `connectDataFailure`)                                                                                                   |
| `code`  | DeviceError code: `firmware-update-required`, `disabled`, `permission-denied`, `location-disabled`, `no-device-selected`, `device-in-use`, `pairing-information-lost`, etc. Falls back to `unknown` if unset. |
| `flow`  | `web_bluetooth` / `native_bluetooth` / `radio`                                                                                                                                                                |

### `device_connect_exit`

User pressed close on the connect dialog mid-flow.

| Param     | Type / values                                                                 |
| --------- | ----------------------------------------------------------------------------- |
| `at_step` | The step they exited from (any value from the `device_connect_step.step` set) |
| `reason`  | `close` (only value emitted today)                                            |
| `flow`    | `web_bluetooth` / `native_bluetooth` / `radio`                                |

Distinguishing `back_to_home` / `dismiss` / `escape` would need additional state-machine events to disambiguate.

### `device_disconnect`

Fires when the data connection ends.

| Param    | Type / values                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------- |
| `reason` | `user` (LiveGraphPanel disconnect button) / `unknown` (state machine entered `ConnectionLost`) |
| `flow`   | `web_bluetooth` / `native_bluetooth` / `radio`                                                 |

`reason: unknown` covers user-perceived drops only — brief auto-reconnects that succeed don't trip it. Range / battery / reset / firmware causes can't be distinguished from JS today.

### `device_flash_step`

Same shape as `device_connect_step`, for the download/flash state machine.

| Param  | Type / values                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `step` | One of: `help`, `choose_microbit`, `connect_cable`, `webusb_flashing_tutorial`, `connect_radio_remote`, `manual_flashing_tutorial`, `enter_bluetooth_pattern`, `native_bluetooth_tutorial`, `native_bluetooth_troubleshooting`, `pairing_lost`, `bluetooth_searching`, `flashing`, `incompatible_device`, `connect_failed`, `unplug_radio_bridge`, `bluetooth_disabled`, `bluetooth_permission_denied`, `location_disabled` |
| `from` | Previous `step` name, or `idle`                                                                                                                                                                                                                                                                                                                                                                                             |
| `via`  | State-machine event type                                                                                                                                                                                                                                                                                                                                                                                                    |
| `flow` | `web_bluetooth` / `native_bluetooth` / `radio`                                                                                                                                                                                                                                                                                                                                                                              |

Source: `flashStepNames` in `src/logging/step-tracking.ts`. `None` is filtered out (idle).

### `device_flash`

Terminal success: program flashed to device. Cross-app event name — kept generic so any micro:bit app emits the same event regardless of program type.

| Param     | Type / values                                  |
| --------- | ---------------------------------------------- |
| `actions` | int — count of actions in the trained model    |
| `samples` | int — total sample count across all actions    |
| `flow`    | `web_bluetooth` / `native_bluetooth` / `radio` |

Emitted from `performFlash` on `flashSuccess`.

### `device_flash_failure`

| Param   | Type / values                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `stage` | `connect` (from `connectFlashFailure`) / `flash` (from `flashFailure`). No compile/verify stages — the `.hex` is pre-compiled. |
| `code`  | DeviceError code, or `unknown`                                                                                                 |
| `flow`  | `web_bluetooth` / `native_bluetooth` / `radio`                                                                                 |

### `device_flash_exit`

| Param     | Type / values                                  |
| --------- | ---------------------------------------------- |
| `at_step` | The step they exited from                      |
| `reason`  | `close`                                        |
| `flow`    | `web_bluetooth` / `native_bluetooth` / `radio` |

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

## Hex save events

| Event      | Params                                                         | When fired                                                                                                                         |
| ---------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `hex_save` | `actions:int`, `samples:int`, `destination: download \| share` | User saved the compiled program `.hex` file. `destination` describes where the hex went (download to disk vs. native share sheet). |

## Project events

CRUD events from the home page and projects page carry a `surface` param so PMs can compare which entry point drives behaviour. Each event below lists which `surface` values are actually emitted today.

### `project_create`

| Param     | Values                                                                                   |
| --------- | ---------------------------------------------------------------------------------------- |
| `surface` | `home` (only value emitted today; ProjectsPage doesn't currently expose a Create action) |

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
| `connect-user`                                                                                             | Replaced by first emission of `device_connect_step`                                                                           |
| `disconnect-user`                                                                                          | Renamed to `device_disconnect`; widened with `reason` param to also capture unexpected drops                                  |
| `dataset-save` / `model-train` / `hex-save` / `hex-download` (plus their `-actions` / `-samples` fan-outs) | Consolidated to a single event each with raw numeric params; UA-era bucketing removed                                         |
| `dataset-delete`                                                                                           | Renamed to `dataset_clear`                                                                                                    |
| `drop-load` / `file-upload`                                                                                | Split: `dataset_load` (`.json` branch) and `project_import` (`.hex` branch). Logging moved inside the parsed-format branches. |
| `session-open-new`                                                                                         | Renamed to `project_create`                                                                                                   |
| `import-shared-project-start` / `import-shared-project-preloaded`                                          | Dropped. `page_view` of `/share/*` covers landings; intermediate preview-success was not actionable enough to keep.           |
| `import-shared-project-failed`                                                                             | Renamed to `project_share_failure`; `share_id` dropped (Sentry has the request URL).                                          |
| `import-shared-project-complete`                                                                           | Renamed to `project_share_open`; `share_id` dropped (per-share cardinality not useful as a GA4 dimension).                    |
| `edit-in-makecode`                                                                                         | Renamed to `editor_open`                                                                                                      |
| `makecode-load-failed`                                                                                     | Renamed to `editor_open_failure`                                                                                              |
