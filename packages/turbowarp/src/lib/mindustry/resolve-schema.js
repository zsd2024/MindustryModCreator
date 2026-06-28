import zhDocs from './zh-docs.json';

const schemaCache = {};
const schemasContext = require.context('./schemas', false, /\.json$/);

function loadSchema(type) {
  if (schemaCache[type]) return schemaCache[type];
  try {
    const key = `./${type}.json`;
    if (schemasContext.keys().includes(key)) {
      const schema = schemasContext(key);
      schemaCache[type] = schema;
      return schema;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function getZhLabel(key) {
  return zhDocs[`Class.${key}.name`] || null;
}

function getZhDoc(key) {
  return zhDocs[`Class.${key}.doc`] || null;
}

function getFieldLabel(type, fieldName) {
  return zhDocs[`Class.${type}.field.${fieldName}.name`] || fieldName;
}

function getFieldDoc(type, fieldName) {
  return zhDocs[`Class.${type}.field.${fieldName}.doc`] || '';
}

function resolveFields(type, visited = new Set()) {
  if (!type || visited.has(type)) return [];
  visited.add(type);

  const schema = loadSchema(type);
  if (!schema) return [];

  const parentFields = schema.parentType
    ? resolveFields(schema.parentType, visited)
    : [];

  const ownFields = (schema.fields || []).map(f => ({
    ...f,
    sourceType: type,
  }));

  return [...parentFields, ...ownFields];
}

function getAllTypes() {
  return schemasContext.keys()
    .map(k => k.replace('./', '').replace('.json', ''))
    .filter(t => t !== 'zh_CN');
}

export {
  loadSchema,
  resolveFields,
  getZhLabel,
  getZhDoc,
  getFieldLabel,
  getFieldDoc,
  getAllTypes,
};
