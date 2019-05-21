import { writeFileSync, join, sanitizeIdentifier, isReserved } from '../util'
import { DOC, SP, ST, getDocType, getTSParamType } from './support'

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
  const typeLines = isTs ? [`namespace api {`] : undefined
  const docLines = []
  Object.keys(defs).forEach(name => {
    const def = defs[name]
    if (isTs) {
      join(typeLines, renderTsType(name, def, options))
    }
    join(docLines, renderTypeDoc(name, def))
  })
  if (isTs) {
    join(typeLines, renderTsDefaultTypes())
    typeLines.push('}')
  }
  return isTs ? typeLines.concat(docLines) : docLines
}

function renderTsType(name, def, options) {
  if (def.allOf) return renderTsInheritance(name, def.allOf, options)
  if (def.type !== 'object') {
    console.warn(`Unable to render ${name} ${def.type}, skipping.`)
    return []
  }

  name = sanitizeIdentifier(name)

  const lines = []
  if (def.description) {
    lines.push(`/**`)
    lines.push(DOC + def.description.trim().replace(/\n/g, `\n${DOC}${SP}`))
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

  if (isReserved(prop) || !/^[a-z0-9_]+$/i.test(prop)) prop = `'${prop}'`

  const lines = []  
  const type = getTSParamType(info, true)
  if (info.description) {
    lines.push(`${SP}/**`)
    lines.push(`${SP}${DOC}` + (info.description || '').trim().replace(/\n/g, `\n${SP}${DOC}${SP}`))
    lines.push(`${SP} */`)
  }
  const req = required ? '' : '?'
  lines.push(`${SP}${prop}${req}: ${type}${ST}`)
  return lines
}

function renderTsDefaultTypes() {
  return `export interface OpenApiSpec {
  host: string${ST}
  basePath: string${ST}
  schemes: string[]${ST}
  contentTypes: string[]${ST}
  accepts: string[]${ST}
  securityDefinitions?: {[key: string]: SecurityDefinition}${ST}
}

export interface SecurityDefinition {
  type: 'basic'|'apiKey'|'oauth2'${ST}
  description?: string${ST}
  name?: string${ST}
  in?: 'query'|'header'${ST}
  flow?: 'implicit'|'password'|'application'|'accessCode'${ST}
  authorizationUrl?: string${ST}
  tokenUrl?: string${ST}
  scopes?: {[key: string]: string}${ST}
}

export type CollectionFormat = 'csv'|'ssv'|'tsv'|'pipes'|'multi'${ST}
export type HttpMethod = 'get'|'put'|'post'|'delete'|'options'|'head'|'patch'${ST}

export interface OperationInfo {
  path: string${ST}
  method: HttpMethod${ST}
  security?: OperationSecurity[]${ST}
  contentTypes?: string[]${ST}
  accepts?: string[]${ST}
}

export interface OperationSecurity {
  id: string${ST}
  scopes?: string[]${ST}
}

export interface OperationParamGroups {
  header?: {[key: string]: string}${ST}
  path?: {[key: string]: string|number|boolean}${ST}
  query?: {[key: string]: string|string[]|number|boolean}${ST}
  formData?: {[key: string]: string|number|boolean}${ST}
  body?: any${ST}
}

export interface ServiceRequest {
  method: HttpMethod${ST}
  url: string${ST}
  headers: { [index: string]: string }${ST}
  body: any${ST}
}

export interface RequestInfo {
  baseUrl: string${ST}
  parameters: OperationParamGroups${ST}
}

export interface ResponseOutcome {
  retry?: boolean${ST}
  res: Response<any>${ST}
}

export interface ServiceOptions {
  /**
   * The service url.
   *
   * If not specified then defaults to the one defined in the Open API
   * spec used to generate the service api.
   */
  url?: string${ST}
  /**
   * Fetch options object to apply to each request e.g 
   * 
   *     { mode: 'cors', credentials: true }
   * 
   * If a headers object is defined it will be merged with any defined in
   * a specific request, the latter taking precedence with name collisions.
   */
  fetchOptions?: any${ST}
  /**
   * Function which should resolve rights for a request (e.g auth token) given
   * the OpenAPI defined security requirements of the operation to be executed.
   */
  getAuthorization?: (security: OperationSecurity, securityDefinitions: any, op: OperationInfo) => Promise<OperationRightsInfo>${ST}
  /**
   * Given an error response, custom format and return a ServiceError
   */
  formatServiceError?: (response: FetchResponse, data: any) => ServiceError${ST}
  /**
   * Before each Fetch request is dispatched this function will be called if it's defined.
   * 
   * You can use this to augment each request, for example add extra query parameters.
   * 
   *     const params = reqInfo.parameters;
   *     if (params && params.query) {
   *       params.query.lang = "en"
   *     }
   *     return reqInfo
   */
  processRequest?: (op: OperationInfo, reqInfo: RequestInfo) => RequestInfo${ST}
  /**
   * If you need some type of request retry behavior this function
   * is the place to do it.
   * 
   * The response is promise based so simply resolve the "res" parameter
   * if you're happy with it e.g.
   * 
   *     if (!res.error) return Promise.resolve({ res });
   * 
   * Otherwise return a promise which flags a retry.
   * 
   *     return Promise.resolve({ res, retry: true })
   * 
   * You can of course do other things before this, like refresh an auth
   * token if the error indicated it expired.
   * 
   * The "attempt" param will tell you how many times a retry has been attempted.
   */
  processResponse?: (req: api.ServiceRequest, res: Response<any>, attempt: number) => Promise<api.ResponseOutcome>${ST}
  /**
   * If a fetch request fails this function gives you a chance to process
   * that error before it's returned up the promise chain to the original caller.
   */
  processError?: (req: api.ServiceRequest, res: api.ResponseOutcome) => Promise<api.ResponseOutcome>${ST}
  /**
   * By default the authorization header name is "Authorization".
   * This property allows you to override it.
   * 
   * One place this can come up is where your API is under the same host as
   * a website it powers. If the website has Basic Auth in place then some
   * browsers will override your "Authorization: Bearer <token>" header with
   * the Basic Auth value when calling your API. To counter this we can change
   * the header, e.g.
   * 
   *     authorizationHeader = "X-Authorization"
   * 
   * The service must of course accept this alternative.
   */
  authorizationHeader?: string${ST}
}

export type OperationRights = {[key: string]: OperationRightsInfo}${ST}

export interface OperationRightsInfo {
  username?: string${ST}
  password?: string${ST}
  token?: string${ST}
  apiKey?: string${ST}
}

export interface Response<T> {
  raw: FetchResponse${ST}
  /**
   * If 'error' is true then data will be of type ServiceError
   */
  data?: T${ST}
  /**
   * True if there was a service error, false if not
   */
  error?: boolean${ST}
}

export interface FetchResponse extends FetchBody {
  url: string${ST}
  status: number${ST}
  statusText: string${ST}
  ok: boolean${ST}
  headers: Headers${ST}
  type: string | FetchResponseType${ST}
  size: number${ST}
  timeout: number${ST}
  redirect(url: string, status: number): FetchResponse${ST}
  error(): FetchResponse${ST}
  clone(): FetchResponse${ST}
}

export interface FetchBody {
  bodyUsed: boolean${ST}
  arrayBuffer(): Promise<ArrayBuffer>${ST}
  blob(): Promise<Blob>${ST}
  formData(): Promise<FormData>${ST}
  json(): Promise<any>${ST}
  json<T>(): Promise<T>${ST}
  text(): Promise<string>${ST}
}

export interface FetchHeaders {
  get(name: string): string${ST}
  getAll(name: string): Array<string>${ST}
  has(name: string): boolean${ST}
}

export declare enum FetchResponseType { 'basic', 'cors', 'default', 'error', 'opaque' }${ST}

export class ServiceError extends Error {
  status: number${ST}
}

/**
 * Flux standard action meta for service action
 */
export interface ServiceMeta {
  res: FetchResponse${ST}
  info: any${ST}
}
`.replace(/  /g, SP).split('\n')
}


function renderTypeDoc(name: string, def: any): string[] {
  if (def.allOf) return renderDocInheritance(name, def.allOf)
  if (def.type !== 'object') {
    console.warn(`Unable to render ${name} ${def.type}, skipping.`)
    return []
  }

  name = sanitizeIdentifier(name)

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
