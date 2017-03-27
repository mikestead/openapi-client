"use strict";
const SUPPORTED_METHODS = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch'
];
function getOperations(spec) {
    return getPaths(spec)
        .reduce((ops, pathInfo) => ops.concat(getPathOperations(pathInfo, spec)), []);
}
exports.getOperations = getOperations;
function getPaths(spec) {
    return Object.keys(spec.paths || {})
        .map(path => Object.assign({ path: path }, spec.paths[path]));
}
function getPathOperations(pathInfo, spec) {
    return Object.keys(pathInfo)
        .filter(key => !!~SUPPORTED_METHODS.indexOf(key))
        .map(method => getPathOperation(method, pathInfo, spec));
}
function getPathOperation(method, pathInfo, spec) {
    const op = Object.assign({ method: method, path: pathInfo.path, parameters: [] }, pathInfo[method]);
    op.id = op.operationId;
    // if there's no explicit operationId given, create one based on the method and path
    if (!op.id) {
        op.id = method + pathInfo.path;
        op.id = op.id.replace(/[\/{(?\/{)]([^{.])/g, (_, m) => m.toUpperCase());
        op.id = op.id.replace(/[\/}]/g, '');
    }
    op.group = getOperationGroupName(op);
    delete op.operationId;
    op.responses = getOperationResponses(op);
    op.security = getOperationSecurity(op);
    const operation = op;
    if (operation.consumes)
        operation.contentTypes = operation.consumes;
    if (operation.produces)
        operation.accepts = operation.produces;
    delete operation.consumes;
    delete operation.produces;
    if (!op.contentTypes || !op.contentTypes.length)
        op.contentTypes = spec.contentTypes.slice();
    if (!op.accepts || !op.accepts.length)
        op.accepts = spec.accepts.slice();
    return op;
}
function getOperationGroupName(op) {
    let name = op.tags && op.tags.length ? op.tags[0] : 'default';
    name = name.replace(/[^$_a-z0-9]+/gi, '');
    return name.replace(/^[0-9]+/m, '');
}
function getOperationResponses(op) {
    return Object.keys(op.responses || {}).map(code => {
        const info = op.responses[code];
        info.code = code;
        return info;
    });
}
function getOperationSecurity(op) {
    if (!op.security || !op.security.length)
        return;
    return op.security.map(def => {
        const id = Object.keys(def)[0];
        const scopes = def[id].length ? def[id] : undefined;
        return { id: id, scopes: scopes };
    });
}
