
import axios from 'axios';

type ResponseObject = {
    status: number;
    statusText: string;
    value: string;
    message: string;
};

export async function getApiCall(url: string, token: string, tokenHeaderName: string): Promise<ResponseObject> {
    let result: ResponseObject;
    try {
        let headers: any = {};
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

        let value: string = Buffer.from(response.data).toString();

        result = {
            status: response.status,
            statusText: response.statusText,
            value: value,
            message: ''
        };

    } catch (err: any) {

        result = {
            status: err.response.status,
            statusText: err.response.statusText,
            value: '',
            message: _getMessageFromError(err)
        };
    }

    return result;
};

function _getMessageFromError(err: any): string {
    if (err?.response?.data.hasOwnProperty('errors') && 
        Array.isArray(err.response.data.errors) && 
        err.response.data.errors.length > 0) {
        return err.response.data.errors[0]?.message;
    } else if (err?.response?.data?.hasOwnProperty('Message')) {
        return err.response.data.Message;
    } else if (err.hasOwnProperty('message')) {
        return err.message;
    } 
    
    return '';
}