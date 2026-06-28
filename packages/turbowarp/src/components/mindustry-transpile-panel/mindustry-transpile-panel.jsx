import PropTypes from 'prop-types';
import React from 'react';
import {resolveFields} from '../../lib/mindustry/resolve-schema';
import toHjson from '../../lib/mindustry/to-hjson';
import styles from './mindustry-transpile-panel.css';

function parseDefault(field) {
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

function computeDefaults(contentType) {
  const fields = resolveFields(contentType);
  const defs = {};
  for (const f of fields) {
    defs[f.name] = parseDefault(f);
  }
  return defs;
}

function diffData(contentType, currentData) {
  if (!currentData || Object.keys(currentData).length === 0) return null;
  const defaults = computeDefaults(contentType);
  const result = {};
  for (const key of Object.keys(currentData)) {
    const dv = defaults[key];
    if (dv === undefined) {
      // field not in schema — still include it
      result[key] = currentData[key];
    } else if (toHjson(currentData[key]) !== toHjson(dv)) {
      result[key] = currentData[key];
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

class TranspilePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {collapsed: false};
  }

  render() {
    const {collapsed} = this.state;
    const {selectedAsset, formData} = this.props;

    let code = null;
    if (selectedAsset) {
      if (selectedAsset.kind === 'modconfig' && this.props.modConfig) {
        const out = {};
        const cfg = this.props.modConfig;
        for (const k of Object.keys(cfg)) {
          const v = cfg[k];
          if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
          if (k === 'texturescale' && v === 1.0) continue;
          if (k === 'hidden' && !v) continue;
          if (k === 'java' && !v) continue;
          if (k === 'iosCompatible' && !v) continue;
          if (k === 'pregenerated' && !v) continue;
          if (k === 'legacyCompatible' && !v) continue;
          out[k] = v;
        }
        code = toHjson(out);
      } else if (selectedAsset.kind === 'content' && formData && Object.keys(formData).length > 0) {
        const changed = diffData(selectedAsset.contentType, formData);
        if (changed) {
          code = toHjson(changed);
        } else {
          code = '// 未修改任何字段\n// 修改字段后此处显示差异';
        }
      } else if (selectedAsset.kind === 'content') {
        code = `// ${selectedAsset.name} (${selectedAsset.contentType})\n// 编辑内容后此处显示 JSON 差异输出`;
      } else {
        code = `// ${selectedAsset.name}.java\n// Java 转译结果（待实现）`;
      }
    }

    return (
      <div className={styles.panel}>
        <div className={styles.header} onClick={() => this.setState({collapsed: !collapsed})}>
          <span className={styles.arrow}>{collapsed ? '▶' : '▼'}</span>
          <span className={styles.headerTitle}>
            {selectedAsset
              ? (selectedAsset.kind === 'content' ? 'HJSON 输出（仅差异）' : selectedAsset.kind === 'modconfig' ? 'mod.hjson' : 'Java 输出')
              : '转译输出'}
          </span>
          <span className={styles.headerHint}>
            {collapsed ? '展开' : '折叠'}
          </span>
        </div>
        {!collapsed && (
          <div className={styles.body}>
            {code ? (
              <pre className={styles.codeBlock}>{code}</pre>
            ) : (
              <div className={styles.placeholder}>
                添加并选中资源后显示转译结果
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

TranspilePanel.propTypes = {
  selectedAsset: PropTypes.object,
  formData: PropTypes.object,
  modConfig: PropTypes.object,
};

export default TranspilePanel;
