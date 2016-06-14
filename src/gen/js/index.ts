import genOperations from './genOperations'
import genReduxActions from './genReduxActions'
import genService from './genService'
import genTypes from './genTypes'
import genSpec from './genSpec'

export default function genCode(spec: ApiSpec, operations: ApiOperation[], options: ClientOptions): ApiSpec {
  genService(options)
  genSpec(spec, options)
  genOperations(spec, operations, options)
  genTypes(spec, options)
  if (options.redux) genReduxActions(spec, operations, options)
  return spec
}