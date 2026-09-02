// Require hook so plain `tsc`-compiled test output (out/**) can `require('./frame.html')`
// the same way webpack + html-loader does for the real extension bundle: as a raw string
// exposed under the ES-module `default` export shape (matching src/modules.d.ts's
// `export default content` declaration and tsc's non-esModuleInterop output which reads
// `frame_html_1.default`).
// Only used by the @vscode/test-cli host test run (see .vscode-test.mjs), not the shipped extension.
const Module = require('module');
const fs = require('fs');

Module._extensions['.html'] = function (module, filename) {
    const content = fs.readFileSync(filename, 'utf8');
    module.exports = { __esModule: true, default: content };
};
