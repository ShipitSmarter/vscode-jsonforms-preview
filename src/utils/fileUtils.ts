import path = require("path");
import * as fs from 'fs';
import { CONSTANTS } from "../constants";

export function getExtension(path: string): string | undefined{
    var re = /(?:\.([^.]+))?$/;
    var matches = re.exec(path);
    if(matches && matches.length > 1){
        return matches[1];
    }
    return undefined;
}

export function isSchemaFile(filePath: string): boolean{
    return CONSTANTS.schemaExtensions.some((ext:string) => filePath.endsWith(`.${ext}`) || filePath.endsWith(`${path.sep}${ext}`));
}

export function getCompanionFilePath(filePath: string): string | undefined{
    const directory = path.dirname(filePath);
    const fileExt = getExtension(filePath);
    const isSchema = CONSTANTS.schemaExtensions.some((ext:string) => filePath.endsWith(`.${ext}`) || filePath.endsWith(`${path.sep}${ext}`));
    const schemaExt = isSchema ? `${CONSTANTS.schemaFile}.${fileExt}` : `${CONSTANTS.uiSchemaFile}.${fileExt}`;
    const pathPrefix = filePath.replace(schemaExt, "");

    const mapFiles = (ext:string) => `${pathPrefix}${ext}`;

    const validFiles = isSchema ? CONSTANTS.uiSchemaExtensions.map(mapFiles) : CONSTANTS.schemaExtensions.map(mapFiles);

    for (const file of validFiles) {
        if (fs.existsSync(file)) {
            return file;
        }
    }
    return undefined;
}

export function isJson(content: string): boolean{
    const jsonChars = ['{', '['];
    return jsonChars.some(c => content.startsWith(c));
}