#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { homedir } from 'os';
import * as hjson from 'hjson';

const HOME = homedir();
const MODS_DIR = join(HOME, '.tmp/MindustryWorkspace/Mods/JSON');

// Determine content type from a content file
function inferContentType(filePath, data) {
    if (data.type && data.type !== 'item' && data.type !== 'liquid' && data.type !== 'block') {
        return data.type;
    }
    const parentDir = basename(dirname(filePath));
    const folderMap = {
        'items': 'Item',
        'liquids': 'Liquid',
        'blocks': null, // need type field
        'units': null,
        'planet': 'Planet',
        'planets': 'Planet',
        'sectors': 'SectorPreset',
        'weather': 'Weather',
        'effects': 'StatusEffect',
        'status': 'StatusEffect',
        'teams': 'TeamEntry',
    };
    const mapped = folderMap[parentDir];
    if (mapped) return mapped;
    return null;
}

function walkDir(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(fullPath));
        } else if (entry.isFile() && /\.(json|hjson)$/i.test(entry.name) && entry.name !== 'mod.json' && entry.name !== 'mod.hjson') {
            results.push(fullPath);
        }
    }
    return results;
}

function parseFile(filePath) {
    try {
        const raw = readFileSync(filePath, 'utf-8');
        if (filePath.endsWith('.hjson')) {
            return hjson.parse(raw);
        }
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function collectFieldInfo(value, path = []) {
    const fields = [];
    if (value === null || value === undefined) return fields;
    if (typeof value === 'object' && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value)) {
            const fullPath = [...path, k];
            fields.push({
                path: fullPath.join('.'),
                depth: path.length,
                jsType: Array.isArray(v) ? 'array' : typeof v,
                hasChildren: typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0,
                sampleValue: typeof v === 'object' && v !== null ? JSON.stringify(v).slice(0, 100) : String(v),
            });
            fields.push(...collectFieldInfo(v, fullPath));
        }
    } else if (Array.isArray(value)) {
        for (const item of value) {
            if (typeof item === 'object' && item !== null) {
                fields.push(...collectFieldInfo(item, path));
            }
        }
    }
    return fields;
}

function analyze() {
    const files = walkDir(MODS_DIR);
    const perType = {}; // contentType -> { fields: {fieldName -> stats} }

    for (const filePath of files) {
        const data = parseFile(filePath);
        if (!data) continue;

        const type = inferContentType(filePath, data);
        if (!type) continue;

        if (!perType[type]) perType[type] = { totalFiles: 0, fields: {} };
        perType[type].totalFiles++;

        for (const [key, value] of Object.entries(data)) {
            if (key === 'type') continue; // skip type discriminator itself
            if (!perType[type].fields[key]) {
                perType[type].fields[key] = {
                    count: 0,
                    valueTypes: new Set(),
                    sampleValues: [],
                    isObject: false,
                    isArray: false,
                    childFields: new Set(),
                };
            }
            const stat = perType[type].fields[key];
            stat.count++;
            stat.valueTypes.add(typeof value);
            if (stat.sampleValues.length < 3) {
                const sample = typeof value === 'object' ? JSON.stringify(value).slice(0, 120) : String(value);
                if (!stat.sampleValues.includes(sample)) stat.sampleValues.push(sample);
            }
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    stat.isArray = true;
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        for (const k of Object.keys(value[0])) {
                            stat.childFields.add(k);
                        }
                    }
                } else {
                    stat.isObject = true;
                    for (const k of Object.keys(value)) {
                        stat.childFields.add(k);
                    }
                }
            }
        }
    }

    // Convert Sets to arrays and sort
    const output = {};
    for (const [typeName, typeData] of Object.entries(perType)) {
        const fields = {};
        const sorted = Object.entries(typeData.fields)
            .sort((a, b) => b[1].count - a[1].count);
        for (const [fName, fData] of sorted) {
            fields[fName] = {
                ...fData,
                valueTypes: [...fData.valueTypes],
                childFields: [...fData.childFields].sort(),
                frequency: `${Math.round(fData.count / typeData.totalFiles * 100)}%`,
            };
        }
        output[typeName] = {
            totalFiles: typeData.totalFiles,
            totalFields: Object.keys(typeData.fields).length,
            fields,
        };
    }

    // Sort types by totalFiles descending
    const sortedOutput = {};
    const typeEntries = Object.entries(output).sort((a, b) => b[1].totalFiles - a[1].totalFiles);
    for (const [k, v] of typeEntries) sortedOutput[k] = v;

    return sortedOutput;
}

const result = analyze();
console.log(JSON.stringify(result, null, 2));
