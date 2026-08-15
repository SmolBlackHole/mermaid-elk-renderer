import tsparser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";

export default defineConfig([
    ...obsidianmd.configs.recommended,
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsparser,
            parserOptions: { project: "./tsconfig.json" },
            globals: { ...globals.browser },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": "error",
            "no-console": ["error", { allow: ["log", "warn", "error", "debug"] }],
        },
    },
    {
        files: ["tests/**/*.ts"],
        languageOptions: {
            globals: { ...globals.node },
        },
        rules: {
            "import/no-nodejs-modules": "off",
        },
    },
    {
        files: ["src/logger.ts"],
        rules: {
            "obsidianmd/rule-custom-message": "off",
        },
    },
]);
