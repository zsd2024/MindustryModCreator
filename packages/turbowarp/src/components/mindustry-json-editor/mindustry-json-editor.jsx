import PropTypes from 'prop-types';
import React from 'react';
import {resolveFields, getFieldLabel, getFieldDoc, getZhLabel, getZhDoc} from '../../lib/mindustry/resolve-schema';
import styles from './mindustry-json-editor.css';

import {parse} from 'marked';

function renderMarkdown(text) {
  if (!text) return null;
  const html = parse(text, {async: false});
  return <span dangerouslySetInnerHTML={{__html: html}} />;
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
      collapsedSections: new Set(),
    };
  }

  initData(contentType, initial) {
    if (!contentType) return {};
    const fields = resolveFields(contentType);
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

  renderField(field) {
    const {data} = this.state;
    const value = data[field.name] !== undefined ? data[field.name] : this.parseDefault(field);
    const label = getFieldLabel(field.sourceType, field.name);
    const hint = getFieldDoc(field.sourceType, field.name) || field.notes || '';
    const friendlyType = FRIENDLY_TYPE_NAMES[field.type] || '文本';

    const renderControl = () => {
      if (field.type === 'boolean') {
        return (
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => this.handleChange(field.name, e.target.checked)}
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
              onChange={e => {
                const c = e.target.value.replace('#', '');
                this.handleChange(field.name, c + 'ff');
              }}
              className={styles.colorPicker}
            />
          </div>
        );
      }

      if (field.type === 'int' || field.type === 'float') {
        if (field.name === 'size') {
          return this.renderSizeSelector(value, field);
        }
        return (
          <input
            type="number"
            value={value}
            onChange={e => {
              const v = field.type === 'int' ? parseInt(e.target.value, 10) || 0 : parseFloat(e.target.value) || 0;
              this.handleChange(field.name, v);
            }}
            step={field.type === 'float' ? '0.1' : '1'}
            className={styles.numInput}
          />
        );
      }

      return (
        <input
          type="text"
          value={value}
          onChange={e => this.handleChange(field.name, e.target.value)}
          className={styles.textInput}
        />
      );
    };

    return (
      <div className={styles.fieldRow} key={field.name}>
        <div className={styles.fieldHeader}>
          <span className={styles.fieldLabel}>{label}</span>
          {hint && <span className={styles.fieldHint}>{renderMarkdown(hint)}</span>}
        </div>
        <div className={styles.fieldControl}>
          {renderControl()}
        </div>
      </div>
    );
  }

  renderSizeSelector(value, field) {
    const sizes = [
      {label: '1x1', value: 1},
      {label: '2x2', value: 2},
      {label: '3x3', value: 3},
      {label: '4x4', value: 4},
      {label: '5x5', value: 5},
    ];
    return (
      <div className={styles.sizeGrid}>
        {sizes.map(s => (
          <button
            key={s.value}
            className={`${styles.sizeBtn} ${value === s.value ? styles.sizeBtnActive : ''}`}
            onClick={() => this.handleChange(field.name, s.value)}
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

    const fields = resolveFields(contentType);
    if (fields.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>❓</div>
          <p className={styles.emptyText}>未找到 "{contentType}" 的配置信息</p>
        </div>
      );
    }

    const sections = {};
    for (const f of fields) {
      if (!sections[f.sourceType]) sections[f.sourceType] = [];
      sections[f.sourceType].push(f);
    }

    return (
      <div className={styles.editor}>
        <div className={styles.editorHeader}>
          <span className={styles.editorTitle}>{getZhLabel(contentType) || contentType}</span>
        </div>
        <div className={styles.sectionsContainer}>
          {Object.keys(sections).map(st => this.renderSection(st, sections[st]))}
        </div>
      </div>
    );
  }
}

MindustryJsonEditor.propTypes = {
  contentType: PropTypes.string,
  initialData: PropTypes.object,
  onChange: PropTypes.func,
};

MindustryJsonEditor.defaultProps = {
  initialData: {},
};

export default MindustryJsonEditor;
