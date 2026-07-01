import PropTypes from 'prop-types';
import React from 'react';
import {resolveFields} from '../../lib/mindustry/resolve-schema';
// eslint-disable-next-line import/no-unresolved
import hjson from 'hjson';
import styles from './mindustry-transpile-panel.css';

/**
 * @param {object} field - field descriptor
 * @returns {boolean|number|string} parsed default value
 */
const parseDefault = function (field) {
    if (field.defaultValue === void 0 || field.defaultValue === '') {
        if (field.type === 'boolean') return false;
        if (field.type === 'int' || field.type === 'float') return 0;
        return '';
    }
    if (field.type === 'boolean') return field.defaultValue === 'true';
    if (field.type === 'int') return parseInt(field.defaultValue, 10) || 0;
    if (field.type === 'float') return parseFloat(field.defaultValue) || 0;
    return field.defaultValue;
};

/**
 * @param {string} contentType - content type name
 * @returns {object} default values map
 */
const computeDefaults = function (contentType) {
    const fields = resolveFields(contentType);
    const defs = {};
    for (const f of fields) {
        defs[f.name] = parseDefault(f);
    }
    return defs;
};

/**
 * @param {string} contentType - content type name
 * @param {object} currentData - current form data
 * @returns {object|null} diff data or null
 */
const diffData = function (contentType, currentData) {
    if (!currentData || Object.keys(currentData).length === 0) return null;
    const defaults = computeDefaults(contentType);
    const result = {};
    for (const key of Object.keys(currentData)) {
        const dv = defaults[key];
        if (dv === void 0) {
            // field not in schema — still include it
            result[key] = currentData[key];
        } else if (hjson.stringify(currentData[key]) !== hjson.stringify(dv)) {
            result[key] = currentData[key];
        }
    }
    return Object.keys(result).length > 0 ? result : null;
};

const PLACEHOLDER_TEXT = '添加并选中资源后显示转译结果';

class TranspilePanel extends React.Component {
    constructor (props) {
        super(props);
        this.state = {collapsed: false};
        this.handleToggleCollapse = this.handleToggleCollapse.bind(this);
    }

    handleToggleCollapse () {
        this.setState(prev => ({collapsed: !prev.collapsed}));
    }

    render () {
        const {collapsed} = this.state;
        const {selectedAsset, formData} = this.props;

        let code = null;
        if (selectedAsset) {
            if (selectedAsset.kind === 'modconfig' && this.props.modConfig) {
                const out = {};
                const cfg = this.props.modConfig;
                for (const k of Object.keys(cfg)) {
                    const v = cfg[k];
                    if (v === void 0 || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
                    if (k === 'texturescale' && v === 1.0) continue;
                    if (k === 'hidden' && !v) continue;
                    if (k === 'java' && !v) continue;
                    if (k === 'iosCompatible' && !v) continue;
                    if (k === 'pregenerated' && !v) continue;
                    if (k === 'legacyCompatible' && !v) continue;
                    out[k] = v;
                }
                code = hjson.stringify(out, {bracesSameLine: false, emitRootBraces: false});
            } else if (selectedAsset.kind === 'content' && formData && Object.keys(formData).length > 0) {
                const changed = diffData(selectedAsset.contentType, formData);
                if (changed) {
                    code = hjson.stringify(changed, {bracesSameLine: false, emitRootBraces: false});
                } else {
                    code = '// 未修改任何字段\n// 修改字段后此处显示差异';
                }
            } else if (selectedAsset.kind === 'bundle' && formData && Object.keys(formData).length > 0) {
                const lines = Object.keys(formData).sort()
                    .map(k => `${k}=${formData[k]}`);
                code = lines.join('\n');
            } else if (selectedAsset.kind === 'content') {
                code = `// ${selectedAsset.name} (${selectedAsset.contentType})\n// 编辑内容后此处显示 HJSON 差异输出`;
            } else {
                code = `// ${selectedAsset.name}.java\n// Java 转译结果（待实现）`;
            }
        }

        let headerTitle;
        if (selectedAsset) {
            if (selectedAsset.kind === 'content') {
                headerTitle = 'HJSON 输出（仅差异）';
            } else if (selectedAsset.kind === 'modconfig') {
                headerTitle = 'mod.hjson';
            } else if (selectedAsset.kind === 'bundle') {
                headerTitle = '本地化文件';
            } else {
                headerTitle = 'Java 输出';
            }
        } else {
            headerTitle = '转译输出';
        }

        const arrowIcon = collapsed ? '\u25B6' : '\u25BC';
        const collapseLabel = collapsed ? '展开' : '折叠';

        return (
            <div className={styles.panel}>
                <div
                    className={styles.header}
                    onClick={this.handleToggleCollapse}
                >
                    <span className={styles.arrow}>{arrowIcon}</span>
                    <span className={styles.headerTitle}>{headerTitle}</span>
                    <span className={styles.headerHint}>{collapseLabel}</span>
                </div>
                {!collapsed && (
                    <div className={styles.body}>
                        {code ? (
                            <pre className={styles.codeBlock}>{code}</pre>
                        ) : (
                            <div className={styles.placeholder}>{PLACEHOLDER_TEXT}</div>
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
    modConfig: PropTypes.object
};

export default TranspilePanel;
