const SUPPORTED_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch'
]

export function getOperations(spec: ApiSpec): ApiOperation[] {
  return getPaths(spec)
    .reduce<ApiOperation[]>((ops, pathInfo) =>
      ops.concat(getPathOperations(pathInfo, spec)), [])
}

function getPaths(spec: ApiSpec): Object[] {
  return Object.keys(spec.paths || {})
    .map(path => Object.assign({ path }, spec.paths[path]))
}

function getPathOperations(pathInfo, spec): ApiOperation[] {
  return Object.keys(pathInfo)
    .filter(key => !!~SUPPORTED_METHODS.indexOf(key))
    .map(method => getPathOperation(<HttpMethod> method, pathInfo, spec))
}

function getPathOperation(method: HttpMethod, pathInfo, spec: ApiSpec): ApiOperation {
  const op = Object.assign({ method, path: pathInfo.path, parameters: [] }, pathInfo[method])
  op.id = op.operationId

  // if there's no explicit operationId given, create one based on the method and path
  if (!op.id) {
    op.id = method + pathInfo.path
    op.id = op.id.replace(/[\/{(?\/{)]([^{.])/g, (_, m) => m.toUpperCase());
    op.id = op.id.replace(/[\/}]/g, '');
  }

  op.group = getOperationGroupName(op)
  delete op.operationId
  op.responses = getOperationResponses(op)
  op.security = getOperationSecurity(op) || getApiSecurity(spec)

  const operation: any = op
  if (operation.consumes) operation.contentTypes = operation.consumes
  if (operation.produces) operation.accepts = operation.produces
  delete operation.consumes
  delete operation.produces

  if (!op.contentTypes || !op.contentTypes.length) op.contentTypes = spec.contentTypes.slice()
  if (!op.accepts || !op.accepts.length) op.accepts = spec.accepts.slice()
  return <ApiOperation> op
}

function getOperationGroupName(op: any): string {
  let name = op.tags && op.tags.length ? op.tags[0] : 'default'
  name = name.replace(/[^$_a-z0-9]+/gi, '')
  return name.replace(/^[0-9]+/m, '')
}

function getOperationResponses(op: any): ApiOperationResponse[] {
  return Object.keys(op.responses || {}).map(code => {
    const info = op.responses[code]
    info.code = code
    return info
  })
}

function getOperationSecurity(op: any): ApiOperationSecurity[] {
  if (!op.security) return;

  if (op.security.length) {
    return op.security.map(def => {
      const id = Object.keys(def)[0];
      const scopes = def[id].length ? def[id] : undefined;
      return { id: id, scopes: scopes };
    });
  } else if (Object.keys(op.security).length) {
    return [{ id: Object.keys(op.security)[0] }];
  }
}

function getApiSecurity(spec: any): ApiOperationSecurity[] {
  if (!spec.security) return;

  if (spec.security.length) {
    return spec.security.map(def => {
      const id = Object.keys(def)[0];
      const scopes = def[id].length ? def[id] : undefined;
      return { id: id, scopes: scopes };
    });
  } else if (Object.keys(spec.security).length) {
    return [{ id: Object.keys(spec.security)[0] }];
  }
}
