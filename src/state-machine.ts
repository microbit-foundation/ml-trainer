/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Logging } from "./logging/logging";

/**
 * Generic state machine types and interpreter.
 */

export interface Transition<TStep, TAction> {
  target: TStep;
  actions?: TAction[];
}

export interface ConditionalTransition<
  TStep,
  TAction,
  TContext,
  TEvent = unknown
> {
  guard: (ctx: TContext, event: TEvent) => boolean;
  target: TStep;
  actions?: TAction[];
}

type TransitionConfig<TStep, TAction, TContext, TEvent> =
  | Transition<TStep, TAction>
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
}

/**
 * Resolve a transition configuration to a result.
 */
function resolveTransition<TStep, TAction, TContext, TEvent>(
  transitionConfig: TransitionConfig<TStep, TAction, TContext, TEvent>,
  context: TContext,
  event: TEvent
): TransitionResult<TStep, TAction> | null {
  // Conditional transitions - array of guarded transitions
  if (isConditionalArray(transitionConfig)) {
    for (const cond of transitionConfig) {
      if (cond.guard(context, event)) {
        return {
          step: cond.target,
          actions: cond.actions ?? [],
        };
      }
    }
    return null;
  }

  // Simple transition
  return {
    step: transitionConfig.target,
    actions: transitionConfig.actions ?? [],
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

  // First, try state-specific transition
  if (stateConfig) {
    const transitionConfig = stateConfig.on[event.type as TEvent["type"]];
    if (transitionConfig) {
      return resolveTransition(transitionConfig, context, event);
    }
  }

  // Fall back to global transition
  if (flow._global) {
    const globalConfig = flow._global.on[event.type as TEvent["type"]];
    if (globalConfig) {
      return resolveTransition(globalConfig, context, event);
    }
  }

  return null;
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
