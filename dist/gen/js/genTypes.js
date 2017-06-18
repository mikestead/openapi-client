"use strict";
const util_1 = require('../util');
const support_1 = require('./support');
function genTypes(spec, options) {
    const file = genTypesFile(spec, options);
    util_1.writeFileSync(file.path, file.contents);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genTypes;
function genTypesFile(spec, options) {
    const lines = [];
    util_1.join(lines, renderHeader());
    util_1.join(lines, renderDefinitions(spec, options));
    return {
        path: `${options.outDir}/types.${options.language}`,
        contents: lines.join('\n')
    };
}
exports.genTypesFile = genTypesFile;
function renderHeader() {
    const lines = [];
    lines.push(`/** @module types */`);
    lines.push(`// Auto-generated, edits will be overwritten`);
    lines.push(``);
    return lines;
}
function renderDefinitions(spec, options) {
    const isTs = (options.language === 'ts');
    const defs = spec.definitions || {};
    const typeLines = isTs ? [`namespace api {`] : undefined;
    const docLines = [];
    Object.keys(defs).forEach(name => {
        const def = defs[name];
        if (isTs) {
            util_1.join(typeLines, renderTsType(name, def, options));
        }
        if (!options.genOnlyTypes) {
            util_1.join(docLines, renderTypeDoc(name, def));
        }
    });
    if (isTs) {
        if (!options.genOnlyTypes) {
            util_1.join(typeLines, renderTsDefaultTypes());
        }
        typeLines.push('}');
    }
    return isTs ? typeLines.concat(docLines) : docLines;
}
function renderTsType(name, def, options) {
    name = name
        .replace(/«/g, 'Oftype')
        .replace(/»/g, 'Endoftype')
        .replace(/,/g, 'Andtype');
    if (def.allOf)
        return renderTsInheritance(name, def.allOf, options);
    if (def.type !== 'object') {
        console.warn(`Unable to render ${name} ${def.type}, skipping.`);
        return [];
    }
    const lines = [];
    if (def.description) {
        lines.push(`/**`);
        lines.push(support_1.DOC + def.description.trim().replace(/\n/g, `\n$${support_1.DOC}${support_1.SP}`));
        lines.push(` */`);
    }
    lines.push(`export interface ${name} {`);
    const required = def.required || [];
    const props = Object.keys(def.properties || {});
    const requiredProps = props.filter(p => !!~required.indexOf(p));
    const optionalProps = props.filter(p => !~required.indexOf(p));
    const requiredPropLines = requiredProps
        .map(prop => renderTsTypeProp(prop, def.properties[prop], true))
        .reduce((a, b) => a.concat(b), []);
    const optionalPropLines = optionalProps
        .map(prop => renderTsTypeProp(prop, def.properties[prop], false))
        .reduce((a, b) => a.concat(b), []);
    util_1.join(lines, requiredPropLines);
    util_1.join(lines, optionalPropLines);
    lines.push('}');
    lines.push('');
    return lines;
}
function renderTsInheritance(name, allOf, options) {
    verifyAllOf(name, allOf);
    const ref = allOf[0];
    const parentName = ref.$ref.split('/').pop();
    const lines = renderTsType(name, allOf[1], options);
    if (lines[0].startsWith('export interface'))
        lines.shift();
    lines.unshift(`export interface ${name} extends ${parentName} {`);
    return lines;
}
function renderTsTypeProp(prop, info, required) {
    const lines = [];
    const type = support_1.getTSParamType(info, true);
    let format = '';
    if (info.format) {
        format = ` // ${info.format}`;
    }
    if (info.description) {
        lines.push(`${support_1.SP}/**`);
        lines.push(`${support_1.SP}${support_1.DOC}` + (info.description || '').trim().replace(/\n/g, `\n${support_1.SP}${support_1.DOC}${support_1.SP}`));
        lines.push(`${support_1.SP} */`);
    }
    const req = required ? '' : '?';
    lines.push(`${support_1.SP}${prop}${req}: ${type}${support_1.ST}${format}`);
    return lines;
}
function renderTsDefaultTypes() {
    return `export interface OpenApiSpec {
  host: string${support_1.ST}
  basePath: string${support_1.ST}
  schemes: string[]${support_1.ST}
  contentTypes: string[]${support_1.ST}
  accepts: string[]${support_1.ST}
  securityDefinitions?: {[key: string]: SecurityDefinition}${support_1.ST}
}

export interface SecurityDefinition {
  type: 'basic'|'apiKey'|'oauth2'${support_1.ST}
  description?: string${support_1.ST}
  name?: string${support_1.ST}
  in?: 'query'|'header'${support_1.ST}
  flow?: 'implicit'|'password'|'application'|'accessCode'${support_1.ST}
  authorizationUrl?: string${support_1.ST}
  tokenUrl?: string${support_1.ST}
  scopes?: {[key: string]: string}${support_1.ST}
}

export type CollectionFormat = 'csv'|'ssv'|'tsv'|'pipes'|'multi'${support_1.ST}
export type HttpMethod = 'get'|'put'|'post'|'delete'|'options'|'head'|'patch'${support_1.ST}

export interface OperationInfo {
  path: string${support_1.ST}
  method: HttpMethod${support_1.ST}
  security?: OperationSecurity[]${support_1.ST}
  contentTypes?: string[]${support_1.ST}
  accepts?: string[]${support_1.ST}
}

export interface OperationSecurity {
  id: string${support_1.ST}
  scopes?: string[]${support_1.ST}
}

export interface OperationParamGroups {
  header?: {[key: string]: string}${support_1.ST}
  path?: {[key: string]: string|number|boolean}${support_1.ST}
  query?: {[key: string]: string|string[]|number|boolean}${support_1.ST}
  formData?: {[key: string]: string|number|boolean}${support_1.ST}
  body?: any${support_1.ST}
}

export interface ServiceRequest {
  method: HttpMethod${support_1.ST}
  url: string${support_1.ST}
  headers: { [index: string]: string }${support_1.ST}
  body: any${support_1.ST}
}

export interface RequestInfo {
  baseUrl: string${support_1.ST}
  parameters: OperationParamGroups${support_1.ST}
}

export interface ResponseOutcome {
  retry?: boolean${support_1.ST}
  res: Response<any>${support_1.ST}
}

export interface ServiceOptions {
  /**
   * The service url.
   *
   * If not specified then defaults to the one defined in the Open API
   * spec used to generate the service api.
   */
  url?: string${support_1.ST}
  fetchOptions?: any${support_1.ST}
  getAuthorization?: (security: OperationSecurity, securityDefinitions: any, op: OperationInfo) => Promise<OperationRights>${support_1.ST}
  formatServiceError?: (response: FetchResponse, data: any) => ServiceError${support_1.ST}
  processRequest?: (op: OperationInfo, reqInfo: RequestInfo) => RequestInfo${support_1.ST}
  processResponse?: (req: api.ServiceRequest, res: Response<any>, attempt: number) => Promise<api.ResponseOutcome>${support_1.ST}
}

export type OperationRights = {[key: string]: OperationRightsInfo}${support_1.ST}

export interface OperationRightsInfo {
  username?: string${support_1.ST}
  password?: string${support_1.ST}
  token?: string${support_1.ST}
  apiKey?: string${support_1.ST}
}

export interface Response<T> {
  raw: FetchResponse${support_1.ST}
  /**
   * If 'error' is true then data will be of type ServiceError
   */
  data?: T${support_1.ST}
  /**
   * True if there was a service error, false if not
   */
  error?: boolean${support_1.ST}
}

export interface FetchResponse extends FetchBody {
  url: string${support_1.ST}
  status: number${support_1.ST}
  statusText: string${support_1.ST}
  ok: boolean${support_1.ST}
  headers: Headers${support_1.ST}
  type: string | FetchResponseType${support_1.ST}
  size: number${support_1.ST}
  timeout: number${support_1.ST}
  redirect(url: string, status: number): FetchResponse${support_1.ST}
  error(): FetchResponse${support_1.ST}
  clone(): FetchResponse${support_1.ST}
}

export interface FetchBody {
  bodyUsed: boolean${support_1.ST}
  arrayBuffer(): Promise<ArrayBuffer>${support_1.ST}
  blob(): Promise<Blob>${support_1.ST}
  formData(): Promise<FormData>${support_1.ST}
  json(): Promise<any>${support_1.ST}
  json<T>(): Promise<T>${support_1.ST}
  text(): Promise<string>${support_1.ST}
}

export interface FetchHeaders {
  get(name: string): string${support_1.ST}
  getAll(name: string): Array<string>${support_1.ST}
  has(name: string): boolean${support_1.ST}
}

export declare enum FetchResponseType { 'basic', 'cors', 'default', 'error', 'opaque' }${support_1.ST}

export class ServiceError extends Error {
  status: number${support_1.ST}
}

/**
 * Flux standard action meta for service action
 */
export interface ServiceMeta {
  res: FetchResponse${support_1.ST}
  info: any${support_1.ST}
}
`.replace(/  /g, support_1.SP).split('\n');
}
function renderTypeDoc(name, def) {
    if (def.allOf)
        return renderDocInheritance(name, def.allOf);
    if (def.type !== 'object') {
        console.warn(`Unable to render ${name} ${def.type}, skipping.`);
        return [];
    }
    const group = 'types';
    const lines = [
        '/**',
        `${support_1.DOC}@typedef ${name}`,
        `${support_1.DOC}@memberof module:${group}`
    ];
    const req = def.required || [];
    const propLines = Object.keys(def.properties).map(prop => {
        const info = def.properties[prop];
        const description = (info.description || '').trim().replace(/\n/g, `\n${support_1.DOC}${support_1.SP}`);
        return `${support_1.DOC}@property {${support_1.getDocType(info)}} ${prop} ${description}`;
    });
    if (propLines.length)
        lines.push(`${support_1.DOC}`);
    util_1.join(lines, propLines);
    lines.push(' */');
    lines.push('');
    return lines;
}
function renderDocInheritance(name, allOf) {
    verifyAllOf(name, allOf);
    const ref = allOf[0];
    const parentName = ref.$ref.split('/').pop();
    const lines = renderTypeDoc(name, allOf[1]);
    lines.splice(3, 0, `${support_1.DOC}@extends ${parentName}`);
    return lines;
}
function verifyAllOf(name, allOf) {
    // Currently we interpret allOf as inheritance. Not strictly correct
    // but seems to be how most model inheritance in Swagger and is consistent
    // with other code generation tool
    if (!allOf || allOf.length !== 2) {
        console.log(allOf);
        throw new Error(`Json schema allOf '${name}' must have two elements to be treated as inheritance`);
    }
    const ref = allOf[0];
    if (!ref.$ref) {
        throw new Error(`Json schema allOf '${name}' first element must be a $ref ${ref}`);
    }
}
