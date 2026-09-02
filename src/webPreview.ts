import * as vscode from 'vscode';
import * as YAML from 'yaml';
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
    const preview = await WebPreview.create(filePath);

    // Render preview
    await preview.createPreview();
}

async function readFileContent(filePath: string): Promise<string> {
    const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
    return new TextDecoder('utf-8').decode(bytes);
}

interface WebPreviewInit {
    renderUrl: string;
    schemaPath: string;
    uiSchemaPath: string;
    schemaContent: string;
    uiSchemaContent: string;
}

class WebPreview extends Disposable implements vscode.Disposable {
    private _panel: vscode.WebviewPanel;

    private _renderUrl: string;

    private _schemaPath: string;
    private _uiSchemaPath: string;
    private _schemaContent: string;
    private _uiSchemaContent: string;

    private _debouncedTextUpdate: () => void;

    // Resolve file paths and read content (async IO) before constructing the
    // instance, so the constructor itself performs no IO.
    public static async create(filePath: string): Promise<WebPreview> {
        const url = getConfiguration<string>(CONSTANTS.configKeyRenderUrl);
        if (!url) {
            showMessage(
                "No render URL configured",
                MessageType.Error
            );
            throw new Error("No render URL configured");
        }

        let schemaPath: string;
        let uiSchemaPath: string;

        // Work out correct filepaths
        if (filePath && isSchemaFile(filePath)) {
            schemaPath = filePath;
            uiSchemaPath = await getCompanionFilePath(filePath);
        }
        else if (!isSchemaFile(filePath)) {
            uiSchemaPath = filePath;
            schemaPath = await getCompanionFilePath(filePath);
        }
        else {
            showMessage(
                "Invalid file selected",
                MessageType.Error
            );
            throw new Error("Invalid file selected");
        }

        const schemaContent = await readFileContent(schemaPath);
        const uiSchemaContent = await readFileContent(uiSchemaPath);

        return new WebPreview({
            renderUrl: url,
            schemaPath: schemaPath,
            uiSchemaPath: uiSchemaPath,
            schemaContent: schemaContent,
            uiSchemaContent: uiSchemaContent,
        });
    }

    private constructor(init: WebPreviewInit) {
        super();

        this._renderUrl = init.renderUrl;
        this._schemaPath = init.schemaPath;
        this._uiSchemaPath = init.uiSchemaPath;
        this._schemaContent = init.schemaContent;
        this._uiSchemaContent = init.uiSchemaContent;

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
