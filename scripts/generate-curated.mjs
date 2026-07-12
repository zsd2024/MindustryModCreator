#!/usr/bin/env bun
/**
 * Generate curated schema files from field-usage-report.json.
 * 
 * For each content type:
 *   - Reads field usage data (frequency, valueTypes, isObject, isArray)
 *   - Includes ALL fields that appear in mods, sorted by frequency desc
 *   - Maps value types to schema types (boolean→boolean, number→int/float, etc.)
 *   - Uses inheritance from reflection schema (parentType chain)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HOME = homedir();
const REPORT = join(HOME, '.tmp/MindustryWorkspace/MindustryModCreator/scripts/field-usage-report.json');
const SCHEMAS_DIR = join(HOME, '.tmp/MindustryWorkspace/MindustryModCreator/packages/turbowarp/src/lib/mindustry/schemas');
const CURATED_DIR = join(SCHEMAS_DIR, 'curated');
const TYPES_DIR = join(CURATED_DIR, 'types');

const report = JSON.parse(readFileSync(REPORT, 'utf-8'));

// Fields that are always integers
const INT_FIELDS = new Set([
  'size', 'health', 'itemCapacity', 'liquidCapacity', 'maxNodes',
  'shots', 'amount', 'tier', 'range', 'drillTime',
  'max', 'reload', 'frames', 'cost', 'hardness',
  'configurable', 'armor',
]);

function inferSchemaType(stat, fieldName) {
    if (stat.valueTypes.includes('boolean')) return 'boolean';
    if (stat.isArray) return 'array';
    if (stat.isObject) return 'object';
    if (stat.valueTypes.includes('number')) {
        if (INT_FIELDS.has(fieldName)) return 'int';
        return 'float';
    }
    if (stat.valueTypes.includes('string')) return 'string';
    return 'string';
}

function loadReflectionSchema(type) {
    try {
        return JSON.parse(readFileSync(join(SCHEMAS_DIR, `${type}.json`), 'utf-8'));
    } catch { return null; }
}

function getParentType(type) {
    const schema = loadReflectionSchema(type);
    return schema ? schema.parentType : null;
}

// Unit types map to UnitType parent
const UNIT_TYPES = ['FlyingUnitType', 'LegsUnitType', 'NavalUnitType', 'MechUnitType', 'TankUnitType', 'PayloadUnitType', 'MissileUnitType', 'CrawlUnitType', 'TetheredUnitType'];

// Map from mod-discovered type name (lowercase) to canonical PascalCase
const TYPE_NAME_MAP = {
  flying: 'FlyingUnitType',
  mech: 'MechUnitType',
  legs: 'LegsUnitType',
  naval: 'NavalUnitType',
  tank: 'TankUnitType',
  payload: 'PayloadUnitType',
  missile: 'MissileUnitType',
  crawl: 'CrawlUnitType',
  tether: 'TetheredUnitType',
};

// Parent type fallback fields (when no direct mod usage data exists)
const PARENT_FALLBACKS = {
  'UnlockableContent': ['localizedName', 'name', 'description', 'details', 'hidden', 'alwaysUnlocked', 'research'],
  'Block': ['size', 'health', 'requirements', 'category', 'consumes', 'itemCapacity', 'liquidCapacity', 'hasPower', 'hasLiquids', 'hasItems', 'squareSprite', 'buildVisibility'],
  'Turret': ['reload', 'range', 'inaccuracy', 'shootCone', 'shootSound', 'shoot', 'ammo', 'ammoTypes', 'targetAir', 'targetGround', 'rotateSpeed', 'coolantMultiplier', 'heatColor', 'shootEffect', 'smokeEffect', 'warmupSpeed', 'minWarmup', 'display'],
  'UnitType': ['speed', 'health', 'armor', 'hitSize', 'flying', 'drag', 'accel', 'rotateSpeed', 'engineSize', 'engineOffset', 'engineColor', 'itemCapacity', 'weapons', 'abilities', 'controller', 'research', 'mineSpeed', 'mineTier', 'buildSpeed', 'payloadCapacity', 'trailLength', 'outlineColor', 'hovering'],
  'PowerBlock': ['laserRange', 'maxNodes', 'laserColor', 'blockLoss', 'tower'],
  'PowerDistributor': ['laserRange', 'maxNodes'],
  'PowerGenerator': ['powerProduction', 'powerCapacity', 'itemCapacity', 'consumes'],
  'UnitBlock': ['plans', 'configurable', 'shownPlanets', 'forceTeam'],
  'PayloadBlock': ['payloadCapacity', 'payloadSpeed', 'payloadColor'],
};

const TARGET_TYPES = new Set([
    'UnlockableContent', 'Block', 'GenericCrafter', 'UnitType',
    'Turret', 'ItemTurret', 'PowerTurret', 'LiquidTurret',
    'Wall', 'Floor', 'Item', 'Liquid',
    'Drill', 'BurstDrill', 'BeamDrill',
    'ForceProjector', 'MendProjector', 'OverdriveProjector', 'RegenProjector',
    'ConsumeGenerator', 'ThermalGenerator', 'SolarGenerator', 'ImpactReactor',
    'PowerNode', 'Battery', 'BeamNode',
    'Conveyor', 'Router', 'Junction', 'Sorter', 'OverflowGate', 'ItemBridge',
    'Duct', 'LiquidRouter', 'LiquidBridge', 'Conduit', 'Pump',
    'UnitFactory', 'Reconstructor', 'UnitAssembler',
    'StorageBlock', 'Vault', 'CoreBlock',
    'MessageBlock', 'LightBlock', 'LogicBlock',
    'PayloadConveyor', 'PayloadRouter', 'PayloadMassDriver',
    'UnitCargoLoader', 'UnitCargoUnloadPoint',
    'StatusEffect', 'SectorPreset',
    'UnitBlock', 'PowerBlock', 'PowerDistributor', 'PowerGenerator',
    'PayloadBlock',
    'AttributeCrafter', 'HeatCrafter', 'WallCrafter', 'Fracker',
    'SteamVent', 'HeatProducer', 'HeatConductor',
    'TreeBlock', 'ShieldWall', 'CanvasBlock', 'TallBlock',
    'Prop', 'StaticWall', 'OreBlock', 'OverlayFloor',
    'SeaBush', 'ShallowLiquid', 'WobbleProp',
    'MassDriver', 'LaunchPad', 'RepairTower',
    'NuclearReactor', 'Battery',
    'Unloader',
    ...UNIT_TYPES,
]);

function generateCurated(type) {
    // Try direct lookup, then inverse map from report lower-case name
    let typeData = Object.hasOwn(report, type) ? report[type] : undefined;
    if (!typeData) {
        const reverseMap = Object.fromEntries(Object.entries(TYPE_NAME_MAP).map(e => [e[1], e[0]]));
        const altName = reverseMap[type];
        if (altName && Object.hasOwn(report, altName)) {
            typeData = report[altName];
        }
    }
    if (!typeData || typeof typeData !== 'object' || !typeData.fields) {
        // Use fallback fields for parent types
        const fallbackFields = Object.hasOwn(PARENT_FALLBACKS, type) ? PARENT_FALLBACKS[type] : undefined;
        if (!fallbackFields) {
            console.log(`  SKIP ${type}: no report data and no fallback`);
            return false;
        }
        const parentType = getParentType(type);
        const fields = fallbackFields.map(n => {
            // Try to infer type from reflection schema if available
            const refSchema = loadReflectionSchema(type);
            const refField = refSchema?.fields?.find(f => f.name === n);
            return { name: n, type: refField?.type || 'string' };
        });
        const curated = { localizedName: type };
        if (parentType) curated.parentType = parentType;
        curated.fields = fields;
        writeFileSync(join(CURATED_DIR, `${type}.json`), JSON.stringify(curated, null, 4) + '\n');
        console.log(`  WROTE ${type}: ${fields.length} fields (fallback)${parentType ? ` (extends ${parentType})` : ''}`);
        return true;
    }

    // For unit types, parentType is always UnitType (not from reflection)
    const parentType = UNIT_TYPES.includes(type)
        ? 'UnitType'
        : getParentType(type);

    const fields = [];
    for (const [fieldName, stat] of Object.entries(typeData.fields)) {
        const schemaType = inferSchemaType(stat, fieldName);
        const entry = { name: fieldName, type: schemaType };

        // For object types with few children, include sub-fields inline
        if (schemaType === 'object' && stat.childFields.length > 0 && stat.childFields.length <= 8) {
            entry.fields = stat.childFields.map(cf => ({
                name: cf,
                type: INT_FIELDS.has(cf) ? 'int' : 'string',
            }));
        }

        // For array types with few children, define items
        if (schemaType === 'array' && stat.childFields.length > 0 && stat.childFields.length <= 6) {
            entry.items = {
                type: 'object',
                fields: stat.childFields.map(cf => ({
                    name: cf,
                    type: INT_FIELDS.has(cf) ? 'int' : 'string',
                })),
            };
        }

        fields.push(entry);
    }

    const curated = { localizedName: type };
    if (parentType) curated.parentType = parentType;
    curated.fields = fields;

    writeFileSync(join(CURATED_DIR, `${type}.json`), JSON.stringify(curated, null, 4) + '\n');
    console.log(`  WROTE ${type}: ${fields.length} fields${parentType ? ` (extends ${parentType})` : ''}`);
    return true;
}

// Main
console.log('=== Generating curated schemas ===');
mkdirSync(CURATED_DIR, { recursive: true });
mkdirSync(TYPES_DIR, { recursive: true });

let generated = 0;
for (const type of TARGET_TYPES) {
    if (generateCurated(type)) generated++;
}
// Generate types/
console.log('\n=== Generating types/ ===');
const commonTypes = {
    'StackRequirement': {
        type: 'object', fields: [
            { name: 'item', type: 'Item' },
            { name: 'amount', type: 'int', defaultValue: '1' },
        ]
    },
    'ConsumePower': {
        type: 'object', fields: [
            { name: 'usage', type: 'float', defaultValue: '1' },
            { name: 'capacity', type: 'float' },
            { name: 'buffered', type: 'boolean', defaultValue: 'false' },
        ]
    },
    'ConsumeItems': {
        type: 'object', fields: [
            { name: 'item', type: 'Item' },
            { name: 'amount', type: 'int', defaultValue: '1' },
        ]
    },
    'ConsumeLiquid': {
        type: 'object', fields: [
            { name: 'liquid', type: 'Liquid' },
            { name: 'amount', type: 'float', defaultValue: '0.1' },
        ]
    },
    'Shoot': {
        type: 'object', fields: [
            { name: 'shots', type: 'int', defaultValue: '1' },
            { name: 'shotDelay', type: 'float', defaultValue: '0' },
        ]
    },
    'Research': {
        type: 'object', fields: [
            { name: 'parent', type: 'string' },
            { name: 'requirements', type: 'array', items: { '$ref': 'types/StackRequirement' } },
            { name: 'objectives', type: 'array', items: { type: 'string' } },
        ]
    },
};
for (const [name, def] of Object.entries(commonTypes)) {
    writeFileSync(join(TYPES_DIR, `${name}.json`), JSON.stringify(def, null, 4) + '\n');
}
console.log(`  ${Object.keys(commonTypes).length} type definitions`);
console.log(`\nDone: ${generated} curated files`);
