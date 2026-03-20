#!/usr/bin/env node

/**
 * Reports new translation copy introduced on the current branch vs main.
 *
 * "New" means the defaultMessage text doesn't exist anywhere in the main
 * branch file — we ignore message IDs (which may be renamed) and
 * descriptions (which aren't translated).
 *
 * Word counting follows Crowdin's approach: a word is a combination of
 * letters/punctuation/special chars followed by space (hyphenated words
 * count as one). ICU plural/select branches are parsed using the formatjs
 * parser and all branches are counted since translators translate every
 * branch. HTML/XML tags are excluded.
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "@formatjs/icu-messageformat-parser";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the set of unique defaultMessage values from a messages object. */
function extractMessages(json) {
  return new Set(Object.values(json).map((entry) => entry.defaultMessage));
}

/**
 * Extract translatable text from a parsed ICU AST.
 *
 * For plural/select/selectordinal, includes text from all branches since
 * translators need to translate every branch.
 */
function extractTextFromAst(ast) {
  const parts = [];
  for (const node of ast) {
    switch (node.type) {
      case 0: // literal
        parts.push(node.value);
        break;
      case 1: // argument (simple placeholder like {name})
        parts.push("placeholder");
        break;
      case 5: // select
      case 6: // plural
        parts.push(allBranchText(node.options));
        break;
      case 8: // tag (<link>content</link>)
        parts.push("tag " + extractTextFromAst(node.children) + " tag");
        break;
    }
  }
  return parts.join(" ");
}

/** Concatenate text from all branches of a plural/select. */
function allBranchText(options) {
  const parts = [];
  for (const option of Object.values(options)) {
    parts.push(extractTextFromAst(option.value));
  }
  return parts.join(" ");
}

/** Count words in already-extracted text. */
function countWordsInText(text) {
  const tokens = text.split(/\s+/).filter((t) => /\w/.test(t));
  return tokens.length;
}

/** Count words in an ICU message string. */
function countWords(message) {
  const ast = parse(message, { ignoreTag: false });
  return countWordsInText(extractTextFromAst(ast));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const LANG_FILE = "lang/ui.en.json";

const branchJson = JSON.parse(readFileSync(LANG_FILE, "utf-8"));
const mainJson = JSON.parse(
  execSync(`git show main:${LANG_FILE}`, { encoding: "utf-8" })
);

const mainMessages = extractMessages(mainJson);
const newEntries = [];

for (const [id, entry] of Object.entries(branchJson)) {
  if (!mainMessages.has(entry.defaultMessage)) {
    newEntries.push({ id, message: entry.defaultMessage });
  }
}

if (newEntries.length === 0) {
  console.log("No new translation copy on this branch.");
  process.exit(0);
}

let totalWords = 0;

for (const { id, message } of newEntries) {
  totalWords += countWords(message);
  console.log(message);
}

console.log(
  `\n${newEntries.length} new messages, ${totalWords} words`
);
