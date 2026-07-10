import PropTypes from 'prop-types';
import React from 'react';
import {resolveFields, getFieldLabel, getFieldDoc, getZhLabel, getZhDoc} from '../../lib/mindustry/resolve-schema';
import {normalizeType} from '../../lib/mindustry/compound-types';
import {VANILLA_CONTENT} from '../../lib/mindustry/vanilla-content';
import styles from './mindustry-json-editor.css';

import ReactMarkdown from 'react-markdown';

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

const ENHANCED_RESEARCH = {
    parent: {type: 'Block', localizedName: '父节点'},
    objectives: {type: 'array', items: {type: 'string'}, localizedName: '目标'},
    requirements: {type: 'array', items: STACK_REQUIREMENT, localizedName: '需求'}
};

const S = {
    itemCount: '项',
    arrayEmpty: '暂未添加',
    arrayRemoveTitle: '删除此项',
    arrayAdd: '+ 添加',
    noMatch: '无匹配',
    search: '搜索...',
    emptyIcon: '📝',
    emptyText: '在左侧资产区选择一个内容来编辑',
    notFoundIcon: '❓',
    notFoundPrefix: '未找到 ',
    notFoundSuffix: ' 的配置信息',
    advancedMode: '⚡ 高级模式',
    itemIndexPrefix: '#',
    removeBtn: '✕',
    sizeLabel: 'x',
    defaultDisplay: '--'
};

const REFERENCE_TYPES = new Set([
    'Item', 'Liquid', 'Block', 'UnitType', 'BulletType',
    'StatusEffect', 'Weather', 'Planet', 'SectorPreset',
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
            advancedMode: false,
            _dd: {}
        };
        this._onChangeMap = new Map();
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
        const data = {...initial};
        for (const f of fields) {
            if (data[f.name] === null || data[f.name] === void 0) {
                data[f.name] = this.parseDefault(f);
            }
        }
        return data;
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

    handleChange (fieldName, value) {
        this.setState(prev => {
            const data = {...prev.data, [fieldName]: value};
            if (this.props.onChange) this.props.onChange(data);
            return {data};
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

    handleEnumToggle = e => {
        const key = e.currentTarget.dataset.ddkey;
        this.setState(prev => ({
            _dd: {...prev._dd, [`${key}_open`]: !prev._dd?.[`${key}_open`]}
        }));
    };

    handleEnumSearch = e => {
        if (!e || !e.currentTarget || !e.target) return;
        const key = e.currentTarget.dataset.ddkey;
        this.setState(prev => ({
            _dd: {...prev._dd, [`${key}_search`]: e.target.value}
        }));
    };

    handleEnumBlur = e => {
        if (!e || !e.currentTarget) return;
        const key = e.currentTarget.dataset.ddkey;
        setTimeout(() => {
            this.setState(prev => ({
                _dd: {...prev._dd, [`${key}_open`]: false, [`${key}_search`]: ''}
            }));
        }, 150);
    };

    handleEnumSelect = e => {
        if (!e || !e.currentTarget) return;
        const key = e.currentTarget.dataset.ddkey;
        const optValue = e.currentTarget.dataset.optvalue;
        const cb = this._onChangeMap.get(e.currentTarget.dataset.ckey);
        if (cb) cb(optValue);
        this.setState(prev => ({
            _dd: {...prev._dd, [`${key}_open`]: false, [`${key}_search`]: ''}
        }));
    };

    handleContentToggle = e => {
        console.log('[DEBUG] handleContentToggle |', 'e:', !!e,
            'ddkey:', e?.currentTarget?.dataset?.ddkey);
        if (!e || !e.currentTarget) return;
        const key = e.currentTarget.dataset.ddkey;
        this.setState(prev => ({
            _dd: {...prev._dd, [`${key}_open`]: !prev._dd?.[`${key}_open`]}
        }));
    };

    handleContentSearch = e => {
        console.log('[DEBUG] handleContentSearch |', 'e:', !!e,
            'ct:', !!e?.currentTarget, 't:', !!e?.target,
            'ddkey:', e?.currentTarget?.dataset?.ddkey,
            'value:', e?.target?.value);
        if (!e || !e.currentTarget || !e.target) return;
        const key = e.currentTarget.dataset.ddkey;
        this.setState(prev => ({
            _dd: {...prev._dd, [`${key}_search`]: e.target.value}
        }));
    };

    handleContentBlur = e => {
        console.log('[DEBUG] handleContentBlur |', 'e:', !!e,
            'ddkey:', e?.currentTarget?.dataset?.ddkey);
        if (!e || !e.currentTarget) return;
        const key = e.currentTarget.dataset.ddkey;
        setTimeout(() => {
            this.setState(prev => ({
                _dd: {...prev._dd, [`${key}_open`]: false, [`${key}_search`]: ''}
            }));
        }, 150);
    };

    handleContentSelect = e => {
        console.log('[DEBUG] handleContentSelect |', 'e:', !!e,
            'ddkey:', e?.currentTarget?.dataset?.ddkey,
            'optname:', e?.currentTarget?.dataset?.optname,
            'ckey:', e?.currentTarget?.dataset?.ckey);
        if (!e || !e.currentTarget) return;
        const key = e.currentTarget.dataset.ddkey;
        const optName = e.currentTarget.dataset.optname;
        const cb = this._onChangeMap.get(e.currentTarget.dataset.ckey);
        if (cb) cb(optName);
        this.setState(prev => ({
            _dd: {...prev._dd, [`${key}_open`]: false, [`${key}_search`]: ''}
        }));
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

    handleAdvancedToggle = () => {
        this.setState(prev => ({advancedMode: !prev.advancedMode}));
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

        console.log('[DEBUG] getAllContentOptions returns',
            result.length, 'items, VANILLA keys:',
            Object.keys(VANILLA_CONTENT));
        return result;
    }

    renderSearchableSelect (options, value, ddKey, ckey) {
        const dd = this.state._dd || {};
        const open = dd[`${ddKey}_open`];
        const search = dd[`${ddKey}_search`] || '';
        const filtered = options.filter(o => !search ||
            o.value.includes(search) || o.cn.includes(search));
        const selected = options.find(o => o.value === value);

        return (
            <div className={styles.selectWrap}>
                <div
                    className={styles.selectDisplay}
                    data-ddkey={ddKey}
                    onClick={this.handleEnumToggle}
                >
                    <span className={styles.selectDisplayLabel}>
                        {selected ? selected.cn : (value || S.defaultDisplay)}
                    </span>
                    <span className={styles.selectArrow}>{open ? '▲' : '▼'}</span>
                </div>
                {open && (
                    <div className={styles.selectDropdown}>
                        <input
                            type="text"
                            value={search}
                            placeholder={S.search}
                            data-ddkey={ddKey}
                            autoFocus
                            onChange={this.handleEnumSearch}
                            onBlur={this.handleEnumBlur}
                            className={styles.selectSearch}
                        />
                        <div className={styles.selectOptions}>
                            {filtered.length === 0 && (
                                <div className={styles.selectEmpty}>{S.noMatch}</div>
                            )}
                            {filtered.map(opt => (
                                <div
                                    key={opt.value}
                                    className={
                                        `${styles.selectOption} ${value === opt.value ? styles.selectOptionActive : ''}`
                                    }
                                    data-ddkey={ddKey}
                                    data-ckey={ckey}
                                    data-optvalue={opt.value}
                                    onMouseDown={this.handleEnumSelect}
                                >
                                    <span className={styles.selectOptCn}>{opt.cn}</span>
                                    <span className={styles.selectOptId}>{opt.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    renderContentSelect (allOptions, value, fieldType, fieldName, ddKey, ckey) {
        const isResearch = fieldName === 'research';
        const options = isResearch ?
            allOptions :
            allOptions.filter(o => o.type === fieldType);
        const dd = this.state._dd || {};
        const open = dd[`${ddKey}_open`];
        const search = dd[`${ddKey}_search`] || '';
        const filtered = options.filter(o => !search ||
            o.name.includes(search) || o.cn.includes(search));
        const selected = options.find(o => o.name === value);
        console.log('[DEBUG] renderContentSelect |', 'ddKey:', ddKey,
            'open:', open, 'search:', search,
            'options:', options.length,
            'filtered:', filtered.length,
            'selected:', selected?.name);

        return (
            <div className={styles.selectWrap}>
                <div
                    className={styles.selectDisplay}
                    data-ddkey={ddKey}
                    onClick={this.handleContentToggle}
                >
                    <span className={styles.selectDisplayLabel}>{selected ? selected.cn : (value || '--')}</span>
                    <span className={styles.selectArrow}>{open ? '▲' : '▼'}</span>
                </div>
                {open && (
                    <div className={styles.selectDropdown}>
                        <input
                            type="text"
                            value={search}
                            placeholder={S.search}
                            data-ddkey={ddKey}
                            autoFocus
                            onChange={this.handleContentSearch}
                            onBlur={this.handleContentBlur}
                            className={styles.selectSearch}
                        />
                        <div className={styles.selectOptions}>
                            {filtered.length === 0 && (
                                <div className={styles.selectEmpty}>{S.noMatch}</div>
                            )}
                            {filtered.map(opt => (
                                <div
                                    key={opt.name}
                                    className={
                                        `${styles.selectOption} ${value === opt.name ? styles.selectOptionActive : ''}`
                                    }
                                    data-ddkey={ddKey}
                                    data-ckey={ckey}
                                    data-optname={opt.name}
                                    onMouseDown={this.handleContentSelect}
                                >
                                    <span className={styles.selectOptCn}>{opt.cn}</span>
                                    <span className={styles.selectOptId}>{opt.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
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
            return this.renderSearchableSelect(enumOptions, value, contextKey || field.name, ckey);
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

        if (field.name === 'research' || REFERENCE_TYPES.has(field.type)) {
            const allContent = this.getAllContentOptions();
            return this.renderContentSelect(allContent, value, field.type, field.name, contextKey || field.name, ckey);
        }

        return (
            <input
                type="text"
                value={value}
                data-ckey={ckey}
                onChange={this.handleTextChange}
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
                            >{S.removeBtn}</button>
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

    renderSubFieldControl (enhanced, subValue, onChange, subCkey) {
        const value = subValue === void 0 ? this.parseDefault(enhanced) : subValue;
        if (enhanced.type === 'array' && enhanced.items) {
            return this.renderArrayField(enhanced, value, subCkey, (name, val) => {
                onChange(val);
            });
        }
        if (enhanced.type === 'object' && enhanced.fields) {
            return this.renderObjectField(enhanced, value, subCkey);
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
                        const fresh = this.state.data[field.name] || {};
                        const updated = {...fresh, [enhanced.name]: newVal};
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
                                {this.renderSubFieldControl(enhanced, subValue, onSubChange, subCkey)}
                            </div>
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
        const label = getFieldLabel(field.sourceType, field.name);
        const hint = getFieldDoc(field.sourceType, field.name) || field.notes || '';
        const ckey = field.name;

        const renderControl = () => {
            if (field.name === 'research') {
                console.log('[DEBUG] research field |',
                    'type:', field.type,
                    'value:', JSON.stringify(value),
                    'typeof:', typeof value,
                    'fields:', field.fields);
                if (typeof value === 'string') {
                    this._onChangeMap.set(ckey, newVal => {
                        this.handleChange(field.name, newVal);
                    });
                    const allContent = this.getAllContentOptions();
                    console.log('[DEBUG] renderContentSelect with', allContent.length, 'options');
                    return this.renderContentSelect(allContent, value, null, field.name, ckey, ckey);
                }
                // Object value: fall through to normal object rendering (with ENHANCED_RESEARCH sub-fields)
            }

            if (field.type === 'object' && field.fields) {
                console.log('[DEBUG] renderObjectField for',
                    field.name, 'type:', field.type);
                return this.renderObjectField(field, value, ckey);
            }

            if (field.type === 'array') {
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
                    <span className={styles.sectionArrow}>{isCollapsed ? '▶' : '▼'}</span>
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
                    <div className={styles.emptyIcon}>{S.emptyIcon}</div>
                    <p className={styles.emptyText}>{S.emptyText}</p>
                </div>
            );
        }

        const mode = this.state.advancedMode ? 'full' : 'curated';
        const fields = resolveFields(contentType, mode);
        if (fields.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>{S.notFoundIcon}</div>
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
        console.log('[DEBUG] render |', 'type:', contentType,
            'mode:', mode, 'fields:', fields.length,
            'research:',
            researchField ?
                JSON.stringify({name: researchField.name,
                    type: researchField.type,
                    hf: !!researchField.fields}) :
                'null',
            'data.research:', JSON.stringify(this.state.data?.research));

        return (
            <div className={styles.editor}>
                <div className={styles.editorHeader}>
                    <span className={styles.editorTitle}>{getZhLabel(contentType) || contentType}</span>
                    <label className={styles.advancedToggle}>
                        <span className={styles.advancedToggleLabel}>{S.advancedMode}</span>
                        <span className={styles.toggleSwitch}>
                            <input
                                type="checkbox"
                                checked={this.state.advancedMode}
                                onChange={this.handleAdvancedToggle}
                            />
                            <span className={styles.toggleSlider} />
                        </span>
                    </label>
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
    contentType: PropTypes.string,
    initialData: PropTypes.object,
    onChange: PropTypes.func,
    assets: PropTypes.array,
    contentLocalizedNames: PropTypes.objectOf(PropTypes.string)
};

MindustryJsonEditor.defaultProps = {
    initialData: {},
    contentLocalizedNames: {}
};

export default MindustryJsonEditor;
