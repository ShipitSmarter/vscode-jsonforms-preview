/* eslint-disable @typescript-eslint/naming-convention */
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {getCompanionFilePath} from "../../../utils/fileUtils";

suite('File utils tests', () => {
	let tmpDir: string;

	suiteSetup(() => {
		// Use a real temporary directory instead of an fs mock. Mocking libraries
		// such as mock-fs fail to intercept fs calls on modern Node versions,
		// causing these tests to fall through to the real filesystem and fail.
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonforms-preview-'));
		fs.writeFileSync(path.join(tmpDir, 'test.schema.json'), '{}');
		fs.writeFileSync(path.join(tmpDir, 'test.uischema.json'), '{}');
	});

	suiteTeardown(() => {
		fs.rmSync(tmpDir, {recursive: true, force: true});
	});

	test('Test get file path from schema', () => {
		const filePath = path.join(tmpDir, 'test.schema.json');
		const companion = getCompanionFilePath(filePath);
		assert.equal(companion, path.join(tmpDir, 'test.uischema.json'));
	});

	test('Test get file path from uischema', () => {
		const filePath = path.join(tmpDir, 'test.uischema.json');
		const companion = getCompanionFilePath(filePath);
		assert.equal(companion, path.join(tmpDir, 'test.schema.json'));
	});
});
