# Content System

## REFERENCE_TYPES
当字段 type 在以下集合中时，渲染内容选择器下拉：
`Item`, `Liquid`, `Block`, `UnitType`, `BulletType`, `StatusEffect`, `Effect`, `Weather`, `Planet`, `SectorPreset`, `Sound`, `TextureRegion`, `Research`

## VANILLA_CONTENT (`vanilla-content.js`)
- 哈表: `{contentType: [{name, cn}, ...]}`
- 来源: Mindustry 源码 + bundle_zh_CN.properties
- 包含所有原版内容项
- 当前内容类型: Block (410+), Item (40+), Liquid (8), UnitType (50+), StatusEffect (23), Effect (265+), BulletType (50+), Planet (4), SectorPreset (51), Weather (5), Sound (65+)
- REFERENCE_TYPES 中的 `TextureRegion` 暂无 VANILLA_CONTENT 条目（由 sprite 动态加载）
- 新增内容类型时需在此添加条目

## Content Type Utils (`content-type-utils.js`)
- `contentTypeToFolder(contentType)` - content type → 导出文件夹名
- `contentTypeKey(contentType)` - content type → bundle 前缀 (用于 key)
- `bundleKeyForContent(contentType, name)` - 生成 bundle key

## Content Type → Export Folder Mapping
| ContentType | Folder | Bundle Key Prefix |
|---|---|---|
| Block | blocks/ | block. |
| Item | items/ | item. |
| Liquid | liquids/ | liquid. |
| UnitType | units/ | unit. |
| BulletType | bullets/ | bullet. |
| ... | ... | ... |

## Mod Export (`mod-export.js`)
- 使用 JSZip 生成 .zip
- `diffData()` 只输出与默认值不同的字段
- Block/Unit 自动注入 `type` 字段
- Bundle key 按字母排序
- Java 源文件生成到对应包路径
