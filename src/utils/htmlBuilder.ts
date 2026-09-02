// Pure helpers for building the webview HTML payload. Extracted from WebPreview
// so the token-substitution logic (the frozen wire protocol: {URL}, {NONCE},
// {FRAME_SRC}, {SCHEMA}, {UI_SCHEMA}) can be tested without a VS Code host.

export interface PreviewHtmlParams {
    template: string;
    renderUrl: string;
    nonce: string;
    frameSrc: string;
    schemaBase64: string;
    uiSchemaBase64: string;
}

// Replace the frame.html template tokens with actual values.
// Byte-identical to the original WebPreview.updatePreview() replacement order.
export function buildPreviewHtml(params: PreviewHtmlParams): string {
    let html = params.template;

    html = html.replace("{URL}", params.renderUrl);
    html = html.replace(/{NONCE}/g, params.nonce);
    html = html.replace("{FRAME_SRC}", params.frameSrc);
    html = html.replace("{SCHEMA}", "SCHEMA:" + params.schemaBase64);
    html = html.replace("{UI_SCHEMA}", "UI_SCHEMA:" + params.uiSchemaBase64);

    return html;
}

// Derive the CSP frame-src value from the configured render URL.
// Falls back to the raw value if it cannot be parsed as a URL.
export function getFrameSrc(renderUrl: string): string {
    try {
        return new URL(renderUrl).origin;
    } catch {
        return renderUrl;
    }
}

// Generate a random nonce for the webview Content-Security-Policy.
export function generateNonce(): string {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
