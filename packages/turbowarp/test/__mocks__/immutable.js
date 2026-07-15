const createMap = (obj) => {
    const storage = obj ? {...obj} : {};
    return {
        isMap: true,
        size: Object.keys(storage).length,
        get: (k) => storage[k],
        has: (k) => k in storage,
        set: (k, v) => { storage[k] = v; return createMap(storage); },
        delete: (k) => { delete storage[k]; return createMap(storage); },
        merge: (other) => createMap({...storage, ...other}),
        mergeDeep: (other) => createMap({...storage, ...other}),
        map: (fn) => Object.keys(storage).map(k => fn(storage[k], k)),
        forEach: (fn) => Object.keys(storage).forEach(k => fn(storage[k], k)),
        filter: (fn) => createMap(Object.keys(storage).filter(k => fn(storage[k], k)).reduce((acc, k) => { acc[k] = storage[k]; return acc; }, {})),
        toArray: () => Object.values(storage),
        toObject: () => ({...storage}),
        toJSON: () => storage,
        keys: () => Object.keys(storage),
        values: () => Object.values(storage),
        entries: () => Object.entries(storage)
    };
};

const createOrderedMap = (obj) => ({
    ...createMap(obj),
    isOrderedMap: true,
    valueSeq: () => Object.values(obj || {}),
    keySeq: () => Object.keys(obj || {}),
    entrySeq: () => Object.entries(obj || {})
});

const createList = (arr) => {
    const items = arr ? [...arr] : [];
    return {
        isList: true,
        size: items.length,
        get: (k) => items[k],
        has: (k) => k < items.length,
        set: (k, v) => { items[k] = v; return createList(items); },
        push: (v) => { items.push(v); return createList(items); },
        delete: (k) => { items.splice(k, 1); return createList(items); },
        merge: (other) => createList([...items, ...other]),
        map: (fn) => items.map(fn),
        forEach: (fn) => items.forEach(fn),
        filter: (fn) => createList(items.filter(fn)),
        toArray: () => [...items],
        toObject: () => ({...items}),
        toJSON: () => items
    };
};

const OrderedMap = Object.assign(
    (obj) => createOrderedMap(obj),
    {isOrderedMap: true, of: () => createOrderedMap()}
);

const List = Object.assign(
    (arr) => createList(arr),
    {isList: true, of: (...args) => createList(args)}
);

const Map = Object.assign(
    (obj) => createMap(obj),
    {isMap: true, of: () => createMap()}
);

module.exports = {Map, OrderedMap, List};
