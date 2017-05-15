import genOperations from './genOperations'
import genReduxActions from './genReduxActions'
import genService from './genService'
import genTypes from './genTypes'
import genSpec from './genSpec'
import { applyFormatOptions } from './support'

export default function genCode(spec: ApiSpec, operations: ApiOperation[], options: ClientOptions): ApiSpec {
  applyFormatOptions(options)
  if (!options.genOnlyTypes) {
    genService(options)
    genSpec(spec, options)
    genOperations(spec, operations, options)
  }
  genTypes(spec, options)
  if (options.redux)
    genReduxActions(spec, operations, options)
  return spec
}
