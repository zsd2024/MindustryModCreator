function needsQuotes(str) {
  if (typeof str !== 'string') return true;
  if (str === '') return true;
  return /[\s:,\[\]{}"']|^[0-9]|^true$|^false$|^null$|^undefined$/.test(str);
}

function isSimpleValue(v) {
  return v === null || v === undefined || typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string';
}

function toHjson(val, indent) {
  indent = indent || 0;
  const pad = '  '.repeat(indent);

  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);

  if (typeof val === 'string') {
    if (val.includes('\n')) {
      return `'''\n${val}\n'''`;
    }
    if (needsQuotes(val)) {
      return JSON.stringify(val);
    }
    return val;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    // if all simple values, inline
    if (val.every(isSimpleValue) && val.length <= 6) {
      const items = val.map(v => toHjson(v, indent + 1)).join(', ');
      return `[${items}]`;
    }
    const items = val.map(v => `${pad}  ${toHjson(v, indent + 1)}`).join('\n');
    return `[\n${items}\n${pad}]`;
  }

  // object
  const keys = Object.keys(val);
  if (keys.length === 0) return '{}';

  const lines = keys.map(k => {
    const v = val[k];
    const keyStr = needsQuotes(k) ? JSON.stringify(k) : k;
    const valStr = toHjson(v, indent + 1);

    if (typeof v === 'string' && v.includes('\n')) {
      return `${pad}  ${keyStr}:\n${valStr}`;
    }
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      return `${pad}  ${keyStr}:\n${valStr}`;
    }
    return `${pad}  ${keyStr}: ${valStr}`;
  });

  return lines.join('\n');
}

export default toHjson;
