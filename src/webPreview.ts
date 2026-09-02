import * as vscode from 'vscode';
import * as fs from 'fs';
import * as YAML from 'yaml';
import path = require("path");
import { CONSTANTS } from "./constants";
import { debounce } from './utils/debounce';
import { showMessage, MessageType } from './utils/messages';
import { Disposable } from './utils/dispose';
import { isJson, isSchemaFile, getCompanionFilePath } from "./utils/fileUtils";
import { getConfiguration, base64Encode } from "./utils/general";
import { injectAsyncFetchData } from "./utils/asyncFetch";
import { buildPreviewHtml, getFrameSrc, generateNonce } from "./utils/htmlBuilder";

import frameTemplate from './frame.html';

export async function showPreview(filePath: string): Promise<void> {
    // Initialize the preview
    const preview = new WebPreview(filePath);

    // Render preview
    await preview.createPreview();
}

class WebPreview extends Disposable implements vscode.Disposable {
    private _panel: vscode.WebviewPanel;

    private _renderUrl: string;

    private _schemaPath: string;
    private _uiSchemaPath: string;
    private _schemaContent: string;
    private _uiSchemaContent: string;

    private _debouncedTextUpdate: () => void;

    public constructor(filePath: string) {
        super();

        // Fetch configured URL from configuration
        const url = getConfiguration<string>(CONSTANTS.configKeyRenderUrl);
        if (!url) {
            showMessage(
                "No render URL configured",
                MessageType.Error
            );
            throw new Error("No render URL configured");
        }
        this._renderUrl = url;

        // Work out correct filepaths
        if (filePath && isSchemaFile(filePath)) {
            this._schemaPath = filePath;
            this._uiSchemaPath = getCompanionFilePath(filePath);
        }
        else if (!isSchemaFile(filePath)) {
            this._uiSchemaPath = filePath;
            this._schemaPath = getCompanionFilePath(filePath);
        }
        else {
            showMessage(
                "Invalid file selected",
                MessageType.Error
            );
            throw new Error("Invalid file selected");
        }

        // Get content
        this._schemaContent = fs.readFileSync(this._schemaPath, 'utf8');
        this._uiSchemaContent = fs.readFileSync(this._uiSchemaPath, 'utf8');

        // Create the webview panel
        this._panel = this.createPanel();

        // Configure editor debounce
        const debounceTimeout = getConfiguration<number>(CONSTANTS.configKeyDebounceTimeout);
        this._debouncedTextUpdate = debounce(() => this.updatePreview(), debounceTimeout ?? CONSTANTS.defaultDebounceTimeout);

        // Hook change event to sync new files with the preview
        const onChangedTextEditor = vscode.workspace.onDidChangeTextDocument((e): void => {
            if (e.document.isUntitled) { return; }
            if (e.document.uri.scheme === 'output') { return; }

            if (e.document.uri.fsPath === this._schemaPath) {
                try {
                    this._schemaContent = this.formatAndValidateContent(e.document.getText());
                }
                catch {
                    // Invalid JSON, so we don't update
                    return;
                }
            }
            else if (e.document.uri.fsPath === this._uiSchemaPath) {
                try {
                    this._uiSchemaContent = this.formatAndValidateContent(e.document.getText());
                }
                catch {
                    // Invalid JSON, so we don't update
                    return;
                }
            }
            else {
                return;
            }

            this._debouncedTextUpdate();
        });

        // Register panel and events for disposal
        this._register(this._panel);
        this._register(onChangedTextEditor);
    }

    private createPanel(): vscode.WebviewPanel {
        const showOptions = {
            viewColumn: vscode.ViewColumn.Two,
            preserveFocus: true
        };

        const options = {
            enableScripts: true,
        };

        const panel = vscode.window.createWebviewPanel('WebPreview', 'JSONForms Web-Preview', showOptions, options);

        return panel;
    }

    public async createPreview(): Promise<void> {
        await this.updatePreview();
    }

    private async updatePreview(): Promise<void> {
        const nonce = generateNonce();
        const frameSrc = getFrameSrc(this._renderUrl);

        // BASE64 encode the content since we need to ensure there are no escape characters in it
        const encSchem = base64Encode(this._schemaContent);
        const uiSchemaContent = await this.injectAsyncFetchData(this._uiSchemaContent);
        const encUiSchem = base64Encode(uiSchemaContent);

        this._panel.webview.html = buildPreviewHtml({
            template: frameTemplate,
            renderUrl: this._renderUrl,
            nonce: nonce,
            frameSrc: frameSrc,
            schemaBase64: encSchem,
            uiSchemaBase64: encUiSchem,
        });
    }

    private async injectAsyncFetchData(stringData: string): Promise<string> {
        return injectAsyncFetchData(stringData, {
            tenantUrl: getConfiguration<string>(CONSTANTS.configKeyTenantUrl),
            token: getConfiguration<string>(CONSTANTS.configKeyToken),
            tokenHeaderName: getConfiguration<string>(CONSTANTS.configKeyTokenHeaderName),
            onError: (message) => { showMessage(message, MessageType.Error); },
        });
    }

    // Format and validate the content
    // Will throw if invalid
    private formatAndValidateContent(content: string): string {
        if (!isJson(content)) {
            const yam = YAML.parse(content);
            return JSON.stringify(yam);
        }
        JSON.parse(content);
        return content;
    }
}
