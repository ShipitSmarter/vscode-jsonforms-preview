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
    context: vscode.ExtensionContext,
    editorInstance: any,
    filePath: any){

    const preview = new WebPreview(context, editorInstance, filePath);

    await preview.createPreview();
}

class WebPreview extends Disposable implements vscode.Disposable {

    private _panel: vscode.WebviewPanel;
    private _context: vscode.ExtensionContext;
    private _editorInstance: any;

    private _renderUrl: string;

    private _schemaPath: any;
    private _uiSchemaPath: any;
    private _schemaContent: string;
    private _uiSchemaContent: string;


    private _debouncedTextUpdate: () => void;


    public constructor(context: vscode.ExtensionContext,
        editorInstance: any,
        filePath: any){ 
        super();

        // Store params
        this._context = context;
        this._editorInstance = editorInstance;

        // Fetch configured URL from configuration
        const url = vscode.workspace.getConfiguration().get<string>(CONSTANTS.configKeyRenderUrl);
        if(!url){
            showMessage(
                this._editorInstance,
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
                this._editorInstance,
                "Invalid file selected",
                MessageType.Error
            );
            throw new Error("Invalid file selected");
        }

        // Confirm files exist
        if (!this._schemaPath) {
            showMessage(
                this._editorInstance,
                "Missing schema file",
                MessageType.Error
            );
            throw new Error("Missing schema file");
        }
        if(!this._uiSchemaPath)
        {
            showMessage(
                this._editorInstance,
                "Missing UISchema file, all properties will be rendered",
                MessageType.Warning
            );
        }


        // Get content
        let schemaFileContent = fs.readFileSync(this._schemaPath, 'utf8');
        let uiSchemaContent = fs.readFileSync(this._uiSchemaPath, 'utf8');

        this._schemaContent = schemaFileContent;
        this._uiSchemaContent = uiSchemaContent;

        // Create the webview panel
        this._panel = this.createPanel();


        // Configure editor debounce
        const debounceTimeout = vscode.workspace.getConfiguration().get<number>(CONSTANTS.configKeyDebounceTimeout);
        this._debouncedTextUpdate = debounce(() => this.updatePreview(), debounceTimeout ?? CONSTANTS.defaultDebounceTimeout);
        const onChangedTextEditor = vscode.workspace.onDidChangeTextDocument((e): void => {
            if (e.document.isUntitled) { return; }
            if (e.document.uri.scheme === 'output') { return; }

            if(e.document.uri.fsPath === this._schemaPath){
                try{
                    var schemaContent = this.formatContent(e.document.getText());
                    JSON.parse(schemaContent);
                    this._schemaContent = this.formatContent(e.document.getText());
                }
                catch(e){
                    // Invalid JSON, so we don't update
                    return;
                }
            }
            else if(e.document.uri.fsPath === this._uiSchemaPath){
                try{
                    var uiSchemaContent = this.formatContent(e.document.getText());
                    JSON.parse(uiSchemaContent);
                    this._uiSchemaContent = this.formatContent(e.document.getText());
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

    private formatContent(content: string): string{
        if(!isJson(content)){
            let yam = YAML.parse(content);
            return JSON.stringify(yam);
        }
        return content;
    }
}