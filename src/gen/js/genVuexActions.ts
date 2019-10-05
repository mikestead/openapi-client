import { writeFileSync, join, groupOperationsByGroupName, camelToUppercase, getBestResponse } from '../util'
import { DOC, SP, ST, getDocType, getTSParamType } from './support'
import { renderDestructuredParamSignature, renderOperationGroup } from './genOperations'

export default function genVuexActions(spec: ApiSpec, operations: ApiOperation[], options: ClientOptions) {
  const files = genVuexActionGroupFiles(spec, operations, options)
  files.forEach(file => writeFileSync(file.path, file.contents))
}

export function genVuexActionGroupFiles(spec: ApiSpec, operations: ApiOperation[], options: ClientOptions) {
  const groups = groupOperationsByGroupName(operations)
  const files = []
  for (let name in groups) {
    const group = groups[name]
    const lines = []
    lines.push(renderHeader(name, spec, options))
    lines.push(renderOperationGroup(group, renderVuexActionBlock, spec, options))
    lines.push(`}${ST}`);
    files.push({
      path: `${options.outDir}/action/${name}.${options.language}`,
      contents: lines.join('\n')
    })
  }
  return files
}

function renderHeader(name: string, spec: ApiSpec, options: ClientOptions): string {

  const code = `
${options.language === 'ts' && spec.definitions ? '/// <reference path="../types.ts"/>': ''}
/** @module action/${name} */
// Auto-generated, edits will be overwritten
import * as ${name} from '../${name}'${ST}

export default {`.trim()
  return code
}

function renderVuexActionBlock(spec: ApiSpec, op: ApiOperation, options: ClientOptions): string {
  const isTs = options.language === 'ts'
  const actionComplete = camelToUppercase(op.id)
  const actionError = camelToUppercase(op.id) + '_ERROR'
  let paramSignature = renderDestructuredParamSignature(op, options, `${op.group}.`)
  let actionParamSignature = renderDestructuredParamSignature(op, options, `${op.group}.`, true)
  const required = op.parameters.filter(param => param.required)
  let params = required.map(param => param.name).join(', ')
  if (required.length < op.parameters.length) {
    if (required.length) params += ', options'
    else params = 'options'
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
`.replace(/  /g, SP);
}