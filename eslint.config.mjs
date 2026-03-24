// @ts-check
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "backend/dist/**",
      "web/dist/**",
      "firmware/**",
    ],
  },

  // Backend: Node.js / TypeScript (no React)
  {
    files: ["backend/**/*.ts"],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: "./backend/tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // Web: React / TypeScript
  {
    files: ["web/**/*.{ts,tsx}"],
    extends: [
      ...tseslint.configs.recommended,
    ],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: "./web/tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // Root-level TypeScript files (e.g. vite.config.ts)
  {
    files: ["*.ts", "*.mts"],
    extends: [
      ...tseslint.configs.recommended,
    ],
  },

  // Prettier must be last to disable conflicting formatting rules
  prettierConfig,
);
