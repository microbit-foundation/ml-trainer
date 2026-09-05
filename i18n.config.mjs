import { defineConfig } from "@microbit/i18n-tools";

// Languages with a CreateAI UI translation in Crowdin. Which of them the app
// offers, and whether as a preview, is decided in src/settings.tsx; the
// MakeCode extension (pxt-microbit-ml) needs its own translations too.
const languages = [
  "ca",
  "es-ES",
  "fr",
  "ja",
  "ko",
  "lo",
  "nl",
  "pl",
  "pt-BR",
  "vi",
  "zh-TW",
  "lol",
];

export default defineConfig({
  crowdin: {
    project: "microbitorg",
    branch: "new",
    directory: "apps/microbit-createai",
  },
  languages,
  catalogs: [
    {
      source: "lang/ui.en.json",
      out: "src/messages/ui.{lang}.json",
      packages: ["@microbit/ui", "@microbit/ui-patterns"],
      local: ["en-US"],
      // The "on ML start" block label is shown in CodeViewDefaultBlock and
      // must read exactly as the MakeCode extension's block does, so take
      // the extension's translation rather than our own.
      afterDownload: async ({ messages, download }) => {
        const id = "ml.onStart|block";
        const strings = await download(
          "makecode-extensions/pxt-microbit-ml/machine-learning-strings.json",
        );
        const block = strings[id];
        if (typeof block === "string" && block) {
          messages[id] = { defaultMessage: block };
        }
        return messages;
      },
    },
  ],
});
