// Minimal stub for the `vscode` module, used only by the plain-node unit
// test layer (see test-unit-setup.cjs). Not used by the real extension host.
const fs = require('fs');

module.exports = {
    workspace: {
        getConfiguration: () => ({ get: () => undefined }),
        fs: {
            stat: async (uri) => {
                // Throws (mirroring vscode.workspace.fs.stat's FileNotFound rejection)
                // when the path does not exist.
                fs.statSync(uri.fsPath);
                return {};
            },
        },
    },
    Uri: {
        file: (fsPath) => ({ fsPath }),
    },
};
