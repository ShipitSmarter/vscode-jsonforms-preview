# Change Log

## 1.1.0
- Refreshed dependencies and dev tooling: TypeScript 5.9, webpack 5.110, ts-loader 9.6, html-loader 5, axios 1.20, yaml 2.9, @vscode/vsce 3, @types/node 24, @types/vscode ^1.134.0
- Bumped `engines.vscode` to `^1.134.0`
- Removed unused `copy-webpack-plugin` dependency
- Migrated ESLint from `.eslintrc.json` (ESLint 8 + typescript-eslint 5) to flat config `eslint.config.js` (ESLint 10 + typescript-eslint 8), preserving the same 5 lint rules and ignore patterns
- Migrated the test runner from a hand-rolled `@vscode/test-electron` harness to `@vscode/test-cli` (`.vscode-test.mjs`); existing test files are unchanged
- No runtime behavior changes in this release (tooling-only refresh)

## 1.0.5
- Fix invalid iframe sandbox flag (`allow-modal` → `allow-modals`) rejected by VSCode 1.135.0+
- Add a Content-Security-Policy and script nonce to the webview (resolves the "webview without a content security policy" warning)
- Scope `tsconfig.json` to `src` so the build no longer picks up files under `examples/`

## 1.0.4
- Fixed issue with base64 encoding

## 1.0.3
- Improved error handling
- Improved documentation

## 1.0.2

- Add inject data from settings to the ui-schema to dynamically test async fetch behaviour on internal components

## 1.0.1

- Restructured the configuration, so it shows up in the VSCode settings UI

## 1.0.0

- Initial release
