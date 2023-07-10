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

export function getExtension(path: string): string | undefined{
    var re = /(?:\.([^.]+))?$/;
    var matches = re.exec(path);
    if(matches && matches.length > 1){
        return matches[1];
    }
    return undefined;
}

export const YamlExts = ["yaml", "yml"];
export const JsonExts = ["json"];
export const UiSchemaExt = "uischema";
export const SchemaExt = "schema";

export function switchPath(schemaPath: string, currentSchema: string, fileExt: string): string{
    const switchedExt = currentSchema === SchemaExt ? UiSchemaExt : SchemaExt;

    const pathPrefix = schemaPath.endsWith(`${path.sep}${currentSchema}.${fileExt}`)
    ? schemaPath.substring(0, schemaPath.length - `${currentSchema}.${fileExt}`.length)
    : schemaPath.endsWith(`.${currentSchema}.${fileExt}`)
    ? schemaPath.substring(0, schemaPath.length - `${currentSchema}.${fileExt}`.length)
    : schemaPath.substring(0, schemaPath.length - `${fileExt}`.length);

    return pathPrefix + `${switchedExt}.${fileExt}`;
}

export function isJson(content: string): boolean{
    const jsonChars = ['{', '['];
    return jsonChars.some(c => content.startsWith(c));
}