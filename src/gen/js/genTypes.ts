import { writeFileSync, join } from '../util'
import { DOC, SP, getDocType, getTSParamType, formatDocDescription } from './support'

export default function genTypes(spec: ApiSpec, options: ClientOptions) {
  const file = genTypesFile(spec, options)
  writeFileSync(file.path, file.contents)
}

export function genTypesFile(spec: ApiSpec, options: ClientOptions) {
  const lines = []
  join(lines, renderHeader())
  join(lines, renderDefinitions(spec, options))
  return {
    path: `${options.outDir}/types.${options.language}`,
    contents: lines.join('\n')
  }
}

function renderHeader() {
  const lines = []
  lines.push(`/** @module types */`)
  lines.push(`// Auto-generated, edits will be overwritten`)
  lines.push(``)
  return lines  
}

function renderDefinitions(spec: ApiSpec, options: ClientOptions): string[] {
  const isTs = (options.language === 'ts')
  const defs = spec.definitions || {}
  const typeLines = []
  const docLines = []
  Object.keys(defs).forEach(name => {
    const def = defs[name]
    if (isTs) {
      join(typeLines, renderTsType(name, def, options))
    }
    join(docLines, renderTypeDoc(name, def))
  })
  join(typeLines, renderTsDefaultTypes())
  return typeLines.concat(docLines)
}

function renderTsType(name, def, options) {
  if (def.allOf) return renderTsInheritance(name, def.allOf, options)
  if (def.type !== 'object') {
    console.warn(`Unable to render ${name} ${def.type}, skipping.`)
    return []
  }
  
  const lines = []
  if (def.description) {
    lines.push(`/**`)
    lines.push(DOC + def.description.trim().replace(/\n/g, `\n$${DOC}${SP}`))
    lines.push(` */`)
  }
  lines.push(`export interface ${name} {`)
    
  const required = def.required || []
  const props = Object.keys(def.properties || {})
  const requiredProps = props.filter(p => !!~required.indexOf(p))
  const optionalProps = props.filter(p => !~required.indexOf(p))

  const requiredPropLines = requiredProps
    .map(prop => renderTsTypeProp(prop, def.properties[prop], true))
    .reduce((a, b) => a.concat(b), [])

  const optionalPropLines = optionalProps
    .map(prop => renderTsTypeProp(prop, def.properties[prop], false))
    .reduce((a, b) => a.concat(b), [])
  
  join(lines, requiredPropLines)
  join(lines, optionalPropLines)
  lines.push('}')
  lines.push('')
  return lines
}

function renderTsInheritance(name: string, allOf: any[], options: ClientOptions) {
  verifyAllOf(name, allOf)
  const ref = allOf[0]
  const parentName = ref.$ref.split('/').pop()
  const lines = renderTsType(name, allOf[1], options)
  if (lines[0].startsWith('export interface')) lines.shift()
  lines.unshift(`export interface ${name} extends ${parentName} {`)
  return lines
}

function renderTsTypeProp(prop: string, info: any, required: boolean): string[] {
  const lines = []
  const type = getTSParamType(info, true)
  if (info.description) {
    lines.push(`${SP}/**`)
    lines.push(`${SP}${DOC}` + (info.description || '').trim().replace(/\n/g, `\n${SP}${DOC}${SP}`))
    lines.push(`${SP} */`)
  }
  const req = required ? '' : '?'
  lines.push(`${SP}${prop}${req}: ${type}`)
  return lines
}

function renderTsDefaultTypes() {
  return `export interface OpenApiSpec {
  host: string
  basePath: string
  schemes: string[]
  consumes: string[]
  produces: string[]
  securityDefinitions?: {[key: string]: SecurityDefinition}
}

export interface SecurityDefinition {
  type: 'basic'|'apiKey'|'oauth2'
  description?: string
  name?: string
  in?: 'query'|'header'
  flow?: 'implicit'|'password'|'application'|'accessCode'
  authorizationUrl?: string
  tokenUrl?: string
  scopes?: {[key: string]: string}
}

export type CollectionFormat = 'csv'|'ssv'|'tsv'|'pipes'|'multi'
export type HttpMethod = 'get'|'put'|'post'|'delete'|'options'|'head'|'patch'

export interface OperationInfo {
  path: string
  method: HttpMethod
  security?: OperationSecurity[]
  consumes?: string[]
  produces?: string[]
}

export interface OperationSecurity {
  id: string
  scopes?: string[]
}

export interface OperationParamGroups {
  header?: {[key: string]: string}
  path?: {[key: string]: string|number}
  query?: {[key: string]: string|number}
  formData?: {[key: string]: string|number}
  body?: any
}

export interface ServiceRequest {
  method: HttpMethod
  url: string
  headers: { [index: string]: string }
  body: any
}

export interface ServiceOptions {
  getAuthorization?: (security: OperationSecurity, securityDefinitions: any, op: OperationInfo) => Promise<OperationRights>
}

export type OperationRights = {[key: string]: OperationRightsInfo}

export interface OperationRightsInfo {
  username?: string
  password?: string
  token?: string
  apiKey?: string
}
`.split('\n')
}


function renderTypeDoc(name: string, def: any): string[] {
  if (def.allOf) return renderDocInheritance(name, def.allOf)
  if (def.type !== 'object') {
    console.warn(`Unable to render ${name} ${def.type}, skipping.`)
    return []
  }
  
  const group = 'types'
  const lines = [
    '/**',
    `${DOC}@typedef ${name}`,
    `${DOC}@memberof module:${group}`
  ]
  const req = def.required || []
  const propLines = Object.keys(def.properties).map(prop => {
    const info = def.properties[prop]
    const description = (info.description || '').trim().replace(/\n/g, `\n${DOC}${SP}`)
    return `${DOC}@property {${getDocType(info)}} ${prop} ${description}`
  })
  if (propLines.length) lines.push(`${DOC}`)
  join(lines, propLines)
  lines.push(' */')
  lines.push('')
  return lines
}

function renderDocInheritance(name: string, allOf: any[]) {
  verifyAllOf(name, allOf)
  const ref = allOf[0]
  const parentName = ref.$ref.split('/').pop()
  const lines = renderTypeDoc(name, allOf[1])
  lines.splice(3, 0, `${DOC}@extends ${parentName}`)
  return lines
}

function verifyAllOf(name:string, allOf: any[]) {
  // Currently we interpret allOf as inheritance. Not strictly correct
  // but seems to be how most model inheritance in Swagger and is consistent
  // with other code generation tool
  if (!allOf || allOf.length !== 2) {
    console.log(allOf)
    throw new Error(`Json schema allOf '${name}' must have two elements to be treated as inheritance`)
  }
  const ref = allOf[0]
  if (!ref.$ref) {
    throw new Error(`Json schema allOf '${name}' first element must be a $ref ${ref}`)
  } 
}
