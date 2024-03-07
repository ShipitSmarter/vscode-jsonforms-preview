import * as vscode from 'vscode';
import * as fs from 'fs';
import * as YAML from 'yaml';
import path = require("path");
import { CONSTANTS } from "./constants";
import { debounce } from './utils/debounce';
import { showMessage, MessageType } from './utils/messages';
import { Disposable } from './utils/dispose';
import { isJson, isSchemaFile, getCompanionFilePath } from "./utils/fileUtils";
import axios from 'axios';

import frameTemplate from './frame.html';

type ResponseObject = {
    status:number;
    statusText:string;
    value:string;
    message:string;
};

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

        const panel = vscode.window.createWebviewPanel('WebPreview', 'JSONForms Web-Preview',  showOptions, options);
       
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
        const encUiSchem = btoa(await this.injectAsyncFetchData(this._uiSchemaContent));

        // Replace the script tags with the content
        html = html.replace("{SCHEMA}", "SCHEMA:" + encSchem);
        html = html.replace("{UI_SCHEMA}", "UI_SCHEMA:" + encUiSchem);

        // Set panel HTML
        this._panel.webview.html = html;
    }

    private async injectAsyncFetchData(stringData: string): Promise<string> {
        let uiSchemaObject = JSON.parse(stringData);
        await this.findAsyncFetches(uiSchemaObject);

        let result = JSON.stringify(uiSchemaObject);
        return result;
    }

    private async findAsyncFetches(obj: any): Promise<void> {
        // thanks to https://medium.com/@alaneicker/how-to-process-json-data-with-recursion-dc530dd3db09
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                if (key === 'asyncFetch') {
                    await this.injectInAsyncFetchObject(obj[key]);
                    continue;
                }
                if (Array.isArray(obj[key])) {
                    // loop through array
                    for (let i = 0; i < obj[key].length; i++) {
                        if (typeof obj[key][i] === 'object') {
                            // call function recursively only for objects
                            await this.findAsyncFetches(obj[key][i]);
                        }
                    }
                } else {
                    // call function recursively for object
                    await this.findAsyncFetches(obj[key]);
                }
            }
        }
    }

    private async injectInAsyncFetchObject(asyncFetch: any): Promise<void> {
        const endpoint = asyncFetch.api.endpoint;
        const url = vscode.workspace.getConfiguration().get<string>(CONSTANTS.configKeyTenantUrl) ?? "";
        const token = vscode.workspace.getConfiguration().get<string>(CONSTANTS.configKeyToken) ?? "";
        const tokenHeaderName = vscode.workspace.getConfiguration().get<string>(CONSTANTS.configKeyTokenHeaderName) ?? "";

        var response = await this._getApiCall(url + endpoint, token, tokenHeaderName);
        let responseObject = JSON.parse(response.value);
        asyncFetch.result = responseObject;
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


    private async _getApiCall(url:string, token:string, tokenHeaderName: string): Promise<ResponseObject> {
        let result: ResponseObject;
        try {
            let headers: any = {};
            headers[tokenHeaderName] = token;

          const response = await axios({
                method: "GET",
                url: url,
                responseType: 'arraybuffer',
                responseEncoding: "binary",
                headers: {
                    ...headers
                }
            });
    
          let value: string = Buffer.from(response.data).toString();
    
          result = {
            status: response.status,
            statusText: response.statusText,
            value: value,
            message: ''
          };
    
        } catch (err:any) {
    
          result = {
            status: err.response.status,
            statusText: err.response.statusText,
            value: '',
            message: this._getMessageFromError(err)
          };

          vscode.window.showErrorMessage(`JSONForms Web-Preview: GET to ${url} failed: ${result.message}`);
        }
    
        return result;
    };

    private _getMessageFromError(err:any) : string {
        let message: string;
        if (err?.response?.data.hasOwnProperty('errors')) {
            message = err.response.data.errors[0]?.message;
        } else if (err?.response?.data?.hasOwnProperty('Message')) {
            message = err.response.data.Message;
        } else if (err.hasOwnProperty('message')) {
            message = err.message;
        } else {
            message = '';
        }

        return message;
    }
}