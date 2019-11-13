"use strict";
const support_1 = require('./support');
const fs_1 = require('fs');
const util_1 = require('../util');
function genService(options) {
    const file = genServiceFile(options);
    const contents = file.contents.replace(/  /g, support_1.SP).replace(/;;/g, support_1.ST);
    util_1.writeFileSync(file.path, contents);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genService;
function genServiceFile(options) {
    const path = `${options.outDir}/gateway/index.${options.language}`;
    const contents = fs_1.readFileSync(`${__dirname}/service.${options.language}.template`, 'utf8');
    return { path: path, contents: contents };
}
exports.genServiceFile = genServiceFile;
