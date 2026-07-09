// eslint-disable-next-line import/no-unresolved
import hjson from 'hjson';

const schemaCache = {};
const curatedSchemaCache = {};
const zhCache = {};
const schemasContext = require.context('./schemas', false, /\.json$/);
const curatedSchemasContext = require.context('./schemas/curated', true, /\.json$/);
const zhContext = require.context('./schemas/zh_CN', false, /\.json$/);

const loadSchema = function (type) {
    if (schemaCache[type]) return schemaCache[type];
    try {
        const key = `./${type}.json`;
        if (schemasContext.keys().includes(key)) {
            schemaCache[type] = schemasContext(key);
            return schemaCache[type];
        }
    } catch (e) {
        console.warn(`[resolve-schema] Failed to load schema for '${type}':`, e.message);
    }
    return null;
};

const loadCuratedSchema = function (type) {
    if (curatedSchemaCache[type]) return curatedSchemaCache[type];
    try {
        const key = `./${type}.json`;
        if (curatedSchemasContext.keys().includes(key)) {
            curatedSchemaCache[type] = curatedSchemasContext(key);
            return curatedSchemaCache[type];
        }
    } catch (e) {
        // ignore
    }
    return null;
};

const loadZh = function (type) {
    if (zhCache[type]) return zhCache[type];
    try {
        const key = `./${type}.json`;
        if (zhContext.keys().includes(key)) {
            zhCache[type] = zhContext(key);
            return zhCache[type];
        }
    } catch (e) {
        console.warn(`[resolve-schema] Failed to load zh_CN for '${type}':`, e.message);
    }
    return null;
};

const getZhLabel = function (key) {
    const zh = loadZh(key);
    return zh?.localizedName || null;
};

const getZhDoc = function (key) {
    const zh = loadZh(key);
    return zh?.notes || null;
};

const getFieldLabel = function (type, fieldName) {
    const zh = loadZh(type);
    if (!zh?.fields) return fieldName;
    const field = zh.fields.find(f => f.name === fieldName);
    return field?.localizedName || fieldName;
};

const getFieldDoc = function (type, fieldName) {
    const zh = loadZh(type);
    if (!zh?.fields) return '';
    const field = zh.fields.find(f => f.name === fieldName);
    return field?.notes || '';
};

const resolveFields = function (type, mode = 'curated', visited = new Set()) {
    if (!type || visited.has(type)) return [];
    visited.add(type);

    const schema = mode === 'curated'
        ? (loadCuratedSchema(type) || loadSchema(type))
        : loadSchema(type);

    if (!schema) return [];

    const parentFields = schema.parentType ?
        resolveFields(schema.parentType, mode, visited) :
        [];

    const ownFields = (schema.fields || []).map(f => ({
        ...f,
        sourceType: type
    }));

    return [...parentFields, ...ownFields];
};

const parseDefault = function (field) {
    if (field.defaultValue === void 0 || field.defaultValue === '') {
        if (field.type === 'boolean') return false;
        if (field.type === 'int' || field.type === 'float') return 0;
        return '';
    }
    if (field.type === 'boolean') return field.defaultValue === 'true';
    if (field.type === 'int') return parseInt(field.defaultValue, 10) || 0;
    if (field.type === 'float') return parseFloat(field.defaultValue) || 0;
    return field.defaultValue;
};

const computeDefaults = function (contentType) {
    const fields = resolveFields(contentType, 'full');
    const defs = {};
    for (const f of fields) {
        defs[f.name] = parseDefault(f);
    }
    return defs;
};

const diffData = function (contentType, currentData) {
    if (!currentData || Object.keys(currentData).length === 0) return null;
    const defaults = computeDefaults(contentType);
    const result = {};
    for (const key of Object.keys(currentData)) {
        const dv = defaults[key];
        if (dv === void 0) {
            result[key] = currentData[key];
        } else if (hjson.stringify(currentData[key]) !== hjson.stringify(dv)) {
            result[key] = currentData[key];
        }
    }
    return Object.keys(result).length > 0 ? result : null;
};

const getAllTypes = function () {
    return schemasContext.keys()
        .map(k => k.replace('./', '').replace('.json', ''))
        .filter(t => t !== 'zh_CN');
};

export {
    loadSchema,
    loadCuratedSchema,
    resolveFields,
    getZhLabel,
    getZhDoc,
    getFieldLabel,
    getFieldDoc,
    getAllTypes,
    parseDefault,
    computeDefaults,
    diffData
};
