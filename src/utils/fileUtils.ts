import path = require("path");
import { ExtensionContext, Uri } from "vscode";

export function getExtensionFile(context: ExtensionContext, folder: string, file: string): string {
    // get path to file in extension folder
    let fileRawPath = Uri.file(
        path.join(context.extensionPath, folder, file)
    );

    let filePathEscaped : string = fileRawPath.toString();

    let filePath = Uri.parse(filePathEscaped).fsPath;

    return filePath;
}