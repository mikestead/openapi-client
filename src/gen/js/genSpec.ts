import { DOC, SP, ST, getDocType, getTSParamType } from './support'
import { writeFileSync } from '../util'

export default function genSpec(spec: ApiSpec, options: ClientOptions) {
  const file = genSpecFile(spec, options)
  writeFileSync(file.path, file.contents)
}

export function genSpecFile(spec: ApiSpec, options: ClientOptions) {
  return {
    path: `${options.outDir}/gateway/spec.${options.language}`,
    contents: renderSpecView(spec, options)
  }
}

function renderSpecView(spec: ApiSpec, options: ClientOptions): string {
  const view = {
    host: spec.host,
    schemes: spec.schemes,
    basePath: spec.basePath,
    contentTypes: spec.contentTypes,
    accepts: spec.accepts,
    securityDefinitions: spec.securityDefinitions
  }
  const type = (options.language === 'ts') ? ': api.OpenApiSpec' : ''
  return `${options.language === 'ts' ? '/// <reference path="../types.ts"/>': ''}
// Auto-generated, edits will be overwritten
const spec${type} = ${stringify(view)}${ST}
export default spec${ST}
`
}

function stringify(view: any): string {
  const str = JSON.stringify(view, null, 2)
  return str.replace(/"/g, `'`).replace(/  /g, SP)
}