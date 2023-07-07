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

        let test = fs.readFileSync(file, 'utf8');

        this._panel.webview.html = test;

        this._register(this._panel);
    }

    // <iframe width="2000px" height="10000px" src='http://localhost:8080/'> </iframe>

    public async showPreview(){
        this._panel?.reveal();
    }
}