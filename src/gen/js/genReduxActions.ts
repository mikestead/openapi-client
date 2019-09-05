import { writeFileSync, join, groupOperationsByGroupName, camelToUppercase, getBestResponse } from '../util'
import { DOC, SP, ST, getDocType, getTSParamType } from './support'
import { renderParamSignature, renderOperationGroup, getParamName } from './genOperations'

export default function genReduxActions(spec: ApiSpec, operations: ApiOperation[], options: ClientOptions) {
  const files = genReduxActionGroupFiles(spec, operations, options)
  files.forEach(file => writeFileSync(file.path, file.contents))
}

export function genReduxActionGroupFiles(spec: ApiSpec, operations: ApiOperation[], options: ClientOptions) {
  const groups = groupOperationsByGroupName(operations)
  const files = []
  for (let name in groups) {
    const group = groups[name]
    const lines = []
    lines.push(renderHeader(name, spec, options))
    lines.push(renderOperationGroup(group, renderReduxActionBlock, spec, options))
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
import { createAction } from 'redux-actions'
import * as ${name} from '../${name}'${ST}
`.trim()
  return code
}

function renderReduxActionBlock(spec: ApiSpec, op: ApiOperation, options: ClientOptions): string {
  const lines = []
  const isTs = options.language === 'ts'
  const actionRequest = 'REQUEST_' + camelToUppercase(op.id)
  const actionStart = camelToUppercase(op.id) + '_START'
  const actionSuccess = camelToUppercase(op.id) + '_SUCCESS'
  const actionError = camelToUppercase(op.id) + '_ERROR'
  const actionComplete = camelToUppercase(op.id)
  const infoParam = isTs ? 'info?: any' : 'info'
  let paramSignature = renderParamSignature(op, options, `${op.group}.`)
  paramSignature += `${paramSignature ? ', ' : ''}${infoParam}`
  const required = op.parameters.filter(param => param.required)
  let params = required.map(param => getParamName(param.name)).join(', ')
  if (required.length < op.parameters.length) {
    if (required.length) params += ', options'
    else params = 'options'
  }

  const response = getBestResponse(op)
  const returnType = response ? getTSParamType(response) : 'any'
  return `
export const ${actionRequest} = '${actionStart}'${ST}
export const ${actionStart} = 's/${op.group}/${actionStart}'${ST}
export const ${actionSuccess} = 's/${op.group}/${actionSuccess}'${ST}
export const ${actionError} = 's/${op.group}/${actionError}'${ST}
export const ${actionComplete} = 's/${op.group}/${actionComplete}'${ST}

export const ${op.id}SuccessAction = createAction(${actionSuccess})
export const ${op.id}ErrorAction = createAction(${actionError})

${isTs ? `export type ${actionComplete} = ${returnType}${ST}`: ''}

export function ${op.id}(${paramSignature})${isTs? ': any' : ''} {
  return dispatch => {
    dispatch({ type: ${actionStart}, meta: { info } })${ST}
    return ${op.group}.${op.id}(${params})
      .then(response => dispatch({
        type: ${actionComplete},
        payload: response.data,
        error: response.error,
        meta: {
          res: response.raw,
          info
        }
      }))${ST}
  }${ST}
}
`.replace(/  /g, SP)
}