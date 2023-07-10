import * as vscode from 'vscode';

import {showPreview} from "./webPreview";

const { registerCommand } = vscode.commands;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		registerCommand('json-forms-web-preview.rightClickSchema', (args: any) => {
			if (args === undefined) {
			  args = {fsPath: null};
			}
			showPreview(context, vscode, args.fsPath);
		}),
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
