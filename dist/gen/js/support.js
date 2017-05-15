"use strict";
exports.DOC = ' * ';
exports.DEFAULT_SP = '  ';
exports.SP = exports.DEFAULT_SP;
exports.ST = ''; // statement terminator
function applyFormatOptions(options) {
    switch (`${options.indent}`) {
        case 'tab':
        case '\t':
            exports.SP = '\t';
            break;
        case '4':
            exports.SP = '    ';
            break;
        case '2':
            exports.SP = '  ';
            break;
        case 'spaces':
        default:
            exports.SP = exports.DEFAULT_SP;
            break;
    }
    if (options.semicolon) {
        exports.ST = ';';
    }
}
exports.applyFormatOptions = applyFormatOptions;
function formatDocDescription(description) {
    return (description || '').trim().replace(/\n/g, `\n${exports.DOC}${exports.SP}`);
}
exports.formatDocDescription = formatDocDescription;
function getDocType(param) {
    if (!param) {
        return 'object';
    }
    else if (param.$ref) {
        const type = param.$ref.split('/').pop();
        return `module:types.${type}`;
    }
    else if (param.schema) {
        return getDocType(param.schema);
    }
    else if (param.type === 'array') {
        if (param.items.type) {
            return `${getDocType(param.items)}[]`;
        }
        else if (param.items.$ref) {
            const type = param.items.$ref.split('/').pop();
            return `module:types.${type}[]`;
        }
        else {
            return 'object[]';
        }
    }
    else if (param.type === 'integer') {
        return 'number';
    }
    else if (param.type === 'string' && (param.format === 'date-time' || param.format === 'date')) {
        return 'date';
    }
    else {
        return param.type || 'object';
    }
}
exports.getDocType = getDocType;
function getTSParamType(param, inTypesModule) {
    if (!param) {
        return 'any';
    }
    else if (param.enum) {
        if (!param.type || param.type === 'string')
            return `'${param.enum.join(`'|'`)}'`;
        else if (param.type === 'number')
            return `${param.enum.join(`|`)}`;
    }
    if (param.$ref) {
        const type = param.$ref.split('/').pop();
        return inTypesModule
            ? type
            : `api.${type}`;
    }
    else if (param.schema) {
        return getTSParamType(param.schema, inTypesModule);
    }
    else if (param.type === 'array') {
        if (param.items.type) {
            if (param.items.enum) {
                return `(${getTSParamType(param.items, inTypesModule)})[]`;
            }
            else {
                return `${getTSParamType(param.items, inTypesModule)}[]`;
            }
        }
        else if (param.items.$ref) {
            const type = param.items.$ref.split('/').pop();
            return inTypesModule
                ? `${type}[]`
                : `api.${type}[]`;
        }
        else {
            return 'any[]';
        }
    }
    else if (param.type === 'object') {
        if (param.additionalProperties) {
            const extraProps = param.additionalProperties;
            return `{[key: string]: ${getTSParamType(extraProps, inTypesModule)}}`;
        }
        return 'any';
    }
    else if (param.type === 'integer') {
        return 'number';
    }
    else if (param.type === 'string' && (param.format === 'date-time' || param.format === 'date')) {
        return 'Date';
    }
    else {
        return param.type || 'any';
    }
}
exports.getTSParamType = getTSParamType;
