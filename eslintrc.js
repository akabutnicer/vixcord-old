export default {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest", // Allows the use of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  extends: ["plugin:@typescript-eslint/recommended"],
  env: {
    node: true, // Enable Node.js global variables
  },
  rules: {
    'no-console': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
};
