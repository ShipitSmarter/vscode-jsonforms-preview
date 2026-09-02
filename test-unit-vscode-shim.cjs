// Minimal stub for the `vscode` module, used only by the plain-node unit
// test layer (see test-unit-setup.cjs). Not used by the real extension host.
module.exports = {
    workspace: {
        getConfiguration: () => ({ get: () => undefined }),
    },
};
