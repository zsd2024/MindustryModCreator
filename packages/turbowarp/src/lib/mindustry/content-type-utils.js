export const contentTypePrefix = {
  Item: 'item', Liquid: 'item', CellLiquid: 'item',
  BulletType: 'bullet', BasicBulletType: 'bullet', ArtilleryBulletType: 'bullet',
  ContinuousBulletType: 'bullet', ContinuousFlameBulletType: 'bullet',
  ContinuousLaserBulletType: 'bullet', FlakBulletType: 'bullet',
  GasBulletType: 'bullet', LiquidBulletType: 'bullet', MassDriverBolt: 'bullet',
  MissileBulletType: 'bullet', PointBulletType: 'bullet', RailBulletType: 'bullet',
  ShrapnelBulletType: 'bullet',
  StatusEffect: 'status',
  UnitType: 'unit', ErekirUnitType: 'unit', MechUnitType: 'unit',
  PayloadUnitType: 'unit', TankUnitType: 'unit', LegsUnitType: 'unit',
  NavalUnitType: 'unit',
  ParticleWeather: 'weather', RainWeather: 'weather',
  Planet: 'planet',
  SectorPreset: 'sector',
};

export function getBundlePrefix(contentType) {
  return contentTypePrefix[contentType] || 'block';
}

export function generateBundleKeys(assets, modConfig) {
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
}
