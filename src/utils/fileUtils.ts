import path = require("path");
import * as vscode from 'vscode';
import { CONSTANTS } from "../constants";

export function getExtension(path: string): string | undefined {
    const re = /(?:\.([^.]+))?$/;
    const matches = re.exec(path);
    if (matches && matches.length > 1) {
        return matches[1];
    }
    return undefined;
}

export function isSchemaFile(filePath: string): boolean {
    return CONSTANTS.schemaExtensions.some((ext: string) => filePath.endsWith(`.${ext}`) || filePath.endsWith(`${path.sep}${ext}`));
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
        return true;
    } catch {
        return false;
    }
}

export async function getCompanionFilePath(filePath: string): Promise<string> {
    if (!(await fileExists(filePath))) {
        throw new Error(`File ${filePath} does not exist`);
    }

    const fileExt = getExtension(filePath);
    const isSchema = CONSTANTS.schemaExtensions.some((ext: string) => filePath.endsWith(`.${ext}`) || filePath.endsWith(`${path.sep}${ext}`));
    const schemaExt = isSchema ? `${CONSTANTS.schemaFile}.${fileExt}` : `${CONSTANTS.uiSchemaFile}.${fileExt}`;
    const pathPrefix = filePath.replace(schemaExt, "");

    const mapFiles = (ext: string) => `${pathPrefix}${ext}`;

    const validFiles = isSchema ? CONSTANTS.uiSchemaExtensions.map(mapFiles) : CONSTANTS.schemaExtensions.map(mapFiles);

    for (const file of validFiles) {
        if (await fileExists(file)) {
            return file;
        }
    }
    throw new Error(`No companion file found for ${filePath}`);
}

export function isJson(content: string): boolean {
    const jsonChars = ['{', '['];
    return jsonChars.some(c => content.startsWith(c));
}
