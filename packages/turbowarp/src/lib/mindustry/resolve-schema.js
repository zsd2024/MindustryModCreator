const schemaCache = {};
const zhCache = {};
const schemasContext = require.context('./schemas', false, /\.json$/);
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

const resolveFields = function (type, visited = new Set()) {
    if (!type || visited.has(type)) return [];
    visited.add(type);

    const schema = loadSchema(type);
    if (!schema) return [];

    const parentFields = schema.parentType ?
        resolveFields(schema.parentType, visited) :
        [];

    const ownFields = (schema.fields || []).map(f => ({
        ...f,
        sourceType: type
    }));

    return [...parentFields, ...ownFields];
};

const getAllTypes = function () {
    return schemasContext.keys()
        .map(k => k.replace('./', '').replace('.json', ''))
        .filter(t => t !== 'zh_CN');
};

export {
    loadSchema,
    resolveFields,
    getZhLabel,
    getZhDoc,
    getFieldLabel,
    getFieldDoc,
    getAllTypes
};
