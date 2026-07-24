/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
// Visual fidelity harness. Compares the working tree against a baseline git
// ref by running src/e2e/fidelity.spec.ts twice:
//
//   1. The ref is checked out into a temporary detached worktree (with this
//      repo's node_modules symlinked in), its dev server is started on
//      :5199, and the spec runs with --update-snapshots to record baselines
//      into .fidelity/ (git-ignored, per-run artefacts).
//   2. The working tree's dev server is started on the same port and the
//      spec runs in compare mode. Playwright's HTML report shows the
//      side-by-side diffs.
//
// The spec itself always runs from the working tree, so both sides capture
// the same states; only the app under test differs. Usage:
//
//   npm run fidelity            # baseline = HEAD
//   npm run fidelity -- <ref>   # baseline = any commit-ish
//
// Each dev server run regenerates Panda output for its own tree (via
// `predev`); the worktree starts empty so it gets a full, non-stale gen.
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(
  path.dirname(fileURLToPath(new URL(import.meta.url)))
);
const port = "5199";
const appUrl = `http://localhost:${port}/`;

const ref = process.argv[2] ?? "HEAD";
const sha = execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();

const log = (message) => console.log(`\nfidelity: ${message}`);

const playwrightEnv = {
  ...process.env,
  E2E_PORT: port,
  // Enables the fidelity project in playwright.config.ts.
  FIDELITY: "1",
  FIDELITY_NO_WEBSERVER: "1",
  // Don't auto-open the HTML report mid-harness; we print how to at the end.
  PLAYWRIGHT_HTML_OPEN: "never",
  PW_TEST_HTML_REPORT_OPEN: "never",
};

/**
 * Run a command to completion, inheriting stdio. Resolves with the exit
 * code rather than rejecting so the harness can treat compare-mode test
 * failures (expected when there are visual diffs) as a result, not an error.
 */
const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });

/**
 * Start `npm run dev` on :5199 in the given tree and wait until it serves.
 * Detached so stop() can signal the whole npm → vite process group.
 * VITE_CACHE_DIR keeps each side's dep-optimizer cache away from the
 * node_modules/.vite dir a concurrently running dev server may be using
 * (the worktree shares node_modules via the symlink); caches persist
 * across fidelity runs.
 */
const startDevServer = async (cwd, cacheName) => {
  const child = spawn(
    "npm",
    ["run", "dev", "--", "--port", port, "--strictPort"],
    {
      cwd,
      stdio: "inherit",
      detached: true,
      env: {
        ...process.env,
        VITE_CACHE_DIR: path.join(
          repoRoot,
          ".fidelity",
          "vite-cache",
          cacheName
        ),
      },
    }
  );
  let exited = false;
  child.on("exit", () => {
    exited = true;
  });
  const deadline = Date.now() + 240_000;
  while (Date.now() < deadline) {
    if (exited) {
      throw new Error(`Dev server in ${cwd} exited before serving`);
    }
    try {
      const response = await fetch(appUrl);
      if (response.ok) {
        return {
          stop: () => {
            if (!exited) {
              process.kill(-child.pid, "SIGTERM");
            }
          },
        };
      }
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  process.kill(-child.pid, "SIGTERM");
  throw new Error(`Timed out waiting for dev server at ${appUrl}`);
};

const runSpec = (updateSnapshots) =>
  run(
    "npx",
    [
      "playwright",
      "test",
      "--project=fidelity",
      ...(updateSnapshots ? ["--update-snapshots"] : []),
    ],
    { cwd: repoRoot, env: playwrightEnv }
  );

const tempDir = mkdtempSync(path.join(tmpdir(), "ml-trainer-fidelity-"));
const worktree = path.join(tempDir, "baseline");
let cleanedUp = false;
const cleanup = () => {
  if (cleanedUp) {
    return;
  }
  cleanedUp = true;
  try {
    execFileSync("git", ["worktree", "remove", "--force", worktree], {
      cwd: repoRoot,
      stdio: "ignore",
    });
  } catch {
    // Not created yet, or already removed.
  }
  rmSync(tempDir, { recursive: true, force: true });
};
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

try {
  log(`baseline ${ref} (${sha.slice(0, 10)}) → ${worktree}`);
  execFileSync("git", ["worktree", "add", "--detach", worktree, sha], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  symlinkSync(
    path.join(repoRoot, "node_modules"),
    path.join(worktree, "node_modules"),
    "dir"
  );

  rmSync(path.join(repoRoot, ".fidelity", "snapshots"), {
    recursive: true,
    force: true,
  });

  log("starting baseline dev server (includes Panda codegen)");
  const baselineServer = await startDevServer(worktree, "baseline");
  try {
    log("recording baseline snapshots");
    const baselineExit = await runSpec(true);
    if (baselineExit !== 0) {
      throw new Error(
        "Baseline run failed — snapshots are incomplete; see output above"
      );
    }
  } finally {
    baselineServer.stop();
  }

  log("starting working-tree dev server");
  const workingServer = await startDevServer(repoRoot, "working");
  let compareExit;
  try {
    log("comparing working tree against baseline");
    compareExit = await runSpec(false);
  } finally {
    workingServer.stop();
  }

  if (compareExit === 0) {
    log("no visual differences ✔");
  } else {
    log(
      "visual differences found — open the report with: npx playwright show-report"
    );
  }
  process.exitCode = compareExit;
} finally {
  cleanup();
}
