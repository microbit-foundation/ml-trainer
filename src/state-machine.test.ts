/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { vi } from "vitest";
import {
  always,
  createFireEvent,
  FlowDefinition,
  transition,
} from "./state-machine";

// Test types
type TestStep = "idle" | "loading" | "success" | "error";
type TestEvent =
  | { type: "start" }
  | { type: "complete" }
  | { type: "fail"; message: string }
  | { type: "reset" };
type TestAction =
  | { type: "setLoading" }
  | { type: "setData" }
  | { type: "logError"; message: string };
interface TestContext {
  isEnabled: boolean;
  retryCount: number;
}

describe("transition", () => {
  describe("simple transitions", () => {
    const simpleFlow: FlowDefinition<
      TestStep,
      TestEvent,
      TestAction,
      TestContext
    > = {
      idle: {
        on: {
          start: {
            target: "loading",
            actions: [{ type: "setLoading" }],
          },
        },
      },
      loading: {
        on: {
          complete: {
            target: "success",
            actions: [{ type: "setData" }],
          },
          fail: {
            target: "error",
          },
        },
      },
      success: {
        on: {
          reset: {
            target: "idle",
          },
        },
      },
    };

    const defaultContext: TestContext = { isEnabled: true, retryCount: 0 };

    it("returns target step and actions for valid transition", () => {
      const result = transition(
        simpleFlow,
        "idle",
        { type: "start" },
        defaultContext
      );

      expect(result).toEqual({
        step: "loading",
        actions: [{ type: "setLoading" }],
      });
    });

    it("returns empty actions array when no actions defined", () => {
      const result = transition(
        simpleFlow,
        "loading",
        { type: "fail", message: "error" },
        defaultContext
      );

      expect(result).toEqual({
        step: "error",
        actions: [],
      });
    });

    it("returns null when step is not defined in flow", () => {
      const result = transition(
        simpleFlow,
        "error",
        { type: "reset" },
        defaultContext
      );

      expect(result).toBeNull();
    });

    it("returns null when event type has no transition", () => {
      const result = transition(
        simpleFlow,
        "idle",
        { type: "complete" },
        defaultContext
      );

      expect(result).toBeNull();
    });
  });

  describe("conditional transitions", () => {
    const conditionalFlow: FlowDefinition<
      TestStep,
      TestEvent,
      TestAction,
      TestContext
    > = {
      idle: {
        on: {
          start: [
            {
              guard: (ctx) => !ctx.isEnabled,
              target: "error",
              actions: [{ type: "logError", message: "disabled" }],
            },
            {
              guard: (ctx) => ctx.retryCount > 3,
              target: "error",
              actions: [{ type: "logError", message: "too many retries" }],
            },
            {
              guard: always,
              target: "loading",
              actions: [{ type: "setLoading" }],
            },
          ],
        },
      },
      loading: {
        on: {
          fail: [
            {
              guard: (_ctx, event) =>
                (event as { message?: string }).message === "critical",
              target: "error",
            },
            {
              guard: always,
              target: "idle",
            },
          ],
        },
      },
    };

    it("matches first guard that returns true", () => {
      const result = transition(
        conditionalFlow,
        "idle",
        { type: "start" },
        { isEnabled: false, retryCount: 0 }
      );

      expect(result).toEqual({
        step: "error",
        actions: [{ type: "logError", message: "disabled" }],
      });
    });

    it("matches second guard when first fails", () => {
      const result = transition(
        conditionalFlow,
        "idle",
        { type: "start" },
        { isEnabled: true, retryCount: 5 }
      );

      expect(result).toEqual({
        step: "error",
        actions: [{ type: "logError", message: "too many retries" }],
      });
    });

    it("falls through to always guard", () => {
      const result = transition(
        conditionalFlow,
        "idle",
        { type: "start" },
        { isEnabled: true, retryCount: 0 }
      );

      expect(result).toEqual({
        step: "loading",
        actions: [{ type: "setLoading" }],
      });
    });

    it("uses event in guard", () => {
      const result = transition(
        conditionalFlow,
        "loading",
        { type: "fail", message: "critical" },
        { isEnabled: true, retryCount: 0 }
      );

      expect(result).toEqual({
        step: "error",
        actions: [],
      });
    });

    it("falls through to always when event guard fails", () => {
      const result = transition(
        conditionalFlow,
        "loading",
        { type: "fail", message: "minor" },
        { isEnabled: true, retryCount: 0 }
      );

      expect(result).toEqual({
        step: "idle",
        actions: [],
      });
    });

    it("returns null when no guard matches", () => {
      const noFallbackFlow: FlowDefinition<
        TestStep,
        TestEvent,
        TestAction,
        TestContext
      > = {
        idle: {
          on: {
            start: [
              {
                guard: () => false,
                target: "loading",
              },
              {
                guard: () => false,
                target: "error",
              },
            ],
          },
        },
      };

      const result = transition(
        noFallbackFlow,
        "idle",
        { type: "start" },
        { isEnabled: true, retryCount: 0 }
      );

      expect(result).toBeNull();
    });

    it("returns null for empty conditional array", () => {
      const emptyGuardsFlow: FlowDefinition<
        TestStep,
        TestEvent,
        TestAction,
        TestContext
      > = {
        idle: {
          on: {
            start: [],
          },
        },
      };

      const result = transition(
        emptyGuardsFlow,
        "idle",
        { type: "start" },
        { isEnabled: true, retryCount: 0 }
      );

      expect(result).toBeNull();
    });
  });

  describe("global transitions", () => {
    const defaultContext: TestContext = { isEnabled: true, retryCount: 0 };

    it("uses global transition when state has no handler for event", () => {
      const flowWithGlobal: FlowDefinition<
        TestStep,
        TestEvent,
        TestAction,
        TestContext
      > = {
        _global: {
          on: {
            reset: { target: "idle" },
          },
        },
        loading: {
          on: {
            complete: { target: "success" },
          },
        },
        success: {
          on: {
            // No reset handler - should use global
          },
        },
      };

      const result = transition(
        flowWithGlobal,
        "success",
        { type: "reset" },
        defaultContext
      );

      expect(result).toEqual({
        step: "idle",
        actions: [],
      });
    });

    it("state-specific transition takes precedence over global", () => {
      const flowWithGlobal: FlowDefinition<
        TestStep,
        TestEvent,
        TestAction,
        TestContext
      > = {
        _global: {
          on: {
            reset: { target: "idle" },
          },
        },
        success: {
          on: {
            reset: { target: "loading", actions: [{ type: "setLoading" }] },
          },
        },
      };

      const result = transition(
        flowWithGlobal,
        "success",
        { type: "reset" },
        defaultContext
      );

      expect(result).toEqual({
        step: "loading",
        actions: [{ type: "setLoading" }],
      });
    });

    it("supports conditional global transitions", () => {
      const flowWithGlobal: FlowDefinition<
        TestStep,
        TestEvent,
        TestAction,
        TestContext
      > = {
        _global: {
          on: {
            reset: [
              {
                guard: (ctx) => ctx.retryCount > 3,
                target: "error",
              },
              {
                guard: always,
                target: "idle",
              },
            ],
          },
        },
        loading: {
          on: {
            complete: { target: "success" },
          },
        },
      };

      // With high retry count, should go to error
      const result1 = transition(
        flowWithGlobal,
        "loading",
        { type: "reset" },
        { isEnabled: true, retryCount: 5 }
      );
      expect(result1?.step).toBe("error");

      // With low retry count, should go to idle
      const result2 = transition(
        flowWithGlobal,
        "loading",
        { type: "reset" },
        { isEnabled: true, retryCount: 0 }
      );
      expect(result2?.step).toBe("idle");
    });

    it("returns null when no state-specific or global transition exists", () => {
      const flowWithGlobal: FlowDefinition<
        TestStep,
        TestEvent,
        TestAction,
        TestContext
      > = {
        _global: {
          on: {
            reset: { target: "idle" },
          },
        },
        loading: {
          on: {
            complete: { target: "success" },
          },
        },
      };

      const result = transition(
        flowWithGlobal,
        "loading",
        { type: "start" }, // No handler for 'start' in loading or global
        defaultContext
      );

      expect(result).toBeNull();
    });

    it("works when state is not defined in flow but global handles event", () => {
      const flowWithGlobal: FlowDefinition<
        TestStep,
        TestEvent,
        TestAction,
        TestContext
      > = {
        _global: {
          on: {
            reset: { target: "idle" },
          },
        },
        // 'error' state not defined
      };

      const result = transition(
        flowWithGlobal,
        "error",
        { type: "reset" },
        defaultContext
      );

      expect(result).toEqual({
        step: "idle",
        actions: [],
      });
    });
  });

  describe("edge cases", () => {
    const defaultContext: TestContext = { isEnabled: true, retryCount: 0 };

    it("allows self-transitions", () => {
      const selfTransitionFlow: FlowDefinition<
        TestStep,
        TestEvent,
        TestAction,
        TestContext
      > = {
        loading: {
          on: {
            start: {
              target: "loading",
              actions: [{ type: "setLoading" }],
            },
          },
        },
      };

      const result = transition(
        selfTransitionFlow,
        "loading",
        { type: "start" },
        defaultContext
      );

      expect(result).toEqual({
        step: "loading",
        actions: [{ type: "setLoading" }],
      });
    });

    it("returns multiple actions in order", () => {
      const multiActionFlow: FlowDefinition<
        TestStep,
        TestEvent,
        TestAction,
        TestContext
      > = {
        idle: {
          on: {
            start: {
              target: "loading",
              actions: [
                { type: "setLoading" },
                { type: "setData" },
                { type: "logError", message: "started" },
              ],
            },
          },
        },
      };

      const result = transition(
        multiActionFlow,
        "idle",
        { type: "start" },
        defaultContext
      );

      expect(result).toEqual({
        step: "loading",
        actions: [
          { type: "setLoading" },
          { type: "setData" },
          { type: "logError", message: "started" },
        ],
      });
    });
  });
});

describe("createFireEvent", () => {
  interface TestDeps {
    logging: { error: ReturnType<typeof vi.fn> };
  }

  it("calls sendEvent with event and deps", async () => {
    const sendEvent = vi.fn().mockResolvedValue(undefined);
    const deps: TestDeps = { logging: { error: vi.fn() } };
    const fireEvent = createFireEvent(sendEvent, "Test error");

    fireEvent({ type: "start" }, deps);

    // Wait for promise to resolve
    await vi.waitFor(() => {
      expect(sendEvent).toHaveBeenCalledWith({ type: "start" }, deps);
    });
  });

  it("logs error when sendEvent rejects", async () => {
    const error = new Error("Something went wrong");
    const sendEvent = vi.fn().mockRejectedValue(error);
    const deps: TestDeps = { logging: { error: vi.fn() } };
    const fireEvent = createFireEvent(sendEvent, "Connection error");

    fireEvent({ type: "start" }, deps);

    await vi.waitFor(() => {
      expect(deps.logging.error).toHaveBeenCalledWith(
        "Connection error [start]",
        error
      );
    });
  });

  it("does not throw when sendEvent rejects", () => {
    const sendEvent = vi.fn().mockRejectedValue(new Error("fail"));
    const deps: TestDeps = { logging: { error: vi.fn() } };
    const fireEvent = createFireEvent(sendEvent, "Test");

    // Should not throw
    expect(() => fireEvent({ type: "start" }, deps)).not.toThrow();
  });
});
