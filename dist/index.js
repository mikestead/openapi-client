"use strict";
require('isomorphic-fetch');
const spec_1 = require('./spec');
const js_1 = require('./gen/js');
const util_1 = require('./gen/util');
const assert = require('assert');
function genCode(options) {
    return verifyOptions(options)
        .then(options => spec_1.resolveSpec(options.src, { ignoreRefType: '#/definitions/' })
        .then(spec => gen(spec, options)));
}
exports.genCode = genCode;
function verifyOptions(options) {
    try {
        assert.ok(options.src, 'Open API src not specified');
        assert.ok(options.outDir, 'Output directory not specified');
        assert.ok(options.language, 'Generation language not specified');
        return Promise.resolve(options);
    }
    catch (e) {
        return Promise.reject(e);
    }
}
function gen(spec, options) {
    util_1.removeOldFiles(options);
    const operations = spec_1.getOperations(spec);
    switch (options.language) {
        case 'js': return js_1.default(spec, operations, options);
        case 'ts': return js_1.default(spec, operations, options);
        default:
            throw new Error(`Language '${options.language}' not supported`);
    }
}
