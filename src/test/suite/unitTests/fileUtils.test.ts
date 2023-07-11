/* eslint-disable @typescript-eslint/naming-convention */
import * as mockFs from 'mock-fs';

import * as assert from 'assert';
import * as vscode from 'vscode';

import {getCompanionFilePath} from "../../../utils/fileUtils";


suite('File utils tests', () => {
	vscode.window.showInformationMessage('Start all tests.');

	suiteTeardown(() => {
        mockFs.restore();
    });

	test('Test get file path from schema', () => {
		mockFs({
			'schemas': {
				'test.schema.json': '{}',
				'test.uischema.json': '{}'
				}
			}
		);

		const filePath = "schemas/test.schema.json";
		const companion = getCompanionFilePath(filePath);
		assert.equal(companion, "schemas/test.uischema.json");
	});
	test('Test get file path from uischema', () => {
		mockFs({
			'schemas': {
				'test.schema.json': '{}',
				'test.uischema.json': '{}'
				}
			}
		);

		const filePath = "schemas/test.uischema.json";
		const companion = getCompanionFilePath(filePath);
		assert.equal(companion, "schemas/test.schema.json");
	});
});
