import PropTypes from 'prop-types';
import React from 'react';
import {resolveFields, getFieldLabel, getFieldDoc, getZhLabel, getZhDoc} from '../../lib/mindustry/resolve-schema';
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

  renderField(field) {
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
    const subFields = itemDef && itemDef.fields;

    const addItem = () => {
      const defaults = {};
      if (subFields) {
        for (const sf of subFields) {
          if (sf.defaultValue !== undefined) {
            defaults[sf.name] = this.parseDefault(sf);
          }
        }
      }
      const newItems = [...items, defaults];
      this.handleChange(field.name, newItems);
    };

    const removeItem = (idx) => {
      const newItems = items.filter((_, i) => i !== idx);
      this.handleChange(field.name, newItems);
    };

    const updateItem = (idx, name, val) => {
      const newItems = items.map((item, i) =>
        i === idx ? { ...item, [name]: val } : item
      );
      this.handleChange(field.name, newItems);
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
              {(subFields || []).map(sf => {
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
              })}
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

    if (field.name === 'research' && this.props.assets) {
      const suggestions = this.props.assets
        .filter(a => a.kind === 'content' && a.id !== this.props.assetId)
        .map(a => a.name)
        .filter(Boolean);
      const listId = `research-suggest-${field.name}`;
      return (
        <>
          <input
            type="text"
            value={value}
            list={listId}
            onChange={e => onChange(e.target.value)}
            className={styles.textInput}
          />
          <datalist id={listId}>
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        </>
      );
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

  renderSizeSelector(value, field, onChange) {
    const sizes = [
      {label: '1x1', value: 1},
      {label: '2x2', value: 2},
      {label: '3x3', value: 3},
      {label: '4x4', value: 4},
      {label: '5x5', value: 5},
    ];
    const handleSizeChange = onChange || ((v) => this.handleChange(field.name, v));
    return (
      <div className={styles.sizeGrid}>
        {sizes.map(s => (
          <button
            key={s.value}
            className={`${styles.sizeBtn} ${value === s.value ? styles.sizeBtnActive : ''}`}
            onClick={() => handleSizeChange(s.value)}
          >
            {s.label}
          </button>
        ))}
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
