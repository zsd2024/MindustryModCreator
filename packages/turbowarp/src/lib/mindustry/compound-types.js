const COMPOUND_TYPES = {
  ItemStack: {
    type: 'object',
    fields: [
      {name: 'item', type: 'Item'},
      {name: 'amount', type: 'int', defaultValue: 1},
    ],
  },
  LiquidStack: {
    type: 'object',
    fields: [
      {name: 'liquid', type: 'Liquid'},
      {name: 'amount', type: 'float', defaultValue: 1},
    ],
  },
  PathCost: {
    type: 'object',
    fields: [
      {name: 'type', type: 'Block'},
      {name: 'cost', type: 'float', defaultValue: 1},
    ],
  },
  ItemBridgeBuild: {
    type: 'object',
    fields: [
      {name: 'item', type: 'Item'},
      {name: 'sort', type: 'boolean'},
    ],
  },
};

function normalizeType(field) {
  const type = field.type;
  if (!type || type === 'object' || type === 'array') return field;

  if (COMPOUND_TYPES[type]) {
    return { ...field, ...COMPOUND_TYPES[type] };
  }

  const arrayMatch = type.match(/^(.+?)((?:\[\])+)$/);
  if (arrayMatch) {
    const baseType = arrayMatch[1];
    const arrayDepth = arrayMatch[2].length / 2;
    let items = { type: baseType };
    for (let i = 1; i < arrayDepth; i++) {
      items = { type: 'array', items };
    }
    return { ...field, type: 'array', items };
  }

  const seqMatch = type.match(/^Seq of (.+)$/);
  if (seqMatch) {
    return { ...field, type: 'array', items: { type: seqMatch[1] } };
  }

  const mapMatch = type.match(/^Object(Map|FloatMap) of (.+?),\s*(.+)$/);
  if (mapMatch) {
    const keyType = mapMatch[2];
    const valType = mapMatch[3];
    return {
      ...field, type: 'array',
      items: {
        type: 'object',
        fields: [
          {name: 'key', type: keyType, localizedName: '键'},
          {name: 'value', type: valType, localizedName: '值'},
        ],
      },
    };
  }

  const setMatch = type.match(/^ObjectSet of (.+)$/);
  if (setMatch) {
    return {
      ...field, type: 'array',
      items: {
        type: 'object',
        fields: [
          {name: 'value', type: setMatch[1], localizedName: '值'},
        ],
      },
    };
  }

  const enumSetMatch = type.match(/^EnumSet of (.+)$/);
  if (enumSetMatch) {
    return { ...field, type: 'array', items: { type: enumSetMatch[1] } };
  }

  return field;
}

export { COMPOUND_TYPES, normalizeType };
