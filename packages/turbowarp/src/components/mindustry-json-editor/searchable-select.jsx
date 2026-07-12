import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './searchable-select.css';

const DROPDOWN_ESTIMATED_HEIGHT = 260;

class SearchableSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {open: false, search: ''};
        this.triggerRef = React.createRef();
    }

    getPortalStyle () {
        const el = this.triggerRef.current;
        if (!el) return {style: {}, up: false};
        const rect = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const need = Math.min(DROPDOWN_ESTIMATED_HEIGHT, spaceBelow);
        const up = spaceBelow < DROPDOWN_ESTIMATED_HEIGHT && spaceAbove >= need;
        return {
            style: {
                position: 'fixed',
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                zIndex: 1000,
                top: up ? 'auto' : `${rect.bottom}px`,
                bottom: up ? `${window.innerHeight - rect.top}px` : 'auto',
                maxHeight: up
                    ? `${Math.min(DROPDOWN_ESTIMATED_HEIGHT, spaceAbove)}px`
                    : `${Math.min(DROPDOWN_ESTIMATED_HEIGHT, spaceBelow)}px`
            },
            up
        };
    }

    handleToggle = () => {
        this.setState(prev => ({open: !prev.open, search: ''}));
    };

    handleSelect = (optValue) => {
        this.props.onChange(optValue);
        this.setState({open: false, search: ''});
    };

    handleSearchChange = (e) => {
        this.setState({search: e.target.value});
    };

    handleBackdrop = () => {
        this.setState({open: false, search: ''});
    };

    handleDropdownClick = (e) => {
        e.stopPropagation();
    };

    render () {
        const {options, value, placeholder, searchPlaceholder} = this.props;
        const {open, search} = this.state;

        const filtered = options.filter(o => !search ||
            o.value.includes(search) || o.cn.includes(search));
        const selected = options.find(o => o.value === value);

        const trigger = (
            <div className={styles.selectWrap}>
                <div
                    className={styles.selectDisplay}
                    ref={this.triggerRef}
                    onClick={this.handleToggle}
                >
                    <span className={styles.selectDisplayLabel}>
                        {selected ? selected.cn : (value || placeholder || '--')}
                    </span>
                    <span className={styles.selectArrow}>{open ? '▲' : '▼'}</span>
                </div>
            </div>
        );

        if (!open) return trigger;

        const {style: portalStyle, up} = this.getPortalStyle();
        const ddClass = up
            ? `${styles.selectDropdown} ${styles.selectDropdownUp}`
            : styles.selectDropdown;

        return (
            <>
                {trigger}
                {ReactDOM.createPortal(
                    <div
                        className={styles.portalBackdrop}
                        onMouseDown={this.handleBackdrop}
                    >
                        <div
                            className={ddClass}
                            style={portalStyle}
                            onMouseDown={this.handleDropdownClick}
                        >
                            <input
                                type="text"
                                value={search}
                                placeholder={searchPlaceholder || '搜索...'}
                                autoFocus
                                onChange={this.handleSearchChange}
                                className={styles.selectSearch}
                            />
                            <div className={styles.selectOptions}>
                                {filtered.length === 0 && (
                                    <div className={styles.selectEmpty}>无匹配</div>
                                )}
                                {filtered.map(opt => (
                                    <div
                                        key={opt.value}
                                        className={`${styles.selectOption} ${
                                            value === opt.value ? styles.selectOptionActive : ''
                                        }`}
                                        onMouseDown={() => this.handleSelect(opt.value)}
                                    >
                                        <span className={styles.selectOptCn}>{opt.cn}</span>
                                        <span className={styles.selectOptId}>{opt.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </>
        );
    }
}

SearchableSelect.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        cn: PropTypes.string.isRequired,
        color: PropTypes.string
    })).isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    searchPlaceholder: PropTypes.string
};

export default SearchableSelect;
