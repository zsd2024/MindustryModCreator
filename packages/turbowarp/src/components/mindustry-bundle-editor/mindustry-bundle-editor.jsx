import React from 'react';
import {getBundlePrefix, generateBundleKeys} from '../../lib/mindustry/content-type-utils';
import styles from './mindustry-bundle-editor.css';

class BundleEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newKey: '',
      newValue: '',
      filter: '',
    };
  }

  getEntries() {
    return this.props.entries || {};
  }

  handleValueChange(key, value) {
    const updated = {...this.getEntries(), [key]: value};
    if (this.props.onChange) this.props.onChange(updated);
  }

  handleDelete(key) {
    const entries = this.getEntries();
    const updated = {...entries};
    delete updated[key];
    if (this.props.onChange) this.props.onChange(updated);
  }

  handleAdd() {
    const {newKey, newValue} = this.state;
    if (!newKey.trim()) return;
    const updated = {...this.getEntries(), [newKey.trim()]: newValue};
    if (this.props.onChange) this.props.onChange(updated);
    this.setState({newKey: '', newValue: ''});
  }

  handleGenerateMissing() {
    const current = this.getEntries();
    const generated = generateBundleKeys(this.props.assets || [], this.props.modConfig);
    const merged = {...generated, ...current};
    if (this.props.onChange) this.props.onChange(merged);
  }

  render() {
    const entries = this.getEntries();
    const {filter} = this.state;
    const keys = Object.keys(entries);
    const filtered = filter ? keys.filter(k => k.includes(filter)) : keys;

    return (
      <div className={styles.editor}>
        <div className={styles.toolbar}>
          <input
            className={styles.search}
            placeholder="搜索 key..."
            value={filter}
            onChange={e => this.setState({filter: e.target.value})}
          />
          <button className={styles.btn} onClick={() => this.handleGenerateMissing()}>
            生成缺失 Key
          </button>
        </div>
        <div className={styles.table}>
          <div className={styles.header}>
            <span className={styles.keyCol}>Key</span>
            <span className={styles.valCol}>Value</span>
            <span className={styles.delCol}/>
          </div>
          <div className={styles.body}>
            {filtered.map(k => (
              <div className={styles.row} key={k}>
                <span className={styles.keyCol}>{k}</span>
                <input
                  className={styles.valCol}
                  type="text"
                  value={entries[k]}
                  onChange={e => this.handleValueChange(k, e.target.value)}
                />
                <button
                  className={styles.delBtn}
                  onClick={() => this.handleDelete(k)}
                  title="删除"
                >×</button>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.addRow}>
          <input
            className={styles.keyCol}
            placeholder="新 key"
            value={this.state.newKey}
            onChange={e => this.setState({newKey: e.target.value})}
            onKeyDown={e => e.key === 'Enter' && this.handleAdd()}
          />
          <input
            className={styles.valCol}
            placeholder="值"
            value={this.state.newValue}
            onChange={e => this.setState({newValue: e.target.value})}
            onKeyDown={e => e.key === 'Enter' && this.handleAdd()}
          />
          <button className={styles.addBtn} onClick={() => this.handleAdd()}>+</button>
        </div>
      </div>
    );
  }
}

export default BundleEditor;
