/**
 * Update translations for CreateAI tool. To ensure translations for ML
 * MakeCode blocks are consistent, translated strings are taken from
 * pxt-microbit-ml machine-learning-strings.json. See CodeViewDefaultBlock.tsx
 * to see where they are used.
 *
 * Pass path to extracted Crowdin ZIP
 *
 * Manually run `npm run i18n:compile` after.
 *
 * To add a language, add below and then update for all translations.
 */
const fs = require("fs");

const okExitStatus = 0;
const errExitStatus = 2;

const languages = [
  "ca",
  "en",
  "es-ES",
  "fr",
  "ja",
  "ko",
  "nl",
  "pl",
  "pt-BR",
  "zh-TW",
  "lol",
];
const enMessagesToAdd = {
  "ml.onStart|block": {
    defaultMessage: "on ML $event start",
    description:
      "This string should be a Crowdin duplicate of the MakeCode extension block with the same text and use the same translation.",
  },
};

const getMessagesToAdd = (mlStrings, langMessages) => {
  return Object.keys(enMessagesToAdd).reduce((acc, k) => {
    // Add or update with translated strings.
    if (mlStrings[k]) {
      return {
        ...acc,
        [k]: { ...enMessagesToAdd[k], defaultMessage: mlStrings[k] },
      };
    }
    // Fallback to en messages if no translation.
    if (!langMessages[k]) {
      return { ...acc, [k]: { ...enMessagesToAdd[k] } };
    }
    return {
      ...acc,
      [k]: { ...enMessagesToAdd[k], defaultMessage: acc[k].defaultMessage },
    };
  }, {});
};
const getFileJSONContent = (filepath) => JSON.parse(fs.readFileSync(filepath));

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.log("Error: Missing argument to extracted Crowdin ZIP");
  process.exit(errExitStatus);
}

const prefix = args[0];
const createAiStringsDir = "new/apps/microbit-createai";
const extensionStringsDir = "new/makecode-extensions/pxt-microbit-ml";

languages.forEach((language) => {
  const lowerLang = language.toLowerCase();
  const outputFilepath = `lang/ui.${lowerLang}.json`;

  if (language === "en") {
    // Assumes that lang/ui.en.json exists and directly adds enMessagesToAdd.
    const langMessages = getFileJSONContent(outputFilepath);
    fs.writeFileSync(
      outputFilepath,
      JSON.stringify({ ...langMessages, ...enMessagesToAdd })
    );
    return;
  }

  const srcLangFilepath = `${prefix}/${lowerLang}/${createAiStringsDir}/ui.en.json`;
  const langMessages = getFileJSONContent(srcLangFilepath);

  // Update machine learning strings.
  const mlFilepath = `${prefix}/${lowerLang}/${extensionStringsDir}/machine-learning-strings.json`;
  const mlStrings = getFileJSONContent(mlFilepath);
  const messagesToAdd = getMessagesToAdd(mlStrings, langMessages);

  fs.writeFileSync(
    outputFilepath,
    JSON.stringify({ ...langMessages, ...messagesToAdd })
  );
});

process.exit(okExitStatus);
