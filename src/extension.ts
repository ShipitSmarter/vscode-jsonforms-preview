import * as vscode from 'vscode';

import {showPreview} from "./webPreview";

const { registerCommand } = vscode.commands;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		registerCommand('json-forms-web-preview.rightClickSchema', () => showPreview(context)),
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
