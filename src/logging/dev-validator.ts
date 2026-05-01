/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Event, Logging, Navigation } from "./logging";

/**
 * Firebase Analytics has stricter naming and value rules than gtag.
 * This wrapper warns at console-level when an event would be silently
 * renamed, dropped, or truncated by the Firebase backend, so issues
 * surface during web development rather than after the apps build
 * lands in front of a tester. Production is silent — analytics must
 * never crash calling code.
 *
 * https://firebase.google.com/docs/reference/cpp/group/event-names
 * https://firebase.google.com/docs/reference/cpp/group/parameter-names
 */
const NAME_RE = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;

// Firebase reserves these event names — if we emit them they will be
// dropped on Firebase's side. List per Firebase Analytics docs (the
// ones likely to collide with our taxonomy).
const RESERVED_EVENT_NAMES = new Set([
  "ad_activeview",
  "ad_click",
  "ad_exposure",
  "ad_impression",
  "ad_query",
  "adunit_exposure",
  "app_clear_data",
  "app_exception",
  "app_install",
  "app_open",
  "app_remove",
  "app_update",
  "error",
  "first_open",
  "first_visit",
  "in_app_purchase",
  "notification_dismiss",
  "notification_foreground",
  "notification_open",
  "notification_receive",
  "os_update",
  "screen_view",
  "session_start",
  "user_engagement",
]);

const STRING_PARAM_MAX = 100;
const USER_PROPERTY_NAME_MAX = 24;
const USER_PROPERTY_VALUE_MAX = 36;

const warn = (message: string, context?: unknown) => {
  if (context !== undefined) {
    console.warn(`[analytics-validator] ${message}`, context);
  } else {
    console.warn(`[analytics-validator] ${message}`);
  }
};

const validateName = (kind: "event" | "param", name: string) => {
  if (!NAME_RE.test(name)) {
    warn(`${kind} name does not match Firebase spec ${NAME_RE}: "${name}"`);
  }
};

const validateEvent = (event: Event): void => {
  if (RESERVED_EVENT_NAMES.has(event.type)) {
    warn(`event name "${event.type}" is reserved by Firebase`, event);
  } else {
    validateName("event", event.type);
  }
  if (
    typeof event.message === "string" &&
    event.message.length > STRING_PARAM_MAX
  ) {
    warn(
      `event message exceeds Firebase ${STRING_PARAM_MAX}-char string param cap (${event.message.length})`,
      event
    );
  }
  // FirebaseAnalyticsLogging flattens `detail`'s primitive entries
  // into top-level params; mirror that here so we catch regressions
  // before the apps build runs.
  if (
    event.detail !== undefined &&
    typeof event.detail === "object" &&
    event.detail !== null
  ) {
    for (const [key, value] of Object.entries(
      event.detail as Record<string, unknown>
    )) {
      validateName("param", key);
      if (typeof value === "string" && value.length > STRING_PARAM_MAX) {
        warn(
          `event detail.${key} string exceeds Firebase ${STRING_PARAM_MAX}-char param cap (${value.length})`,
          event
        );
      }
    }
  }
};

const validateNavigation = (args: Navigation): void => {
  if (args.path.length > STRING_PARAM_MAX) {
    warn(
      `navigate path exceeds Firebase ${STRING_PARAM_MAX}-char param cap (${args.path.length})`,
      args
    );
  }
};

const validateUserProperty = (name: string, value: string): void => {
  validateName("param", name);
  if (name.length > USER_PROPERTY_NAME_MAX) {
    warn(
      `user property name exceeds Firebase ${USER_PROPERTY_NAME_MAX}-char cap (${name.length}): "${name}"`
    );
  }
  if (value.length > USER_PROPERTY_VALUE_MAX) {
    warn(
      `user property "${name}" value exceeds Firebase ${USER_PROPERTY_VALUE_MAX}-char cap (${value.length})`
    );
  }
};

/**
 * Wrap a Logging implementation so that emitted events and navigations
 * are validated against the Firebase spec, with violations logged as
 * console warnings. Underlying `logging` calls are always made — this
 * is purely diagnostic, not a gate.
 */
export const wrapWithDevValidator = (logging: Logging): Logging => ({
  event(event) {
    validateEvent(event);
    logging.event(event);
  },
  error(message, e) {
    logging.error(message, e);
  },
  log(e) {
    logging.log(e);
  },
  setConsent(granted) {
    logging.setConsent(granted);
  },
  navigate(args) {
    validateNavigation(args);
    logging.navigate(args);
  },
  setUserProperty(name, value) {
    validateUserProperty(name, value);
    logging.setUserProperty(name, value);
  },
});
