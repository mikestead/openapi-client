"use strict";
const util_1 = require('../util');
const support_1 = require('./support');
const genOperations_1 = require('./genOperations');
function genVuexActions(spec, operations, options) {
    const files = genVuexActionGroupFiles(spec, operations, options);
    files.forEach(file => util_1.writeFileSync(file.path, file.contents));
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genVuexActions;
function genVuexActionGroupFiles(spec, operations, options) {
    const groups = util_1.groupOperationsByGroupName(operations);
    const files = [];
    for (let name in groups) {
        const group = groups[name];
        const lines = [];
        lines.push(renderHeader(name, spec, options));
        lines.push(genOperations_1.renderOperationGroup(group, renderVuexActionBlock, spec, options));
        lines.push(`}${support_1.ST}`);
        files.push({
            path: `${options.outDir}/action/${name}.${options.language}`,
            contents: lines.join('\n')
        });
    }
    return files;
}
exports.genVuexActionGroupFiles = genVuexActionGroupFiles;
function renderHeader(name, spec, options) {
    const code = `
${options.language === 'ts' && spec.definitions ? '/// <reference path="../types.ts"/>' : ''}
/** @module action/${name} */
// Auto-generated, edits will be overwritten
import * as ${name} from '../${name}'${support_1.ST}

export default {`.trim();
    return code;
}
function renderVuexActionBlock(spec, op, options) {
    const isTs = options.language === 'ts';
    const actionComplete = util_1.camelToUppercase(op.id);
    const actionError = util_1.camelToUppercase(op.id) + '_ERROR';
    let paramSignature = genOperations_1.renderDestructuredParamSignature(op, options, `${op.group}.`);
    let actionParamSignature = genOperations_1.renderDestructuredParamSignature(op, options, `${op.group}.`, true);
    const required = op.parameters.filter(param => param.required);
    let params = required.map(param => param.name).join(', ');
    if (required.length < op.parameters.length) {
        if (required.length)
            params += ', options';
        else
            params = 'options';
    }
    return `
  async ${op.id}({ commit }${paramSignature ? ', ' + paramSignature : ''})${isTs ? ': Promise<any>' : ''} {
    const response = await ${op.group}.${op.id}(${params});

    if (response.error) {
      commit('${actionError}', { response${actionParamSignature ? ', ' + actionParamSignature : ''} });
    } else {
      commit('${actionComplete}', { response${actionParamSignature ? ', ' + actionParamSignature : ''} });
    }

    return response;
  },
`.replace(/  /g, support_1.SP);
}
