/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Logging } from "./logging/logging";

/**
 * Generic state machine types and interpreter.
 */

/**
 * Synchronous state updates applied atomically with the step change.
 * Modelled after xstate's assign — these are context mutations, not
 * side-effects, so they land in the same render as the new step.
 */
export type Assign = Record<string, unknown>;

/**
 * External transition - has target, runs exit/entry actions.
 */
export interface Transition<TStep, TAction> {
  target: TStep;
  actions?: TAction[];
  assign?: Assign;
}

/**
 * Internal transition - no target, stays in current state, no exit/entry.
 */
export interface InternalTransition<TAction> {
  actions?: TAction[];
  assign?: Assign;
}

export interface ConditionalTransition<
  TStep,
  TAction,
  TContext,
  TEvent = unknown
> {
  guard: (ctx: TContext, event: TEvent) => boolean;
  /**
   * Target state. If omitted, this is an internal transition (no exit/entry).
   */
  target?: TStep;
  actions?: TAction[];
  assign?: Assign;
}

type TransitionConfig<TStep, TAction, TContext, TEvent> =
  | Transition<TStep, TAction>
  | InternalTransition<TAction>
  | ConditionalTransition<TStep, TAction, TContext, TEvent>[];

function isConditionalArray<TStep, TAction, TContext, TEvent>(
  config: TransitionConfig<TStep, TAction, TContext, TEvent>
): config is ConditionalTransition<TStep, TAction, TContext, TEvent>[] {
  return Array.isArray(config);
}

interface StateConfig<
  TStep,
  TEvent extends { type: string },
  TAction,
  TContext
> {
  /**
   * Actions to run when entering this state.
   * Entry actions run after transition actions.
   */
  entry?: TAction[];
  /**
   * Actions to run when exiting this state.
   * Exit actions run before transition actions.
   */
  exit?: TAction[];
  on: Partial<
    Record<TEvent["type"], TransitionConfig<TStep, TAction, TContext, TEvent>>
  >;
}

/**
 * Global transitions configuration.
 * These transitions apply to all states unless overridden by state-specific transitions.
 */
export interface GlobalTransitions<
  TStep,
  TEvent extends { type: string },
  TAction,
  TContext
> {
  on: Partial<
    Record<TEvent["type"], TransitionConfig<TStep, TAction, TContext, TEvent>>
  >;
}

export type FlowDefinition<
  TStep extends string,
  TEvent extends { type: string },
  TAction,
  TContext
> = Partial<Record<TStep, StateConfig<TStep, TEvent, TAction, TContext>>> & {
  /**
   * Global transitions that apply to all states.
   * State-specific transitions take precedence over global ones.
   */
  _global?: GlobalTransitions<TStep, TEvent, TAction, TContext>;
};

export interface TransitionResult<TStep, TAction> {
  step: TStep;
  actions: TAction[];
  assign: Assign;
}

interface InternalTransitionResult<TAction> {
  step: undefined;
  actions: TAction[];
  assign: Assign;
}

type ResolvedTransition<TStep, TAction> =
  | TransitionResult<TStep, TAction>
  | InternalTransitionResult<TAction>;

function hasTarget<TStep, TAction>(
  config: Transition<TStep, TAction> | InternalTransition<TAction>
): config is Transition<TStep, TAction> {
  return "target" in config;
}

/**
 * Resolve a transition configuration to a result.
 */
function resolveTransition<TStep, TAction, TContext, TEvent>(
  transitionConfig: TransitionConfig<TStep, TAction, TContext, TEvent>,
  context: TContext,
  event: TEvent
): ResolvedTransition<TStep, TAction> | null {
  // Conditional transitions - array of guarded transitions
  if (isConditionalArray(transitionConfig)) {
    for (const cond of transitionConfig) {
      if (cond.guard(context, event)) {
        // Internal transition if no target
        if (cond.target === undefined) {
          return {
            step: undefined,
            actions: cond.actions ?? [],
            assign: cond.assign ?? {},
          };
        }
        return {
          step: cond.target,
          actions: cond.actions ?? [],
          assign: cond.assign ?? {},
        };
      }
    }
    return null;
  }

  // Simple transition (external or internal)
  if (hasTarget(transitionConfig)) {
    return {
      step: transitionConfig.target,
      actions: transitionConfig.actions ?? [],
      assign: transitionConfig.assign ?? {},
    };
  }

  // Internal transition (no target)
  return {
    step: undefined,
    actions: transitionConfig.actions ?? [],
    assign: transitionConfig.assign ?? {},
  };
}

export function transition<
  TStep extends string,
  TEvent extends { type: string },
  TAction,
  TContext
>(
  flow: FlowDefinition<TStep, TEvent, TAction, TContext>,
  currentStep: TStep,
  event: TEvent,
  context: TContext
): TransitionResult<TStep, TAction> | null {
  const stateConfig = flow[currentStep];
  let resolved: ResolvedTransition<TStep, TAction> | null = null;

  // First, try state-specific transition
  if (stateConfig) {
    const transitionConfig = stateConfig.on[event.type as TEvent["type"]];
    if (transitionConfig) {
      resolved = resolveTransition(transitionConfig, context, event);
    }
  }

  // Fall back to global transition
  if (!resolved && flow._global) {
    const globalConfig = flow._global.on[event.type as TEvent["type"]];
    if (globalConfig) {
      resolved = resolveTransition(globalConfig, context, event);
    }
  }

  if (!resolved) {
    return null;
  }

  // Internal transition (no target): stay in current state, no exit/entry
  if (resolved.step === undefined) {
    return {
      step: currentStep,
      actions: resolved.actions,
      assign: resolved.assign,
    };
  }

  // External transition: exit → transition → entry
  const exitActions = stateConfig?.exit ?? [];
  const targetStateConfig = flow[resolved.step];
  const entryActions = targetStateConfig?.entry ?? [];
  return {
    step: resolved.step,
    actions: [...exitActions, ...resolved.actions, ...entryActions],
    assign: resolved.assign,
  };
}

/**
 * Guard that always returns true.
 * Useful as a fallback in conditional transition arrays.
 */
export const always = (_ctx: unknown, _event: unknown) => true;

/**
 * Create a fire-and-forget event dispatcher.
 *
 * Actions should handle their own errors by transitioning to appropriate
 * error states. This logs unexpected errors as a safety net.
 */
export const createFireEvent = <
  TEvent extends { type: string },
  TDeps extends { logging: Logging }
>(
  sendEvent: (event: TEvent, deps: TDeps) => Promise<void>,
  errorPrefix: string
) => {
  return (event: TEvent, deps: TDeps) => {
    sendEvent(event, deps).catch((error) => {
      deps.logging.error(`${errorPrefix} [${event.type}]`, error);
    });
  };
};
