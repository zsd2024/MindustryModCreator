import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {resolveFields, getFieldLabel, getFieldDoc, getZhLabel, getZhDoc} from '../../lib/mindustry/resolve-schema';
import {normalizeType} from '../../lib/mindustry/compound-types';
import {VANILLA_CONTENT} from '../../lib/mindustry/vanilla-content';
import styles from './mindustry-json-editor.css';

import SearchableSelect from './searchable-select.jsx';
import ReactMarkdown from 'react-markdown';
import {Undo, Redo, SettingsBackupRestore, EditNote, SearchOff} from '@nine-thirty-five/material-symbols-react/outlined';
import {Icon} from '../../lib/icon-map';

const renderMarkdown = function (text) {
    if (!text) return null;
    return <ReactMarkdown>{text}</ReactMarkdown>;
};

const STACK_REQUIREMENT = {
    type: 'object',
    fields: [
        {name: 'item', type: 'Item', localizedName: '物品'},
        {name: 'amount', type: 'int', defaultValue: 1, localizedName: '数量'}
    ]
};

const OBJECTIVE_TYPE_DEFS = [
    {value: 'Produce', cn: '生产', fields: [{name: 'content', type: 'string', localizedName: '内容'}]},
    {value: 'Research', cn: '研究', fields: [{name: 'content', type: 'string', localizedName: '内容'}]},
    {value: 'SectorComplete', cn: '通关关卡', fields: [{name: 'preset', type: 'string', localizedName: '关卡'}]},
    {value: 'OnSector', cn: '在某关卡', fields: [{name: 'preset', type: 'string', localizedName: '关卡'}]},
    {value: 'OnPlanet', cn: '在某行星', fields: [{name: 'planet', type: 'string', localizedName: '行星'}]},
];

const OBJECTIVE_CONTENT_TYPES = {
    Produce: ['Item', 'UnitType', 'Block'],
    Research: ['Block'],
    SectorComplete: ['SectorPreset'],
    OnSector: ['SectorPreset'],
    OnPlanet: ['Planet']
};

const CONTENT_TYPE_LABELS = {
    Item: '物品', Liquid: '液体', Block: '方块', UnitType: '单位',
    BulletType: '子弹', StatusEffect: '状态效果', Effect: '特效',
    Weather: '天气', Planet: '行星', SectorPreset: '关卡',
    Sound: '音效', TextureRegion: '纹理'
};

const RESEARCH_CONTENT_TYPES = ['Block', 'Item', 'Liquid', 'UnitType', 'SectorPreset', 'Planet'];
const ENHANCED_RESEARCH = {
    parent: {localizedName: '父节点'},
    objectives: {
        type: 'array',
        items: {
            type: 'object',
            fields: [
                {name: 'type', type: 'string'},
                {name: 'content', type: 'string'},
                {name: 'preset', type: 'string'},
                {name: 'planet', type: 'string'}
            ]
        },
        localizedName: '目标'
    },
    requirements: {type: 'array', items: STACK_REQUIREMENT, localizedName: '需求'},
    root: {type: 'boolean', localizedName: '根节点'},
    requiresUnlock: {type: 'boolean', localizedName: '需要前置解锁'}
};

const S = {
    itemCount: '项',
    arrayEmpty: '暂未添加',
    arrayRemoveTitle: '删除此项',
    arrayAdd: '+ 添加',
    noMatch: '无匹配',
    search: '搜索...',
    emptyIcon: 'edit_note',
    emptyText: '在左侧资产区选择一个内容来编辑',
    notFoundIcon: 'search_off',
    notFoundPrefix: '未找到 ',
    notFoundSuffix: ' 的配置信息',
    itemIndexPrefix: '#',
    removeBtn: 'close',
    sizeLabel: 'x',
    defaultDisplay: '--'
};

const REFERENCE_TYPES = new Set([
    'Item', 'Liquid', 'Block', 'UnitType', 'BulletType',
    'StatusEffect', 'Effect', 'Weather', 'Planet', 'SectorPreset',
    'Sound', 'TextureRegion', 'Research'
]);

const ENUM_VALUES = {
    buildVisibility: [
        {value: 'hidden', cn: '隐藏'},
        {value: 'shown', cn: '显示'},
        {value: 'sandboxOnly', cn: '沙盒仅限'},
        {value: 'editorOnly', cn: '编辑器仅限'},
        {value: 'lightingOnly', cn: '光照仅限'}
    ],
    category: [
        {value: 'distribution', cn: '物品输送'},
        {value: 'crafting', cn: '制造'},
        {value: 'defense', cn: '防御'},
        {value: 'effect', cn: '效果'},
        {value: 'liquid', cn: '液体'},
        {value: 'logic', cn: '逻辑'},
        {value: 'power', cn: '电力'},
        {value: 'production', cn: '生产'},
        {value: 'turret', cn: '炮塔'},
        {value: 'units', cn: '单位'}
    ],
    Interp: [
        {value: 'linear', cn: '线性'},
        {value: 'slope', cn: '倾斜'},
        {value: 'reverse', cn: '反向'},
        {value: 'one', cn: '恒定1'},
        {value: 'zero', cn: '恒定0'},
        {value: 'fast', cn: '快入'},
        {value: 'slow', cn: '慢入'},
        {value: 'pow2', cn: '平方'},
        {value: 'pow2In', cn: '平方入'},
        {value: 'pow2Out', cn: '平方出'},
        {value: 'pow2InOut', cn: '平方出入'},
        {value: 'pow3', cn: '立方'},
        {value: 'pow3In', cn: '立方入'},
        {value: 'pow3Out', cn: '立方出'},
        {value: 'pow3InOut', cn: '立方出入'},
        {value: 'pow4', cn: '四次方'},
        {value: 'pow4In', cn: '四次方入'},
        {value: 'pow4Out', cn: '四次方出'},
        {value: 'pow4InOut', cn: '四次方出入'},
        {value: 'pow5', cn: '五次方'},
        {value: 'pow5In', cn: '五次方入'},
        {value: 'pow5Out', cn: '五次方出'},
        {value: 'pow5InOut', cn: '五次方出入'},
        {value: 'sine', cn: '正弦'},
        {value: 'sineIn', cn: '正弦入'},
        {value: 'sineOut', cn: '正弦出'},
        {value: 'sineInOut', cn: '正弦出入'},
        {value: 'circle', cn: '圆形'},
        {value: 'circleIn', cn: '圆形入'},
        {value: 'circleOut', cn: '圆形出'},
        {value: 'circleInOut', cn: '圆形出入'},
        {value: 'swing', cn: '摇摆'},
        {value: 'swingIn', cn: '摇摆入'},
        {value: 'swingOut', cn: '摇摆出'},
        {value: 'swingInOut', cn: '摇摆出入'},
        {value: 'elastic', cn: '弹性'},
        {value: 'elasticIn', cn: '弹性入'},
        {value: 'elasticOut', cn: '弹性出'},
        {value: 'elasticInOut', cn: '弹性出入'},
        {value: 'bounce', cn: '弹跳'},
        {value: 'bounceIn', cn: '弹跳入'},
        {value: 'bounceOut', cn: '弹跳出'},
        {value: 'bounceInOut', cn: '弹跳出入'},
        {value: 'fade', cn: '渐隐'},
        {value: 'fadeIn', cn: '淡入'},
        {value: 'fadeOut', cn: '淡出'},
        {value: 'fadeInOut', cn: '淡入淡出'},
        {value: 'accel', cn: '加速'},
        {value: 'decel', cn: '减速'},
        {value: 'acceldecel', cn: '加减速'},
        {value: 'smooth', cn: '平滑'},
        {value: 'smooth2', cn: '平滑2'},
        {value: 'dense', cn: '密集'},
        {value: 'expIn', cn: '指数入'},
        {value: 'expOut', cn: '指数出'},
        {value: 'expInOut', cn: '指数出入'}
    ],
    Blending: [
        {value: 'normal', cn: '正常'},
        {value: 'additive', cn: '叠加'},
        {value: 'alpha', cn: 'Alpha'},
        {value: 'disabled', cn: '禁用'}
    ],
    CacheLayer: [
        {value: 'normal', cn: '正常'},
        {value: 'walls', cn: '墙壁'},
        {value: 'water', cn: '水'},
        {value: 'tar', cn: '焦油'},
        {value: 'molten', cn: '熔融'}
    ],
    BlockGroup: [
        {value: 'none', cn: '无'},
        {value: 'walls', cn: '墙壁'},
        {value: 'projectors', cn: '投影器'},
        {value: 'turrets', cn: '炮塔'},
        {value: 'transportation', cn: '运输'},
        {value: 'payloads', cn: '载荷'},
        {value: 'liquids', cn: '液体'},
        {value: 'power', cn: '电力'},
        {value: 'drills', cn: '钻头'},
        {value: 'logic', cn: '逻辑'},
        {value: 'cells', cn: '细胞'}
    ],
    BlockFlag: [
        {value: 'core', cn: '核心'},
        {value: 'reactor', cn: '反应堆'},
        {value: 'generator', cn: '发电机'},
        {value: 'drill', cn: '钻头'},
        {value: 'factory', cn: '工厂'},
        {value: 'battery', cn: '电池'},
        {value: 'turret', cn: '炮塔'},
        {value: 'repair', cn: '维修'},
        {value: 'launchPad', cn: '发射台'},
        {value: 'command', cn: '指挥'},
        {value: 'unitFactory', cn: '单位工厂'},
        {value: 'overdriveProjector', cn: '超速投影'},
        {value: 'forceProjector', cn: '力墙投影'},
        {value: 'message', cn: '信息板'},
        {value: 'all', cn: '全部'}
    ],
    Attribute: [
        {value: 'water', cn: '水'},
        {value: 'heat', cn: '热量'},
        {value: 'oil', cn: '石油'},
        {value: 'sand', cn: '沙'},
        {value: 'spores', cn: '孢子'}
    ],
    Sortf: [
        {value: 'closest', cn: '最近'},
        {value: 'farthest', cn: '最远'},
        {value: 'health', cn: '生命值'},
        {value: 'maxHealth', cn: '最大生命值'},
        {value: 'shield', cn: '护盾'},
        {value: 'damage', cn: '伤害'},
        {value: 'armor', cn: '护甲'},
        {value: 'speed', cn: '速度'}
    ]
};

class MindustryJsonEditor extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            data: this.initData(props.contentType, props.initialData || {}),
            collapsedSections: this.initCollapsedSections(props.contentType),
            undoStack: [],
            redoStack: []
        };
        this._onChangeMap = new Map();
        this.editorFocused = false;
        this._undoTimer = null;
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleUndo = this.handleUndo.bind(this);
        this.handleRedo = this.handleRedo.bind(this);
        this.handleResetField = this.handleResetField.bind(this);
    }

    pushUndo () {
        this.setState(prev => {
            const stack = [...prev.undoStack, {...prev.data}];
            if (stack.length > 50) stack.shift();
            return {undoStack: stack, redoStack: []};
        });
    }

    handleKeyDown (e) {
        if (!this.editorFocused) return;
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            if (e.shiftKey) {
                e.preventDefault();
                this.handleRedo();
            } else {
                e.preventDefault();
                this.handleUndo();
            }
        }
    }

    handleFocus () {
        this.editorFocused = true;
    }

    handleBlur () {
        this.editorFocused = false;
    }

    handleUndo () {
        const {undoStack, data} = this.state;
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        this.setState(prevState => ({
            data: prev,
            undoStack: prevState.undoStack.slice(0, -1),
            redoStack: [...prevState.redoStack, {...data}]
        }), () => {
            this.props.onChange(this.state.data);
        });
    }

    handleRedo () {
        const {redoStack, data} = this.state;
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        this.setState(prevState => ({
            data: next,
            redoStack: prevState.redoStack.slice(0, -1),
            undoStack: [...prevState.undoStack, {...data}]
        }), () => {
            this.props.onChange(this.state.data);
        });
    }

    handleResetField (fieldName, field) {
        const defaultVal = this.parseDefault(field);
        this.handleChange(fieldName, defaultVal);
    }

    initCollapsedSections (contentType) {
        if (!contentType) return new Set();
        const fields = resolveFields(contentType, 'full');
        const sourceTypes = [...new Set(fields.map(f => f.sourceType).filter(Boolean))];
        const collapsed = new Set(sourceTypes);
        collapsed.delete(contentType);
        return collapsed;
    }

    initData (contentType, initial) {
        if (!contentType) return {};
        const fields = resolveFields(contentType, 'full');
        const data = {};
        for (const f of fields) {
            data[f.name] = this.parseDefault(f);
        }
        return {...data, ...initial};
    }

    parseDefault (field) {
        if (field.defaultValue === void 0 || field.defaultValue === '') {
            if (field.type === 'boolean') return false;
            if (field.type === 'int' || field.type === 'float') return 0;
            if (field.type === 'array') return [];
            return '';
        }
        if (field.type === 'boolean') return field.defaultValue === 'true';
        if (field.type === 'int') return parseInt(field.defaultValue, 10) || 0;
        if (field.type === 'float') return parseFloat(field.defaultValue) || 0;
        if (field.type === 'array') return [];
        return field.defaultValue;
    }

    handleChange (name, val) {
        if (this._undoTimer) {
            clearTimeout(this._undoTimer);
        } else {
            this.pushUndo();
        }
        this._undoTimer = setTimeout(() => {
            this._undoTimer = null;
        }, 0);

        this.setState(prev => ({data: {...prev.data, [name]: val}}), () => {
            if (this.props.onChange) this.props.onChange(this.state.data);
        });
    }

    handleCheckboxChange = e => {
        const cb = this._onChangeMap.get(e.currentTarget.dataset.ckey);
        if (cb) cb(e.target.checked);
    };

    handleColorChange = e => {
        const cb = this._onChangeMap.get(e.currentTarget.dataset.ckey);
        if (cb) cb(`${e.target.value.replace('#', '')}ff`);
    };

    handleTextChange = e => {
        const cb = this._onChangeMap.get(e.currentTarget.dataset.ckey);
        if (cb) cb(e.target.value);
    };

    handleNumberChange = e => {
        const cb = this._onChangeMap.get(e.currentTarget.dataset.ckey);
        if (!cb) return;
        const type = e.currentTarget.dataset.type;
        const v = type === 'int' ?
            parseInt(e.target.value, 10) || 0 :
            parseFloat(e.target.value) || 0;
        cb(v);
    };

    handleSizeClick = e => {
        const s = parseInt(e.currentTarget.dataset.size, 10);
        const cb = this._onChangeMap.get(e.currentTarget.dataset.ckey);
        if (cb) cb(s);
    };

    handleSizeCustom = e => {
        const v = parseInt(e.target.value, 10);
        if (v > 0) {
            const cb = this._onChangeMap.get(e.currentTarget.dataset.ckey);
            if (cb) cb(v);
        }
    };

    handleArrayRemove = e => {
        const fieldName = e.currentTarget.dataset.fieldname;
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        const ckey = e.currentTarget.dataset.ckey;
        const getPath = e.currentTarget.dataset.getpath;
        const items = Array.isArray(this.getNestedData(getPath)) ? this.getNestedData(getPath) : [];
        const onChange = this._onChangeMap.get(ckey);
        if (onChange) {
            onChange(fieldName, items.filter((_, i) => i !== idx));
        } else {
            this.handleChange(fieldName, items.filter((_, i) => i !== idx));
        }
    };

    handleArrayAdd = e => {
        const fieldName = e.currentTarget.dataset.fieldname;
        const ckey = e.currentTarget.dataset.ckey;
        const getPath = e.currentTarget.dataset.getpath;
        const itemDefStr = e.currentTarget.dataset.itemdef;
        const itemDef = itemDefStr ? JSON.parse(itemDefStr) : null;
        const items = Array.isArray(this.getNestedData(getPath)) ? this.getNestedData(getPath) : [];
        const normalizedItemDef = itemDef ? normalizeType(itemDef) : null;
        const subFields = normalizedItemDef && normalizedItemDef.fields;
        const onChange = this._onChangeMap.get(ckey);
        const doChange = onChange || ((name, val) => this.handleChange(name, val));
        if (subFields && subFields.length > 0) {
            const defaults = {};
            for (const sf of subFields) {
                defaults[sf.name] = this.parseDefault(sf);
            }
            doChange(fieldName, [...items, defaults]);
        } else {
            const defaultVal = itemDef ? this.parseDefault(normalizedItemDef) : '';
            doChange(fieldName, [...items, defaultVal]);
        }
    };

    handleSectionToggle = e => {
        const typeName = e.currentTarget.dataset.typename;
        this.setState(prev => {
            const collapsed = new Set(prev.collapsedSections);
            if (collapsed.has(typeName)) {
                collapsed.delete(typeName);
            } else {
                collapsed.add(typeName);
            }
            return {collapsedSections: collapsed};
        });
    };

    getAllContentOptions () {
        const {assets, contentLocalizedNames} = this.props;
        const seen = new Set();
        const result = [];

        for (const [type, items] of Object.entries(VANILLA_CONTENT)) {
            for (const item of items) {
                if (!seen.has(item.name)) {
                    seen.add(item.name);
                    result.push({...item, type, source: 'vanilla'});
                }
            }
        }

        if (assets) {
            for (const asset of assets) {
                if (asset.kind !== 'content') continue;
                if (!seen.has(asset.name)) {
                    seen.add(asset.name);
                    result.push({
                        name: asset.name,
                        cn: (contentLocalizedNames && contentLocalizedNames[asset.name]) || asset.name,
                        type: asset.contentType,
                        source: 'mod'
                    });
                }
            }
        }

        return result;
    }

    renderSizeSelector (value, ckey) {
        const sizes = [1, 2, 3, 4, 5];
        return (
            <div className={styles.sizeWrap}>
                <div className={styles.sizeGrid}>
                    {sizes.map(s => (
                        <button
                            key={s}
                            className={`${styles.sizeBtn} ${value === s ? styles.sizeBtnActive : ''}`}
                            data-size={s}
                            data-ckey={ckey}
                            onClick={this.handleSizeClick}
                        >
                            {s}{S.sizeLabel}{s}
                        </button>
                    ))}
                </div>
                <div className={styles.sizeCustom}>
                    <input
                        type="number"
                        min="1"
                        value={value}
                        data-ckey={ckey}
                        onChange={this.handleSizeCustom}
                        className={styles.numInput}
                    />
                    <span className={styles.sizeSuffix}>{S.sizeLabel}{value}</span>
                </div>
            </div>
        );
    }

    renderControlInline (field, value, onChange, contextKey) {
        const ckey = contextKey || field.name;
        this._onChangeMap.set(ckey, onChange);

        if (field.type === 'boolean') {
            return (
                <label className={styles.toggleSwitch}>
                    <input
                        type="checkbox"
                        checked={!!value}
                        data-ckey={ckey}
                        onChange={this.handleCheckboxChange}
                    />
                    <span className={styles.toggleSlider} />
                </label>
            );
        }

        if (field.type === 'Color') {
            const hex = String(value || '000000ff');
            return (
                <div className={styles.colorGroup}>
                    <span
                        className={styles.colorSwatch}
                        style={{backgroundColor: `#${hex.slice(0, 6)}`}}
                    />
                    <input
                        type="color"
                        value={`#${hex.replace('#', '').slice(0, 6)}`}
                        data-ckey={ckey}
                        onChange={this.handleColorChange}
                        className={styles.colorPicker}
                    />
                </div>
            );
        }

        const rawOptions = field.options || ENUM_VALUES[field.name] || ENUM_VALUES[field.type];
        if (rawOptions) {
            const enumOptions = rawOptions.map(o => (
                typeof o === 'string' ? {value: o, cn: o} : {...o, cn: o.cn || o.value}
            ));
            return <SearchableSelect options={enumOptions} value={value} onChange={onChange} ddKey={ckey} />;
        }

        if (field.name === 'forceTeam') {
            const M64 = 0xFFFFFFFFFFFFFFFFn;
            const MUL1 = 0xff51afd7ed558ccdn, MUL2 = 0xc4ceb9fe1a85ec53n;
            const mh3 = (xv => {
                let x = BigInt(xv) & M64;
                x ^= (x >> 33n); x &= M64;
                x = (x * MUL1) & M64;
                x ^= (x >> 33n); x &= M64;
                x = (x * MUL2) & M64;
                x ^= (x >> 33n);
                return x & M64;
            });
            const teamOpts = [{value: '-1', cn: '默认', color: '#888888'}];
            const names = ['灰(Derelict)','黄(Sharded)','红(Crux)','紫(Malis)','绿(Green)','蓝(Blue)','Neoplastic'];
            const fixedColors = ['#4d4e58','#ffd37f','#f25555','#a27ce5','#54d67d','#6c87fd','#e05438'];

            let seed0 = mh3(8), seed1 = mh3(seed0);
            const nf = () => {
                let s1 = seed0; const s0 = seed1;
                seed0 = s0;
                s1 = (s1 ^ (s1 << 23n)) & M64;
                const ns1 = (s1 ^ s0 ^ (s1 >> 17n) ^ (s0 >> 26n)) & M64;
                seed1 = ns1;
                return Number((((ns1 + s0) & M64) >> 40n) & 0xFFFFFFn) / (1 << 24);
            };
            for (let i = 0; i < 3; i++) nf();

            for (let i = 0; i < 256; i++) {
                if (i < fixedColors.length) {
                    teamOpts.push({value: String(i), cn: names[i], color: fixedColors[i]});
                } else {
                    const h = 360 * nf();
                    const S = 40 + 60 * nf();
                    const V = 60 + 40 * nf();
                    const C = S / 100 * V / 100;
                    const X = C * (1 - Math.abs((h / 60) % 2 - 1));
                    const m = V / 100 - C;
                    let r, g, b;
                    if (h < 60) [r,g,b] = [C,X,0];
                    else if (h < 120) [r,g,b] = [X,C,0];
                    else if (h < 180) [r,g,b] = [0,C,X];
                    else if (h < 240) [r,g,b] = [0,X,C];
                    else if (h < 300) [r,g,b] = [X,0,C];
                    else [r,g,b] = [C,0,X];
                    const rr = Math.round((r + m) * 255);
                    const gg = Math.round((g + m) * 255);
                    const bb = Math.round((b + m) * 255);
                    const hex = '#' + [rr,gg,bb].map(c => c.toString(16).padStart(2,'0')).join('');
                    teamOpts.push({value: String(i), cn: String(i), color: hex});
                }
            }
            const strValue = value == null ? '-1' : String(value);
            return <SearchableSelect options={teamOpts} value={strValue} onChange={val => onChange(parseInt(val, 10))} ddKey={ckey} />;
        }

        if (field.type === 'int' || field.type === 'float') {
            if (field.name === 'size') {
                return this.renderSizeSelector(value, ckey);
            }
            return (
                <input
                    type="number"
                    value={value}
                    data-type={field.type}
                    data-ckey={ckey}
                    onChange={this.handleNumberChange}
                    step={field.type === 'float' ? '0.1' : '1'}
                    className={styles.numInput}
                />
            );
        }

        if (REFERENCE_TYPES.has(field.type)) {
            const allContent = this.getAllContentOptions();
            const contentOptions = allContent.filter(o => o.type === field.type).map(item => ({value: item.name, cn: item.cn, type: item.type}));
            return <SearchableSelect options={contentOptions} value={value} onChange={onChange} ddKey={ckey} labelMap={CONTENT_TYPE_LABELS} />;
        }

        return (
            <input
                type="text"
                value={value}
                data-ckey={ckey}
                onChange={this.handleTextChange}
                onBlur={() => this.pushUndo()}
                className={styles.textInput}
            />
        );
    }

    getNestedData (path) {
        if (!path) return void 0;
        return path.split('.').reduce((obj, key) => obj && obj[key], this.state.data);
    }

    renderArrayField (field, value, path, onArrayChange) {
        const items = Array.isArray(value) ? value : [];
        const itemDef = field.items;
        const normalizedItemDef = itemDef ? normalizeType(itemDef) : null;
        const subFields = normalizedItemDef && normalizedItemDef.fields;
        const isObjectArray = subFields && subFields.length > 0;
        const prefix = path || field.name;
        const ckey = prefix;
        const dataPath = path || field.name;
        const handleArrayChange = onArrayChange || ((name, val) => this.handleChange(name, val));
        this._onChangeMap.set(ckey, handleArrayChange);

        return (
            <div className={styles.arrayField}>
                {items.length === 0 && (
                    <div className={styles.arrayEmpty}>{S.arrayEmpty}</div>
                )}
                {items.map((item, idx) => (
                    <div
                        className={styles.arrayItem}
                        key={idx}
                    >
                        <div className={styles.arrayItemHeader}>
                            <span className={styles.arrayItemIndex}>{S.itemIndexPrefix}{idx + 1}</span>
                            <button
                                className={styles.arrayRemoveBtn}
                                data-fieldname={field.name}
                                data-getpath={dataPath}
                                data-ckey={ckey}
                                data-idx={idx}
                                onClick={this.handleArrayRemove}
                                title={S.arrayRemoveTitle}
                            ><Icon name={S.removeBtn} size={20} /></button>
                        </div>
                        <div className={styles.arrayItemBody}>
                            {isObjectArray ? ((subFields || []).map(sf => {
                                const sfValue = item[sf.name] === void 0 ?
                                    this.parseDefault(sf) :
                                    item[sf.name];
                                return (
                                    <div
                                        className={styles.nestedFieldRow}
                                        key={sf.name}
                                    >
                                        <span className={styles.nestedFieldLabel}>
                                            {getFieldLabel(field.sourceType, sf.name) || sf.localizedName || sf.name}
                                        </span>
                                        <div className={styles.nestedFieldControl}>
                                            {this.renderControlInline(
                                                sf,
                                                sfValue,
                                                val => {
                                                    const updated = {...item, [sf.name]: val};
                                                    handleArrayChange(field.name, items.map((it, i) =>
                                                        (i === idx ? updated : it)
                                                    ));
                                                },
                                                `${prefix}[${idx}].${sf.name}`
                                            )}
                                        </div>
                                    </div>
                                );
                            })) : (
                                <div className={styles.nestedFieldControl}>
                                    {this.renderControlInline(
                                        normalizedItemDef || {type: 'string'},
                                        item,
                                        val => {
                                            handleArrayChange(field.name, items.map((it, i) =>
                                                (i === idx ? val : it)
                                            ));
                                        },
                                        `${prefix}[${idx}]`
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <button
                    className={styles.arrayAddBtn}
                    data-fieldname={field.name}
                    data-getpath={dataPath}
                    data-ckey={ckey}
                    data-itemdef={itemDef ? JSON.stringify(itemDef) : ''}
                    onClick={this.handleArrayAdd}
                >
                    {S.arrayAdd}
                </button>
            </div>
        );
    }

    renderObjectivesArray (field, items, prefix, onArrayChange) {
        const objTypes = OBJECTIVE_TYPE_DEFS;
        const handleArrayChange = onArrayChange;
        const allContentOptions = this.getAllContentOptions();

        const updateItem = (idx, updated) => {
            handleArrayChange(field.name, items.map((it, i) => (i === idx ? updated : it)));
        };

        const removeItem = idx => {
            handleArrayChange(field.name, items.filter((_, i) => i !== idx));
        };

        const addItem = () => {
            const newItem = {type: OBJECTIVE_TYPE_DEFS[0].value};
            handleArrayChange(field.name, [...items, newItem]);
        };

        const getContentOptions = type => {
            const cats = OBJECTIVE_CONTENT_TYPES[type] || [];
            return allContentOptions.filter(o => cats.includes(o.type)).map(item => ({value: item.name, cn: item.cn, type: item.type}));
        };

        return (
            <div className={styles.arrayField}>
                {items.length === 0 && (
                    <div className={styles.arrayEmpty}>{S.arrayEmpty}</div>
                )}
                {items.map((item, idx) => {
                    const isString = typeof item === 'string';
                    const currentType = isString ? 'Produce' : (item.type || 'Produce');
                    const typeDef = objTypes.find(t => t.value === currentType) || objTypes[0];
                    return (
                        <div className={styles.arrayItem} key={idx}>
                            <div className={styles.arrayItemHeader}>
                                <span className={styles.arrayItemIndex}>
                                    {S.itemIndexPrefix}{idx + 1}
                                </span>
                                <button
                                    className={styles.arrayRemoveBtn}
                                    onClick={() => removeItem(idx)}
                                    title={S.arrayRemoveTitle}
                                >
                                    <Icon name={S.removeBtn} size={20} />
                                </button>
                            </div>
                            <div className={styles.arrayItemBody}>
                                {isString ? (
                                    <div className={styles.objectiveFieldRow}>
                                        <SearchableSelect
                                            options={getContentOptions('Produce')}
                                            value={item}
                                            onChange={newVal => updateItem(idx, newVal)}
                                            ddKey={`obj-content-${idx}`}
                                            labelMap={CONTENT_TYPE_LABELS}
                                        />
                                        <button
                                            className={styles.objectiveConvertBtn}
                                            onClick={() => updateItem(idx, {type: 'Produce', content: item})}
                                            title="转换为对象格式"
                                        >
                                            →
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.objectiveItemGrid}>
                                        <div className={styles.objectiveFieldRow}>
                                            <span className={styles.objectiveFieldLabel}>类型</span>
                                            <SearchableSelect
                                                options={objTypes.map(t => ({value: t.value, cn: t.cn}))}
                                                value={currentType}
                                                onChange={newType => updateItem(idx, {...item, type: newType})}
                                                ddKey={`obj-type-${idx}`}
                                            />
                                        </div>
                                        {typeDef.fields.map(fd => (
                                            <div className={styles.objectiveFieldRow} key={fd.name}>
                                                <span className={styles.objectiveFieldLabel}>
                                                    {fd.localizedName || fd.name}
                                                </span>
                                                <SearchableSelect
                                                    options={getContentOptions(currentType)}
                                                    value={item[fd.name] || ''}
                                                    onChange={newVal => updateItem(idx, {...item, [fd.name]: newVal})}
                                                    ddKey={`obj-${fd.name}-${idx}`}
                                                    labelMap={CONTENT_TYPE_LABELS}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <button className={styles.arrayAddBtn} onClick={addItem}>
                    {S.arrayAdd}
                </button>
            </div>
        );
    }

    renderSubFieldControl (enhanced, subValue, onChange, subCkey, parentFieldName) {
        const value = subValue === void 0 ? this.parseDefault(enhanced) : subValue;
        if (enhanced.name === 'objectives' && enhanced.type === 'array') {
            return this.renderObjectivesArray(enhanced, value, subCkey, (name, val) => {
                onChange(val);
            });
        }
        if (enhanced.type === 'array' && enhanced.items) {
            return this.renderArrayField(enhanced, value, subCkey, (name, val) => {
                onChange(val);
            });
        }
        if (enhanced.type === 'object' && enhanced.fields) {
            return this.renderObjectField(enhanced, value, subCkey);
        }
        if (enhanced.name === 'parent' && parentFieldName === 'research') {
            const allContent = this.getAllContentOptions();
            const options = allContent.map(item => ({value: item.name, cn: item.cn, type: item.type}));
            return (
                <SearchableSelect
                    options={options}
                    value={value}
                    onChange={onChange}
                    ddKey={subCkey}
                    labelMap={CONTENT_TYPE_LABELS}
                    visibleTypes={RESEARCH_CONTENT_TYPES}
                />
            );
        }
        return this.renderControlInline(enhanced, value, onChange, subCkey);
    }

    enhanceField (subF, parentFieldName) {
        if (parentFieldName === 'research' && ENHANCED_RESEARCH[subF.name]) {
            return {...subF, ...ENHANCED_RESEARCH[subF.name]};
        }
        return subF;
    }

    renderObjectField (field, value, path) {
        const currentValue = value || {};
        const subFields = field.fields || [];
        const prefix = path || field.name;
        return (
            <div className={styles.nestedObject}>
                {subFields.map(subF => {
                    const enhanced = this.enhanceField(subF, field.name);
                    const subValue = currentValue[enhanced.name] === void 0 ?
                        this.parseDefault(enhanced) :
                        currentValue[enhanced.name];
                    const subCkey = `${prefix}.${enhanced.name}`;
                    const onSubChange = newVal => {
                        const raw = this.state.data[field.name];
                        const base = (raw && typeof raw === 'object') ? raw : {};
                        const updated = {...base, [enhanced.name]: newVal};
                        this.handleChange(field.name, updated);
                    };
                    return (
                        <div
                            className={styles.nestedFieldRow}
                            key={enhanced.name}
                        >
                            <span className={styles.nestedFieldLabel}>
                                {getFieldLabel(field.sourceType, enhanced.name) ||
                                    enhanced.localizedName || enhanced.name}
                            </span>
                            <div className={styles.nestedFieldControl}>
                                 {this.renderSubFieldControl(enhanced, subValue, onSubChange, subCkey, field.name)}
                            </div>
                            <button
                                className={styles.resetBtn}
                                onClick={() => onSubChange(this.parseDefault(enhanced))}
                                title="恢复默认"
                            >
                                <SettingsBackupRestore size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    }

    renderField (rawField) {
        const field = normalizeType(rawField);
        const {data} = this.state;
        const value = data[field.name] === void 0 ? this.parseDefault(field) : data[field.name];
        const label = getFieldLabel(field.sourceType, field.name) || field.name;
        const hint = getFieldDoc(field.sourceType, field.name) || field.notes || '';
        const ckey = field.name;

        const renderControl = () => {
            if (field.name === 'research') {
                if (typeof value === 'string' && value !== '') {
                    const allContent = this.getAllContentOptions();
                    const options = allContent.map(item => ({value: item.name, cn: item.cn, type: item.type}));
                    return <SearchableSelect options={options} value={value} onChange={newVal => this.handleChange(field.name, newVal)} ddKey={ckey} labelMap={CONTENT_TYPE_LABELS} visibleTypes={RESEARCH_CONTENT_TYPES} />;
                }
                // Empty string or object: render research sub-fields
                const researchValue = typeof value === 'string' ? {} : value;
                return this.renderObjectField(field, researchValue, ckey);
            }

            if (field.type === 'object' && field.fields) {
                return this.renderObjectField(field, value, ckey);
            }

            if (field.type === 'array') {
                if (field.name === 'objectives') {
                    return this.renderObjectivesArray(field, value, ckey, (name, val) => {
                        this.handleChange(name, val);
                    });
                }
                return this.renderArrayField(field, value, ckey);
            }

            return this.renderControlInline(field, value, newVal => {
                this.handleChange(field.name, newVal);
            }, ckey);
        };

        return (
            <div
                className={styles.fieldRow}
                key={field.name}
            >
                <div className={styles.fieldHeader}>
                    <span className={styles.fieldLabel}>{label}</span>
                    {hint && <span className={styles.fieldHint}>{renderMarkdown(hint)}</span>}
                    {field.type === 'array' && Array.isArray(value) && (
                        <span className={styles.fieldCount}>{value.length}{S.itemCount}</span>
                    )}
                </div>
                <div className={styles.fieldControl}>
                    {renderControl()}
                </div>
                <button
                    className={styles.resetBtn}
                    onClick={() => this.handleResetField(field.name, field)}
                    title="恢复默认"
                >
                    <SettingsBackupRestore size={16} />
                </button>
            </div>
        );
    }

    renderSection (typeName, fields) {
        if (!fields || fields.length === 0) return null;
        const isCollapsed = this.state.collapsedSections.has(typeName);
        const zhLabel = getZhLabel(typeName) || typeName;
        const zhDoc = getZhDoc(typeName) || '';

        return (
            <div
                className={styles.section}
                key={typeName}
            >
                <div
                    className={styles.sectionHeader}
                    data-typename={typeName}
                    onClick={this.handleSectionToggle}
                >
                    <span className={styles.sectionArrow}>
                            <Icon name={isCollapsed ? 'chevron_right' : 'expand_more'} />
                        </span>
                    <span className={styles.sectionTitle}>{zhLabel}</span>
                    {zhDoc && <span className={styles.sectionDesc}>{renderMarkdown(zhDoc)}</span>}
                </div>
                {!isCollapsed && (
                    <div className={styles.sectionBody}>
                        {fields.map(f => this.renderField(f))}
                    </div>
                )}
            </div>
        );
    }

    render () {
        const {contentType} = this.props;
        if (!contentType) {
            return (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><EditNote size={48} /></div>
                    <p className={styles.emptyText}>{S.emptyText}</p>
                </div>
            );
        }

        const mode = this.props.advancedMode ? 'full' : 'curated';
        const fields = resolveFields(contentType, mode);
        if (fields.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><SearchOff size={48} /></div>
                    <p className={styles.emptyText}>{S.notFoundPrefix}{contentType}{S.notFoundSuffix}</p>
                </div>
            );
        }

        const sections = {};
        let researchField = null;
        for (const f of fields) {
            if (f.name === 'name') continue;
            if (f.name === 'research') {
                researchField = f;
                continue;
            }
            if (!sections[f.sourceType]) sections[f.sourceType] = [];
            sections[f.sourceType].push(f);
        }
        return (
            <div
                className={styles.editor}
                tabIndex={-1}
                onKeyDown={this.handleKeyDown}
                onFocus={this.handleFocus}
                onBlur={this.handleBlur}
            >
                <div className={styles.editorHeader}>
                    <span className={styles.editorTitle}>{getZhLabel(contentType) || contentType}</span>
                    <div className={styles.editorActions}>
                        <button
                            className={styles.undoBtn}
                            onClick={this.handleUndo}
                            disabled={this.state.undoStack.length === 0}
                            title="撤销 (Ctrl+Z)"
                        >
                            <Undo size={20} />
                        </button>
                        <button
                            className={styles.redoBtn}
                            onClick={this.handleRedo}
                            disabled={this.state.redoStack.length === 0}
                            title="重做 (Ctrl+Shift+Z)"
                        >
                            <Redo size={20} />
                        </button>
                    </div>
                </div>
                <div className={styles.sectionsContainer}>
                    {Object.keys(sections).map(st => this.renderSection(st, sections[st]))}
                    {researchField && this.renderSection('research', [researchField])}
                </div>
            </div>
        );
    }
}

MindustryJsonEditor.propTypes = {
    advancedMode: PropTypes.bool,
    onToggleAdvancedMode: PropTypes.func,
    contentType: PropTypes.string,
    initialData: PropTypes.object,
    onChange: PropTypes.func,
    assets: PropTypes.array,
    contentLocalizedNames: PropTypes.objectOf(PropTypes.string)
};

MindustryJsonEditor.defaultProps = {
    advancedMode: false,
    initialData: {},
    contentLocalizedNames: {}
};

export default MindustryJsonEditor;
