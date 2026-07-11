import PropTypes from 'prop-types';
import React from 'react';
import {ContextMenuTrigger} from 'react-contextmenu';
import {ContextMenu, MenuItem, DangerousMenuItem} from '../context-menu/context-menu.jsx';
import Modal from '../modal/modal.jsx';
import {getZhLabel, getCuratedTypes} from '../../lib/mindustry/resolve-schema';
import styles from './mindustry-asset-cards.css';

const BUILTIN_IDS = new Set(['__mod_config__', '__bundle_en__', '__bundle_zh__']);

const FRIENDLY_NAMES = {
    __mod_config__: '模组配置文件',
    __bundle_en__: 'English 本地化文件',
    __bundle_zh__: '中文简体 本地化文件'
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
    'CharacterOverlay', 'RuneOverlay'
]);

const CATEGORIES = [
    {types: ['Block', 'Wall', 'Floor', 'Prop', 'StaticWall', 'TreeBlock', 'Cliff'], label: '方块'},
    {types: [
        'Conveyor', 'Duct', 'Router', 'Junction', 'DuctRouter',
        'DuctJunction', 'StackConveyor', 'StackRouter',
        'OverflowDuct', 'OverflowGate', 'Sorter'
    ],
    label: '输送'},
    {types: ['Drill', 'BurstDrill', 'BeamDrill', 'SolidPump', 'Pump'], label: '采集'},
    {types: [
        'GenericCrafter', 'AttributeCrafter', 'HeatCrafter',
        'Separator', 'Fracker', 'WallCrafter', 'Incinerator'
    ],
    label: '工厂'},
    {types: [
        'Turret', 'ItemTurret', 'LiquidTurret', 'PowerTurret',
        'ContinuousTurret', 'ContinuousLiquidTurret', 'LaserTurret',
        'PointDefenseTurret', 'TractorBeamTurret', 'BuildTurret'
    ],
    label: '炮塔'},
    {types: [
        'PowerNode', 'LongPowerNode', 'PowerGenerator', 'HeaterGenerator',
        'ThermalGenerator', 'ConsumeGenerator', 'ImpactReactor',
        'NuclearReactor', 'VariableReactor', 'Battery', 'PowerDiode',
        'BeamNode', 'PowerSource'
    ],
    label: '电力'},
    {types: ['Conduit', 'LiquidRouter', 'LiquidBlock', 'LiquidSource'], label: '液体'},
    {types: [
        'UnitType', 'UnitFactory', 'UnitAssembler',
        'UnitAssemblerModule', 'Reconstructor', 'DroneCenter'
    ],
    label: '单位'},
    {types: [
        'ItemBridge', 'BufferedItemBridge', 'DirectionBridge',
        'DirectionLiquidBridge', 'MassDriver', 'LaunchPad', 'LandingPad',
        'PayloadConveyor', 'PayloadRouter', 'PayloadLoader',
        'PayloadUnloader', 'PayloadMassDriver'
    ],
    label: '传输'},
    {types: [
        'ForceProjector', 'DirectionalForceProjector', 'OverdriveProjector',
        'MendProjector', 'RegenProjector', 'ShockwaveTower', 'ShockMine',
        'ShieldWall', 'BaseShield', 'RepairTower'
    ],
    label: '防御'},
    {types: ['Item', 'Liquid'], label: '物品与液体'},
    {types: [
        'BulletType', 'BasicBulletType', 'ArtilleryBulletType',
        'BombBulletType', 'ContinuousBulletType',
        'ContinuousFlameBulletType', 'ContinuousLaserBulletType',
        'EmpBulletType', 'FireBulletType', 'FlakBulletType',
        'LaserBoltBulletType', 'LaserBulletType', 'LiquidBulletType',
        'MultiBulletType', 'PointBulletType', 'PointLaserBulletType',
        'RailBulletType', 'SapBulletType', 'ShrapnelBulletType',
        'SpaceLiquidBulletType'
    ],
    label: '子弹'},
    {types: [
        'Weapon', 'PointDefenseWeapon', 'RepairBeamWeapon',
        'BuildWeapon', 'PointDefenseBulletWeapon'
    ],
    label: '武器'},
    {types: [
        'Ability', 'ArmorPlateAbility', 'EnergyFieldAbility',
        'ForceFieldAbility', 'LiquidExplodeAbility', 'LiquidRegenAbility',
        'MoveEffectAbility', 'MoveLightningAbility', 'RegenAbility',
        'RepairFieldAbility', 'ShieldArcAbility',
        'ShieldRegenFieldAbility', 'SpawnDeathAbility',
        'StatusFieldAbility', 'SuppressionFieldAbility',
        'UnitSpawnAbility'
    ],
    label: '能力'},
    {types: ['Effect'], label: '效果'},
    {types: ['Weather'], label: '天气'},
    {types: ['SectorPreset'], label: '关卡'},
    {types: ['Planet'], label: '星球'},
    {types: ['TeamEntry'], label: '队伍'}
];

/**
 * @param {object} asset - asset object
 * @returns {string} icon path
 */
const iconForAsset = function (asset) {
    if (asset.kind === 'modconfig') return '\u2699\uFE0F';
    if (asset.kind === 'java') return '\u2615';
    const ct = asset.contentType;
    if (!ct) return '\uD83D\uDCC4';
    if (['Wall', 'Block', 'Floor', 'Prop'].includes(ct)) return '\uD83E\uDDF1';
    if (ct === 'Item' || ct === 'Liquid') return '\uD83D\uDC8E';
    if (ct.includes('Turret') || ct === 'Weapon') return '\uD83C\uDFAF';
    if (ct.includes('Bullet')) return '\uD83D\uDCA5';
    if (ct.includes('Conveyor') || ct.includes('Duct') ||
        ct.includes('Router') || ct.includes('Sorter')) return '\u2699\uFE0F';
    if (ct.includes('Drill') || ct.includes('Pump')) return '\u26CF\uFE0F';
    if (ct.includes('Generator') || ct.includes('Reactor') ||
        ct.includes('Battery') || ct.includes('Power')) return '\u26A1';
    if (ct.includes('Unit') || ct.includes('Factory') ||
        ct.includes('Assembler') || ct.includes('Reconstructor')) return '\uD83E\uDD16';
    if (ct.includes('Force') || ct.includes('Overdrive') ||
        ct.includes('Shield') || ct.includes('Mine')) return '\uD83D\uDEE1\uFE0F';
    if (ct.includes('Ability')) return '\u2728';
    if (ct.includes('Crafter') || ct.includes('Separator') ||
        ct.includes('Fracker') || ct.includes('Incinerator')) return '\uD83C\uDFED';
    if (ct.includes('Bridge') || ct.includes('MassDriver') || ct.includes('Launch')) return '\uD83D\uDCE1';
    if (ct.includes('Effect') || ct.includes('Weather')) return '\uD83C\uDF0A';
    if (ct === 'SectorPreset') return '\uD83C\uDF0D';
    if (ct === 'Planet') return '\uD83E\uDE90';
    if (ct === 'TeamEntry') return '\uD83C\uDFC6';
    return '\uD83D\uDCC4';
};

class AssetCards extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            dialogOpen: false,
            dialogName: '',
            dialogType: null,
            dialogSearch: '',
            renamingId: null,
            renameValue: '',
            bundleDialog: false,
            bundleLang: 'zh_CN',
            javaDialog: false,
            javaName: ''
        };
        this.handleOpenDialog = this.handleOpenDialog.bind(this);
        this.handleCloseDialog = this.handleCloseDialog.bind(this);
        this.handleConfirmAdd = this.handleConfirmAdd.bind(this);
        this.handlePromptAddJava = this.handlePromptAddJava.bind(this);
        this.handleConfirmAddJava = this.handleConfirmAddJava.bind(this);
        this.handlePromptAddBundle = this.handlePromptAddBundle.bind(this);
        this.handleBundleLangChange = this.handleBundleLangChange.bind(this);
        this.handleJavaNameChange = this.handleJavaNameChange.bind(this);
        this.handleJavaKeyDown = this.handleJavaKeyDown.bind(this);
        this.handleCloseJavaDialog = this.handleCloseJavaDialog.bind(this);
        this.handleCloseBundleDialog = this.handleCloseBundleDialog.bind(this);
        this.handleAddBundleConfirm = this.handleAddBundleConfirm.bind(this);
        this.handleDialogNameChange = this.handleDialogNameChange.bind(this);
        this.handleDialogSearchChange = this.handleDialogSearchChange.bind(this);
        this.handleCloseAddDialog = this.handleCloseAddDialog.bind(this);
        this.handleRenameChange = this.handleRenameChange.bind(this);
        this.handleRenameBlur = this.handleRenameBlur.bind(this);
        this.handleRenameKeyDown = this.handleRenameKeyDown.bind(this);
        this.handleRenameClick = this.handleRenameClick.bind(this);
        this.handleTypeClick = this.handleTypeClick.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleSelectCard = this.handleSelectCard.bind(this);
        this.handleRename = this.handleRename.bind(this);
        this.handleDuplicate = this.handleDuplicate.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    // ── add dialog ──
    handleOpenDialog () {
        this.setState({dialogOpen: true, dialogName: '', dialogType: null, dialogSearch: ''});
    }

    handleCloseDialog () {
        this.setState({dialogOpen: false});
    }

    handleConfirmAdd () {
        const {dialogName, dialogType} = this.state;
        if (!dialogName.trim() || !dialogType) return;
        this.props.onAddContent(dialogName.trim(), dialogType);
        this.handleCloseDialog();
    }

    handlePromptAddJava () {
        this.setState({javaDialog: true, javaName: ''});
    }

    handleConfirmAddJava () {
        const {javaName} = this.state;
        if (javaName.trim()) {
            this.props.onAddJavaFile(javaName.trim());
        }
        this.setState({javaDialog: false});
    }

    handleCloseJavaDialog () {
        this.setState({javaDialog: false});
    }

    handleJavaNameChange (e) {
        this.setState({javaName: e.target.value});
    }

    handleJavaKeyDown (e) {
        if (e.key === 'Enter') this.handleConfirmAddJava();
        if (e.key === 'Escape') this.setState({javaDialog: false});
    }

    handlePromptAddBundle () {
        this.setState({bundleDialog: true, bundleLang: 'zh_CN'});
    }

    handleBundleLangChange (e) {
        this.setState({bundleLang: e.target.value});
    }

    handleCloseBundleDialog () {
        this.setState({bundleDialog: null});
    }

    handleAddBundleConfirm () {
        if (this.state.bundleLang && this.props.onAddBundle) {
            this.props.onAddBundle(this.state.bundleLang);
        }
        this.setState({bundleDialog: null});
    }

    handleDialogNameChange (e) {
        this.setState({dialogName: e.target.value});
    }

    handleDialogSearchChange (e) {
        this.setState({dialogSearch: e.target.value});
    }

    handleCloseAddDialog () {
        this.handleCloseDialog();
    }

    handleRenameChange (e) {
        this.setState({renameValue: e.target.value});
    }

    handleRenameBlur () {
        this.confirmRename();
    }

    handleRenameKeyDown (e) {
        if (e.key === 'Enter') this.confirmRename();
        if (e.key === 'Escape') this.setState({renamingId: null, renameValue: ''});
    }

    handleRenameClick (e) {
        e.stopPropagation();
    }

    handleTypeClick (e) {
        this.setState({dialogType: e.currentTarget.dataset.type});
    }

    handleContextMenu (e) {
        e.preventDefault();
    }

    handleSelectCard (e) {
        this.props.onSelect(e.currentTarget.dataset.id);
    }

    handleRename (e, data) {
        this.startRename(data.id, data.name);
    }

    handleDuplicate (e, data) {
        this.props.onDuplicateAsset(data.id);
    }

    handleDelete (e, data) {
        this.props.onDeleteAsset(data.id);
    }

    // ── rename (inline) ──
    startRename (id, name) {
        this.setState({renamingId: id, renameValue: name});
    }

    confirmRename () {
        const {renamingId, renameValue} = this.state;
        if (renamingId && renameValue.trim()) {
            this.props.onRenameAsset(renamingId, renameValue.trim());
        }
        this.setState({renamingId: null, renameValue: ''});
    }

    // ── picker ──
    renderPicker () {
        const {dialogType, dialogSearch} = this.state;
        const curatedTypes = new Set(getCuratedTypes());
        const filtered = CATEGORIES.map(cat => ({
            ...cat,
            types: cat.types.filter(t => {
                if (!this.props.advancedMode && !curatedTypes.has(t)) return false;
                const zh = getZhLabel(t);
                if (!zh) return false;
                if (IGNORED_TYPES.has(t)) return false;
                if (!dialogSearch) return true;
                const q = dialogSearch.toLowerCase();
                return t.toLowerCase().includes(q) || zh.toLowerCase().includes(q);
            })
        })).filter(cat => cat.types.length > 0);

        return (
            <div className={styles.dialogPicker}>
                {filtered.map(cat => (
                    <div
                        className={styles.pickerCategory}
                        key={cat.label}
                    >
                        <div className={styles.pickerCatLabel}>{cat.label}</div>
                        {cat.types.map(t => {
                            const active = dialogType === t;
                            return (
                                <span
                                    key={t}
                                    className={`${styles.pickerItem} ${active ? styles.pickerItemActive : ''}`}
                                    data-type={t}
                                    onClick={this.handleTypeClick}
                                >
                                    {getZhLabel(t)}
                                </span>
                            );
                        })}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className={styles.emptyHint}>{'无匹配类型'}</div>
                )}
            </div>
        );
    }

    render () {
        const {assets, selectedId} = this.props;
        const {renamingId, renameValue} = this.state;

        return (
            <div
                className={styles.cardsPane}
                onContextMenu={this.handleContextMenu}
            >
                <div className={styles.cardsHeader}>
                    <span className={styles.cardsTitle}>{'资源'}</span>
                </div>
                <div className={styles.cardsBody}>
                    {assets.length === 0 && (
                        <div className={styles.emptyHint}>
                            {'暂无资源，点击下方按钮添加'}
                        </div>
                    )}
                    {assets.map(asset => {
                        const active = selectedId === asset.id;
                        const isRenaming = renamingId === asset.id;
                        const isBuiltin = BUILTIN_IDS.has(asset.id);
                        const cardContent = (
                            <React.Fragment>
                                <div className={styles.cardIconArea}>
                                    <span className={styles.cardIcon}>{iconForAsset(asset)}</span>
                                    <span
                                        className={`${styles.cardBadge} ${
                                            asset.kind === 'content' ? styles.badgeJson :
                                                asset.kind === 'modconfig' ? styles.badgeConfig :
                                                    asset.kind === 'bundle' ? styles.badgeConfig :
                                                        styles.badgeJava
                                        }`}
                                    >
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
                                            onChange={this.handleRenameChange}
                                            onBlur={this.handleRenameBlur}
                                            onKeyDown={this.handleRenameKeyDown}
                                            autoFocus
                                            onClick={this.handleRenameClick}
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
                            </React.Fragment>
                        );
                        if (isBuiltin) {
                            return (
                                <div
                                    key={asset.id}
                                    className={`${styles.card} ${active ? styles.cardActive : ''}`}
                                    data-id={asset.id}
                                    onClick={this.handleSelectCard}
                                >
                                    {cardContent}
                                </div>
                            );
                        }
                        return (
                            <ContextMenuTrigger
                                key={asset.id}
                                id={`asset-ctx-${asset.id}`}
                                attributes={{
                                    'className': `${styles.card} ${active ? styles.cardActive : ''}`,
                                    'data-id': asset.id,
                                    'onClick': this.handleSelectCard
                                }}
                            >
                                {cardContent}
                            </ContextMenuTrigger>
                        );
                    })}
                </div>
                <div className={styles.cardsFooter}>
                    <button
                        className={styles.addBtn}
                        onClick={this.handleOpenDialog}
                    >
                        {'+ 添加内容'}
                    </button>
                    <button
                        className={styles.addBtn}
                        onClick={this.handlePromptAddJava}
                    >
                        {'+ 添加 Java'}
                    </button>
                    <button
                        className={styles.addBtn}
                        onClick={this.handlePromptAddBundle}
                    >
                        {'+ 本地化'}
                    </button>
                </div>

                {/* context menus (outside flex container) */}
                {assets.map(asset => {
                    if (BUILTIN_IDS.has(asset.id)) return null;
                    return (
                        <ContextMenu
                            key={`ctx-${asset.id}`}
                            id={`asset-ctx-${asset.id}`}
                            data={{id: asset.id, name: asset.name}}
                        >
                            <MenuItem onClick={this.handleRename}>
                                {'重命名'}
                            </MenuItem>
                            <MenuItem onClick={this.handleDuplicate}>
                                {'复制'}
                            </MenuItem>
                            <DangerousMenuItem onClick={this.handleDelete}>
                                {'删除'}
                            </DangerousMenuItem>
                        </ContextMenu>
                    );
                })}

                {/* add java dialog */}
                {this.state.javaDialog && (
                    <Modal
                        contentLabel="添加 Java 文件"
                        onRequestClose={this.handleCloseJavaDialog}
                        className={styles.bundleDialog}
                    >
                        <div className={styles.dialogBody}>
                            <div className={styles.dialogNameRow}>
                                <span className={styles.nameLabel}>{'类名'}</span>
                                <input
                                    className={styles.nameInput}
                                    value={this.state.javaName}
                                    onChange={this.handleJavaNameChange}
                                    onKeyDown={this.handleJavaKeyDown}
                                    placeholder="如 MyBlock"
                                    autoFocus
                                />
                            </div>
                            <div className={styles.dialogActions}>
                                <button
                                    className={styles.dialogBtn}
                                    onClick={this.handleCloseJavaDialog}
                                >
                                    {'取消'}
                                </button>
                                <button
                                    className={styles.dialogBtnPrimary}
                                    disabled={!this.state.javaName.trim()}
                                    onClick={this.handleConfirmAddJava}
                                >
                                    {'添加'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* add bundle dialog */}
                {this.state.bundleDialog && (
                    <Modal
                        contentLabel="添加本地化文件"
                        onRequestClose={this.handleCloseBundleDialog}
                        className={styles.bundleDialog}
                    >
                        <div className={styles.dialogBody}>
                            <div className={styles.dialogNameRow}>
                                <span className={styles.nameLabel}>{'语言'}</span>
                                <select
                                    className={styles.nameInput}
                                    value={this.state.bundleLang}
                                    onChange={this.handleBundleLangChange}
                                >
                                    <option value="en">{'English'}</option>
                                    <option value="zh_CN">{'简体中文'}</option>
                                    <option value="zh_TW">{'繁體中文'}</option>
                                    <option value="ja">{'日本語'}</option>
                                    <option value="ko">{'한국어'}</option>
                                    <option value="ru">{'Русский'}</option>
                                    <option value="de">{'Deutsch'}</option>
                                    <option value="fr">{'Français'}</option>
                                    <option value="es">{'Español'}</option>
                                    <option value="pt_BR">{'Português (Brasil)'}</option>
                                    <option value="th">{'ไทย'}</option>
                                    <option value="vi">{'Tiếng Việt'}</option>
                                    <option value="id">{'Bahasa Indonesia'}</option>
                                    <option value="it">{'Italiano'}</option>
                                    <option value="pl">{'Polski'}</option>
                                    <option value="uk">{'Українська'}</option>
                                </select>
                            </div>
                            <div className={styles.dialogActions}>
                                <button
                                    className={styles.dialogBtn}
                                    onClick={this.handleCloseBundleDialog}
                                >
                                    {'取消'}
                                </button>
                                <button
                                    className={`${styles.dialogBtn} ${styles.dialogBtnPrimary}`}
                                    onClick={this.handleAddBundleConfirm}
                                >
                                    {'添加'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* add dialog */}
                {this.state.dialogOpen && (
                    <Modal
                        contentLabel="添加新内容"
                        onRequestClose={this.handleCloseAddDialog}
                        className={styles.addDialog}
                    >
                        <div className={styles.dialogBody}>
                            <div className={styles.dialogNameRow}>
                                <span className={styles.nameLabel}>{'名称'}</span>
                                <input
                                    className={styles.nameInput}
                                    value={this.state.dialogName}
                                    onChange={this.handleDialogNameChange}
                                    placeholder="英文标识符，如 my-wall"
                                    autoFocus
                                />
                            </div>
                            <div className={styles.dialogNameRow}>
                                <span className={styles.nameLabel}>{'搜索'}</span>
                                <input
                                    className={styles.nameInput}
                                    value={this.state.dialogSearch}
                                    onChange={this.handleDialogSearchChange}
                                    placeholder="输入中文或英文过滤"
                                />
                            </div>
                            {this.renderPicker()}
                            <div className={styles.dialogActions}>
                                <button
                                    className={styles.dialogBtn}
                                    onClick={this.handleCloseAddDialog}
                                >
                                    {'取消'}
                                </button>
                                <button
                                    className={styles.dialogBtnPrimary}
                                    disabled={!this.state.dialogName.trim() || !this.state.dialogType}
                                    onClick={this.handleConfirmAdd}
                                >
                                    {'确认添加'}
                                </button>
                            </div>
                        </div>
                    </Modal>
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
    onAddBundle: PropTypes.func
};

export default AssetCards;
