import * as vscode from 'vscode';
import * as fs from 'fs';
import * as YAML from 'yaml';
import path = require("path");
import { CONSTANTS } from "./constants";
import { debounce } from './utils/debounce';
import { showMessage, MessageType } from './utils/messages';
import { Disposable } from './utils/dispose';
import { getExtensionFile, getExtension, isJson, isSchemaFile, getCompanionFilePath } from "./utils/fileUtils";


export async function showPreview(
    context: vscode.ExtensionContext,
    editorInstance: any,
    schemaPath: any){

    const preview = new WebPreview(context, editorInstance, schemaPath);

    await preview.createPreview();
}

class WebPreview extends Disposable implements vscode.Disposable {

    private _panel: vscode.WebviewPanel;
    private _context: vscode.ExtensionContext;
    private _editorInstance: any;
    private _schemaPath: any;
    private _uiSchemaPath: any;
    private _url: string;
    private _debouncedTextUpdate: () => void;

    public constructor(context: vscode.ExtensionContext,
        editorInstance: any,
        schemaPath: any){ 
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
        this._url = url;
        
        
        // Work out correct filepaths
        if(schemaPath && isSchemaFile(schemaPath)){
            this._schemaPath = schemaPath;
            this._uiSchemaPath = getCompanionFilePath(schemaPath);   
        }
        else if(!isSchemaFile(schemaPath)){
            this._uiSchemaPath = schemaPath;
            this._schemaPath = getCompanionFilePath(schemaPath);
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


        // Create the webview panel
        this._panel = this.createPanel();


        // Configure editor debounce
        // TODO: Can we take a LIVE view? without having to save?
        const debounceTimeout = vscode.workspace.getConfiguration().get<number>(CONSTANTS.configKeyDebounceTimeout);
        this._debouncedTextUpdate = debounce(() => this.updatePreview(), debounceTimeout ?? CONSTANTS.defaultDebounceTimeout);
        const onChangedTextEditor = vscode.workspace.onDidChangeTextDocument((e): void => {
            if (e.document.isUntitled) { return; }
            if (e.document.uri.scheme === 'output') { return; }
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
        // TODO: Load this better
        let file = getExtensionFile(this._context, "dist", "frame.html");
        let html = fs.readFileSync(file, 'utf8');

        // Replace the renderer URL
        html = html.replace("{URL}", this._url);

        // Read schema content
        let schemaContent = fs.readFileSync(this._schemaPath, 'utf8');
        let uiSchemaContent = fs.readFileSync(this._uiSchemaPath, 'utf8');

        // Convert from YAML to JSON if needed
        if(!isJson(schemaContent)){
            let schemaYam = YAML.parse(schemaContent);
            schemaContent = JSON.stringify(schemaYam);
        }
        if(!isJson(uiSchemaContent)){
            let uiSchemaYam = YAML.parse(uiSchemaContent);
            uiSchemaContent = JSON.stringify(uiSchemaYam);
        }

        // BASE64 encode the content since we need to ensure there are no escape characters in it
        const encSchem = btoa(schemaContent);
        const encUiSchem = btoa(uiSchemaContent);

        // Replace the script tags with the content
        html = html.replace("{SCHEMA}", "SCHEMA:" + encSchem);
        html = html.replace("{UI_SCHEMA}", "UI_SCHEMA:" + encUiSchem);

        // Set panel HTML
        this._panel.webview.html = html;
    }
}