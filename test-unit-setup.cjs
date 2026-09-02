// Mocha --require hook for the plain-node unit test layer.
// Some pure-logic modules import `vscode` only to read configuration via
// vscode.workspace.getConfiguration(); the unit-test layer never exercises
// that code path, but Node still needs to resolve the module at require time.
// This stubs it out with a minimal shim so the real logic under test can be
// required outside of the VS Code extension host.
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, ...rest) {
    if (request === 'vscode') {
        return require.resolve('./test-unit-vscode-shim.cjs');
    }
    return originalResolveFilename.call(this, request, ...rest);
};
