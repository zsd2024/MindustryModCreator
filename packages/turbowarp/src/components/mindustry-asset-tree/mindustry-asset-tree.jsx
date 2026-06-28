import PropTypes from 'prop-types';
import React from 'react';
import {getZhLabel} from '../../lib/mindustry/resolve-schema';
import styles from './mindustry-asset-tree.css';

const IGNORED_TYPES = new Set([
  'DrawArcSmelt', 'DrawBlockParts', 'DrawBlurSpin', 'DrawBubbles',
  'DrawCells', 'DrawCircles', 'DrawCrucibleFlame', 'DrawCultivator',
  'DrawFade', 'DrawFlame', 'DrawFrames', 'DrawGlowRegion',
  'DrawHeatInput', 'DrawHeatOutput', 'DrawHeatRegion',
  'DrawLiquidOutputs', 'DrawLiquidRegion', 'DrawLiquidTile',
  'DrawMulti', 'DrawMultiWeave', 'DrawParticles', 'DrawPistons',
  'DrawPlasma', 'DrawPower', 'DrawPulseShape', 'DrawPumpLiquid',
  'DrawRegion', 'DrawShape', 'DrawSideRegion', 'DrawSoftParticles',
  'DrawSpikes', 'DrawTurret', 'DrawWarmupRegion', 'DrawWeave',
  'Effect', 'ExplosionEffect', 'MultiEffect', 'ParticleEffect',
  'RadialEffect', 'SeqEffect', 'SoundEffect', 'WaveEffect', 'WrapEffect',
  'Weather', 'ParticleWeather', 'RainWeather',
  'CharacterOverlay', 'RuneOverlay',
  'SectorPreset',
]);

const CATEGORIES = [
  {types: ['Block', 'Wall', 'Floor', 'Prop', 'StaticWall', 'TreeBlock', 'Cliff'], label: '方块'},
  {types: ['Conveyor', 'Duct', 'Router', 'Junction', 'DuctRouter', 'DuctJunction', 'StackConveyor', 'StackRouter', 'OverflowDuct', 'OverflowGate', 'Sorter'], label: '输送'},
  {types: ['Drill', 'BurstDrill', 'BeamDrill', 'SolidPump', 'Pump'], label: '采集'},
  {types: ['GenericCrafter', 'AttributeCrafter', 'HeatCrafter', 'Separator', 'Fracker', 'WallCrafter', 'Incinerator'], label: '工厂'},
  {types: ['Turret', 'ItemTurret', 'LiquidTurret', 'PowerTurret', 'ContinuousTurret', 'ContinuousLiquidTurret', 'LaserTurret', 'PointDefenseTurret', 'TractorBeamTurret', 'BuildTurret'], label: '炮塔'},
  {types: ['PowerNode', 'LongPowerNode', 'PowerGenerator', 'HeaterGenerator', 'ThermalGenerator', 'ConsumeGenerator', 'ImpactReactor', 'NuclearReactor', 'VariableReactor', 'Battery', 'PowerDiode', 'BeamNode', 'PowerSource'], label: '电力'},
  {types: ['Conduit', 'LiquidRouter', 'LiquidBlock', 'LiquidSource'], label: '液体'},
  {types: ['UnitType', 'UnitFactory', 'UnitAssembler', 'UnitAssemblerModule', 'Reconstructor', 'DroneCenter'], label: '单位'},
  {types: ['ItemBridge', 'BufferedItemBridge', 'DirectionBridge', 'DirectionLiquidBridge', 'MassDriver', 'LaunchPad', 'LandingPad', 'PayloadConveyor', 'PayloadRouter', 'PayloadLoader', 'PayloadUnloader', 'PayloadMassDriver'], label: '传输'},
  {types: ['ForceProjector', 'DirectionalForceProjector', 'OverdriveProjector', 'MendProjector', 'RegenProjector', 'ShockwaveTower', 'ShockMine', 'ShieldWall', 'BaseShield', 'RepairTower'], label: '防御'},
  {types: ['Item', 'Liquid'], label: '物品与液体'},
  {types: ['BulletType', 'BasicBulletType', 'ArtilleryBulletType', 'BombBulletType', 'ContinuousBulletType', 'ContinuousFlameBulletType', 'ContinuousLaserBulletType', 'EmpBulletType', 'FireBulletType', 'FlakBulletType', 'LaserBoltBulletType', 'LaserBulletType', 'LiquidBulletType', 'MultiBulletType', 'PointBulletType', 'PointLaserBulletType', 'RailBulletType', 'SapBulletType', 'ShrapnelBulletType', 'SpaceLiquidBulletType'], label: '子弹'},
  {types: ['Weapon', 'PointDefenseWeapon', 'RepairBeamWeapon', 'BuildWeapon', 'PointDefenseBulletWeapon'], label: '武器'},
  {types: ['Ability', 'ArmorPlateAbility', 'EnergyFieldAbility', 'ForceFieldAbility', 'LiquidExplodeAbility', 'LiquidRegenAbility', 'MoveEffectAbility', 'MoveLightningAbility', 'RegenAbility', 'RepairFieldAbility', 'ShieldArcAbility', 'ShieldRegenFieldAbility', 'SpawnDeathAbility', 'StatusFieldAbility', 'SuppressionFieldAbility', 'UnitSpawnAbility'], label: '能力'},
  {types: ['Effect'], label: '效果'},
  {types: ['Weather'], label: '天气'},
];

class MindustryAssetTree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: new Set(),
      items: this.initItems(),
      selectedId: null,
      editingName: null,
    };
  }

  initItems() {
    const items = [];
    for (const cat of CATEGORIES) {
      for (const type of cat.types) {
        const zhName = getZhLabel(type);
        if (!zhName) continue;
        if (IGNORED_TYPES.has(type)) continue;
        items.push({
          id: type,
          type,
          name: zhName,
          category: cat.label,
          children: [],
        });
      }
    }
    return items;
  }

  toggleCategory(catLabel) {
    this.setState(prev => {
      const collapsed = new Set(prev.collapsed);
      if (collapsed.has(catLabel)) collapsed.delete(catLabel);
      else collapsed.add(catLabel);
      return {collapsed};
    });
  }

  handleItemClick(type, itemId) {
    this.setState({selectedId: itemId});
    if (this.props.onSelectContent) {
      this.props.onSelectContent(type, itemId);
    }
  }

  renderCategory(cat) {
    const items = this.state.items.filter(i => i.category === cat.label);
    if (items.length === 0) return null;
    const isCollapsed = this.state.collapsed.has(cat.label);

    return (
      <div className={styles.category} key={cat.label}>
        <div
          className={styles.categoryHeader}
          onClick={() => this.toggleCategory(cat.label)}
        >
          <span className={styles.arrow}>{isCollapsed ? '▶' : '▼'}</span>
          <span className={styles.catLabel}>{cat.label}</span>
          <span className={styles.catCount}>{items.length}</span>
        </div>
        {!isCollapsed && (
          <div className={styles.categoryBody}>
            {items.map(item => (
              <div
                key={item.id}
                className={`${styles.item} ${this.state.selectedId === item.id ? styles.itemActive : ''}`}
                onClick={() => this.handleItemClick(item.type, item.id)}
              >
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemType}>{item.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  render() {
    const uniqueCats = [...new Set(this.state.items.map(i => i.category))];

    return (
      <div className={styles.tree}>
        <div className={styles.treeHeader}>
          <span className={styles.treeTitle}>Mod 内容</span>
        </div>
        <div className={styles.treeBody}>
          {uniqueCats.map(cat => this.renderCategory({label: cat}))}
        </div>
        <div className={styles.treeFooter}>
          <button className={styles.addBtn} onClick={this.props.onAddContent}>
            + 添加内容
          </button>
          <button className={styles.addBtn} onClick={this.props.onAddJavaFile}>
            + 添加 Java
          </button>
        </div>
      </div>
    );
  }
}

MindustryAssetTree.propTypes = {
  onSelectContent: PropTypes.func,
  onAddContent: PropTypes.func,
  onAddJavaFile: PropTypes.func,
};

export default MindustryAssetTree;
