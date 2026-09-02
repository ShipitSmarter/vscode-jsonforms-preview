/* eslint-disable @typescript-eslint/naming-convention */
import * as assert from 'assert';
import { getMessageFromError } from '../../utils/calls';

// These tests lock the getMessageFromError contract AFTER the Step 4
// axios->fetch swap: errors are now shaped as `{ body, message }`, where
// `body` is the parsed JSON response body (or undefined) and `message` is
// a generic fallback message, mirroring what getApiCall constructs from a
// fetch Response.
suite('calls: getMessageFromError (fetch-shaped)', () => {
    test('extracts first message from body.errors array', () => {
        const err = {
            body: { errors: [{ message: 'first error' }, { message: 'second error' }] },
            message: 'Request failed with status code 400',
        };
        assert.strictEqual(getMessageFromError(err), 'first error');
    });

    test('extracts body.Message when errors array absent', () => {
        const err = {
            body: { Message: 'top level message' },
            message: 'Request failed with status code 500',
        };
        assert.strictEqual(getMessageFromError(err), 'top level message');
    });

    test('falls back to err.message when no body shape matches', () => {
        const err = { message: 'plain error message' };
        assert.strictEqual(getMessageFromError(err), 'plain error message');
    });

    test('returns empty string when nothing matches', () => {
        const err = {};
        assert.strictEqual(getMessageFromError(err), '');
    });

    test('empty errors array falls through to Message check', () => {
        const err = { body: { errors: [], Message: 'fallback message' } };
        assert.strictEqual(getMessageFromError(err), 'fallback message');
    });

    test('returns empty string for non-object input', () => {
        assert.strictEqual(getMessageFromError(undefined), '');
        assert.strictEqual(getMessageFromError('plain string'), '');
    });

    test('handles a real Error instance (network failure) via its message', () => {
        const err = new Error('fetch failed');
        assert.strictEqual(getMessageFromError(err), 'fetch failed');
    });
});
