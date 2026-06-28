import PropTypes from 'prop-types';
import React from 'react';
import styles from './mindustry-folder-tree.css';

class FolderTree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: new Set(),
      renamingId: null,
      renameValue: '',
      contextMenu: null,
    };
    this._ctxEl = null;
    this.treeRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('click', this.handleDocClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocClick);
  }

  handleDocClick = (e) => {
    if (this.state.contextMenu && this._ctxEl && !this._ctxEl.contains(e.target)) {
      this.setState({contextMenu: null});
    }
  }

  toggleCollapse(id) {
    this.setState(prev => {
      const set = new Set(prev.collapsed);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return {collapsed: set};
    });
  }

  handleClick(id, e) {
    this.props.onSelectFolder(id);
    this.toggleCollapse(id);
    e.stopPropagation();
  }

  handleContextMenu(id, e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      contextMenu: {folderId: id, x: e.clientX, y: e.clientY, ref: null},
    });
  }

  startRename(id, currentName) {
    this.setState({renamingId: id, renameValue: currentName, contextMenu: null});
  }

  confirmRename() {
    const {renamingId, renameValue} = this.state;
    if (renamingId && renameValue.trim()) {
      this.props.onRenameFolder(renamingId, renameValue.trim());
    }
    this.setState({renamingId: null, renameValue: ''});
  }

  handleRenameKeyDown(e) {
    if (e.key === 'Enter') this.confirmRename();
    if (e.key === 'Escape') this.setState({renamingId: null, renameValue: ''});
  }

  renderFolder(folder, depth) {
    const {assets, selectedFolderId} = this.props;
    const isRoot = !folder.parentId;
    const isCollapsed = this.state.collapsed.has(folder.id);
    const children = this.props.folders.filter(f => f.parentId === folder.id);
    const childCount = assets.filter(a => {
      if (a.folderId === folder.id) return true;
      const childIds = this.props.folders
        .filter(f => f.parentId === folder.id)
        .map(f => f.id);
      return childIds.includes(a.folderId);
    }).length;
    const isActive = selectedFolderId === folder.id;
    const isRenaming = this.state.renamingId === folder.id;

    return (
      <div key={folder.id} className={styles.folder}>
        <div
          className={`${styles.folderHeader} ${isActive ? styles.folderActive : ''}`}
          onClick={(e) => this.handleClick(folder.id, e)}
          onContextMenu={(e) => this.handleContextMenu(folder.id, e)}
        >
          <span className={styles.folderArrow}>
            {children.length > 0 ? (isCollapsed ? '▶' : '▼') : ''}
          </span>
          <span className={styles.folderIcon}>
            {folder.kind === 'content' ? '📄' : '☕'}
          </span>
          {isRenaming ? (
            <input
              className={styles.renameInput}
              value={this.state.renameValue}
              onChange={(e) => this.setState({renameValue: e.target.value})}
              onBlur={() => this.confirmRename()}
              onKeyDown={(e) => this.handleRenameKeyDown(e)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={styles.folderName}>{folder.name}</span>
          )}
          {!isRenaming && childCount > 0 && (
            <span className={styles.folderCount}>{childCount}</span>
          )}
        </div>
        {!isCollapsed && children.length > 0 && (
          <div className={styles.children}>
            {children.map(child => this.renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  render() {
    const rootFolders = this.props.folders.filter(f => !f.parentId);

    return (
      <div className={styles.tree} ref={this.treeRef}>
        <div className={styles.treeHeader}>
          <span className={styles.treeTitle}>文件夹</span>
        </div>
        <div className={styles.treeBody}>
          <div
            className={`${styles.folderHeader} ${!this.props.selectedFolderId ? styles.folderActive : ''}`}
            onClick={() => this.props.onSelectFolder(null)}
          >
            <span className={styles.folderName}>全部</span>
            <span className={styles.folderCount}>{this.props.assets.length}</span>
          </div>
          {rootFolders.map(f => this.renderFolder(f, 0))}
        </div>
        <div className={styles.treeFooter}>
          <button className={styles.addFolderBtn} onClick={this.props.onAddFolder}>
            + 新建文件夹
          </button>
        </div>

        {/* context menu */}
        {this.state.contextMenu && (
          <div
            className={styles.contextMenu}
            style={{left: this.state.contextMenu.x, top: this.state.contextMenu.y}}
            ref={(el) => {this._ctxEl = el;}}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={styles.contextMenuItem}
              onClick={() => {
                const f = this.props.folders.find(
                  f2 => f2.id === this.state.contextMenu.folderId
                );
                this.startRename(this.state.contextMenu.folderId, f ? f.name : '');
              }}
            >
              重命名
            </div>
            <div
              className={styles.contextMenuDanger}
              onClick={() => {
                this.props.onDeleteFolder(this.state.contextMenu.folderId);
                this.setState({contextMenu: null});
              }}
            >
              删除
            </div>
          </div>
        )}
      </div>
    );
  }
}

FolderTree.propTypes = {
  folders: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string,
    kind: PropTypes.string,
  })).isRequired,
  assets: PropTypes.array.isRequired,
  selectedFolderId: PropTypes.string,
  onSelectFolder: PropTypes.func.isRequired,
  onAddFolder: PropTypes.func.isRequired,
  onRenameFolder: PropTypes.func.isRequired,
  onDeleteFolder: PropTypes.func.isRequired,
};

export default FolderTree;
