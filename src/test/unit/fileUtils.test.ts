import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { getCompanionFilePath, isJson } from '../../utils/fileUtils';

const DPD_DIR = '/Users/jeff/github/stitch-integrations/files/carriers/v2/dpd/meta-api/ordering';
const DPD_SCHEMA = path.join(DPD_DIR, 'ordering.schema.json');
const DPD_UISCHEMA = path.join(DPD_DIR, 'ordering.uischema.json');

suite('fileUtils: getCompanionFilePath', () => {
    let tmpDir: string;

    suiteSetup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonforms-preview-unit-'));
        fs.writeFileSync(path.join(tmpDir, 'test.schema.json'), '{}');
        fs.writeFileSync(path.join(tmpDir, 'test.uischema.json'), '{}');
    });

    suiteTeardown(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('resolves uischema companion from schema (tmp fixture)', async () => {
        const filePath = path.join(tmpDir, 'test.schema.json');
        assert.strictEqual(await getCompanionFilePath(filePath), path.join(tmpDir, 'test.uischema.json'));
    });

    test('resolves schema companion from uischema (tmp fixture)', async () => {
        const filePath = path.join(tmpDir, 'test.uischema.json');
        assert.strictEqual(await getCompanionFilePath(filePath), path.join(tmpDir, 'test.schema.json'));
    });

    test('resolves uischema companion from schema (DPD real fixture)', async function () {
        if (!fs.existsSync(DPD_SCHEMA) || !fs.existsSync(DPD_UISCHEMA)) {
            this.skip();
        }
        assert.strictEqual(await getCompanionFilePath(DPD_SCHEMA), DPD_UISCHEMA);
    });

    test('resolves schema companion from uischema (DPD real fixture)', async function () {
        if (!fs.existsSync(DPD_SCHEMA) || !fs.existsSync(DPD_UISCHEMA)) {
            this.skip();
        }
        assert.strictEqual(await getCompanionFilePath(DPD_UISCHEMA), DPD_SCHEMA);
    });

    test('throws when the input file does not exist', async () => {
        await assert.rejects(() => getCompanionFilePath(path.join(tmpDir, 'missing.schema.json')));
    });

    test('throws when no companion file exists', async () => {
        const lonely = path.join(tmpDir, 'lonely.schema.json');
        fs.writeFileSync(lonely, '{}');
        await assert.rejects(() => getCompanionFilePath(lonely));
        fs.rmSync(lonely);
    });
});

suite('fileUtils: isJson', () => {
    test('returns true for content starting with {', () => {
        assert.strictEqual(isJson('{"a":1}'), true);
    });

    test('returns true for content starting with [', () => {
        assert.strictEqual(isJson('[1,2,3]'), true);
    });

    test('returns false for YAML-style content', () => {
        assert.strictEqual(isJson('a: 1\nb: 2'), false);
    });

    test('returns false for empty string', () => {
        assert.strictEqual(isJson(''), false);
    });
});
