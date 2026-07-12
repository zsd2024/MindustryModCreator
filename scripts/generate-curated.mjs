#!/usr/bin/env bun
/**
 * Generate curated schema files from field-usage-report.json.
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

const INT_FIELDS = new Set([
  'size', 'health', 'itemCapacity', 'liquidCapacity', 'maxNodes',
  'shots', 'amount', 'tier', 'range', 'drillTime',
  'max', 'reload', 'frames', 'cost', 'hardness',
  'configurable', 'armor', 'ammoPerItem', 'segments',
  'bubbles', 'spread', 'sides', 'recurrence', 'shapes',
  'socketNodes', 'itemUseTime', 'pumpAmount', 'launchTime',
  'healAmount', 'crushDamage', 'segmentScl', 'segmentPhase',
  'drownTimeMultiplier', 'lightRadius', 'lightScl',
]);

const FLOAT_FIELDS = new Set([
  'speed', 'powerProduction', 'powerCapacity', 'usage',
  'damage', 'splashDamage', 'splashDamageRadius', 'knockback',
  'inaccuracy', 'shootCone', 'rotateSpeed', 'warmupSpeed',
  'minWarmup', 'coolantMultiplier', 'drag', 'accel',
  'hitSize', 'engineSize', 'engineOffset', 'mineSpeed',
  'mineTier', 'buildSpeed', 'payloadCapacity', 'trailLength',
  'force', 'scaledForce', 'lightOpacity', 'lightColor',
  'baseEfficiency', 'itemUseTime',
]);

const FIELD_TYPE_MAP = {
  // Content reference types
  'item': 'Item',
  'items': 'Item',
  'liquid': 'Liquid',
  'liquids': 'Liquid',
  'result': 'Item',
  'input': 'Item',
  'output': 'Item',
  'unit': 'UnitType',
  'status': 'StatusEffect',
  'effect': 'Effect',
  'sound': 'Sound',
  'block': 'Block',
  'team': 'Team',
  'weather': 'Weather',
  'sector': 'SectorPreset',
  'planet': 'Planet',
  'drawLiquid': 'Liquid',
  'shootSound': 'Sound',
  'engineColor': 'color',

  // Known boolean fields
  'squareSprite': 'boolean',
  'hasPower': 'boolean',
  'hasLiquids': 'boolean',
  'hasItems': 'boolean',
  'hasHeat': 'boolean',
  'flying': 'boolean',
  'hovering': 'boolean',
  'targetAir': 'boolean',
  'targetGround': 'boolean',
  'shootGround': 'boolean',
  'controllable': 'boolean',
  'autoTarget': 'boolean',
  'mirror': 'boolean',
  'rotate': 'boolean',
  'top': 'boolean',
  'under': 'boolean',
  'hollow': 'boolean',
  'circle': 'boolean',
  'tri': 'boolean',
  'outline': 'boolean',
  'spinSprite': 'boolean',
  'continuous': 'boolean',
  'collides': 'boolean',
  'collidesTiles': 'boolean',
  'collidesAir': 'boolean',
  'collidesTeam': 'boolean',
  'pierceBuilding': 'boolean',
  'makeFire': 'boolean',
  'hidden': 'boolean',
  'alwaysUnlocked': 'boolean',
  'omniMovement': 'boolean',
  'drawCell': 'boolean',
  'drawBody': 'boolean',
  'drawCell': 'boolean',

  // Enum string fields
  'buildVisibility': 'buildVisibility',
  'category': 'category',
  'controller': 'controller',

  // Special object/type discriminator fields
  'shoot': 'shoot',
  'drawer': 'drawer',
  'type': 'type',
  'bullet': 'bullet',
  'ammo': 'ammoTypes',
  'ammoTypes': 'ammoTypes',
  'consumes': 'consumes',
  'research': 'research',
  'researchCost': 'StackRequirement[]',

  // Array fields with known item structure
  'weapons': 'weapon[]',
  'abilities': 'ability[]',
  'plans': 'plan[]',
  'requirements': 'StackRequirement[]',
  'parts': 'part[]',
  'drawers': 'drawer[]',
  'barrels': 'float[]',
  'colors': 'color[]',
  'shownPlanets': 'Planet[]',
  'objectives': 'string[]',
  'immunities': 'StatusEffect[]',
  'ammoMultiplier': 'float',

  // Color fields
  'color': 'color',
  'colorTo': 'color',
  'heatColor': 'color',
  'laserColor': 'color',
  'lightColor': 'color',
  'engineColor': 'color',
  'outlineColor': 'color',
  'plantColor': 'color',
  'plantColorLight': 'color',
  'frontColor': 'color',
  'backColor': 'color',
  'glowColor': 'color',
  'flameColor': 'color',
  'midColor': 'color',
  'baseColor': 'color',
  'topColor': 'color',
  'bottomColor': 'color',
  'mixColor': 'color',
  'payloadColor': 'color',

  // Unit fields
  'mineTier': 'int',
  'drillTier': 'int',
  'payloadCapacity': 'int',
  'itemCapacity': 'int',

  // Misc
  'layer': 'float',
  'progress': 'progress',
  'suffix': 'string',
};

// Known object field structures (name -> child fields with types)
const OBJECT_FIELD_STRUCTURES = {
  'consumes': {
    fields: [
      { name: 'power', type: 'float' },
      { name: 'powerBuffered', type: 'float' },
      { name: 'items', type: 'object', fields: [
        { name: 'items', type: 'array', items: { $ref: 'types/StackRequirement' } },
      ]},
      { name: 'liquid', type: 'object', fields: [
        { name: 'liquid', type: 'Liquid' },
        { name: 'amount', type: 'float' },
        { name: 'update', type: 'boolean' },
        { name: 'optional', type: 'boolean' },
        { name: 'booster', type: 'boolean' },
      ]},
      { name: 'coolant', type: 'object', fields: [
        { name: 'amount', type: 'float' },
      ]},
    ],
  },
};

function resolveFieldType(stat, fieldName) {
  if (FIELD_TYPE_MAP[fieldName]) return FIELD_TYPE_MAP[fieldName];
  if (stat.valueTypes.includes('boolean')) return 'boolean';
  if (stat.isArray) return 'array';
  if (stat.isObject) return 'object';
  if (stat.valueTypes.includes('number')) {
    if (INT_FIELDS.has(fieldName)) return 'int';
    if (FLOAT_FIELDS.has(fieldName)) return 'float';
    return 'int';
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

const UNIT_TYPES = ['FlyingUnitType', 'LegsUnitType', 'NavalUnitType', 'MechUnitType', 'TankUnitType', 'PayloadUnitType', 'MissileUnitType', 'CrawlUnitType', 'TetheredUnitType'];

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

function buildFieldEntry(fieldName, stat) {
  const schemaType = resolveFieldType(stat, fieldName);
  const entry = { name: fieldName, type: schemaType };

  // Check known object structures (by field name)
  if (OBJECT_FIELD_STRUCTURES[fieldName]) {
    entry.fields = OBJECT_FIELD_STRUCTURES[fieldName].fields;
    return entry;
  }

  // Auto-detect object sub-fields
  if ((schemaType === 'object' || schemaType === 'consumes') && stat.childFields.length > 0 && stat.childFields.length <= 8) {
    entry.fields = stat.childFields.map(cf => ({
      name: cf,
      type: INT_FIELDS.has(cf) ? 'int' : FLOAT_FIELDS.has(cf) ? 'float' : 'string',
    }));
  }

  // Known array item structures
  if (schemaType === 'array') {
    if (fieldName === 'requirements' || fieldName === 'researchCost') {
      entry.items = { $ref: 'types/StackRequirement' };
    } else if (fieldName === 'weapons') {
      entry.items = { type: 'object', fields: [
        { name: 'name', type: 'string' },
        { name: 'x', type: 'float' },
        { name: 'y', type: 'float' },
        { name: 'reload', type: 'float' },
        { name: 'rotate', type: 'boolean' },
        { name: 'rotateSpeed', type: 'float' },
        { name: 'mirror', type: 'boolean' },
        { name: 'shootSound', type: 'Sound' },
        { name: 'top', type: 'boolean' },
        { name: 'bullet', type: 'bullet' },
        { name: 'shoot', type: 'shoot' },
        { name: 'inaccuracy', type: 'float' },
        { name: 'shootCone', type: 'float' },
        { name: 'cooldownTime', type: 'float' },
        { name: 'recoil', type: 'float' },
        { name: 'shootY', type: 'float' },
        { name: 'continuous', type: 'boolean' },
        { name: 'controllable', type: 'boolean' },
        { name: 'autoTarget', type: 'boolean' },
        { name: 'type', type: 'type' },
      ]};
    } else if (fieldName === 'abilities') {
      entry.items = { type: 'object', fields: [
        { name: 'type', type: 'type' },
        { name: 'range', type: 'float' },
        { name: 'reload', type: 'float' },
        { name: 'duration', type: 'float' },
        { name: 'amount', type: 'float' },
        { name: 'healPercent', type: 'float' },
        { name: 'damage', type: 'float' },
        { name: 'maxTargets', type: 'int' },
        { name: 'rotateSpeed', type: 'float' },
        { name: 'targetAir', type: 'boolean' },
        { name: 'targetGround', type: 'boolean' },
        { name: 'color', type: 'color' },
        { name: 'status', type: 'StatusEffect' },
        { name: 'statusDuration', type: 'float' },
        { name: 'unit', type: 'UnitType' },
        { name: 'spawnTime', type: 'float' },
        { name: 'spawnY', type: 'float' },
        { name: 'x', type: 'float' },
        { name: 'y', type: 'float' },
        { name: 'angle', type: 'float' },
        { name: 'max', type: 'float' },
        { name: 'regen', type: 'float' },
        { name: 'cooldown', type: 'float' },
        { name: 'width', type: 'float' },
        { name: 'radius', type: 'float' },
        { name: 'whenShooting', type: 'boolean' },
        { name: 'region', type: 'string' },
        { name: 'activeEffect', type: 'Effect' },
        { name: 'effect', type: 'Effect' },
      ]};
    } else if (fieldName === 'plans') {
      entry.items = { type: 'object', fields: [
        { name: 'unit', type: 'UnitType' },
        { name: 'requirements', type: 'array', items: { type: 'string' } },
        { name: 'time', type: 'float' },
      ]};
    } else if (fieldName === 'parts') {
      entry.items = { type: 'object', fields: [
        { name: 'type', type: 'type' },
        { name: 'suffix', type: 'string' },
        { name: 'mirror', type: 'boolean' },
        { name: 'under', type: 'boolean' },
        { name: 'progress', type: 'progress' },
        { name: 'x', type: 'float' },
        { name: 'y', type: 'float' },
        { name: 'name', type: 'string' },
        { name: 'moveX', type: 'float' },
        { name: 'moveY', type: 'float' },
        { name: 'moveRot', type: 'float' },
        { name: 'color', type: 'color' },
        { name: 'colorTo', type: 'color' },
        { name: 'layer', type: 'float' },
        { name: 'outline', type: 'boolean' },
        { name: 'blending', type: 'string' },
        { name: 'hollow', type: 'boolean' },
        { name: 'circle', type: 'boolean' },
        { name: 'sides', type: 'int' },
        { name: 'radius', type: 'float' },
        { name: 'radiusTo', type: 'float' },
        { name: 'stroke', type: 'float' },
        { name: 'strokeTo', type: 'float' },
        { name: 'tri', type: 'boolean' },
        { name: 'triLength', type: 'float' },
        { name: 'triLengthTo', type: 'float' },
        { name: 'haloRotateSpeed', type: 'float' },
        { name: 'haloRadius', type: 'float' },
        { name: 'recoilIndex', type: 'int' },
        { name: 'heatProgress', type: 'progress' },
        { name: 'children', type: 'array', items: { type: 'object' } },
        { name: 'moves', type: 'array', items: { type: 'object' } },
      ]};
    } else if (fieldName === 'drawers') {
      entry.items = { type: 'object', fields: [
        { name: 'type', type: 'type' },
        { name: 'suffix', type: 'string' },
        { name: 'rotateSpeed', type: 'float' },
        { name: 'spinSprite', type: 'boolean' },
        { name: 'drawLiquid', type: 'Liquid' },
        { name: 'padding', type: 'float' },
        { name: 'alpha', type: 'float' },
        { name: 'color', type: 'color' },
        { name: 'colorTo', type: 'color' },
        { name: 'layer', type: 'float' },
        { name: 'glowIntensity', type: 'float' },
        { name: 'glowScale', type: 'float' },
        { name: 'flameColor', type: 'color' },
        { name: 'midColor', type: 'color' },
        { name: 'sinMag', type: 'float' },
        { name: 'sinScl', type: 'float' },
        { name: 'basePrefix', type: 'string' },
        { name: 'plantColor', type: 'color' },
        { name: 'plantColorLight', type: 'color' },
        { name: 'bubbles', type: 'int' },
        { name: 'radius', type: 'float' },
        { name: 'spread', type: 'float' },
        { name: 'timeScl', type: 'float' },
        { name: 'parts', type: 'array', items: { type: 'object' } },
        { name: 'drawers', type: 'array', items: { type: 'object' } },
        { name: 'suffixes', type: 'array', items: { type: 'string' } },
      ]};
    } else if (stat.childFields.length > 0 && stat.childFields.length <= 6) {
      entry.items = {
        type: 'object',
        fields: stat.childFields.map(cf => ({
          name: cf,
          type: INT_FIELDS.has(cf) ? 'int' : FLOAT_FIELDS.has(cf) ? 'float' : 'string',
        })),
      };
    }
  }

  return entry;
}

function generateCurated(type) {
  let typeData = Object.hasOwn(report, type) ? report[type] : undefined;
  if (!typeData) {
    const reverseMap = Object.fromEntries(Object.entries(TYPE_NAME_MAP).map(e => [e[1], e[0]]));
    const altName = reverseMap[type];
    if (altName && Object.hasOwn(report, altName)) {
      typeData = report[altName];
    }
  }
  if (!typeData || typeof typeData !== 'object' || !typeData.fields) {
    const fallbackFields = Object.hasOwn(PARENT_FALLBACKS, type) ? PARENT_FALLBACKS[type] : undefined;
    if (!fallbackFields) {
      console.log(`  SKIP ${type}: no report data and no fallback`);
      return false;
    }
    const parentType = getParentType(type);
    const fields = fallbackFields.map(n => {
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

  const parentType = UNIT_TYPES.includes(type)
    ? 'UnitType'
    : getParentType(type);

  const fields = [];
  for (const [fieldName, stat] of Object.entries(typeData.fields)) {
    fields.push(buildFieldEntry(fieldName, stat));
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
      { name: 'requirements', type: 'array', items: { $ref: 'types/StackRequirement' } },
      { name: 'objectives', type: 'array', items: { type: 'string' } },
      { name: 'root', type: 'boolean' },
      { name: 'name', type: 'string' },
      { name: 'requiresUnlock', type: 'boolean' },
    ]
  },
};
for (const [name, def] of Object.entries(commonTypes)) {
  writeFileSync(join(TYPES_DIR, `${name}.json`), JSON.stringify(def, null, 4) + '\n');
}
console.log(`  ${Object.keys(commonTypes).length} type definitions`);
console.log(`\nDone: ${generated} curated files`);
