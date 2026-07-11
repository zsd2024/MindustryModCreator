# Changelog

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

## Earlier
- forceTeam 初始实现（NAME_TO_TYPE 方式）
- research 字段增强：parent 选择器显示所有内容类型
- 空字符串 research 显示完整对象编辑器
