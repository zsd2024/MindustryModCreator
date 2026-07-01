import JSZip from '@turbowarp/jszip';
// eslint-disable-next-line import/no-unresolved
import hjson from 'hjson';
import downloadBlob from '../../lib/download-blob';

const contentTypeToFolder = {
    Item: 'items',
    Liquid: 'liquids',
    CellLiquid: 'liquids',
    BulletType: 'bullets',
    BasicBulletType: 'bullets',
    ArtilleryBulletType: 'bullets',
    ContinuousBulletType: 'bullets',
    ContinuousFlameBulletType: 'bullets',
    ContinuousLaserBulletType: 'bullets',
    FlakBulletType: 'bullets',
    GasBulletType: 'bullets',
    LiquidBulletType: 'bullets',
    MassDriverBolt: 'bullets',
    MissileBulletType: 'bullets',
    PointBulletType: 'bullets',
    RailBulletType: 'bullets',
    ShrapnelBulletType: 'bullets',
    StatusEffect: 'statuses',
    UnitType: 'units',
    ErekirUnitType: 'units',
    MechUnitType: 'units',
    PayloadUnitType: 'units',
    TankUnitType: 'units',
    LegsUnitType: 'units',
    NavalUnitType: 'units',
    ParticleWeather: 'weather',
    Planet: 'planets',
    SectorPreset: 'sectors'
};

/**
 * @param {string} contentType - content type name
 * @returns {string} folder name
 */
const getContentFolder = function (contentType) {
    return contentTypeToFolder[contentType] || 'blocks';
};

/**
 * @param {Array} folders - folder list
 * @param {string} folderId - folder id
 * @returns {Array} path parts
 */
const findFolderPath = function (folders, folderId) {
    const parts = [];
    let current = folders.find(f => f.id === folderId);
    while (current) {
        parts.unshift(current.name);
        const parentId = current.parentId;
        current = parentId ? folders.find(f => f.id === parentId) : null;
    }
    return parts;
};

/**
 * @param {object} data - form data
 * @returns {string} HJSON string
 */
const buildContentHjson = function (data) {
    const clean = {};
    for (const k of Object.keys(data)) {
        const v = data[k];
        if (v === void 0 || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
        clean[k] = v;
    }
    return `${hjson.stringify(clean, {bracesSameLine: false, emitRootBraces: false})}\n`;
};

/**
 * @param {Array} assets - asset list
 * @param {Array} folders - folder list
 * @param {object} modConfig - mod config
 * @param {object} assetFormData - asset form data map
 */
const exportMod = function (assets, folders, modConfig, assetFormData) {
    const zip = new JSZip();

    const modName = modConfig.name || 'my-mod';

    const meta = {};
    for (const k of Object.keys(modConfig)) {
        const v = modConfig[k];
        if (v === void 0 || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
        if (k === 'texturescale' && v === 1.0) continue;
        if (k === 'hidden' && !v) continue;
        if (k === 'java' && !v) continue;
        if (k === 'iosCompatible' && !v) continue;
        if (k === 'pregenerated' && !v) continue;
        if (k === 'legacyCompatible' && !v) continue;
        meta[k] = v;
    }
    zip.file('mod.hjson', `${hjson.stringify(meta, {bracesSameLine: false})}\n`);

    const javaAssets = assets.filter(a => a.kind === 'java');
    const contentAssets = assets.filter(a => a.kind === 'content');

    for (const asset of contentAssets) {
        const folder = getContentFolder(asset.contentType);
        const data = assetFormData[asset.id];
        if (data && Object.keys(data).length > 0) {
            const hjsonContent = buildContentHjson(data);
            zip.file(`content/${folder}/${asset.name}.hjson`, hjsonContent);
        }
    }

    const bundleAssets = assets.filter(a => a.kind === 'bundle');
    for (const asset of bundleAssets) {
        const data = assetFormData[asset.id];
        if (data && Object.keys(data).length > 0) {
            const lines = Object.keys(data).sort()
                .map(k => `${k}=${data[k]}`);
            zip.file(`bundles/${asset.name}`, `${lines.join('\n')}\n`);
        }
    }

    for (const asset of javaAssets) {
        const pathParts = asset.folderId ? findFolderPath(folders, asset.folderId) : [];
        const pkg = pathParts.filter(p => p !== 'Java 文件').join('/');
        const dir = pkg ? `src/${pkg}/` : 'src/';
        // placeholder content — actual Java code will be added when implemented
        const pkgPath = pkg.replace(/\//g, '.') || 'your';
        const content = `// ${asset.name}.java\n// Java source code\npackage ${pkgPath};\n\n`;
        zip.file(`${dir}${asset.name}.java`, content);
    }

    const hasJava = javaAssets.length > 0;
    if (hasJava) {
        zip.file('build.gradle', `apply plugin: 'java'

version = '1.0'

sourceSets.main.java.srcDirs = ['src']

java.sourceCompatibility = JavaVersion.VERSION_17
java.targetCompatibility = JavaVersion.VERSION_17

repositories{
  mavenCentral()
  maven{ url "https://raw.githubusercontent.com/Anuken/MindustryMaven/master/repositories" }
  maven{ url "https://raw.githubusercontent.com/Anuken/ArcMaven/master/repositories" }
}

dependencies{
  compileOnly "com.github.Anuken:Mindustry:$modConfig.minGameVersion"
  compileOnly "com.github.Anuken:Arc:$modConfig.minGameVersion"
}

jar{
  archiveFileName = "${modName}Desktop.jar"
  from(configurations.runtimeClasspath.collect{ it.isDirectory() ? it : zipTree(it) }){
    exclude("META-INF/", "META-INF/**")
  }
  from(projectDir){ include "mod.hjson" }
  from("assets/"){ include "**" }
}
`);
    }

    const filename = `${modName}.zip`;
    zip.generateAsync({type: 'blob'}).then(blob => {
        downloadBlob(filename, blob);
    });
};

export default exportMod;
