import react from "eslint-plugin-react";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import globals from "globals";
import pluginJs from "@eslint/js";
import jest from "eslint-plugin-jest";
import reactRefresh from "eslint-plugin-react-refresh";
import unusedImports from "eslint-plugin-unused-imports";
import eslintComments from "eslint-plugin-eslint-comments";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ["node_modules", "dist/**/*"],
    },
    {
        files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.serviceworker,
                ...globals.browser,
                ...globals.jest,
                ...globals.node,
                process: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": typescriptEslint,
            react,
            jest,
            "react-refresh": reactRefresh,
            "unused-imports": unusedImports,
            "eslint-comments": eslintComments
        },
        rules: {
            // Auto-fix unused variables
            "@typescript-eslint/no-unused-vars": "off",
            "no-unused-vars": "off",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_",
                    "destructuredArrayIgnorePattern": "^_"
                }
            ],

            // Handle directive comments
            "eslint-comments/no-unused-disable": "warn",
            "eslint-comments/no-unused-enable": "warn",

            // Jest configurations
            "jest/valid-expect": ["error", { "alwaysAwait": true }],
            "jest/prefer-to-have-length": "warn",
            "jest/no-disabled-tests": "warn",
            "jest/no-focused-tests": "error",
            "jest/no-identical-title": "error",

            // React refresh
            "react-refresh/only-export-components": ["warn", { 
                allowConstantExport: true 
            }],
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    }
];
