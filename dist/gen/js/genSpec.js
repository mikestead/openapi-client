"use strict";
const support_1 = require('./support');
const util_1 = require('../util');
function genSpec(spec, options) {
    const file = genSpecFile(spec, options);
    util_1.writeFileSync(file.path, file.contents);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genSpec;
function genSpecFile(spec, options) {
    return {
        path: `${options.outDir}/gateway/spec.${options.language}`,
        contents: renderSpecView(spec, options)
    };
}
exports.genSpecFile = genSpecFile;
function renderSpecView(spec, options) {
    const view = {
        host: spec.host,
        schemes: spec.schemes,
        basePath: spec.basePath,
        contentTypes: spec.contentTypes,
        accepts: spec.accepts,
        securityDefinitions: spec.securityDefinitions
    };
    const type = (options.language === 'ts') ? ': api.OpenApiSpec' : '';
    return `${options.language === 'ts' ? '/// <reference path="../types.ts"/>' : ''}
// Auto-generated, edits will be overwritten
const spec${type} = ${stringify(view)}${support_1.ST}
export default spec${support_1.ST}
`;
}
function stringify(view) {
    const str = JSON.stringify(view, null, 2);
    return str.replace(/"/g, `'`).replace(/  /g, support_1.SP);
}
