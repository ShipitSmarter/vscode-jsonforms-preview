import * as vscode from 'vscode';
import * as fs from 'fs';
import { Disposable } from './utils/dispose';
import { getExtensionFile } from "./utils/fileUtils";


export async function showPreview(context: vscode.ExtensionContext){
    const preview = new WebPreview(context);

    await preview.showPreview();
}

class WebPreview extends Disposable implements vscode.Disposable {

    private _panel: vscode.WebviewPanel | undefined;

    public constructor(context: vscode.ExtensionContext){
        super();

        const showOptions = {
            viewColumn: vscode.ViewColumn.Two,
            preserveFocus: true
        };

        const options = {
            enableScripts: true,
            
        };

        this._panel = vscode.window.createWebviewPanel('WebPreview', 'Web Preview',  showOptions, options);

        let file = getExtensionFile(context, "dist", "frame.html");
        let html = fs.readFileSync(file, 'utf8');

        let schemaFile = getExtensionFile(context, "src/testFiles", "booking.schema.json");
        let uiSchemaFile = getExtensionFile(context, "src/testFiles", "booking.uischema.json");
        let schema = fs.readFileSync(schemaFile, 'utf8');
        let uiSchema = fs.readFileSync(uiSchemaFile, 'utf8');

        //html = html.replace("{SCHEMA}", "SCM:" + schema);
        //html = html.replace("{UISCHEMA}", "UISCM:" + uiSchema);

        this._panel.webview.html = html;

        this._register(this._panel);
    }

    // <iframe width="2000px" height="10000px" src='http://localhost:8080/'> </iframe>

    public async showPreview(){
        this._panel?.reveal();
    }
}