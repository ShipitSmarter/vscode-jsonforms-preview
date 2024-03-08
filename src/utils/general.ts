import * as vscode from 'vscode';

export function getConfiguration<T>(constant: string): T | undefined {
    return vscode.workspace.getConfiguration().get<T>(constant);
}

export async function traverseObject(obj: any, keyName: string, keyType: string, fnc: (input:any) => any): Promise<void> {
    // thanks to https://medium.com/@alaneicker/how-to-process-json-data-with-recursion-dc530dd3db09
    for (let key in obj) {
        if (typeof obj[key] === keyType) {
            if (key === keyName) {
                await fnc(obj[key]);
                continue;
            }
            if (Array.isArray(obj[key])) {
                // loop through array
                for (let i = 0; i < obj[key].length; i++) {
                    if (typeof obj[key][i] === 'object') {
                        // call function recursively only for objects
                        await traverseObject(obj[key][i], keyName, keyType, fnc);
                    }
                }
            } else {
                // call function recursively for object
                await traverseObject(obj[key], keyName, keyType, fnc);
            }
        }
    }
}