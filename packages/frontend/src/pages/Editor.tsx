import React from 'react';
import './Editor.css';

const Editor: React.FC = () => {
  return (
    <div className="editor">
      <div className="editor-header">
        <h2>Mod 编辑器</h2>
        <div className="editor-actions">
          <button className="btn btn-secondary">保存</button>
          <button className="btn btn-primary">编译</button>
        </div>
      </div>
      <div className="editor-content">
        <div className="asset-panel">
          <div className="panel-header">
            <h3>内容资产</h3>
            <button className="btn btn-small">+ 新建</button>
          </div>
          <div className="asset-tree">
            <div className="tree-item folder">
              <span className="folder-icon">📁</span>
              <span>防御</span>
            </div>
            <div className="tree-item content" style={{ paddingLeft: '2rem' }}>
              <span className="content-icon">🧱</span>
              <span>钛墙</span>
            </div>
            <div className="tree-item folder">
              <span className="folder-icon">📁</span>
              <span>物品</span>
            </div>
            <div className="tree-item content" style={{ paddingLeft: '2rem' }}>
              <span className="content-icon">📦</span>
              <span>钛</span>
            </div>
          </div>
        </div>
        <div className="edit-panel">
          <div className="panel-header">
            <h3>编辑区</h3>
            <div className="mode-switch">
              <button className="btn btn-small active">HJSON 表单</button>
              <button className="btn btn-small">Java 积木</button>
            </div>
          </div>
          <div className="edit-content">
            <div className="form-placeholder">
              <p>选择左侧资产开始编辑</p>
              <p className="hint">这里将显示 HJSON 可视化表单或 Java 积木编辑器</p>
            </div>
          </div>
        </div>
        <div className="preview-panel">
          <div className="panel-header">
            <h3>预览</h3>
          </div>
          <div className="preview-content">
            <div className="preview-placeholder">
              <p>游戏预览</p>
              <p className="hint">这里将显示 Mindustry 游戏画面实时预览</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;