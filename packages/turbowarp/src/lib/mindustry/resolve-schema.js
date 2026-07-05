import zhDocs from './zh-docs.json';

const schemaCache = {};
const schemasContext = require.context('./schemas', false, /\.json$/);

/**
 * @param {string} type - content type name
 * @returns {object|null} schema object or null
 */
const loadSchema = function (type) {
    if (schemaCache[type]) return schemaCache[type];
    try {
        const key = `./${type}.json`;
        if (schemasContext.keys().includes(key)) {
            const schema = schemasContext(key);
            schemaCache[type] = schema;
            return schema;
        }
    } catch (e) {
        console.warn(`[resolve-schema] Failed to load schema for '${type}':`, e.message);
    }
    return null;
};

/**
 * @param {string} key - class key
 * @returns {string|null} zh label or null
 */
const getZhLabel = function (key) {
    return zhDocs[`Class.${key}.name`] || null;
};

/**
 * @param {string} key - class key
 * @returns {string|null} zh doc or null
 */
const getZhDoc = function (key) {
    return zhDocs[`Class.${key}.doc`] || null;
};

/**
 * @param {string} type - content type name
 * @param {string} fieldName - field name
 * @returns {string} field label
 */
const getFieldLabel = function (type, fieldName) {
    return zhDocs[`Class.${type}.field.${fieldName}.name`] || fieldName;
};

/**
 * @param {string} type - content type name
 * @param {string} fieldName - field name
 * @returns {string} field doc
 */
const getFieldDoc = function (type, fieldName) {
    return zhDocs[`Class.${type}.field.${fieldName}.doc`] || '';
};

/**
 * @param {string} type - content type name
 * @param {Set} [visited] - visited types set
 * @returns {Array} resolved fields
 */
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

/** @returns {string[]} all type names */
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
