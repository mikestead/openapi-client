"use strict";
const genOperations_1 = require('./genOperations');
const genReduxActions_1 = require('./genReduxActions');
const genVuexActions_1 = require('./genVuexActions');
const genService_1 = require('./genService');
const genSpec_1 = require('./genSpec');
const support_1 = require('./support');
function genCode(spec, operations, options) {
    support_1.applyFormatOptions(options);
    genService_1.default(options);
    genSpec_1.default(spec, options);
    genOperations_1.default(spec, operations, options);
    if (options.redux)
        genReduxActions_1.default(spec, operations, options);
    if (options.vuex)
        genVuexActions_1.default(spec, operations, options);
    return spec;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genCode;
