module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:react-hooks/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
  ],
  ignorePatterns: [
    "dist",
    ".eslintrc.cjs",
    "deployment.cjs",
    "bin/**/*.js",
    "bootstrap-template.js",
    "playwright.config.ts",
    "CMakeFiles",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["react-refresh"],
  settings: {
    react: {
      version: "18",
    },
  },
  rules: {
    // More trouble than it's worth
    "react/no-unescaped-entities": "off",
    // False positives from library imports from Chakra UI
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: false,
      },
    ],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};
