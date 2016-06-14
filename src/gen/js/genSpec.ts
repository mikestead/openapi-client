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
    consumes: spec.consumes,
    produces: spec.produces,
    securityDefinitions: spec.securityDefinitions
  }
  const type = (options.language === 'ts') ?  ': OpenApiSpec' : ''
  return `
// Auto-generated, edits will be overwritten
import { OpenApiSpec} from '../types'
const spec${type} = ${stringify(view)}
export default spec
`
}

function stringify(view: any): string {
  const str = JSON.stringify(view, null, 2)
  return str.replace(/"/g, `'`)
}