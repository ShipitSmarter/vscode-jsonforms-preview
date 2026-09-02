// Async-fetch injection: scans a uiSchema JSON string for `asyncFetch` nodes
// and injects the API response as `result`. Extracted from WebPreview as a
// standalone, dependency-injected function so it can be unit tested without
// a VS Code host.

import { traverseObject } from './general';
import { getApiCall, getMessageFromError } from './calls';

export interface AsyncFetchNode {
    api: {
        endpoint: string;
    };
    result?: unknown;
    [key: string]: unknown;
}

export interface AsyncFetchDeps {
    tenantUrl: string | undefined;
    token: string | undefined;
    tokenHeaderName: string | undefined;
    onError: (message: string) => void;
}

// Scan `stringData` for `asyncFetch` objects and inject their API results.
// If no tenant URL is configured, returns the input untouched (current behavior).
export async function injectAsyncFetchData(stringData: string, deps: AsyncFetchDeps): Promise<string> {
    if (!deps.tenantUrl || deps.tenantUrl.length === 0) {
        return stringData;
    }

    const uiSchemaObject = JSON.parse(stringData);
    await traverseObject(uiSchemaObject, "asyncFetch", "object", (input) =>
        injectInAsyncFetchObject(input as unknown as AsyncFetchNode, deps)
    );
    return JSON.stringify(uiSchemaObject);
}

async function injectInAsyncFetchObject(asyncFetchObject: AsyncFetchNode, deps: AsyncFetchDeps): Promise<void> {
    const endpoint = asyncFetchObject.api.endpoint;
    const url = deps.tenantUrl ?? "";
    const token = deps.token ?? "";
    const tokenHeaderName = deps.tokenHeaderName ?? "";

    const response = await getApiCall(url + endpoint, token, tokenHeaderName);
    if (response.status < 200 || response.status >= 300) {
        deps.onError(`GET to ${url + endpoint} failed: ${response.message}`);
    } else {
        try {
            asyncFetchObject.result = JSON.parse(response.value);
        } catch (err: unknown) {
            deps.onError(`GET to ${url + endpoint} returned invalid JSON: ${getMessageFromError(err)}`);
        }
    }
}
