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

const getCuratedTypes = function () {
    return curatedSchemasContext.keys()
        .filter(k => !k.startsWith('./types/'))
        .map(k => k.replace('./', '').replace('.json', ''));
};

const getFieldLabel = function (type, fieldName) {
    let t = type;
    while (t) {
        const zh = loadZh(t);
        if (zh?.fields) {
            const field = zh.fields.find(f => f.name === fieldName);
            if (field?.localizedName) return field.localizedName;
        }
        const schema = loadCuratedSchema(t) || loadSchema(t);
        t = schema?.parentType || null;
    }
    return null;
};

const getFieldDoc = function (type, fieldName) {
    let t = type;
    while (t) {
        const zh = loadZh(t);
        if (zh?.fields) {
            const field = zh.fields.find(f => f.name === fieldName);
            if (field?.notes) return field.notes;
        }
        const schema = loadCuratedSchema(t) || loadSchema(t);
        t = schema?.parentType || null;
    }
    return '';
};

const refCache = {};

const resolveFieldRef = function (refPath) {
    const key = `./types/${refPath.replace('types/', '')}.json`;
    if (refCache[refPath]) return refCache[refPath];
    try {
        if (curatedSchemasContext.keys().includes(key)) {
            const def = curatedSchemasContext(key);
            refCache[refPath] = def.fields || [];
            return refCache[refPath];
        }
    } catch (e) { /* fall through */ }
    refCache[refPath] = [];
    return [];
};

const resolveFieldWithRef = function (f) {
    if (f.$ref) {
        return resolveFieldRef(f.$ref);
    }
    if (f.items && f.items.$ref) {
        return [{
            ...f,
            items: {
                type: 'object',
                fields: resolveFieldRef(f.items.$ref),
                refFrom: f.items.$ref,
            }
        }];
    }
    return [f];
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

    const ownFields = (schema.fields || []).flatMap(f => resolveFieldWithRef(f)).map(f => ({
        ...f,
        sourceType: type
    }));

    // Keep last occurrence of each field (child overrides parent)
    const merged = [...parentFields, ...ownFields];
    const lastIdx = {};
    for (let i = 0; i < merged.length; i++) lastIdx[merged[i].name] = i;
    return merged.filter((_, i) => i === lastIdx[merged[i].name]);
};

const parseDefault = function (field) {
    if (field.defaultValue === void 0 || field.defaultValue === '') {
        if (field.type === 'boolean') return false;
        if (field.type === 'int' || field.type === 'float') return 0;
        if (field.type === 'array') return [];
        return '';
    }
    if (field.type === 'boolean') return field.defaultValue === 'true';
    if (field.type === 'int') return parseInt(field.defaultValue, 10) || 0;
    if (field.type === 'float') return parseFloat(field.defaultValue) || 0;
    if (field.type === 'array') return [];
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
    resolveFieldRef,
    resolveFields,
    getZhLabel,
    getZhDoc,
    getFieldLabel,
    getFieldDoc,
    getCuratedTypes,
    getAllTypes,
    parseDefault,
    computeDefaults,
    diffData
};
