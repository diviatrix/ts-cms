import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Configuration for vanilla JS in /public
  {
    files: ["public/**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["plugin:js/recommended"],
    languageOptions: {
      sourceType: "script", // For vanilla JS (non-module)
      globals: {
        ...globals.browser, // Browser globals like window, document
      },
      ecmaVersion: 2021,
    },
    rules: {
      "no-console": "warn", // Allow console with warnings
      "indent": ["error", 2], // 2-space indentation
      "quotes": ["error", "single"], // Enforce single quotes
      "semi": ["error", "always"], // Enforce semicolons
      // Add custom rules as needed
    },
  },
  // Configuration for TypeScript backend files
  {
    files: ["**/*.ts"],
    ...tseslint.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node, // Node.js globals for backend
      },
      parserOptions: {
        project: ["./tsconfig.json"], // Adjust to your tsconfig path
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Ignore irrelevant files and backend directories
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "server/**", // Adjust to your backend directory name
      "!public/**/*.{js,mjs,cjs}", // Ensure /public JS files are linted
    ],
  },
];