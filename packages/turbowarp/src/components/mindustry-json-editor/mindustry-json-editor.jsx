import PropTypes from 'prop-types';
import React from 'react';
import {resolveFields, getFieldLabel, getFieldDoc, getZhLabel, getZhDoc} from '../../lib/mindustry/resolve-schema';
import {normalizeType} from '../../lib/mindustry/compound-types';
import {VANILLA_CONTENT} from '../../lib/mindustry/vanilla-content';
import styles from './mindustry-json-editor.css';

import ReactMarkdown from 'react-markdown';

function renderMarkdown(text) {
  if (!text) return null;
  return <ReactMarkdown>{text}</ReactMarkdown>;
}

const FRIENDLY_TYPE_NAMES = {
  boolean: '开关',
  int: '数值',
  float: '数值',
  Color: '颜色',
  string: '文本',
  Sound: '音效',
  TextureRegion: '纹理',
};

const REFERENCE_TYPES = new Set([
  'Item', 'Liquid', 'Block', 'UnitType', 'BulletType',
  'StatusEffect', 'Weather', 'Planet', 'SectorPreset',
  'Sound', 'TextureRegion', 'Research',
]);

const ENUM_VALUES = {
  buildVisibility: [
    {value: 'hidden', cn: '隐藏'},
    {value: 'shown', cn: '显示'},
    {value: 'sandboxOnly', cn: '沙盒仅限'},
    {value: 'editorOnly', cn: '编辑器仅限'},
    {value: 'lightingOnly', cn: '光照仅限'},
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
    {value: 'units', cn: '单位'},
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
    {value: 'fade', cn: '淡入淡出'},
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
    {value: 'expInOut', cn: '指数出入'},
  ],
  Blending: [
    {value: 'normal', cn: '正常'},
    {value: 'additive', cn: '叠加'},
    {value: 'alpha', cn: 'Alpha'},
    {value: 'disabled', cn: '禁用'},
  ],
  CacheLayer: [
    {value: 'normal', cn: '正常'},
    {value: 'walls', cn: '墙壁'},
    {value: 'water', cn: '水'},
    {value: 'tar', cn: '焦油'},
    {value: 'molten', cn: '熔融'},
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
    {value: 'cells', cn: '细胞'},
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
    {value: 'all', cn: '全部'},
  ],
};

class MindustryJsonEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.initData(props.contentType, props.initialData || {}),
      collapsedSections: this.initCollapsedSections(props.contentType),
      advancedMode: false,
    };
  }

  initCollapsedSections(contentType) {
    if (!contentType) return new Set();
    const fields = resolveFields(contentType, 'full');
    const sourceTypes = [...new Set(fields.map(f => f.sourceType).filter(Boolean))];
    const collapsed = new Set(sourceTypes);
    collapsed.delete(contentType);
    return collapsed;
  }

  initData(contentType, initial) {
    if (!contentType) return {};
    const fields = resolveFields(contentType, 'full');
    const data = {...initial};
    for (const f of fields) {
      if (data[f.name] === undefined || data[f.name] === null) {
        data[f.name] = this.parseDefault(f);
      }
    }
    return data;
  }

  parseDefault(field) {
    if (field.defaultValue === undefined || field.defaultValue === '') {
      if (field.type === 'boolean') return false;
      if (field.type === 'int' || field.type === 'float') return 0;
      return '';
    }
    if (field.type === 'boolean') return field.defaultValue === 'true';
    if (field.type === 'int') return parseInt(field.defaultValue, 10) || 0;
    if (field.type === 'float') return parseFloat(field.defaultValue) || 0;
    return field.defaultValue;
  }

  handleChange(fieldName, value) {
    this.setState(prev => {
      const data = {...prev.data, [fieldName]: value};
      if (this.props.onChange) this.props.onChange(data);
      return {data};
    });
  }

  toggleSection(key) {
    this.setState(prev => {
      const collapsed = new Set(prev.collapsedSections);
      collapsed.has(key) ? collapsed.delete(key) : collapsed.add(key);
      return {collapsedSections: collapsed};
    });
  }

  toggleAdvancedMode() {
    this.setState(prev => ({ advancedMode: !prev.advancedMode }));
  }

  renderField(rawField) {
    const field = normalizeType(rawField);
    const {data} = this.state;
    const value = data[field.name] !== undefined ? data[field.name] : this.parseDefault(field);
    const label = getFieldLabel(field.sourceType, field.name);
    const hint = getFieldDoc(field.sourceType, field.name) || field.notes || '';
    const friendlyType = FRIENDLY_TYPE_NAMES[field.type] || '文本';

    const renderControl = () => {
      if (field.type === 'object' && field.fields) {
        return this.renderObjectField(field, value);
      }

      if (field.type === 'array') {
        return this.renderArrayField(field, value);
      }

      return this.renderControlInline(field, value, (newVal) => {
        this.handleChange(field.name, newVal);
      });
    };

    return (
      <div className={styles.fieldRow} key={field.name}>
        <div className={styles.fieldHeader}>
          <span className={styles.fieldLabel}>{label}</span>
          {hint && <span className={styles.fieldHint}>{renderMarkdown(hint)}</span>}
          {field.type === 'array' && Array.isArray(value) && (
            <span className={styles.fieldCount}>{value.length} 项</span>
          )}
        </div>
        <div className={styles.fieldControl}>
          {renderControl()}
        </div>
      </div>
    );
  }

  renderArrayField(field, value) {
    const items = Array.isArray(value) ? value : [];
    const itemDef = field.items;
    const normalizedItemDef = itemDef ? normalizeType(itemDef) : null;
    const subFields = normalizedItemDef && normalizedItemDef.fields;

    const isObjectArray = subFields && subFields.length > 0;

    const addItem = () => {
      if (!isObjectArray) {
        const defaultVal = itemDef ? this.parseDefault(itemDef) : '';
        this.handleChange(field.name, [...items, defaultVal]);
        return;
      }
      const defaults = {};
      for (const sf of subFields) {
        if (sf.defaultValue !== undefined) {
          defaults[sf.name] = this.parseDefault(sf);
        }
      }
      this.handleChange(field.name, [...items, defaults]);
    };

    const removeItem = (idx) => {
      this.handleChange(field.name, items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, name, val) => {
      this.handleChange(field.name, items.map((item, i) =>
        i === idx ? (name ? { ...item, [name]: val } : val) : item
      ));
    };

    return (
      <div className={styles.arrayField}>
        {items.length === 0 && (
          <div className={styles.arrayEmpty}>暂未添加</div>
        )}
        {items.map((item, idx) => (
          <div className={styles.arrayItem} key={idx}>
            <div className={styles.arrayItemHeader}>
              <span className={styles.arrayItemIndex}>#{idx + 1}</span>
              <button
                className={styles.arrayRemoveBtn}
                onClick={() => removeItem(idx)}
                title="删除此项"
              >✕</button>
            </div>
            <div className={styles.arrayItemBody}>
              {isObjectArray ? ((subFields || []).map(sf => {
                const sfValue = item[sf.name] !== undefined
                  ? item[sf.name]
                  : this.parseDefault(sf);
                return (
                  <div className={styles.nestedFieldRow} key={sf.name}>
                    <span className={styles.nestedFieldLabel}>
                      {getFieldLabel(field.sourceType, sf.name) || sf.localizedName || sf.name}
                    </span>
                    <div className={styles.nestedFieldControl}>
                      {this.renderControlInline(sf, sfValue, (val) => updateItem(idx, sf.name, val))}
                    </div>
                  </div>
                );
              })) : (
                <div className={styles.nestedFieldControl}>
                  {this.renderControlInline(
                    itemDef || {type: 'string'},
                    item,
                    (val) => updateItem(idx, null, val)
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <button className={styles.arrayAddBtn} onClick={addItem}>
          + 添加
        </button>
      </div>
    );
  }

  renderObjectField(field, value) {
    const currentValue = value || {};
    const subFields = field.fields || [];
    return (
      <div className={styles.nestedObject}>
        {subFields.map(subF => {
          const subValue = currentValue[subF.name] !== undefined
            ? currentValue[subF.name]
            : this.parseDefault(subF);
          return (
            <div className={styles.nestedFieldRow} key={subF.name}>
              <span className={styles.nestedFieldLabel}>
                {getFieldLabel(field.sourceType, subF.name) || subF.localizedName || subF.name}
              </span>
              <div className={styles.nestedFieldControl}>
                {this.renderControlInline(subF, subValue, (newVal) => {
                  const updated = { ...currentValue, [subF.name]: newVal };
                  this.handleChange(field.name, updated);
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  renderControlInline(field, value, onChange) {
    if (field.type === 'boolean') {
      return (
        <label className={styles.toggleSwitch}>
          <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />
          <span className={styles.toggleSlider} />
        </label>
      );
    }

    if (field.type === 'Color') {
      const hex = String(value || '000000ff');
      return (
        <div className={styles.colorGroup}>
          <span className={styles.colorSwatch} style={{backgroundColor: `#${hex.slice(0, 6)}`}} />
          <input
            type="color"
            value={`#${hex.replace('#', '').slice(0, 6)}`}
            onChange={e => onChange(e.target.value.replace('#', '') + 'ff')}
            className={styles.colorPicker}
          />
        </div>
      );
    }

    const rawOptions = field.options || ENUM_VALUES[field.name] || ENUM_VALUES[field.type];
    if (rawOptions) {
      const enumOptions = rawOptions.map(o => typeof o === 'string' ? {value: o, cn: o} : {...o, cn: o.cn || o.value});
      return this.renderSearchableSelect(enumOptions, value, onChange, field.name);
    }

    if (field.type === 'int' || field.type === 'float') {
      if (field.name === 'size') {
        return this.renderSizeSelector(value, field, onChange);
      }
      return (
        <input
          type="number"
          value={value}
          onChange={e => {
            const v = field.type === 'int' ? parseInt(e.target.value, 10) || 0 : parseFloat(e.target.value) || 0;
            onChange(v);
          }}
          step={field.type === 'float' ? '0.1' : '1'}
          className={styles.numInput}
        />
      );
    }

    if (field.name === 'research' || REFERENCE_TYPES.has(field.type)) {
      return this.renderContentSelect(field, value, onChange);
    }

    return (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={styles.textInput}
      />
    );
  }

  getAllContentOptions() {
    const { assets } = this.props;
    const seen = new Set();
    const result = [];

    for (const [type, items] of Object.entries(VANILLA_CONTENT)) {
      for (const item of items) {
        if (!seen.has(item.name)) {
          seen.add(item.name);
          result.push({ ...item, type, source: 'vanilla' });
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
            cn: asset.name,
            type: asset.contentType,
            source: 'mod',
          });
        }
      }
    }

    return result;
  }

  renderContentSelect(field, value, onChange) {
    const allOptions = this.getAllContentOptions();
    const isResearch = field.name === 'research';

    const options = isResearch
      ? allOptions
      : allOptions.filter(o => o.type === field.type);

    const stateKey = `_cnt_${field.name}`;
    const open = this.state[`${stateKey}_open`];
    const search = this.state[`${stateKey}_search`] || '';
    const filtered = options.filter(o => !search ||
      o.name.includes(search) || o.cn.includes(search));

    const selected = options.find(o => o.name === value);

    return (
      <div className={styles.selectWrap}>
        <div className={styles.selectDisplay} onClick={() => this.setState({[`${stateKey}_open`]: !open})}>
          <span className={styles.selectDisplayLabel}>{selected ? selected.cn : (value || '--')}</span>
          <span className={styles.selectArrow}>{open ? '▲' : '▼'}</span>
        </div>
        {open && (
          <div className={styles.selectDropdown}>
            <input
              type="text"
              value={search}
              placeholder="搜索..."
              autoFocus
              onChange={e => this.setState({[`${stateKey}_search`]: e.target.value})}
              onBlur={() => setTimeout(() => this.setState({
                [`${stateKey}_open`]: false,
                [`${stateKey}_search`]: '',
              }), 150)}
              className={styles.selectSearch}
            />
            <div className={styles.selectOptions}>
              {filtered.length === 0 && (
                <div className={styles.selectEmpty}>无匹配</div>
              )}
              {filtered.map(opt => (
                <div
                  key={opt.name}
                  className={`${styles.selectOption} ${value === opt.name ? styles.selectOptionActive : ''}`}
                  onMouseDown={() => {
                    onChange(opt.name);
                    this.setState({
                      [`${stateKey}_open`]: false,
                      [`${stateKey}_search`]: '',
                    });
                  }}
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

  renderSizeSelector(value, field, onChange) {
    const sizes = [1, 2, 3, 4, 5];
    const handleSizeChange = onChange || ((v) => this.handleChange(field.name, v));
    return (
      <div className={styles.sizeWrap}>
        <div className={styles.sizeGrid}>
          {sizes.map(s => (
            <button
              key={s}
              className={`${styles.sizeBtn} ${value === s ? styles.sizeBtnActive : ''}`}
              onClick={() => handleSizeChange(s)}
            >
              {s}x{s}
            </button>
          ))}
        </div>
        <div className={styles.sizeCustom}>
          <input
            type="number"
            min="1"
            value={value}
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              if (v > 0) handleSizeChange(v);
            }}
            className={styles.numInput}
          />
          <span className={styles.sizeSuffix}>x{value}</span>
        </div>
      </div>
    );
  }

  renderSearchableSelect(options, value, onChange, fieldName) {
    const stateKey = `_enum_${fieldName}`;
    const open = this.state[`${stateKey}_open`];
    const search = this.state[`${stateKey}_search`] || '';
    const filtered = options.filter(o => !search ||
      o.value.includes(search) || o.cn.includes(search));

    const selected = options.find(o => o.value === value);

    return (
      <div className={styles.selectWrap}>
        <div className={styles.selectDisplay} onClick={() => this.setState({[`${stateKey}_open`]: !open})}>
          <span className={styles.selectDisplayLabel}>{selected ? selected.cn : (value || '--')}</span>
          <span className={styles.selectArrow}>{open ? '▲' : '▼'}</span>
        </div>
        {open && (
          <div className={styles.selectDropdown}>
            <input
              type="text"
              value={search}
              placeholder="搜索..."
              autoFocus
              onChange={e => this.setState({[`${stateKey}_search`]: e.target.value})}
              onBlur={() => setTimeout(() => this.setState({
                [`${stateKey}_open`]: false,
                [`${stateKey}_search`]: '',
              }), 150)}
              className={styles.selectSearch}
            />
            <div className={styles.selectOptions}>
              {filtered.length === 0 && (
                <div className={styles.selectEmpty}>无匹配</div>
              )}
              {filtered.map(opt => (
                <div
                  key={opt.value}
                  className={`${styles.selectOption} ${value === opt.value ? styles.selectOptionActive : ''}`}
                  onMouseDown={() => {
                    onChange(opt.value);
                    this.setState({
                      [`${stateKey}_open`]: false,
                      [`${stateKey}_search`]: '',
                    });
                  }}
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

  renderSection(typeName, fields) {
    if (!fields || fields.length === 0) return null;
    const isCollapsed = this.state.collapsedSections.has(typeName);
    const zhLabel = getZhLabel(typeName) || typeName;
    const zhDoc = getZhDoc(typeName) || '';

    return (
      <div className={styles.section} key={typeName}>
        <div
          className={styles.sectionHeader}
          onClick={() => this.toggleSection(typeName)}
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

  render() {
    const {contentType} = this.props;
    if (!contentType) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <p className={styles.emptyText}>在左侧资产区选择一个内容来编辑</p>
        </div>
      );
    }

    const mode = this.state.advancedMode ? 'full' : 'curated';
    const fields = resolveFields(contentType, mode);
    if (fields.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>❓</div>
          <p className={styles.emptyText}>未找到 "{contentType}" 的配置信息</p>
        </div>
      );
    }

    const sections = {};
    let researchField = null;
    for (const f of fields) {
      if (f.name === 'research') {
        researchField = f;
        continue;
      }
      if (!sections[f.sourceType]) sections[f.sourceType] = [];
      sections[f.sourceType].push(f);
    }

    return (
      <div className={styles.editor}>
        <div className={styles.editorHeader}>
          <span className={styles.editorTitle}>{getZhLabel(contentType) || contentType}</span>
          <label className={styles.advancedToggle}>
            <span className={styles.advancedToggleLabel}>⚡ 高级模式</span>
            <span className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={this.state.advancedMode}
                onChange={() => this.toggleAdvancedMode()}
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
  assetId: PropTypes.string,
};

MindustryJsonEditor.defaultProps = {
  initialData: {},
};

export default MindustryJsonEditor;
