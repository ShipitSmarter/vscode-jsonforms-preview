import * as assert from 'assert';
import { base64Encode, traverseObject } from '../../utils/general';

suite('general: base64Encode', () => {
    test('encodes ASCII content exactly as Buffer.from(...).toString("base64")', () => {
        const input = '{"hello":"world"}';
        assert.strictEqual(base64Encode(input), Buffer.from(input).toString('base64'));
    });

    test('encodes empty string', () => {
        assert.strictEqual(base64Encode(''), '');
    });

    test('encodes unicode content', () => {
        const input = '{"emoji":"🚀"}';
        assert.strictEqual(base64Encode(input), Buffer.from(input).toString('base64'));
    });
});

suite('general: traverseObject', () => {
    test('invokes fnc for matching keyName/keyType at top level', async () => {
        const seen: unknown[] = [];
        const obj = { asyncFetch: { api: { endpoint: '/x' } } };
        await traverseObject(obj, 'asyncFetch', 'object', async (v) => { seen.push(v); });
        assert.strictEqual(seen.length, 1);
        assert.deepStrictEqual(seen[0], { api: { endpoint: '/x' } });
    });

    test('recurses into nested objects to find matching key', async () => {
        const seen: unknown[] = [];
        const obj = { elements: [{ type: 'Control', options: { asyncFetch: { api: { endpoint: '/y' } } } }] };
        await traverseObject(obj, 'asyncFetch', 'object', async (v) => { seen.push(v); });
        assert.strictEqual(seen.length, 1);
        assert.deepStrictEqual(seen[0], { api: { endpoint: '/y' } });
    });

    test('recurses into arrays of objects', async () => {
        const seen: unknown[] = [];
        const obj = {
            elements: [
                { asyncFetch: { id: 1 } },
                { asyncFetch: { id: 2 } },
            ],
        };
        await traverseObject(obj, 'asyncFetch', 'object', async (v: any) => { seen.push(v.id); });
        assert.deepStrictEqual(seen, [1, 2]);
    });

    test('does not invoke fnc when keyType does not match', async () => {
        const seen: unknown[] = [];
        const obj = { asyncFetch: 'not-an-object' };
        await traverseObject(obj, 'asyncFetch', 'object', async (v) => { seen.push(v); });
        assert.strictEqual(seen.length, 0);
    });

    test('does not descend into non-matching primitive values', async () => {
        const seen: unknown[] = [];
        const obj = { a: 1, b: 'str', c: true };
        await traverseObject(obj, 'asyncFetch', 'object', async (v) => { seen.push(v); });
        assert.strictEqual(seen.length, 0);
    });
});
