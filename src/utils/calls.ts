export type ResponseObject = {
    status: number;
    statusText: string;
    value: string;
    message: string;
};

interface ErrorLike {
    body?: unknown;
    message?: string;
}

function isErrorLike(err: unknown): err is ErrorLike {
    return typeof err === 'object' && err !== null;
}

export async function getApiCall(url: string, token: string, tokenHeaderName: string): Promise<ResponseObject> {
    try {
        const headers: Record<string, string> = {};
        if (tokenHeaderName.length > 0) {
            headers[tokenHeaderName] = token;
        }

        const response = await fetch(url, {
            method: "GET",
            headers: headers,
        });

        const buffer = await response.arrayBuffer();
        const value = Buffer.from(buffer).toString();

        if (!response.ok) {
            return {
                status: response.status,
                statusText: response.statusText,
                value: '',
                message: getMessageFromError({ body: tryParseJson(value), message: `Request failed with status code ${response.status}` })
            };
        }

        return {
            status: response.status,
            statusText: response.statusText,
            value: value,
            message: ''
        };

    } catch (err: unknown) {
        return {
            status: 0,
            statusText: '',
            value: '',
            message: getMessageFromError(err)
        };
    }
}

function tryParseJson(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

export function getMessageFromError(err: unknown): string {
    if (!isErrorLike(err)) {
        return '';
    }

    const data = err.body as Record<string, unknown> | undefined;

    if (data && Object.prototype.hasOwnProperty.call(data, 'errors') &&
        Array.isArray(data.errors) &&
        data.errors.length > 0) {
        const firstError = data.errors[0] as Record<string, unknown> | undefined;
        return (firstError?.message as string) ?? '';
    } else if (data && Object.prototype.hasOwnProperty.call(data, 'Message')) {
        return data.Message as string;
    } else if (err.message !== undefined) {
        return err.message;
    }

    return '';
}
