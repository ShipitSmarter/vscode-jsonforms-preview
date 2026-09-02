import * as assert from 'assert';
import * as vscode from 'vscode';

import { showPreview } from '../../webPreview';
import { CONSTANTS } from '../../constants';

const DPD_DIR = '/Users/jeff/github/stitch-integrations/files/carriers/v2/dpd/meta-api/ordering';
const DPD_UISCHEMA = `${DPD_DIR}/ordering.uischema.json`;
const RENDER_URL = 'https://example.com/renderer/path';

suite('webPreview host integration (wire-protocol freeze)', () => {
    let originalCreateWebviewPanel: typeof vscode.window.createWebviewPanel;
    let capturedPanel: vscode.WebviewPanel | undefined;

    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension('ShipitSmarter.json-forms-web-preview');
        assert.ok(ext, 'expected the extension to be discoverable in the test host');
        if (!ext!.isActive) {
            await ext!.activate();
        }

        const cfg = vscode.workspace.getConfiguration();
        await cfg.update(CONSTANTS.configKeyRenderUrl, RENDER_URL, vscode.ConfigurationTarget.Global);

        // Intercept panel creation so we can inspect the produced webview.html
        // without needing a real UI surface, and without changing webPreview.ts.
        originalCreateWebviewPanel = vscode.window.createWebviewPanel;
        (vscode.window as any).createWebviewPanel = (...args: Parameters<typeof vscode.window.createWebviewPanel>) => {
            const panel = originalCreateWebviewPanel.apply(vscode.window, args);
            capturedPanel = panel;
            return panel;
        };
    });

    suiteTeardown(async () => {
        (vscode.window as any).createWebviewPanel = originalCreateWebviewPanel;
        const cfg = vscode.workspace.getConfiguration();
        await cfg.update(CONSTANTS.configKeyRenderUrl, undefined, vscode.ConfigurationTarget.Global);
        if (capturedPanel) {
            capturedPanel.dispose();
        }
    });

    test('command json-forms-web-preview.rightClickSchema is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('json-forms-web-preview.rightClickSchema'));
    });

    test('showPreview creates a webview panel and populates html with frozen wire-protocol contract', async () => {
        await showPreview(DPD_UISCHEMA);

        assert.ok(capturedPanel, 'expected createWebviewPanel to have been called');
        const html = capturedPanel!.webview.html;
        assert.ok(html.length > 0);

        // {URL} substitution
        assert.ok(html.includes(`src='${RENDER_URL}'`), 'iframe src should be the configured render URL');

        // CSP frame-src derived from render URL origin, and script-src nonce
        const cspMatch = html.match(/content="([^"]*)"/);
        assert.ok(cspMatch, 'expected a CSP meta tag');
        const csp = cspMatch![1];
        assert.ok(csp.includes(`frame-src ${new URL(RENDER_URL).origin}`), 'CSP frame-src should be the render URL origin');
        const nonceMatch = csp.match(/script-src 'nonce-([^']+)'/);
        assert.ok(nonceMatch, 'expected a script-src nonce in the CSP');
        const nonce = nonceMatch![1];
        assert.ok(html.includes(`<script nonce="${nonce}">`), 'inline script tag nonce must match the CSP nonce');

        // SCHEMA / UI_SCHEMA postMessage payload tokens, base64-encoded
        assert.ok(html.includes('sendMessage("SCHEMA:'), 'schema payload must use the SCHEMA: prefix');
        assert.ok(html.includes('sendMessage("UI_SCHEMA:'), 'uischema payload must use the UI_SCHEMA: prefix');

        const schemaTokenMatch = html.match(/sendMessage\("SCHEMA:([^"]*)"\)/);
        const uiSchemaTokenMatch = html.match(/sendMessage\("UI_SCHEMA:([^"]*)"\)/);
        assert.ok(schemaTokenMatch, 'expected to find the SCHEMA: payload in html');
        assert.ok(uiSchemaTokenMatch, 'expected to find the UI_SCHEMA: payload in html');

        const fs = await import('fs');
        const path = await import('path');
        const uiSchemaPath = DPD_UISCHEMA;
        const schemaPath = path.join(DPD_DIR, 'ordering.schema.json');
        const expectedSchemaB64 = Buffer.from(fs.readFileSync(schemaPath, 'utf8')).toString('base64');
        assert.strictEqual(schemaTokenMatch![1], expectedSchemaB64, 'schema base64 payload must be byte-identical to current behavior');

        // injectAsyncFetchData returns the raw string content untouched when no
        // async-fetch tenant-url is configured (current behavior), so the uischema
        // payload should be the byte-identical base64 of the raw file content.
        const rawUiSchema = fs.readFileSync(uiSchemaPath, 'utf8');
        const expectedUiSchemaB64 = Buffer.from(rawUiSchema).toString('base64');
        assert.strictEqual(uiSchemaTokenMatch![1], expectedUiSchemaB64, 'uischema base64 payload must be byte-identical to current behavior');

        // READY / DATA wire-protocol strings must remain untouched in the template
        assert.ok(html.includes('message == "READY"'));
        assert.ok(html.includes('message.includes("DATA:")'));
    });
});
