/**
 * Update translations for CreateAI tool. To ensure translations for ML 
 * MakeCode blocks are consistent, translated strings are taken from 
 * pxt-microbit-ml machine-learning-strings.json. See CodeViewDefaultBlock.tsx
 * to see where they are used.
 * 
 * To update all translations, pass 2 arguments:
 * 1. Path to CreateAI tool translation strings directory.
 * 2. Path to machine-learning-strings.json translation strings directory. 
 * 
 * To only update MakeCode block translations, pass path to 
 * machine-learning-strings.json translation strings directory as an argument.
 * 
 * Manually run `npm run i18n:compile` after.
 * 
 * To add a language, add below and then update for all translations.
 */
const fs = require("fs");

const okExitStatus = 0;
const errExitStatus = 2;

const languages =["en", "es-ES", "ja", "ko", "nl", "pl", "pt-br", "zh-tw"]
const enMessagesToAdd = {
  "ml.onStart|block": {
    "defaultMessage": "on ML $event start",
    "description": "Translation not needed."
  },
}

const getMessagesToAdd = (mlStrings, langMessages) => {
  return Object.keys(enMessagesToAdd).reduce((acc, k) => {
    // Add or update with translated strings.
    if (mlStrings[k]) {
      return {...acc, [k]: { ...enMessagesToAdd[k], defaultMessage: mlStrings[k]}}
    }
    // Fallback to en messages if no translation.
    if (!langMessages[k]) {
      return {...acc, [k]: { ...enMessagesToAdd[k] }}
    }
    return acc
    }, {}
  )
}
const getFileJSONContent = (filepath) => JSON.parse(fs.readFileSync(filepath))

const args = process.argv.slice(2)
if (args.length === 0 || args.length > 2) {
  console.log(`Error: 2 arguments needed. 
    1. Path to CreateAI tool translation strings directory.
    2. Path to machine-learning-strings.json translation strings directory. `)
  process.exit(errExitStatus)
}

const [createAiTranslationsFilepath, mlTranslationsFilepath] = 
  args.length === 1 ? [null, args[0]] : args

languages.forEach(language => {
  const lowerLang = language.toLowerCase()
  const outputFilepath = `lang/ui.${lowerLang}.json`

  if (language === "en") {
    // Assumes that lang/ui.en.json exists and directly adds enMessagesToAdd.
    const langMessages = getFileJSONContent(outputFilepath)
    fs.writeFileSync(outputFilepath, JSON.stringify({...langMessages, ...enMessagesToAdd}))
    return
  }

  const srcLangFilepath = !createAiTranslationsFilepath
    ? `lang/ui.${lowerLang}.json` 
    : `${createAiTranslationsFilepath}/${language}/ui.en.json` 
  const langMessages = getFileJSONContent(srcLangFilepath)

  const mlFilepath = `${mlTranslationsFilepath}/${language}/machine-learning-strings.json`
  const mlStrings = getFileJSONContent(mlFilepath)

  const messagesToAdd = getMessagesToAdd(mlStrings, langMessages) 
  fs.writeFileSync(outputFilepath, JSON.stringify({...langMessages, ...messagesToAdd}))
})

process.exit(okExitStatus);
