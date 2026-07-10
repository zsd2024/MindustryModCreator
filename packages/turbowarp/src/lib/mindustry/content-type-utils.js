export const contentTypePrefix = {
    Block: 'block',
    Wall: 'block',
    OreBlock: 'block',
    Floor: 'block',
    OverlayFloor: 'block',
    Item: 'item',
    Liquid: 'item',
    CellLiquid: 'item',
    BulletType: 'bullet',
    BasicBulletType: 'bullet',
    ArtilleryBulletType: 'bullet',
    ContinuousBulletType: 'bullet',
    ContinuousFlameBulletType: 'bullet',
    ContinuousLaserBulletType: 'bullet',
    FlakBulletType: 'bullet',
    GasBulletType: 'bullet',
    LiquidBulletType: 'bullet',
    MassDriverBolt: 'bullet',
    MissileBulletType: 'bullet',
    PointBulletType: 'bullet',
    RailBulletType: 'bullet',
    ShrapnelBulletType: 'bullet',
    StatusEffect: 'status',
    UnitType: 'unit',
    ErekirUnitType: 'unit',
    MechUnitType: 'unit',
    PayloadUnitType: 'unit',
    TankUnitType: 'unit',
    LegsUnitType: 'unit',
    NavalUnitType: 'unit',
    ParticleWeather: 'weather',
    RainWeather: 'weather',
    Planet: 'planet',
    SectorPreset: 'sector',
    TeamEntry: 'team'
};

export const getBundlePrefix = function (contentType) {
    const prefix = contentTypePrefix[contentType];
    if (!prefix) {
        console.warn(`[content-type-utils] Unknown content type '${contentType}', falling back to 'block'`);
    }
    return prefix || 'block';
};

export const generateBundleKeys = function (assets, modConfig) {
    const modName = (modConfig && modConfig.name) || 'my-mod';
    const keys = {};
    for (const asset of assets) {
        if (asset.kind !== 'content') continue;
        const prefix = getBundlePrefix(asset.contentType);
        const internalName = `${modName}-${asset.name}`;
        keys[`${prefix}.${internalName}.name`] = '';
        keys[`${prefix}.${internalName}.description`] = '';
    }
    return keys;
};

export const getBundleNameMap = function (assetFormData, assets, modConfig) {
    const modName = (modConfig && modConfig.name) || 'my-mod';
    if (!assets || !assetFormData) return {};
    const zhBundle = assets.find(
        a => a.kind === 'bundle' && a.name === 'bundle_zh_CN.properties'
    );
    if (!zhBundle || !assetFormData[zhBundle.id]) return {};
    const bundleData = assetFormData[zhBundle.id];
    const nameMap = {};
    for (const [key, value] of Object.entries(bundleData)) {
        if (!key.endsWith('.name')) continue;
        const parts = key.split('.');
        const internalName = parts.slice(1, -1).join('.');
        const prefix = `${modName}-`;
        const assetName = internalName.startsWith(prefix) ?
            internalName.slice(prefix.length) :
            internalName;
        if (value) {
            nameMap[assetName] = value;
        }
    }
    return nameMap;
};
