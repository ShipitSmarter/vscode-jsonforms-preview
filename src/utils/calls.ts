
import axios from 'axios';

export type ResponseObject = {
    status: number;
    statusText: string;
    value: string;
    message: string;
};

interface AxiosErrorLike {
    response?: {
        status: number;
        statusText: string;
        data?: unknown;
    };
    message?: string;
}

function isAxiosErrorLike(err: unknown): err is AxiosErrorLike {
    return typeof err === 'object' && err !== null;
}

export async function getApiCall(url: string, token: string, tokenHeaderName: string): Promise<ResponseObject> {
    let result: ResponseObject;
    try {
        const headers: Record<string, string> = {};
        if (tokenHeaderName.length > 0) {
            headers[tokenHeaderName] = token;
        }

        const response = await axios({
            method: "GET",
            url: url,
            responseType: 'arraybuffer',
            responseEncoding: "binary",
            headers: {
                ...headers
            }
        });

        const value: string = Buffer.from(response.data).toString();

        result = {
            status: response.status,
            statusText: response.statusText,
            value: value,
            message: ''
        };

    } catch (err: unknown) {
        const response = isAxiosErrorLike(err) ? err.response : undefined;

        result = {
            status: response?.status ?? 0,
            statusText: response?.statusText ?? '',
            value: '',
            message: getMessageFromError(err)
        };
    }

    return result;
}

export function getMessageFromError(err: unknown): string {
    if (!isAxiosErrorLike(err)) {
        return '';
    }

    const data = err.response?.data as Record<string, unknown> | undefined;

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
