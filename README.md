# json-forms-web-preview README

This is the README for your extension "json-forms-web-preview". After writing up a brief description, we recommend including the following sections.

## Features

This extension allows the previewing of JSON Schemas in a WebView panel using your own rendering URL. Allowing you to see how your JSON Forms UIs will look in your own application, using your own styles and custom renderers.

This extension will load a WebView panel that will then load up a pre-configured URL. You will have to create the renderer playground server yourself. And it must follow this pattern.

1. Once your playground is ready, send the string `READY` to the parent browser window using `window.parent.postMessage('ready', '*')`
2. You will then receive the following messages through the message event
   1. `SCHEMA:{DATA}` contains the schema file, BASE64 encoded where `{DATA}` sits in the pattern, you can use `atob` to decode this message
   2. `UI_SCHEMA:{DATA}` contains the UI Schema file, BASE64 encoded where `{DATA}` sits in the pattern, you can use `atob` to decode this message
   3. `DATA:{DATA}` may be recieved, which contains any persisted data. `{DATA}` is the stringified JSON data of the persisted data, this is NOT BASE4 encoded.
3. If you wish to persist data that is entered into the form, send a message event to the parent window with the pattern `DATA:{DATA}`, where `{DATA}` is the stringified JSON of the persisted data, this should not be BASE64 encoded.
4. Your rendering page should now have both schema files, and any persisted data.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
