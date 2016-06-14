import { writeFileSync, join, groupOperationsByGroupName, camelToUppercase, getBestResponse } from '../util'
import { DOC, SP, getDocType, getTSParamType } from './support'
import { renderParamSignature, renderOperationGroup } from './genOperations'

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
/** @module action/${name} */
// Auto-generated, edits will be overwritten
import * as ${name} from '../${name}'
${options.language === 'ts' && spec.definitions ? `import * as types from '../types'` : '' }
`.trim()
  return code
}

function renderReduxActionBlock(spec: ApiSpec, op: ApiOperation, options: ClientOptions): string {
  const lines = []
  const actionStart = camelToUppercase(op.id) + '_START'
  const actionComplete = camelToUppercase(op.id)
  const paramSignature = renderParamSignature(op, options, `${op.group}.`)
  const required = op.parameters.filter(param => param.required)
  let params = required.map(param => param.name).join(', ')
  if (required.length < op.parameters.length) {
    if (required.length) params += ', options'
    else params = 'options'
  }

  const response = getBestResponse(op)
  const returnType = response ? getTSParamType(response) : 'any'
  const isTs = options.language === 'ts'
  return `
export const ${actionStart} = '${op.group}/${op.id}Start'
export const ${actionComplete} = '${op.group}/${op.id}'
${isTs ? `export type ${actionComplete} = ${returnType}`: ''}

export function ${op.id}(${paramSignature})${isTs? ': any' : ''} {
  return dispatch => {
    dispatch({ type: ${actionStart} })
    return ${op.group}.${op.id}(${params})
      .then(payload => dispatch({
        type: ${actionComplete},
        payload,
        error: payload instanceof Error
      }))
  }
}
`
}