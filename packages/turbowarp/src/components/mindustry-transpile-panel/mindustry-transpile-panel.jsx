import PropTypes from 'prop-types';
import React from 'react';
import styles from './mindustry-transpile-panel.css';

function formatJson(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
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
      if (selectedAsset.kind === 'content' && Object.keys(formData || {}).length > 0) {
        code = formatJson(formData);
      } else if (selectedAsset.kind === 'content') {
        code = `// ${selectedAsset.name} (${selectedAsset.contentType})\n// 编辑内容后此处显示 JSON 输出`;
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
              ? (selectedAsset.kind === 'content' ? 'JSON 输出' : 'Java 输出')
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
};

export default TranspilePanel;
