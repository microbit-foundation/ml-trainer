/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import AxeBuilder from "@axe-core/playwright";
import { Page, test } from "@playwright/test";
import { createRequire } from "module";
import path from "path";

interface KnownViolation {
  /** axe rule id. */
  rule: string;
  /**
   * What the rule tests, from axe's tags for it: a WCAG conformance level, or
   * an axe best practice that no WCAG success criterion requires.
   */
  level: "A" | "AA" | "best-practice";
  /** The WCAG success criterion, for A and AA. */
  criterion?: string;
  /** Elements the rule is known to fail on, as a CSS selector. */
  selector: string;
  reason: string;
}

/**
 * Violations we know about and have not fixed yet. A scan fails only on
 * violations that aren't listed here, so fixing one means deleting its entry.
 *
 * The list is recorded against the Foundation's private theme
 * (@microbit-foundation/ml-trainer-microbit), which is what CI and
 * the deployed app use. Colours come from the theme, so without it (a fork,
 * or a checkout that hasn't installed it) the colour-contrast results are
 * different and that rule is skipped. See themeDependentRules.
 */
const knownViolations: KnownViolation[] = [
  {
    rule: "scrollable-region-focusable",
    level: "A",
    criterion: "2.1.1 Keyboard",
    selector: 'div[style*="overflow: auto"]',
    reason:
      "The code preview on the shared project page scrolls but can't be reached from the keyboard.",
  },
  {
    rule: "color-contrast",
    level: "AA",
    criterion: "1.4.3 Contrast (Minimum)",
    selector: "header *",
    reason:
      "The page title and project name in the action bar are white on brand green, 3.48:1 at 20px.",
  },
  {
    rule: "color-contrast",
    level: "AA",
    criterion: "1.4.3 Contrast (Minimum)",
    selector: ".train-model-button",
    reason:
      "Train model looks disabled at 1.95:1 when there isn't enough data, but isn't marked disabled, so isn't exempt.",
  },
  {
    rule: "color-contrast",
    level: "AA",
    criterion: "1.4.3 Contrast (Minimum)",
    selector: 'input[readonly][id^="action-name-input"]',
    reason: "Read-only action names on the testing model page are 3.13:1.",
  },
  {
    rule: "color-contrast",
    level: "AA",
    criterion: "1.4.3 Contrast (Minimum)",
    selector: ".certainty-threshold *",
    reason:
      "The recognition point label and its percentage are 1.94:1 for an action that isn't being detected.",
  },
  {
    rule: "landmark-one-main",
    level: "best-practice",
    selector: "html",
    reason: "The home page has no main landmark.",
  },
  {
    rule: "region",
    level: "best-practice",
    // Every other page has a main landmark, so this is the home page.
    selector: ":root:not(:has(main)) body *",
    reason:
      "With no main landmark, the home page's content is outside any landmark.",
  },
  {
    rule: "page-has-heading-one",
    level: "best-practice",
    selector: "html",
    reason: "Pages have no level-one heading.",
  },
];

/**
 * Rules whose results depend on the theme's colours. The known violations
 * above only describe the Foundation theme, so these rules are skipped when
 * the app is running with the open source default theme.
 */
const themeDependentRules = ["color-contrast"];

const hasFoundationTheme = (() => {
  try {
    createRequire(path.join(process.cwd(), "package.json")).resolve(
      "@microbit-foundation/ml-trainer-microbit/panda-preset"
    );
    return true;
  } catch {
    return false;
  }
})();

interface NodeSummary {
  target: string;
  html: string;
  failureSummary?: string;
}

interface ViolationSummary {
  id: string;
  impact?: string | null;
  help: string;
  helpUrl: string;
  nodes: NodeSummary[];
}

const format = (violations: ViolationSummary[]): string => {
  const lines = [
    `${violations.length} accessibility violation(s) not in knownViolations (src/e2e/axe.ts):`,
  ];
  for (const v of violations) {
    lines.push("", `${v.id} (${v.impact ?? "n/a"}): ${v.help}`, v.helpUrl);
    for (const n of v.nodes) {
      lines.push(`  ${n.target}`, `    ${n.html}`);
      if (n.failureSummary) {
        lines.push(
          ...n.failureSummary.split("\n").map((line) => `    ${line}`)
        );
      }
    }
  }
  return lines.join("\n");
};

/**
 * Scans the page in its current state with axe and fails on any violation
 * that isn't in knownViolations.
 */
export const expectNoNewAccessibilityViolations = async (
  page: Page
): Promise<void> => {
  // A scan part-way through a fade reports the blended colours as contrast
  // failures. Looping animations never finish.
  const t0 = Date.now();
  await page.evaluate(() =>
    Promise.allSettled(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
        .map((a) => a.finished)
    )
  );

  let builder = new AxeBuilder({ page })
    // MakeCode is embedded from its own deployment and isn't ours to fix here.
    .exclude("iframe");
  if (!hasFoundationTheme) {
    builder = builder.disableRules(themeDependentRules);
  }
  const t1 = Date.now();
  const { violations } = await builder.analyze();
  const t2 = Date.now();
  // eslint-disable-next-line no-console
  console.log(
    `AXE_TIMING ${JSON.stringify({
      test: test.info().title,
      path: new URL(page.url()).pathname,
      anim: t1 - t0,
      analyze: t2 - t1,
      frames: page.frames().length,
    })}`
  );

  const candidates = violations.flatMap((v) =>
    v.nodes.map((n) => ({
      target: n.target.join(" "),
      known: knownViolations
        .filter((k) => k.rule === v.id)
        .map((k) => k.selector),
    }))
  );
  const isKnown = await page.evaluate(
    (candidates) =>
      candidates.map(({ target, known }) => {
        const element = document.querySelector(target);
        return !!element && known.some((selector) => element.matches(selector));
      }),
    candidates
  );

  let index = 0;
  const unexpected: ViolationSummary[] = [];
  for (const v of violations) {
    const nodes = v.nodes.filter(() => !isKnown[index++]);
    if (nodes.length > 0) {
      unexpected.push({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: nodes.map((n) => ({
          target: n.target.join(" "),
          html: n.html,
          failureSummary: n.failureSummary,
        })),
      });
    }
  }

  if (unexpected.length > 0) {
    await test.info().attach("axe-violations.json", {
      body: JSON.stringify(unexpected, null, 2),
      contentType: "application/json",
    });
    throw new Error(format(unexpected));
  }
};
