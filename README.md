# JSONForms Remote web-preview

This extension allows the previewing of JSON Schemas in a WebView panel using your own rendering URL. Allowing you to see how your JSON Forms UIs will look in your own application, using your own styles and custom renderers.

There is some configuration required to use this extension. It is also required that you configure a rendering site to the specifications defined in this README to enable the extension to work. 

## Configuring your rendering site

This extension works by loading a WebView panel that connects to a configured URL, the extension will then send the Schema, UISchema, and any persisted data to the page that has been loaded. It is the responsibility of the page at the URL to consume this data and render the form as you see fit.

You may use JSONForms in any way you see fit on your rendering page. The data will be supplied to you using the pattern described below.

1. Once your playground is ready, send the string `READY` to the parent browser window using `window.parent.postMessage('READY', '*')`
2. You will then receive the following messages through the message event, recieve these messages via: `window.addEventListener('message', event => {handle event.data here});`
   1. `SCHEMA:{DATA}` contains the schema file, BASE64 encoded where `{DATA}` sits in the pattern, you can use `atob` to decode this message
   2. `UI_SCHEMA:{DATA}` contains the UI Schema file, BASE64 encoded where `{DATA}` sits in the pattern, you can use `atob` to decode this message
   3. `DATA:{DATA}` may be recieved, which contains any persisted data. `{DATA}` is the stringified JSON data of the persisted data, this is NOT BASE4 encoded.
3. If you wish to persist data that is entered into the form, send a message event to the parent window with the pattern `DATA:{DATA}`, where `{DATA}` is the stringified JSON of the persisted data, this should not be BASE64 encoded. You can send the data message using: `window.parent.postMessage('DATA:{DATA}', '*')`
4. Your rendering page should now have both schema files, and any persisted data.

An example Vue.js implementation of this pattern can be found in the `examples` folder of this repository.

## Extension Settings

There is one configuration option. This can be defined in `json-forms-web-preview` in vscode settings (`.vscode/settings.json`).

```json
{
    "render-url": "https://shipitsmarter.github.io/viya-app",
    "debounce-timeout": 500
}
```

| id             | description                                                                                                                                                                   | type     | default   | example                  |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-----------|--------------------------|
| `render-url`  | Provide the URL of the pre-configured renderer endpoint   | string | `https://shipitsmarter.github.io/viya-app`      | `https://localhost:80` |
| `debouncce-timeout`  | The time between the last character entered on your editor and the render preview being updated   | integer | `500`      | `2500` |

---
