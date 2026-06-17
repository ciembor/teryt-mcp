import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "servers/**"],
  },
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ["packages/**/*.ts"],
    rules: {},
  },
  {
    files: ["packages/**/test/**/*.ts"],
    rules: {
      "sonarjs/publicly-writable-directories": "off",
    },
  },
);
