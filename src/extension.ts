import * as vscode from 'vscode';

import { showPreview } from "./webPreview";

const { registerCommand } = vscode.commands;

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		registerCommand('json-forms-web-preview.rightClickSchema', (uri?: vscode.Uri) => {
			showPreview(uri?.fsPath ?? '');
		}),
	);
}

// This method is called when your extension is deactivated
export function deactivate(): void {}
