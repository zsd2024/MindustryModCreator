import PropTypes from 'prop-types';
import React from 'react';
import {getZhLabel} from '../../lib/mindustry/resolve-schema';
import styles from './mindustry-asset-cards.css';

const BUILTIN_IDS = new Set(['__mod_config__', '__bundle_en__', '__bundle_zh__']);

const FRIENDLY_NAMES = {
  __mod_config__: '模组配置文件',
  '__bundle_en__': '英文本地化',
  '__bundle_zh__': '中文本地化',
};

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

function iconForAsset(asset) {
  if (asset.kind === 'modconfig') return '⚙️';
  if (asset.kind === 'java') return '☕';
  const ct = asset.contentType;
  if (!ct) return '📄';
  if (['Wall', 'Block', 'Floor', 'Prop'].includes(ct)) return '🧱';
  if (ct === 'Item' || ct === 'Liquid') return '💎';
  if (ct.includes('Turret') || ct === 'Weapon') return '🎯';
  if (ct.includes('Bullet')) return '💥';
  if (ct.includes('Conveyor') || ct.includes('Duct') || ct.includes('Router') || ct.includes('Sorter')) return '⚙️';
  if (ct.includes('Drill') || ct.includes('Pump')) return '⛏️';
  if (ct.includes('Generator') || ct.includes('Reactor') || ct.includes('Battery') || ct.includes('Power')) return '⚡';
  if (ct.includes('Unit') || ct.includes('Factory') || ct.includes('Assembler') || ct.includes('Reconstructor')) return '🤖';
  if (ct.includes('Force') || ct.includes('Overdrive') || ct.includes('Shield') || ct.includes('Mine')) return '🛡️';
  if (ct.includes('Ability')) return '✨';
  if (ct.includes('Crafter') || ct.includes('Separator') || ct.includes('Fracker') || ct.includes('Incinerator')) return '🏭';
  if (ct.includes('Bridge') || ct.includes('MassDriver') || ct.includes('Launch')) return '📡';
  if (ct.includes('Effect') || ct.includes('Weather')) return '🌊';
  return '📄';
}

class AssetCards extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      dialogName: '',
      dialogType: null,
      dialogSearch: '',
      contextMenu: null,
      renamingId: null,
      renameValue: '',
      bundleDialog: false,
      bundleLang: 'zh_CN',
    };
    this._ctxEl = null;
  }

  componentDidMount() {
    document.addEventListener('click', this._handleDocClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocClick);
  }

  _handleDocClick = (e) => {
    if (this.state.contextMenu && this._ctxEl && !this._ctxEl.contains(e.target)) {
      this.setState({contextMenu: null});
    }
  };

  // ── add dialog ──
  openDialog() {
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

  promptAddJava() {
    const name = prompt('请输入 Java 类名：');
    if (name && name.trim()) {
      this.props.onAddJavaFile(name.trim());
    }
  }

  promptAddBundle() {
    this.setState({bundleDialog: true, bundleLang: 'zh_CN'});
  }

  // ── right-click context menu ──
  handleContextMenu(asset, e) {
    e.preventDefault();
    e.stopPropagation();
    if (asset.id === '__url_param__') return;
    this.setState({
      contextMenu: {assetId: asset.id, name: asset.name, x: e.clientX, y: e.clientY},
    });
  }

  // ── rename (inline) ──
  startRename(id, name) {
    this.setState({renamingId: id, renameValue: name, contextMenu: null});
  }

  confirmRename() {
    const {renamingId, renameValue} = this.state;
    if (renamingId && renameValue.trim()) {
      this.props.onRenameAsset(renamingId, renameValue.trim());
    }
    this.setState({renamingId: null, renameValue: ''});
  }

  // ── picker ──
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
    const {renamingId, renameValue} = this.state;

    return (
      <div className={styles.cardsPane} onContextMenu={(e) => e.preventDefault()}>
        <div className={styles.cardsHeader}>
          <span className={styles.cardsTitle}>资源</span>
        </div>
        <div className={styles.cardsBody}>
          {assets.length === 0 && (
            <div className={styles.emptyHint}>
              暂无资源，点击下方按钮添加
            </div>
          )}
          {assets.map(asset => {
            const active = selectedId === asset.id;
            const isRenaming = renamingId === asset.id;
            return (
              <div
                key={asset.id}
                className={`${styles.card} ${active ? styles.cardActive : ''}`}
                onClick={() => onSelect(asset.id)}
                onContextMenu={(e) => this.handleContextMenu(asset, e)}
              >
                <div className={styles.cardIconArea}>
                  <span className={styles.cardIcon}>{iconForAsset(asset)}</span>
                  <span className={`${styles.cardBadge} ${
                    asset.kind === 'content' ? styles.badgeJson :
                    asset.kind === 'modconfig' ? styles.badgeConfig :
                    asset.kind === 'bundle' ? styles.badgeConfig :
                    styles.badgeJava
                  }`}>
                    {asset.kind === 'content' ? 'JSON' :
                     asset.kind === 'modconfig' ? 'HJSON' :
                     asset.kind === 'bundle' ? 'i18n' : 'Java'}
                  </span>
                </div>
                <div className={styles.cardInfo}>
                  {isRenaming ? (
                    <input
                      className={styles.renameInput}
                      value={renameValue}
                      onChange={(e) => this.setState({renameValue: e.target.value})}
                      onBlur={() => this.confirmRename()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') this.confirmRename();
                        if (e.key === 'Escape') this.setState({renamingId: null, renameValue: ''});
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className={styles.cardName}>{FRIENDLY_NAMES[asset.id] || asset.name}</div>
                  )}
                  <div className={styles.cardType}>
                    {asset.kind === 'content' ? asset.contentType :
                     asset.kind === 'modconfig' ? 'mod.hjson' :
                     asset.kind === 'bundle' ? '.properties' : '.java'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.cardsFooter}>
          <button className={styles.addBtn} onClick={() => this.openDialog()}>
            + 添加内容
          </button>
          <button className={styles.addBtn} onClick={() => this.promptAddJava()}>
            + 添加 Java
          </button>
          <button className={styles.addBtn} onClick={() => this.promptAddBundle()}>
            + 本地化
          </button>
        </div>

        {/* add bundle dialog */}
        {this.state.bundleDialog && (
          <div className={styles.overlay} onClick={() => this.setState({bundleDialog: null})}>
            <div className={styles.dialog} onClick={e => e.stopPropagation()}>
              <div className={styles.dialogTitle}>添加本地化文件</div>
              <div className={styles.dialogNameRow}>
                <span className={styles.nameLabel}>语言</span>
                <select
                  className={styles.nameInput}
                  value={this.state.bundleLang}
                  onChange={e => this.setState({bundleLang: e.target.value})}
                >
                  <option value="en">English</option>
                  <option value="zh_CN">简体中文</option>
                  <option value="zh_TW">繁體中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="ru">Русский</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="pt_BR">Português (Brasil)</option>
                  <option value="th">ไทย</option>
                  <option value="vi">Tiếng Việt</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="it">Italiano</option>
                  <option value="pl">Polski</option>
                  <option value="uk">Українська</option>
                </select>
              </div>
              <div className={styles.dialogActions}>
                <button className={styles.dialogBtn} onClick={() => this.setState({bundleDialog: null})}>
                  取消
                </button>
                <button
                  className={`${styles.dialogBtn} ${styles.dialogBtnPrimary}`}
                  onClick={() => {
                    if (this.state.bundleLang && this.props.onAddBundle) {
                      this.props.onAddBundle(this.state.bundleLang);
                    }
                    this.setState({bundleDialog: null});
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

          {/* context menu */}
        {this.state.contextMenu && (
          <div
            className={styles.contextMenu}
            style={{left: this.state.contextMenu.x, top: this.state.contextMenu.y}}
            ref={(el) => {this._ctxEl = el;}}
            onClick={(e) => e.stopPropagation()}
          >
            {!BUILTIN_IDS.has(this.state.contextMenu.assetId) && (
              <div
                className={styles.menuItem}
                onClick={() => {
                  const {assetId, name} = this.state.contextMenu;
                  this.startRename(assetId, name);
                }}
              >
                重命名
              </div>
            )}
            {!BUILTIN_IDS.has(this.state.contextMenu.assetId) && (
              <div
                className={`${styles.menuItem} ${styles.menuDivider}`}
                onClick={() => {
                  this.props.onDuplicateAsset(this.state.contextMenu.assetId);
                  this.setState({contextMenu: null});
                }}
              >
                复制
              </div>
            )}
            <div
              className={`${styles.menuItemDanger} ${styles.menuDivider}`}
              onClick={() => {
                this.props.onDeleteAsset(this.state.contextMenu.assetId);
                this.setState({contextMenu: null});
              }}
            >
              删除
            </div>
          </div>
        )}

        {/* add dialog */}
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

AssetCards.propTypes = {
  assets: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onAddContent: PropTypes.func.isRequired,
  onAddJavaFile: PropTypes.func.isRequired,
  onRenameAsset: PropTypes.func,
  onDuplicateAsset: PropTypes.func,
  onDeleteAsset: PropTypes.func,
  onAddBundle: PropTypes.func,
};

export default AssetCards;
