import * as vscode from 'vscode';
import * as fs from 'fs';
import * as YAML from 'yaml';
import path = require("path");
import { Buffer } from "buffer";
import { showMessage, MessageType } from './utils/messages';
import { Disposable } from './utils/dispose';
import { SchemaExt, UiSchemaExt, getExtensionFile, switchPath, JsonExts, YamlExts, getExtension, isJson } from "./utils/fileUtils";


export async function showPreview(context: vscode.ExtensionContext,
    editorInstance: any,
    schemaPath: any){
    const preview = new WebPreview(context, editorInstance, schemaPath);

    await preview.setup();

    await preview.showPreview();
}

class WebPreview extends Disposable implements vscode.Disposable {

    private _panel: vscode.WebviewPanel | undefined;
    private _context: vscode.ExtensionContext;
    private _editorInstance: any;
    private _schemaPath: any;
    private _uiSchemaPath: any;

    public constructor(context: vscode.ExtensionContext,
        editorInstance: any,
        schemaPath: any){ 
        super();

        this._context = context;
        this._editorInstance = editorInstance;
        
        // Work out filepaths
        const fileExt = getExtension(schemaPath);
        if(fileExt && (YamlExts.includes(fileExt) || JsonExts.includes(fileExt))){
            if(schemaPath.includes(`.${SchemaExt}.${fileExt}`) || schemaPath.includes(`${path.sep}${SchemaExt}.${fileExt}`)){
                this._schemaPath = schemaPath;
                this._uiSchemaPath = switchPath(schemaPath, SchemaExt, fileExt);
            }
            if(schemaPath.includes(`.${UiSchemaExt}.${fileExt}`) || schemaPath.includes(`${path.sep}${UiSchemaExt}.${fileExt}`)){
                this._schemaPath = switchPath(schemaPath, UiSchemaExt, fileExt);
                this._uiSchemaPath = schemaPath;
            }
            else{
                showMessage(
                    this._editorInstance,
                    "Invalid file selected",
                    MessageType.Error
                );
            }
        }

        // Confirm files exist
        if (!fs.existsSync(this._schemaPath)) {
            showMessage(
                this._editorInstance,
                "Schema file not found",
                MessageType.Error
            );
        }

        if (!fs.existsSync(this._uiSchemaPath)) {
            showMessage(
                this._editorInstance,
                "UISchema file not found",
                MessageType.Error
            );
        }
    }

    public async setup(){
        const showOptions = {
            viewColumn: vscode.ViewColumn.Two,
            preserveFocus: true
        };

        const options = {
            enableScripts: true,          
        };

        this._panel = vscode.window.createWebviewPanel('WebPreview', 'Web Preview',  showOptions, options);

        // TODO: Load this better
        let file = getExtensionFile(this._context, "dist", "frame.html");
        let html = fs.readFileSync(file, 'utf8');

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
        html = html.replace("{SCHEMA}", "SCM:" + encSchem);
        html = html.replace("{UISCHEMA}", "UISCM:" + encUiSchem);

        this._panel.webview.html = html;

        this._register(this._panel);
    }

    public async showPreview(){
        this._panel?.reveal();
    }
}