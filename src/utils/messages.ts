import * as vscode from 'vscode';

export enum MessageType {
    Error = "err",
    Warning = "war",
    Information = "info",
}

export const showMessage = async (
    message: string,
    type?: string
): Promise<string | undefined> => {
    switch (type) {
        case MessageType.Error:
            return vscode.window.showErrorMessage(message);
        case MessageType.Warning:
            return vscode.window.showWarningMessage(message);
        default:
            return vscode.window.showInformationMessage(message);
    }
};
