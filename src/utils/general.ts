import * as vscode from 'vscode';

export function getConfiguration<T>(constant: string): T | undefined {
    return vscode.workspace.getConfiguration().get<T>(constant);
}

type JsonObject = Record<string, unknown>;

export async function traverseObject(
    obj: JsonObject,
    keyName: string,
    keyType: string,
    fnc: (input: JsonObject) => Promise<void>
): Promise<void> {
    // thanks to https://medium.com/@alaneicker/how-to-process-json-data-with-recursion-dc530dd3db09
    for (const key in obj) {
        const value = obj[key];
        if (typeof value === keyType) {
            if (key === keyName) {
                await fnc(value as JsonObject);
                continue;
            }
            if (Array.isArray(value)) {
                // loop through array
                for (let i = 0; i < value.length; i++) {
                    if (typeof value[i] === 'object') {
                        // call function recursively only for objects
                        await traverseObject(value[i] as JsonObject, keyName, keyType, fnc);
                    }
                }
            } else {
                // call function recursively for object
                await traverseObject(value as JsonObject, keyName, keyType, fnc);
            }
        }
    }
}

export function base64Encode(input: string): string {
    return Buffer.from(input).toString('base64');
}
