import * as vscode from 'vscode';
import * as fs from 'fs';
import * as YAML from 'yaml';
import path = require("path");
import { CONSTANTS } from "./constants";
import { debounce } from './utils/debounce';
import { showMessage, MessageType } from './utils/messages';
import { Disposable } from './utils/dispose';
import { isJson, isSchemaFile, getCompanionFilePath } from "./utils/fileUtils";

import frameTemplate from './frame.html';

export async function showPreview(
    filePath: any){

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

    public constructor(filePath: any){       
        super();

        // Fetch configured URL from configuration
        const url = vscode.workspace.getConfiguration().get<string>(CONSTANTS.configKeyRenderUrl);
        if(!url){
            showMessage(
                vscode,
                "No render URL configured",
                MessageType.Error
            );
            throw new Error("No render URL configured");
        }
        this._renderUrl = url;        
        
        // Work out correct filepaths
        if(filePath && isSchemaFile(filePath)){
            this._schemaPath = filePath;
            this._uiSchemaPath = getCompanionFilePath(filePath);   
        }
        else if(!isSchemaFile(filePath)){
            this._uiSchemaPath = filePath;
            this._schemaPath = getCompanionFilePath(filePath);
        }
        else{
            showMessage(
                vscode,
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
        const debounceTimeout = vscode.workspace.getConfiguration().get<number>(CONSTANTS.configKeyDebounceTimeout);
        this._debouncedTextUpdate = debounce(() => this.updatePreview(), debounceTimeout ?? CONSTANTS.defaultDebounceTimeout);

        // Hook change event to sync new files with the preview
        const onChangedTextEditor = vscode.workspace.onDidChangeTextDocument((e): void => {
            if (e.document.isUntitled) { return; }
            if (e.document.uri.scheme === 'output') { return; }

            if(e.document.uri.fsPath === this._schemaPath){
                try{
                    this._schemaContent = this.formatAndValidateContent(e.document.getText());
                }
                catch(e){
                    // Invalid JSON, so we don't update
                    return;
                }
            }
            else if(e.document.uri.fsPath === this._uiSchemaPath){
                try{
                    this._uiSchemaContent = this.formatAndValidateContent(e.document.getText());
                }
                catch(e){
                    // Invalid JSON, so we don't update
                    return;
                }
            }
            else{
                return;
            }

            this._debouncedTextUpdate();
       });

       // Register panel and events for disposal
       this._register(this._panel);
       this._register(onChangedTextEditor);
    }

    private createPanel(): vscode.WebviewPanel{
        const showOptions = {
            viewColumn: vscode.ViewColumn.Two,
            preserveFocus: true
        };

        const options = {
            enableScripts: true,          
        };

        const panel = vscode.window.createWebviewPanel('WebPreview', 'Web Preview',  showOptions, options);
       
        return panel; 
    }

    public async createPreview(){
        await this.updatePreview();
    }

    private async updatePreview(){
        let html = frameTemplate;

        // Replace the renderer URL
        html = html.replace("{URL}", this._renderUrl);


        // BASE64 encode the content since we need to ensure there are no escape characters in it
        const encSchem = btoa(this._schemaContent);
        const encUiSchem = btoa(this._uiSchemaContent);

        // Replace the script tags with the content
        html = html.replace("{SCHEMA}", "SCHEMA:" + encSchem);
        html = html.replace("{UI_SCHEMA}", "UI_SCHEMA:" + encUiSchem);

        // Set panel HTML
        this._panel.webview.html = html;
    }

    // Format and validate the content
    // Will throw if invalid
    private formatAndValidateContent(content: string): string{
        if(!isJson(content)){
            let yam = YAML.parse(content);
            return JSON.stringify(yam);
        }
        JSON.parse(content);
        return content;
    }
}