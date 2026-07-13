# Changelog

## 2026-07-12

### 新增: 中文翻译全面修校 (Pass 1-3)
- 创建缺失的 TetheredUnitType.json zh_CN 文件
- 修复 17 个空字段 zh_CN 文件
- 新增 1797+ 个字段翻译（localizedName + notes）
- 修复 488 处 notes 缺少 **Notes**: 标记的格式问题
- 读取本地 Mindustry 源码 (`core/src/mindustry/`) 为所有字段添加准确的 JavaDoc 翻译和补充说明
- 替换低质量占位 notes 为基于源码分析的正式中文文档
- 覆盖 133 个 zh_CN 文件，共修改 10139 行

### 修复: terminology 统一
- "瓦片" → "图格"（更新 8 个文件，统一 Mindustry 社区术语）
- research.json 补充 6 个科技树子字段翻译（parent, requirements, objectives, root, name, requiresUnlock）

### 重构: 下拉框提取为 SearchableSelect 组件
- 新建 `searchable-select.jsx` + `.css` 独立组件
- 内聚管理 open/close/search 状态和 portal 定位
- 替换 `renderSearchableSelect`、`renderContentSelect`、`getDropdownPortalStyle` 等旧代码
- 替换全部 `_dd` 状态+`handleEnum*`/`handleContent*` 事件处理

### 修复: 科技树目标编辑器增强
- `root`/`requiresUnlock` 添加 localizedName（根节点/需要前置解锁）
- 目标类型下拉改用 SearchableSelect，显示中文标签（生产/研究/通关关卡/在某关卡/在某行星）
- 目标内容/关卡/行星字段改用 SearchableSelect，根据目标类型动态筛选内容列表（Produce→Item+UnitType+Block，Research→Block 等）

### 新增: SearchableSelect 多类型分类筛选
- 选项携带 `type` 字段时自动检测多类型
- 类型 >= 2 时显示 pill 样式的分类筛选按钮
- `visibleTypes` prop 控制显示的筛选类型（Research 字段只显示 Block/Item/Liquid/UnitType/SectorPreset/Planet）
- `labelMap` prop 映射类型英文→中文标签

## 2026-07-13

### 修复: 补全 VANILLA_CONTENT 缺失内容类型
- 新增 Planet (4 个行星), SectorPreset (51 个关卡), Weather (5 种天气), Sound (60+ 音效), BulletType (50+ 子弹类型)
- 修复 SectorComplete/OnSector/OnPlanet 目标类型下拉为空的问题

### 修复: research 父节点字段支持全内容筛选
- 移除 `ENHANCED_RESEARCH.parent` 的 `type: 'Block'` 限制
- `renderSubFieldControl` 新增 `parentFieldName` 参数
- parent 字段现在显示全 Research 内容类型（Block/Item/Liquid/UnitType/SectorPreset/Planet）并支持分类筛选

## 2026-07-12

### 新增: objectives 类型鉴别编辑器
- `renderObjectivesArray` 自定义数组渲染器，根据 objective type 动态显示对应子字段
- 支持 5 种 Mindustry 目标类型: Produce, Research, SectorComplete, OnSector, OnPlanet
- 兼容旧版字符串格式（如 `"copper"`），提供 "→" 按钮一键转换为 `{type:"Produce",content:"copper"}`
- 新增按钮创建结构化的 `{type, ...}` 对象
- 覆盖 `renderField` 顶层 + `renderSubFieldControl` 子字段双入口

## 2026-07-11

### 修复: forceTeam 颜色使用原版 RNG
- 100% 复现 Mindustry 队伍颜色算法
- 使用 arc Rand.java 的 xorshift128+ + murmurHash3
- seed=8，先消费 3 个随机数 (Mathf.random × 3)
- 队伍 7~255 各消费 3 个 nextFloat 生成 HSV
- 颜色应用到文字而非圆点

### 修复: forceTeam 显示全部 256 个队伍
- 从只显示 7 个命名队伍改为显示 0~255 全部队伍 + -1（默认）
- 队伍 7~255 无名字，仅显示数字
- Neoplastic 无官方译名，保持原名

### 修复: forceTeam 选项显示数字
- 选项显示 `0 - 灰(Derelict)` 而非 `灰(Derelict)`
- 用户可看到队伍 ID

### 修复: getFieldLabel 标签显示 Bug
- `getFieldLabel()` 不再返回 fieldName 作为 fallback（返回 null）
- 数组子字段标签: `getFieldLabel() || sf.localizedName || sf.name`
- 主字段标签: `getFieldLabel() || field.name`

### 重构: 移除 NAME_TO_TYPE，直接修 Schema
- 移除 NAME_TO_TYPE 映射 + JS 字符串匹配逻辑
- 批量修正 45+ curated Schema 中 item/bullet/sound/effect/status/liquid 等字段
- 新增 `Effect` 到 `REFERENCE_TYPES`
- `VANILLA_CONTENT` 添加 StatusEffect (23 项) + Effect (265 项)

### 修复: 类型鉴别子字段
- `Ability.json`: LiquidExplodeAbility.liquid, LiquidRegenAbility.liquid, SpawnDeathAbility.unit, UnitSpawnAbility.unit
- `Bullet.json`: spawnUnit, despawnUnit, puddleLiquid, liquid (LiquidBulletType), trailEffect2 (56 fields)
- `Draw.json`: DrawLiquidRegion.liquid, DrawPumpLiquid.liquid, DrawTurret.liquid

### 重构: 高级模式提升为全局设置
- 高级模式开关从 json-editor 局部状态移至编辑菜单（加速模式下方）
- `render-interface.jsx` 持有 `advancedMode` 状态，通过 gui 链传递
- `getCuratedTypes()` 从文件系统程序化获取精选类型列表（无需硬编码）
- 非高级模式：新建菜单只显示有 curated schema 的内容类型
- 重命名 8 个单位变体 curated 文件（mech→MechUnitType 等），修复查找 Bug
- 移除全部 curated schema 中的 `localizedName`/`description` 字段

### 修复: 中文翻译校订
- WallCrafter: 贴壁钻机→墙壁粉碎机
- BurstDrill: 脉冲钻机→冲击钻头

## Earlier
- forceTeam 初始实现（NAME_TO_TYPE 方式）
- research 字段增强：parent 选择器显示所有内容类型
- 空字符串 research 显示完整对象编辑器
