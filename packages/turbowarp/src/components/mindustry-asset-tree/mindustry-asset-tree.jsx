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

const TYPE_TO_CATEGORY = {};
for (const cat of CATEGORIES) {
  for (const t of cat.types) {
    TYPE_TO_CATEGORY[t] = cat.label;
  }
}

function getCategoryForContentType(type) {
  return TYPE_TO_CATEGORY[type] || '其他';
}

class MindustryAssetTree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: new Set(),
      dialogOpen: false,
      dialogName: '',
      dialogType: null,
      dialogSearch: '',
    };
  }

  toggleCategory(label) {
    this.setState(prev => {
      const collapsed = new Set(prev.collapsed);
      if (collapsed.has(label)) collapsed.delete(label);
      else collapsed.add(label);
      return {collapsed};
    });
  }

  // ── 添加内容对话框 ──
  openAddDialog() {
    this.setState({dialogOpen: true, dialogName: '', dialogType: null, dialogSearch: ''});
  }

  closeDialog() {
    this.setState({dialogOpen: false});
  }

  confirmAdd() {
    const {dialogName, dialogType} = this.state;
    if (!dialogName.trim() || !dialogType) return;
    this.props.onAddContent(dialogName.trim(), dialogType);
    this.closeDialog();
  }

  // ── 添加 Java ──
  promptAddJava() {
    const name = prompt('请输入 Java 类名：');
    if (name && name.trim()) {
      this.props.onAddJavaFile(name.trim());
    }
  }

  // ── 渲染选择器列表 ──
  renderPicker() {
    const {dialogType, dialogSearch} = this.state;
    const filtered = CATEGORIES.map(cat => ({
      ...cat,
      types: cat.types.filter(t => {
        const zh = getZhLabel(t);
        if (!zh) return false;
        if (IGNORED_TYPES.has(t)) return false;
        if (!dialogSearch) return true;
        const q = dialogSearch.toLowerCase();
        return t.toLowerCase().includes(q) || zh.toLowerCase().includes(q);
      }),
    })).filter(cat => cat.types.length > 0);

    return (
      <div className={styles.dialogPicker}>
        {filtered.map(cat => (
          <div className={styles.pickerCategory} key={cat.label}>
            <div className={styles.pickerCatLabel}>{cat.label}</div>
            {cat.types.map(t => {
              const active = dialogType === t;
              return (
                <span
                  key={t}
                  className={`${styles.pickerItem} ${active ? styles.pickerItemActive : ''}`}
                  onClick={() => this.setState({dialogType: t})}
                >
                  {getZhLabel(t)}
                </span>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className={styles.emptyHint}>无匹配类型</div>
        )}
      </div>
    );
  }

  render() {
    const {assets, selectedId, onSelect} = this.props;

    // group user assets by category
    const groupMap = {};
    for (const asset of assets) {
      const cat = asset.kind === 'content'
        ? getCategoryForContentType(asset.contentType)
        : 'Java 文件';
      if (!groupMap[cat]) groupMap[cat] = [];
      groupMap[cat].push(asset);
    }
    const catLabels = Object.keys(groupMap).sort((a, b) => {
      if (a === 'Java 文件') return 1;
      if (b === 'Java 文件') return -1;
      return 0;
    });

    return (
      <div className={styles.tree}>
        <div className={styles.treeHeader}>
          <span className={styles.treeTitle}>Mod 内容</span>
        </div>
        <div className={styles.treeBody}>
          {assets.length === 0 && (
            <div className={styles.emptyHint}>
              暂无内容，点击下方按钮添加
            </div>
          )}
          {catLabels.map(cat => {
            const items = groupMap[cat];
            const isCollapsed = this.state.collapsed.has(cat);
            return (
              <div className={styles.category} key={cat}>
                <div
                  className={styles.categoryHeader}
                  onClick={() => this.toggleCategory(cat)}
                >
                  <span className={styles.arrow}>{isCollapsed ? '▶' : '▼'}</span>
                  <span className={styles.catLabel}>{cat}</span>
                  <span className={styles.catCount}>{items.length}</span>
                </div>
                {!isCollapsed && (
                  <div className={styles.categoryBody}>
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={`${styles.item} ${selectedId === item.id ? styles.itemActive : ''}`}
                        onClick={() => onSelect(item.id)}
                      >
                        <span className={styles.itemName}>{item.name}</span>
                        <span className={styles.itemType}>
                          {item.kind === 'content' ? item.contentType : '.java'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.treeFooter}>
          <button className={styles.addBtn} onClick={() => this.openAddDialog()}>
            + 添加内容
          </button>
          <button className={styles.addBtn} onClick={() => this.promptAddJava()}>
            + 添加 Java
          </button>
        </div>

        {/* 添加内容对话框 */}
        {this.state.dialogOpen && (
          <div className={styles.overlay} onClick={() => this.closeDialog()}>
            <div className={styles.dialog} onClick={e => e.stopPropagation()}>
              <div className={styles.dialogTitle}>添加新内容</div>
              <div className={styles.dialogNameRow}>
                <span className={styles.nameLabel}>名称</span>
                <input
                  className={styles.nameInput}
                  value={this.state.dialogName}
                  onChange={e => this.setState({dialogName: e.target.value})}
                  placeholder="英文标识符，如 my-wall"
                  autoFocus
                />
              </div>
              <div className={styles.dialogNameRow}>
                <span className={styles.nameLabel}>搜索</span>
                <input
                  className={styles.nameInput}
                  value={this.state.dialogSearch}
                  onChange={e => this.setState({dialogSearch: e.target.value})}
                  placeholder="输入中文或英文过滤"
                />
              </div>
              {this.renderPicker()}
              <div className={styles.dialogActions}>
                <button className={styles.dialogBtn} onClick={() => this.closeDialog()}>
                  取消
                </button>
                <button
                  className={styles.dialogBtnPrimary}
                  disabled={!this.state.dialogName.trim() || !this.state.dialogType}
                  onClick={() => this.confirmAdd()}
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

MindustryAssetTree.propTypes = {
  assets: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    kind: PropTypes.oneOf(['content', 'java']).isRequired,
    name: PropTypes.string.isRequired,
    contentType: PropTypes.string,
  })).isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onAddContent: PropTypes.func.isRequired,
  onAddJavaFile: PropTypes.func.isRequired,
};

export default MindustryAssetTree;
