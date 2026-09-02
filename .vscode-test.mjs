import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/suite/**/*.test.js',
  mocha: {
    require: './test-html-require-hook.js',
    timeout: 20000,
  },
});
