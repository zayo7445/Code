"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const context_1 = require("../../mocks/context");
const types_1 = require("../../types");
describe('runFilesInContext', () => {
    let context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
    beforeEach(() => {
        context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
    });
    it('returns IllegalCharInFilePathError if any file path contains invalid characters', () => {
        const files = {
            '/a.js': '1 + 2;',
            '/+-.js': '"hello world";'
        };
        (0, index_1.runFilesInContext)(files, '/a.js', context);
        expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"File path '/+-.js' must only contain alphanumeric chars and/or '_', '/', '.', '-'."`);
    });
    it('returns IllegalCharInFilePathError if any file path contains invalid characters - verbose', () => {
        const files = {
            '/a.js': '1 + 2;',
            '/+-.js': '"hello world";'
        };
        (0, index_1.runFilesInContext)(files, '/a.js', context);
        expect((0, index_1.parseError)(context.errors, true)).toMatchInlineSnapshot(`
      "File path '/+-.js' must only contain alphanumeric chars and/or '_', '/', '.', '-'.
      Rename the offending file path to only use valid chars.
      "
    `);
    });
    it('returns ConsecutiveSlashesInFilePathError if any file path contains consecutive slash characters', () => {
        const files = {
            '/a.js': '1 + 2;',
            '/dir//dir2/b.js': '"hello world";'
        };
        (0, index_1.runFilesInContext)(files, '/a.js', context);
        expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"File path '/dir//dir2/b.js' cannot contain consecutive slashes '//'."`);
    });
    it('returns ConsecutiveSlashesInFilePathError if any file path contains consecutive slash characters - verbose', () => {
        const files = {
            '/a.js': '1 + 2;',
            '/dir//dir2/b.js': '"hello world";'
        };
        (0, index_1.runFilesInContext)(files, '/a.js', context);
        expect((0, index_1.parseError)(context.errors, true)).toMatchInlineSnapshot(`
      "File path '/dir//dir2/b.js' cannot contain consecutive slashes '//'.
      Remove consecutive slashes from the offending file path.
      "
    `);
    });
    it('returns CannotFindModuleError if entrypoint file does not exist', () => {
        const files = {};
        (0, index_1.runFilesInContext)(files, '/a.js', context);
        expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"Cannot find module '/a.js'."`);
    });
    it('returns CannotFindModuleError if entrypoint file does not exist - verbose', () => {
        const files = {};
        (0, index_1.runFilesInContext)(files, '/a.js', context);
        expect((0, index_1.parseError)(context.errors, true)).toMatchInlineSnapshot(`
      "Cannot find module '/a.js'.
      Check that the module file path resolves to an existing file.
      "
    `);
    });
});
//# sourceMappingURL=files.js.map