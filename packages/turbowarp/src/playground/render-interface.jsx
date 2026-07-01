/**
 * Copyright (C) 2021 Thomas Weber
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import {getIsLoading} from '../reducers/project-state.js';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import TWProjectMetaFetcherHOC from '../lib/tw-project-meta-fetcher-hoc.jsx';
import TWStateManagerHOC from '../lib/tw-state-manager-hoc.jsx';
import SBFileUploaderHOC from '../lib/sb-file-uploader-hoc.jsx';
import TWPackagerIntegrationHOC from '../lib/tw-packager-integration-hoc.jsx';
import SettingsStore from '../addons/settings-store-singleton';
import '../lib/tw-fix-history-api';
import GUI from './render-gui.jsx';
import MenuBar from '../components/menu-bar/menu-bar.jsx';
import ProjectInput from '../components/tw-project-input/project-input.jsx';
import FeaturedProjects from '../components/tw-featured-projects/featured-projects.jsx';
import Description from '../components/tw-description/description.jsx';
import BrowserModal from '../components/browser-modal/browser-modal.jsx';
import CloudVariableBadge from '../containers/tw-cloud-variable-badge.jsx';
import TWWindchimeSubmitter from '../containers/tw-windchime-submitter.jsx';
import {isBrowserSupported} from '../lib/tw-environment-support-prober';
import AddonChannels from '../addons/channels';
import {loadServiceWorker} from './load-service-worker';
import runAddons from '../addons/entry';
import InvalidEmbed from '../components/tw-invalid-embed/invalid-embed.jsx';
import {APP_NAME} from '../lib/brand.js';
import exportMod from '../lib/mindustry/mod-export';
import {generateBundleKeys, getBundlePrefix} from '../lib/mindustry/content-type-utils';

import styles from './interface.css';

const isInvalidEmbed = window.parent !== window;

const handleClickAddonSettings = addonId => {
    // addonId might be a string of the addon to focus on, undefined, or an event (treat like undefined)
    const path = process.env.ROUTING_STYLE === 'wildcard' ? 'addons' : 'addons.html';
    const url = `${process.env.ROOT}${path}${typeof addonId === 'string' ? `#${addonId}` : ''}`;
    window.open(url);
};

const messages = defineMessages({
    defaultTitle: {
        defaultMessage: 'Run Scratch projects faster',
        description: 'Title of homepage',
        id: 'tw.guiDefaultTitle'
    }
});

const WrappedMenuBar = compose(
    SBFileUploaderHOC,
    TWPackagerIntegrationHOC
)(MenuBar);

if (AddonChannels.reloadChannel) {
    AddonChannels.reloadChannel.addEventListener('message', () => {
        location.reload();
    });
}

if (AddonChannels.changeChannel) {
    AddonChannels.changeChannel.addEventListener('message', e => {
        SettingsStore.setStoreWithVersionCheck(e.data);
    });
}

runAddons();

const Footer = () => (
    <footer className={styles.footer}>
        <div className={styles.footerContent}>
            <div className={styles.footerText}>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="{APP_NAME} is not affiliated with Scratch, the Scratch Team, or the Scratch Foundation."
                    description="Disclaimer that TurboWarp is not connected to Scratch"
                    id="tw.footer.disclaimer"
                    values={{
                        APP_NAME
                    }}
                />
            </div>

            <div className={styles.footerText}>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="Scratch is a project of the Scratch Foundation. It is available for free at {scratchDotOrg}."
                    description="A disclaimer that Scratch requires when referring to Scratch. {scratchDotOrg} is a link with text 'https://scratch.org/'"
                    id="tw.footer.scratchDisclaimer"
                    values={{
                        scratchDotOrg: (
                            <a
                                href="https://scratch.org/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                {'https://scratch.org/'}
                            </a>
                        )
                    }}
                />
            </div>

            <div className={styles.footerColumns}>
                <div className={styles.footerSection}>
                    <a href="credits.html">
                        <FormattedMessage
                            defaultMessage="Credits"
                            description="Credits link in footer"
                            id="tw.footer.credits"
                        />
                    </a>
                </div>
                <div className={styles.footerSection}>
                    <a href="https://desktop.turbowarp.org/">
                        {/* Do not translate */}
                        {'TurboWarp Desktop'}
                    </a>
                    <a href="https://packager.turbowarp.org/">
                        {/* Do not translate */}
                        {'TurboWarp Packager'}
                    </a>
                    <a href="https://docs.turbowarp.org/embedding">
                        <FormattedMessage
                            defaultMessage="Embedding"
                            description="Link in footer to embedding documentation for embedding link"
                            id="tw.footer.embed"
                        />
                    </a>
                    <a href="https://docs.turbowarp.org/url-parameters">
                        <FormattedMessage
                            defaultMessage="URL Parameters"
                            description="Link in footer to URL parameters documentation"
                            id="tw.footer.parameters"
                        />
                    </a>
                    <a href="https://docs.turbowarp.org/">
                        <FormattedMessage
                            defaultMessage="Documentation"
                            description="Link in footer to additional documentation"
                            id="tw.footer.documentation"
                        />
                    </a>
                </div>
                <div className={styles.footerSection}>
                    <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">
                        <FormattedMessage
                            defaultMessage="Feedback & Bugs"
                            description="Link to feedback/bugs page"
                            id="tw.feedback"
                        />
                    </a>
                    <a href="https://github.com/TurboWarp/">
                        <FormattedMessage
                            defaultMessage="Source Code"
                            description="Link to source code"
                            id="tw.code"
                        />
                    </a>
                    <a href="privacy.html">
                        <FormattedMessage
                            defaultMessage="Privacy Policy"
                            description="Link to privacy policy"
                            id="tw.privacy"
                        />
                    </a>
                </div>
            </div>
        </div>
    </footer>
);

let _assetIdCounter = 0;
const genId = function (prefix) {
    _assetIdCounter += 1;
    return `${prefix}_${Date.now()}_${_assetIdCounter}`;
};

const buildProjectData = function (state) {
    return JSON.stringify({
        version: 1,
        modConfig: state.modConfig,
        folders: state.folders,
        assets: state.assets,
        assetData: state.assetFormData
    });
};

class Interface extends React.Component {
    constructor (props) {
        super(props);
        const initialAssets = [];
        const initialSelectedId = null;
        const modConfig = {
            name: 'my-mod',
            displayName: 'My Mod',
            author: '',
            version: '1.0',
            subtitle: '',
            description: '',
            main: '',
            repo: '',
            minGameVersion: '146',
            dependencies: [],
            softDependencies: [],
            hidden: false,
            java: false,
            iosCompatible: false,
            pregenerated: false,
            legacyCompatible: false,
            texturescale: 1.0
        };
        const bundleEn = {id: '__bundle_en__', kind: 'bundle', name: 'bundle.properties', folderId: 'root_bundles'}; // eslint-disable-line max-len
        const bundleZh = {id: '__bundle_zh__', kind: 'bundle', name: 'bundle_zh_CN.properties', folderId: 'root_bundles'}; // eslint-disable-line max-len
        const bundleKeys = generateBundleKeys(initialAssets, modConfig);
        const initialState = {
            folders: [
                {id: 'root_json', name: 'JSON 内容', parentId: null, kind: 'content'},
                {id: 'root_java', name: 'Java 文件', parentId: null, kind: 'java'},
                {id: 'root_bundles', name: '本地化文件', parentId: null, kind: 'bundle'}
            ],
            assets: [
                {id: '__mod_config__', kind: 'modconfig', name: 'mod.hjson', folderId: 'root_json'},
                bundleEn, bundleZh,
                ...initialAssets
            ],
            selectedAssetId: initialSelectedId || '__mod_config__',
            selectedFolderId: null,
            assetFormData: {
                [bundleEn.id]: bundleKeys
            },
            modConfig
        };
        this.state = initialState;

        // Override VM save to return project file when in Mindustry mode
        if (this.props.vm) {
            const originalSave = this.props.vm.saveProjectSb3.bind(this.props.vm);
            const self = this;
            this.props.vm.saveProjectSb3 = function (type) {
                const state = self.state;
                const hasMindustry = state.assets && state.assets.some(
                    a => a.kind === 'content' || a.kind === 'modconfig' || a.kind === 'java'
                );
                if (hasMindustry) {
                    const data = buildProjectData(state);
                    const blob = new Blob([data], {type: 'application/json'});
                    return Promise.resolve(blob);
                }
                return originalSave(type);
            };
        }

        this.handleUpdateProjectTitle = this.handleUpdateProjectTitle.bind(this);
        this.handleSelectAsset = this.handleSelectAsset.bind(this);
        this.handleJsonFormChange = this.handleJsonFormChange.bind(this);
        this.handleAddContent = this.handleAddContent.bind(this);
        this.handleAddJava = this.handleAddJava.bind(this);
        this.handleDuplicateAsset = this.handleDuplicateAsset.bind(this);
        this.handleAddBundle = this.handleAddBundle.bind(this);
        this.handleSelectFolder = this.handleSelectFolder.bind(this);
        this.handleAddFolder = this.handleAddFolder.bind(this);
        this.handleRenameFolder = this.handleRenameFolder.bind(this);
        this.handleDeleteFolder = this.handleDeleteFolder.bind(this);
        this.handleRenameAsset = this.handleRenameAsset.bind(this);

        this.handleDeleteAsset = this.handleDeleteAsset.bind(this);
        this.handleModConfigChange = this.handleModConfigChange.bind(this);
        this.handleExport = this.handleExport.bind(this);
        this.handleImportProject = this.handleImportProject.bind(this);
    }

    componentDidUpdate (prevProps) {
        if (prevProps.isLoading && !this.props.isLoading) {
            loadServiceWorker();
        }
    }

    handleSelectAsset (assetId) {
        this.setState({selectedAssetId: assetId});
    }

    handleSelectFolder (folderId) {
        this.setState({selectedFolderId: folderId});
    }

    handleJsonFormChange (data) {
        const assetId = this.state.selectedAssetId;
        if (!assetId) return;
        this.setState(prev => ({
            assetFormData: {...prev.assetFormData, [assetId]: data}
        }));
    }

    handleAddContent (name, type) {
        const newAsset = {
            id: genId('content'),
            kind: 'content',
            name,
            contentType: type,
            folderId: this.state.selectedFolderId &&
                !['root_json', 'root_java', 'root_bundles'].includes(this.state.selectedFolderId) ?
                this.state.selectedFolderId :
                'root_json'
        };
        this.setState(prev => {
            const newKeys = generateBundleKeys([newAsset], prev.modConfig);
            let bundleData = {...prev.assetFormData[prev.assets.find(a => a.kind === 'bundle')?.id]};
            if (bundleData) {
                bundleData = {...bundleData, ...newKeys};
            }
            const assetFormData = {...prev.assetFormData};
            const bundleId = prev.assets.find(a => a.kind === 'bundle')?.id;
            if (bundleId && bundleData) {
                assetFormData[bundleId] = bundleData;
            }
            return {
                assets: [...prev.assets, newAsset],
                selectedAssetId: newAsset.id,
                assetFormData
            };
        });
    }

    handleAddJava (name) {
        const newAsset = {
            id: genId('java'),
            kind: 'java',
            name,
            folderId: this.state.selectedFolderId &&
                !['root_json', 'root_java', 'root_bundles'].includes(this.state.selectedFolderId) ?
                this.state.selectedFolderId :
                'root_java'
        };
        this.setState(prev => ({
            assets: [...prev.assets, newAsset],
            selectedAssetId: newAsset.id
        }));
    }

    handleAddBundle (lang) {
        const filename = lang === 'en' ? 'bundle.properties' : `bundle_${lang}.properties`;
        const existing = this.state.assets.find(a => a.kind === 'bundle' && a.name === filename);
        if (existing) {
            this.setState({selectedAssetId: existing.id});
            return;
        }
        const newAsset = {
            id: genId('bundle'),
            kind: 'bundle',
            name: filename,
            folderId: 'root_bundles'
        };
        this.setState(prev => ({
            assets: [...prev.assets, newAsset],
            selectedAssetId: newAsset.id
        }));
    }

    handleAddFolder () {
        const parentId = this.state.selectedFolderId;
        // eslint-disable-next-line no-alert
        const name = prompt('文件夹名：');
        if (!name || !name.trim()) return;
        const kind = parentId ? (
            this.state.folders.find(f => f.id === parentId) || {}
        ).kind : 'content';
        const newFolder = {
            id: genId('folder'),
            name: name.trim(),
            parentId: parentId,
            kind: kind || 'content'
        };
        this.setState(prev => ({
            folders: [...prev.folders, newFolder],
            selectedFolderId: newFolder.id
        }));
    }

    handleRenameFolder (id, name) {
        this.setState(prev => ({
            folders: prev.folders.map(f =>
                (f.id === id ? {...f, name} : f)
            )
        }));
    }

    handleDeleteFolder (id) {
        if (['root_json', 'root_java'].includes(id)) {
            // eslint-disable-next-line no-alert
            alert('不能删除根文件夹');
            return;
        }
        this.setState(prev => {
            const idsToRemove = new Set();
            const collect = fid => {
                idsToRemove.add(fid);
                for (const f of prev.folders) {
                    if (f.parentId === fid) collect(f.id);
                }
            };
            collect(id);
            return {
                folders: prev.folders.filter(f => !idsToRemove.has(f.id)),
                assets: prev.assets.filter(a => !idsToRemove.has(a.folderId)),
                selectedFolderId:
                    prev.selectedFolderId === id ? null : prev.selectedFolderId,
                selectedAssetId:
                    idsToRemove.has(prev.selectedAssetId) ? null : prev.selectedAssetId
            };
        });
    }

    handleRenameAsset (id, name) {
        this.setState(prev => {
            const oldAsset = prev.assets.find(a => a.id === id);
            const newAssets = prev.assets.map(a => (a.id === id ? {...a, name} : a));
            const result = {assets: newAssets};
            if (oldAsset && oldAsset.kind === 'content') {
                const modName = (prev.modConfig && prev.modConfig.name) || 'my-mod';
                const prefix = getBundlePrefix(oldAsset.contentType);
                const oldKeyPrefix = `${prefix}.${modName}-${oldAsset.name}.`;
                const newKeyPrefix = `${prefix}.${modName}-${name}.`;
                const bundleId = prev.assets.find(a => a.kind === 'bundle')?.id;
                if (bundleId && prev.assetFormData[bundleId]) {
                    const oldEntries = prev.assetFormData[bundleId];
                    const newEntries = {};
                    for (const key of Object.keys(oldEntries)) {
                        if (key.startsWith(oldKeyPrefix)) {
                            const suffix = key.slice(oldKeyPrefix.length);
                            newEntries[`${newKeyPrefix}${suffix}`] = oldEntries[key];
                        } else {
                            newEntries[key] = oldEntries[key];
                        }
                    }
                    result.assetFormData = {
                        ...prev.assetFormData,
                        [bundleId]: newEntries
                    };
                }
            }
            return result;
        });
    }

    handleDuplicateAsset (id) {
        this.setState(prev => {
            const src = prev.assets.find(a => a.id === id);
            if (!src) return null;
            const newAsset = {
                ...src,
                id: genId(src.kind),
                name: `${src.name}_副本`
            };
            const result = {
                assets: [...prev.assets, newAsset],
                selectedAssetId: newAsset.id
            };
            if (src.kind === 'content') {
                const newKeys = generateBundleKeys([newAsset], prev.modConfig);
                const assetFormData = {...prev.assetFormData};
                const bundleId = prev.assets.find(a => a.kind === 'bundle')?.id;
                if (bundleId) {
                    assetFormData[bundleId] = {...(assetFormData[bundleId] || {}), ...newKeys};
                }
                result.assetFormData = assetFormData;
            }
            return result;
        });
    }

    handleDeleteAsset (id) {
        if (id === this.state.assets.find(a => a.id === '__url_param__')?.id) return;
        if (id === '__mod_config__') {
            // eslint-disable-next-line no-alert
            alert('不能删除模组配置文件');
            return;
        }
        if (id === '__bundle_en__' || id === '__bundle_zh__') {
            // eslint-disable-next-line no-alert
            alert('不能删除默认本地化文件');
            return;
        }
        this.setState(prev => {
            const oldAsset = prev.assets.find(a => a.id === id);
            const fallback = prev.selectedAssetId === id ?
                (prev.assets.find(a => a.id === '__mod_config__')?.id || null) :
                prev.selectedAssetId;
            const result = {
                assets: prev.assets.filter(a => a.id !== id),
                selectedAssetId: fallback
            };
            if (oldAsset && oldAsset.kind === 'content') {
                const modName = (prev.modConfig && prev.modConfig.name) || 'my-mod';
                const prefix = getBundlePrefix(oldAsset.contentType);
                const oldKeyPrefix = `${prefix}.${modName}-${oldAsset.name}.`;
                const bundleId = prev.assets.find(a => a.kind === 'bundle')?.id;
                if (bundleId && prev.assetFormData[bundleId]) {
                    const oldEntries = prev.assetFormData[bundleId];
                    const newEntries = {};
                    for (const key of Object.keys(oldEntries)) {
                        if (!key.startsWith(oldKeyPrefix)) {
                            newEntries[key] = oldEntries[key];
                        }
                    }
                    result.assetFormData = {
                        ...prev.assetFormData,
                        [bundleId]: newEntries
                    };
                }
            }
            return result;
        });
    }

    handleModConfigChange (key, value) {
        this.setState(prev => ({
            modConfig: {...prev.modConfig, [key]: value}
        }));
    }

    handleImportProject () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mproj,.json';
        input.style = 'display: none';
        input.onchange = e => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data && data.version === 1) {
                        this.setState({
                            assets: data.assets || [],
                            folders: data.folders || [],
                            modConfig: data.modConfig || this.state.modConfig,
                            assetFormData: data.assetData || {},
                            selectedAssetId: null,
                            selectedFolderId: null
                        });
                    } else {
                        // eslint-disable-next-line no-alert
                        alert('无效的项目文件');
                    }
                } catch (err) {
                    // eslint-disable-next-line no-alert
                    alert(`项目文件解析失败：${err.message}`);
                } finally {
                    document.body.removeChild(input);
                }
            };
            reader.readAsText(file);
        };
        document.body.appendChild(input);
        input.click();
    }

    handleExport () {
        const {assets, modConfig} = this.state;
        const hasJava = assets.some(a => a.kind === 'java');
        if (hasJava && !modConfig.java) {
            // eslint-disable-next-line no-alert
            alert('检测到 Java 文件，但 mod.hjson 中未勾选 java: true。\n请先在 mod.hjson 中启用 Java 并设置 main 类。');
            return;
        }
        if (hasJava) {
            // eslint-disable-next-line no-alert
            const proceed = window.confirm(
                '此模组包含 Java 代码，需要 JDK 17 及 Gradle 构建。\n' +
                '参考模板：/home/zyk/.tmp/MindustryWorkspace/MindustryJavaModTemplate\n\n' +
                '仍要导出？'
            );
            if (!proceed) return;
        }
        exportMod(assets, this.state.folders, modConfig, this.state.assetFormData);
    }
    getSelectedAsset () {
        return this.state.assets.find(a => a.id === this.state.selectedAssetId) || null;
    }

    getFilteredAssets () {
        const {assets, selectedFolderId} = this.state;
        if (!selectedFolderId) return assets;
        const folderIds = new Set();
        const collect = id => {
            folderIds.add(id);
            for (const f of this.state.folders) {
                if (f.parentId === id) collect(f.id);
            }
        };
        collect(selectedFolderId);
        return assets.filter(a => !a.folderId || folderIds.has(a.folderId));
    }

    handleUpdateProjectTitle (title, isDefault) {
        if (isDefault || !title) {
            document.title = `${APP_NAME} - ${this.props.intl.formatMessage(messages.defaultTitle)}`;
        } else {
            document.title = `${title} - ${APP_NAME}`;
        }
    }
    render () {
        if (isInvalidEmbed) {
            return <InvalidEmbed />;
        }

        const {
            /* eslint-disable no-unused-vars */
            intl,
            hasCloudVariables,
            description,
            isFullScreen,
            isLoading,
            isPlayerOnly,
            isRtl,
            projectId,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        const isHomepage = isPlayerOnly && !isFullScreen;
        const isEditor = !isPlayerOnly;
        return (
            <div
                className={classNames(styles.container, {
                    [styles.playerOnly]: isHomepage,
                    [styles.editor]: isEditor
                })}
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <TWWindchimeSubmitter />
                {isHomepage ? (
                    <div className={styles.menu}>
                        <WrappedMenuBar
                            canChangeLanguage
                            canManageFiles
                            canChangeTheme
                            enableSeeInside
                            onClickAddonSettings={handleClickAddonSettings}
                        />
                    </div>
                ) : null}
                <div
                    className={styles.center}
                    style={isPlayerOnly ? ({
                        // + 2 accounts for 1px border on each side of the stage
                        width: `${Math.max(480, props.customStageSize.width) + 2}px`
                    }) : null}
                >
                    <GUI
                        onClickAddonSettings={handleClickAddonSettings}
                        onUpdateProjectTitle={this.handleUpdateProjectTitle}
                        selectedAsset={this.getSelectedAsset()}
                        filteredAssets={this.getFilteredAssets()}
                        assets={this.state.assets}
                        selectedAssetId={this.state.selectedAssetId}
                        onSelectAsset={this.handleSelectAsset}
                        onAddContent={this.handleAddContent}
                        onAddJavaFile={this.handleAddJava}
                        onRenameAsset={this.handleRenameAsset}
                        onDuplicateAsset={this.handleDuplicateAsset}
                        onAddBundle={this.handleAddBundle}
                        onDeleteAsset={this.handleDeleteAsset}
                        contentType={this.getSelectedAsset() &&
                            this.getSelectedAsset().kind === 'content' ?
                            this.getSelectedAsset().contentType : null}
                        selectedContentData={
                            this.state.selectedAssetId ?
                                this.state.assetFormData[this.state.selectedAssetId] || {} :
                                {}
                        }
                        onContentDataChange={this.handleJsonFormChange}
                        folders={this.state.folders}
                        selectedFolderId={this.state.selectedFolderId}
                        onSelectFolder={this.handleSelectFolder}
                        onAddFolder={this.handleAddFolder}
                        onRenameFolder={this.handleRenameFolder}
                        onDeleteFolder={this.handleDeleteFolder}
                        modConfig={this.state.modConfig}
                        onModConfigChange={this.handleModConfigChange}
                        onExport={this.handleExport}
                        onImportProject={this.handleImportProject}
                        backpackVisible
                        backpackHost="_local_"
                        {...props}
                    />
                    {isHomepage ? (
                        <React.Fragment>
                            {isBrowserSupported() ? null : (
                                <BrowserModal isRtl={isRtl} />
                            )}
                            <div className={styles.section}>
                                <ProjectInput />
                            </div>
                            {(
                                // eslint-disable-next-line max-len
                                description.instructions === 'unshared' || description.credits === 'unshared'
                            ) && (
                                <div className={classNames(styles.infobox, styles.unsharedUpdate)}>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="Unshared projects are no longer visible."
                                            description="Appears on unshared projects"
                                            id="tw.unshared2.1"
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="For more information, visit: {link}"
                                            description="Appears on unshared projects"
                                            id="tw.unshared.2"
                                            values={{
                                                link: (
                                                    <a
                                                        href="https://docs.turbowarp.org/unshared-projects"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {'https://docs.turbowarp.org/unshared-projects'}
                                                    </a>
                                                )
                                            }}
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            // eslint-disable-next-line max-len
                                            defaultMessage="If the project was shared recently, this message may appear incorrectly for a few minutes."
                                            description="Appears on unshared projects"
                                            id="tw.unshared.cache"
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            // eslint-disable-next-line max-len
                                            defaultMessage="If this project is actually shared, please report a bug."
                                            description="Appears on unshared projects"
                                            id="tw.unshared.bug"
                                        />
                                    </p>
                                </div>
                            )}
                            {hasCloudVariables && projectId !== '0' && (
                                <div className={styles.section}>
                                    <CloudVariableBadge />
                                </div>
                            )}
                            {description.instructions || description.credits ? (
                                <div className={styles.section}>
                                    <Description
                                        instructions={description.instructions}
                                        credits={description.credits}
                                        projectId={projectId}
                                    />
                                </div>
                            ) : null}
                            <div className={styles.section}>
                                <p>
                                    <FormattedMessage
                                        // eslint-disable-next-line max-len
                                        defaultMessage="{APP_NAME} is a Scratch mod that compiles projects to JavaScript to make them run really fast. Try it out by inputting a project ID or URL above or choosing a featured project below."
                                        description="Description of TurboWarp on the homepage"
                                        id="tw.home.description"
                                        values={{
                                            APP_NAME
                                        }}
                                    />
                                </p>
                            </div>
                            <div className={styles.section}>
                                <FeaturedProjects studio="27205657" />
                            </div>
                        </React.Fragment>
                    ) : null}
                </div>
                {isHomepage && <Footer />}
            </div>
        );
    }
}

Interface.propTypes = {
    intl: intlShape,
    vm: PropTypes.object,
    hasCloudVariables: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    description: PropTypes.shape({
        credits: PropTypes.string,
        instructions: PropTypes.string
    }),
    isFullScreen: PropTypes.bool,
    isLoading: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    projectId: PropTypes.string
};

const mapStateToProps = state => ({
    hasCloudVariables: state.scratchGui.tw.hasCloudVariables,
    customStageSize: state.scratchGui.customStageSize,
    description: state.scratchGui.tw.description,
    isFullScreen: state.scratchGui.mode.isFullScreen,
    isLoading: getIsLoading(state.scratchGui.projectState.loadingState),
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    isRtl: state.locales.isRtl,
    projectId: state.scratchGui.projectState.projectId
});

const mapDispatchToProps = () => ({});

const ConnectedInterface = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Interface));

const WrappedInterface = compose(
    AppStateHOC,
    ErrorBoundaryHOC('TW Interface'),
    TWProjectMetaFetcherHOC,
    TWStateManagerHOC,
    TWPackagerIntegrationHOC
)(ConnectedInterface);

export default WrappedInterface;
