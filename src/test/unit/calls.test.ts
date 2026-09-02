/* eslint-disable @typescript-eslint/naming-convention */
import * as assert from 'assert';
import { getMessageFromError } from '../../utils/calls';

// These tests lock the CURRENT axios-based error-extraction behavior of
// getMessageFromError EXACTLY as it exists before the Step 4 axios->fetch
// swap. Step 4 must adapt this function to the fetch Response shape and
// will need to update/replace these tests as part of that change.
suite('calls: getMessageFromError (axios-shaped baseline)', () => {
    test('extracts first message from response.data.errors array', () => {
        const err = {
            response: {
                data: {
                    errors: [{ message: 'first error' }, { message: 'second error' }],
                },
            },
        };
        assert.strictEqual(getMessageFromError(err), 'first error');
    });

    test('extracts response.data.Message when errors array absent', () => {
        const err = {
            response: {
                data: { Message: 'top level message' },
            },
        };
        assert.strictEqual(getMessageFromError(err), 'top level message');
    });

    test('falls back to err.message when no response.data shape matches', () => {
        const err = { message: 'plain error message' };
        assert.strictEqual(getMessageFromError(err), 'plain error message');
    });

    test('returns empty string when nothing matches', () => {
        const err = {};
        assert.strictEqual(getMessageFromError(err), '');
    });

    test('empty errors array falls through to Message check', () => {
        const err = {
            response: {
                data: { errors: [], Message: 'fallback message' },
            },
        };
        assert.strictEqual(getMessageFromError(err), 'fallback message');
    });
});
