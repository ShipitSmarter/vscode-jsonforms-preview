# Change Log

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
