import PropTypes from 'prop-types';
import React from 'react';
import styles from './mod-editor.css';

const FIELDS = [
  {key: 'name', label: '模组标识', hint: '唯一标识符，如 my-mod，不含空格和特殊字符', type: 'text'},
  {key: 'displayName', label: '显示名称', hint: '游戏中显示的模组名称', type: 'text'},
  {key: 'author', label: '作者', hint: '模组作者名', type: 'text'},
  {key: 'version', label: '版本号', hint: '如 1.0.0', type: 'text'},
  {key: 'subtitle', label: '副标题', hint: '简短描述，显示在名称下方', type: 'text'},
  {key: 'description', label: '描述', hint: '模组详细介绍', type: 'textarea'},
  {key: 'main', label: '主类', hint: 'Java 模组的主类路径，如 mymod.MyMod', type: 'text'},
  {key: 'repo', label: '仓库地址', hint: '模组源码仓库 URL', type: 'text'},
  {key: 'minGameVersion', label: '最低游戏版本', hint: '如 146', type: 'text'},
  {key: 'dependencies', label: '依赖模组', hint: '必须依赖的模组标识列表', type: 'array'},
  {key: 'softDependencies', label: '可选依赖', hint: '可选依赖的模组标识列表', type: 'array'},
  {key: 'hidden', label: '隐藏模组', hint: '启用后模组不出现在模组浏览器中，适合只含服务端脚本的模组', type: 'toggle'},
  {key: 'java', label: 'Java 模组', hint: '启用后表示模组包含 Java 代码', type: 'toggle'},
  {key: 'iosCompatible', label: 'iOS 兼容', hint: '脚本模组是否兼容 iOS（不使用 extend/JavaAdapter）', type: 'toggle'},
  {key: 'pregenerated', label: '预生成资源', hint: '启用后跳过 bleed 和内容图标生成', type: 'toggle'},
  {key: 'legacyCompatible', label: '旧版兼容', hint: '来自旧主版本的兼容模组', type: 'toggle'},
  {key: 'texturescale', label: '纹理缩放', hint: '1x1 方块的纹理像素缩放比例，默认 1.0', type: 'number'},
];

class ModEditor extends React.Component {
  renderField(fieldDef) {
    const {config, onChange} = this.props;
    const value = config[fieldDef.key];
    const {key, label, hint, type} = fieldDef;

    if (type === 'toggle') {
      return (
        <div className={styles.toggleRow} key={key}>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => onChange(key, e.target.checked)}
            />
            <span className={styles.toggleSlider} />
          </label>
          <div>
            <div className={styles.toggleLabel}>{label}</div>
            {hint && <span className={styles.hint}>{hint}</span>}
          </div>
        </div>
      );
    }

    if (type === 'array') {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div className={styles.field} key={key}>
          <label className={styles.label}>{label}</label>
          {hint && <span className={styles.hint}>{hint}</span>}
          <div className={styles.arrayRow}>
            {arr.map((item, i) => (
              <span className={styles.tag} key={i}>
                {item}
                <span
                  className={styles.tagRemove}
                  onClick={() => {
                    const next = arr.filter((_, j) => j !== i);
                    onChange(key, next);
                  }}
                >
                  ✕
                </span>
              </span>
            ))}
          </div>
          <ArrayAddField
            onAdd={val => onChange(key, [...arr, val])}
          />
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div className={styles.field} key={key}>
          <label className={styles.label}>{label}</label>
          {hint && <span className={styles.hint}>{hint}</span>}
          <textarea
            className={styles.textarea}
            value={value || ''}
            onChange={e => onChange(key, e.target.value)}
          />
        </div>
      );
    }

    if (type === 'number') {
      return (
        <div className={styles.field} key={key}>
          <label className={styles.label}>{label}</label>
          {hint && <span className={styles.hint}>{hint}</span>}
          <input
            className={styles.input}
            type="number"
            step="0.1"
            value={value ?? ''}
            onChange={e => onChange(key, parseFloat(e.target.value) || 0)}
          />
        </div>
      );
    }

    return (
      <div className={styles.field} key={key}>
        <label className={styles.label}>{label}</label>
        {hint && <span className={styles.hint}>{hint}</span>}
        <input
          className={styles.input}
          type="text"
          value={value || ''}
          onChange={e => onChange(key, e.target.value)}
        />
      </div>
    );
  }

  render() {
    return (
      <div className={styles.editor}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>mod.hjson</div>
          <div className={styles.headerHint}>模组配置文件（必需）</div>
        </div>
        <div className={styles.body}>
          {FIELDS.map(f => this.renderField(f))}
        </div>
      </div>
    );
  }
}

class ArrayAddField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {val: ''};
  }

  handleAdd() {
    const v = this.state.val.trim();
    if (v) {
      this.props.onAdd(v);
      this.setState({val: ''});
    }
  }

  render() {
    return (
      <div className={styles.arrayAddRow}>
        <input
          className={styles.arrayInput}
          value={this.state.val}
          onChange={e => this.setState({val: e.target.value})}
          onKeyDown={e => {if (e.key === 'Enter') this.handleAdd();}}
          placeholder="输入名称后回车添加"
        />
        <button className={styles.arrayAddBtn} onClick={() => this.handleAdd()}>
          + 添加
        </button>
      </div>
    );
  }
}

ModEditor.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ModEditor;
