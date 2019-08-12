import { writeFileSync, join, groupOperationsByGroupName, camelToUppercase, getBestResponse } from '../util'
import { DOC, SP, ST, getDocType, getTSParamType } from './support'

export default function genOperations(spec: ApiSpec, operations: ApiOperation[], options: ClientOptions) {
  const files = genOperationGroupFiles(spec, operations, options)
  files.forEach(file => writeFileSync(file.path, file.contents))
}

export function genOperationGroupFiles(spec: ApiSpec, operations: ApiOperation[], options: ClientOptions) {
  const groups = groupOperationsByGroupName(operations)
  const files = []
  for (let name in groups) {
    const group = groups[name]
    const lines = []
    join(lines, renderHeader(name, spec, options))
    join(lines, renderOperationGroup(group, renderOperation, spec, options))
    if (options.language === 'ts') {
      join(lines, renderOperationGroup(group, renderOperationParamType, spec, options))
    }
    join(lines, renderOperationGroup(group, renderOperationInfo, spec, options))

    files.push({
      path: `${options.outDir}/${name}.${options.language}`,
      contents: lines.join('\n')
    })
  }
  return files
}

function renderHeader(name: string, spec: ApiSpec, options: ClientOptions): string[] {
  const lines = []
  if (spec.definitions && options.language === 'ts') {
    lines.push(`/// <reference path="types.ts"/>`)
  }
  lines.push(`/** @module ${name} */`)
  lines.push(`// Auto-generated, edits will be overwritten`)
  lines.push(`import * as gateway from './gateway'${ST}`)
  lines.push('')
  return lines
}

export function renderOperationGroup(group: any[], func: any, spec: ApiSpec, options: ClientOptions): string[] {
  return group
    .map(op => func.call(this, spec, op, options))
    .reduce((a, b) => a.concat(b))
}

function renderOperation(spec: ApiSpec, op: ApiOperation, options: ClientOptions): string[] {
  const lines = []
  join(lines, renderOperationDocs(op))
  join(lines, renderOperationBlock(spec, op, options))
  return lines
}

function renderOperationDocs(op: ApiOperation): string[] {
  const lines = []
  lines.push(`/**`)
  join(lines, renderDocDescription(op))
  join(lines, renderDocParams(op))
  lines.push(` */`)
  return lines
}

function renderDocDescription(op: ApiOperation) {
  const desc = op.description || op.summary
  return desc ? `${DOC}${desc.trim()}`.replace(/\n/g, `\n${DOC}`).split('\n') : []
}

function renderDocParams(op: ApiOperation) {
  const params = op.parameters
  if (!params.length) {
    return [renderDocReturn(op)]
  }
  const required = params.filter(param => param.required)
  const optional = params.filter(param => !param.required)

  const lines = []
  join(lines, required.map(renderDocParam))
  if (optional.length) {
    lines.push(`${DOC}@param {object} options Optional options`)
    join(lines, optional.map(renderDocParam))
  }
  if (op.description || op.summary) {
    lines.unshift(DOC)
  }
  lines.push(renderDocReturn(op))
  return lines
}

function renderDocParam(param) {
  let name = getParamName(param.name)
  let description = (param.description || '').trim().replace(/\n/g, `\n${DOC}${SP}`)
  if (!param.required) {
    name = `options.${name}`
    if (param.default) name += `=${param.default}`
    name = `[${name}]`
  }
  if (param.enum && param.enum.length) {
    description = `Enum: ${param.enum.join(', ')}. ${description}`
  }
  return `${DOC}@param {${getDocType(param)}} ${name} ${description}`
}

function renderDocReturn(op:ApiOperation): string {
  const response = getBestResponse(op)
  let description = response ? response.description || '' : ''
  description = description.trim().replace(/\n/g, `\n${DOC}${SP}`)
  return `${DOC}@return {Promise<${getDocType(response)}>} ${description}`
}

function renderOperationBlock(spec: ApiSpec, op: ApiOperation, options: ClientOptions): string[] {
  const lines = []
  join(lines, renderOperationSignature(op, options))
  join(lines, renderOperationObject(spec, op, options))
  join(lines, renderRequestCall(op, options))
  lines.push('')
  return lines
}

function renderOperationSignature(op: ApiOperation, options: ClientOptions): string[] {
  const paramSignature = renderParamSignature(op, options)
  const rtnSignature = renderReturnSignature(op, options)
  return [ `export function ${op.id}(${paramSignature})${rtnSignature} {` ]
}

export function renderParamSignature(op: ApiOperation, options: ClientOptions, pkg?: string): string {
  const params = op.parameters
  const required = params.filter(param => param.required)
  const optional = params.filter(param => !param.required)
  const funcParams = renderRequiredParamsSignature(required, options)
  const optParam = renderOptionalParamsSignature(op, optional, options, pkg)
  if (optParam.length) funcParams.push(optParam)

  return funcParams.map(p => p.join(': ')).join(', ')
}

function renderRequiredParamsSignature(required: ApiOperationParam[], options: ClientOptions): string[][] {
  return required.reduce<string[][]>((a, param) => {
    a.push(getParamSignature(param, options))
    return a
  }, [])
}

function renderOptionalParamsSignature(op: ApiOperation, optional: ApiOperationParam[], options: ClientOptions, pkg?: string) {
  if (!optional.length) return []
  if (!pkg) pkg = ''
  const s = options.language === 'ts' ? '?' : ''
  const param = [`options${s}`]
  if (options.language === 'ts') param.push(`${pkg}${op.id[0].toUpperCase() + op.id.slice(1)}Options`)
  return param
}

function renderReturnSignature(op: ApiOperation, options: ClientOptions): string {
  if (options.language !== 'ts') return ''
  const response = getBestResponse(op)
  return `: Promise<${getTSParamType(response)}>`
}

function getParamSignature(param: ApiOperationParam, options: ClientOptions): string[] {
  const signature = [getParamName(param.name)]
  if (options.language === 'ts') signature.push(getTSParamType(param))
  return signature
}

export function getParamName(name: string): string {
  const parts = name.split(/[_-\s!@\#$%^&*\(\)]/g).filter(n => !!n)
  const reduced = parts.reduce((name, p) => `${name}${p[0].toUpperCase()}${p.slice(1)}`)
  return escapeReservedWords(reduced)
}

function escapeReservedWords(name: string): string {
  let escapedName = name

  const reservedWords = [
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield'
  ]

  if (reservedWords.indexOf(name) >= 0) {
    escapedName = name + '_'
  }
  return escapedName
}

function renderOperationObject(spec: ApiSpec, op: ApiOperation, options: ClientOptions): string[] {
  const lines = []
  const parameters = op.parameters.reduce(groupParams, {})
  const names = Object.keys(parameters)
  const last = names.length - 1
  names.forEach((name, i) => {
    join(lines, renderParamGroup(name, parameters[name], i === last))
  })

  if (lines.length) {
    if (options.language === 'ts') {
      lines.unshift(`${SP}const parameters: api.OperationParamGroups = {`)
    } else {
      lines.unshift(`${SP}const parameters = {`)
    }
    lines.push(`${SP}}${ST}`)
    const hasOptionals = op.parameters.some(op => !op.required)
    if (hasOptionals) lines.unshift(`${SP}if (!options) options = {}${ST}`)
  }
  return lines
}

function groupParams(groups: any, param: ApiOperationParam): any {
  const group = groups[param.in] || []
  const name = getParamName(param.name)
  const realName = /^[_$a-z0-9]+$/gim.test(param.name) ? param.name : `'${param.name}'`
  const value = param.required ? name : 'options.' + name

  if (param.type === 'array') {
    if (!param.collectionFormat) throw new Error(`param ${param.name} must specify an array collectionFormat`)
    const str = `gateway.formatArrayParam(${value}, '${param.collectionFormat}', '${param.name}')`
    group.push(`${SP.repeat(3)}${realName}: ${str}`)
  } else if (param.format === 'date' || param.format === 'date-time') {
    const str = `gateway.formatDate(${value}, '${param.format}')`
    group.push(`${SP.repeat(3)}${realName}: ${str}`)
  } else if (param.required && param.name === name && name === realName) {
    group.push(`${SP.repeat(3)}${realName}`)
  } else {
    group.push(`${SP.repeat(3)}${realName}: ${value}`)
  }
  groups[param.in] = group
  return groups
}

function renderParamGroup(name: string, groupLines: string[], last: boolean): string[] {
  const lines = []
  lines.push(`${SP.repeat(2)}${name}: {`)
  join(lines, groupLines.join(',\n').split('\n'))
  lines.push(`${SP.repeat(2)}}${last ? '' : ','}`)
  return lines
}

function renderRequestCall(op: ApiOperation, options: ClientOptions) {
  const params = op.parameters.length ? ', parameters': ''
  return [ `${SP}return gateway.request(${op.id}Operation${params})${ST}`, '}' ]
}

function renderOperationParamType(spec: ApiSpec, op: ApiOperation, options: ClientOptions): string[] {
  const optional = op.parameters.filter(param => !param.required)
  if (!optional.length) return []
  const lines = []
  lines.push(`export interface ${op.id[0].toUpperCase() + op.id.slice(1)}Options {`)
  optional.forEach(param => {
    if (param.description) {
      lines.push(`${SP}/**`)
      lines.push(`${SP}${DOC}` + (param.description || '').trim().replace(/\n/g, `\n${SP}${DOC}${SP}`))
      lines.push(`${SP} */`)
    }
    lines.push(`${SP}${getParamName(param.name)}?: ${getTSParamType(param)}${ST}`)
  })
  lines.push('}')
  lines.push('')
  return lines
}

// We could just JSON.stringify this stuff but want it looking as if typed by developer
function renderOperationInfo(spec: ApiSpec, op: ApiOperation, options: ClientOptions): string[] {
  const lines = []
  if (options.language === 'ts') {
    lines.push(`const ${op.id}Operation: api.OperationInfo = {`)
  } else {
    lines.push(`const ${op.id}Operation = {`)
  }
  lines.push(`${SP}path: '${op.path}',`)

  const hasBody = op.parameters.some(p => p.in === 'body')
  if (hasBody && op.contentTypes.length) {
    lines.push(`${SP}contentTypes: ['${op.contentTypes.join("','")}'],`)
  }
  lines.push(`${SP}method: '${op.method}'${op.security ? ',': ''}`)
  if (op.security && op.security.length) {
    const secLines = renderSecurityInfo(op.security)
    lines.push(`${SP}security: [`)
    join(lines, secLines)
    lines.push(`${SP}]`)
  }
  lines.push(`}${ST}`)
  lines.push('')
  return lines
}

function renderSecurityInfo(security: ApiOperationSecurity[]): string[] {
  return security.map((sec, i) => {
    const scopes = sec.scopes
    const secLines = []
    secLines.push(`${SP.repeat(2)}{`)
    secLines.push(`${SP.repeat(3)}id: '${sec.id}'${scopes ? ',': ''}`)
    if (scopes) {
      secLines.push(`${SP.repeat(3)}scopes: ['${scopes.join(`', '`)}']`)
    }
    secLines.push(`${SP.repeat(2)}}${i + 1 < security.length ? ',': ''}`)
    return secLines
  }).reduce((a, b) => a.concat(b))
}
