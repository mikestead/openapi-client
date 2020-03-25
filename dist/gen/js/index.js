"use strict";
const genOperations_1 = require('./genOperations');
const genReduxActions_1 = require('./genReduxActions');
const genService_1 = require('./genService');
const genTypes_1 = require('./genTypes');
const genSpec_1 = require('./genSpec');
const support_1 = require('./support');
function genCode(spec, operations, options) {
    support_1.applyFormatOptions(options);
    genService_1.default(options);
    genSpec_1.default(spec, options);
    genOperations_1.default(spec, operations, options);
    genTypes_1.default(spec, options);
    if (options.redux)
        genReduxActions_1.default(spec, operations, options);
    return spec;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genCode;
