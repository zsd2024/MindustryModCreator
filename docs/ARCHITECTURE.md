# 架构设计文档

## 系统架构概述

Mindustry-Scratch 在线图形化 Mod 编辑器采用**前后端分离 + 异步容器化编译**架构。

### 架构拓扑图

```text
[ 浏览器前端 (React + 魔改 Turbowarp) ]
   │
   ├─ 1. 资产浏览器：树形管理 Content (虚拟文件夹)
   ├─ 2. 智能编辑区：HJSON 可视化表单 / Java 上下文积木 (自动切换)
   └─ 3. 状态与转译：Redux 状态管理 -> 生成 ModManifest JSON
   │
   ▼ (POST /api/v1/compile 提交完整 ModManifest)
[ Node.js 后端 (NestJS) ]
   │
   ├─ 4. 任务调度：BullMQ + Redis (异步处理编译任务)
   ├─ 5. 目录构建器：解析 JSON，在内存/临时目录生成 Mindustry 标准目录树
   └─ 6. 容器编排：Dockerode (调用 Docker API 启动编译沙箱)
         │
         ▼
[ Docker 编译沙箱 (Eclipse Temurin JDK 17 + Mindustry API) ]
   │
   ├─ 7. 编译：javac 编译 Java 源码
   └─ 8. 打包：jar 命令将 classes 和 content/ 目录打包为 .jar
   │
   ▼
[ 对象存储 (MinIO / S3) ] <── 返回下载 URL 给前端
```

## 核心技术栈选型

| 层级 | 技术选型 | 选型理由 |
| :--- | :--- | :--- |
| **前端框架** | React 18 + TypeScript | Turbowarp/Scratch 原生生态，类型安全。 |
| **图形化引擎** | 魔改 `scratch-gui` & `scratch-vm` | 复用成熟的积木渲染和 AST 遍历能力。 |
| **表单引擎** | `react-jsonschema-form` + 自定义组件 | 将 JSON Schema 快速转化为新手友好的可视化 UI。 |
| **后端框架** | NestJS (Node.js) | 企业级架构，自带模块化、依赖注入，适合复杂业务。 |
| **任务队列** | BullMQ + Redis | 处理耗时的 Docker 编译任务，防止阻塞主线程。 |
| **容器控制** | `dockerode` | Node.js 原生控制 Docker API，实现沙箱编译。 |
| **数据存储** | PostgreSQL + Prisma | 存储用户、项目元数据。 |
| **文件存储** | MinIO (兼容 S3) | 存储项目快照 (`.msproj`)、图标和编译产物 (`.jar`)。 |

## 前端架构

### 界面布局重构

```text
+-------------------------+-------------------------------------+-------------------+
| [ 1. 内容资产区 ]       | [ 2. 智能编辑区 (核心改造区) ]        | [ 3. 舞台/预览 ]  |
| (原角色/精灵区)         | (原代码/脚本区)                     |                   |
|                         |                                     |   (Mindustry      |
| 🌍 全局 Mod (Stage)     |  [ 📊 基础配置 (HJSON 表单) ]        |    游戏画面       |
| 📦 物品 (Items)         |  或                                 |    实时预览)      |
| 🧱 方块 (Blocks)        |  [ 🧩 自定义逻辑 (Java 积木) ]       |                   |
|   └─ 📁 防御            |                                     |                   |
|      └─ 🟩 钛墙         |                                     |                   |
+-------------------------+-------------------------------------+-------------------+
| [ 4. 资产详情区 (原造型/声音区) ]：管理当前选中内容的 Icon (32x32) 和 Sound       |
+---------------------------------------------------------------------------------+
```

### 内容资产区：树形文件夹管理

**痛点解决**：Mindustry Mod 内容极多，扁平列表无法管理。

- **虚拟树形结构**：支持用户创建多级文件夹（如 `方块/防御/墙壁`）。
- **交互**：支持拖拽排序、右键菜单（新建、重命名、删除）。
- **底层映射**：前端的文件夹**仅用于视觉分类**。在数据模型中，通过 `parentId` 维护树形关系。

### 智能编辑区：双模式自动切换

当用户选中一个 Content（如“钛墙”）时，中间编辑区根据状态自动切换：

#### 模式 A：HJSON 图形化表单（新手友好）

**触发条件**：Content 未开启“自定义逻辑”，或 Java 逻辑为空。

**UI 设计（去代码化）**：

- **数值 (health)**：滑动条 (Slider) + 数字输入框。
- **尺寸 (size)**：可视化 1x1 ~ 3x3 网格点选器。
- **颜色 (color)**：圆形色块预览 + 调色板弹窗（自动转 Hex）。
- **数组 (requirements)**：卡片式列表（左侧物品图标下拉，右侧数量输入）。
- **分组折叠**：分为“基础属性”、“外观特效”、“生产消耗”等手风琴折叠面板。

#### 模式 B：Java 上下文积木（进阶逻辑）

**触发条件**：用户点击“+ 添加高级行为”，或该 Content 本身必须依赖 Java（如自定义单位 AI）。

**UI 设计（上下文感知）**：

- **动态积木面板**：左侧积木区**只渲染与当前 Content 类型相关的积木**。选中 Block 时，显示 `[当方块更新]`、`[获取相邻方块]`；选中 Unit 时，显示 `[单位移动]`、`[寻找目标]`。
- **上下文积木**：提供 `[当前方块 (this)]`、`[所在格子 (tile)]` 等专属积木，帮助新手理解 Java 面向对象中的实例概念。

## 核心数据模型与流转

### 前端 Redux 状态设计 (TypeScript)

采用“扁平化节点 + parentId”的方式存储树形结构，性能最优。

```typescript
// 资产节点 (可以是文件夹，也可以是具体内容)
interface AssetNode {
  id: string;               // UUID
  type: 'folder' | 'content'; 
  name: string;             // 显示名 (如 "钛墙" 或 "防御")
  parentId: string | null;  // 父节点 ID，null 表示在顶层分类下
  order: number;            // 排序权重
  
  // 仅当 type === 'content' 时存在
  contentType?: 'item' | 'block' | 'unit' | 'liquid'; 
  vmTargetId?: string;      // 关联 Scratch VM 中的 target ID
  editorMode: 'hjson' | 'java'; // 当前编辑模式
  
  // 数据载荷
  hjsonSchema: Record<string, any>; // 表单数据 (JSON 格式)
  javaBlocks: any;          // 积木 AST 数据 (Scratch VM 格式)
  hasCustomLogic: boolean;  // 是否启用了 Java 逻辑
}
```

### 前后端交互协议：ModManifest

前端点击“编译”时，将 Redux 状态序列化为以下 JSON 提交给后端：

```json
{
  "modMeta": {
    "name": "my-awesome-mod",
    "displayName": "我的牛逼Mod",
    "author": "Dev",
    "description": "A test mod.",
    "version": "1.0",
    "minGameVersion": "145"
  },
  "globalLogic": "/* 全局 Stage 区域生成的 Java 代码字符串 */",
  "assetTree": {
    "nodes": {
      "folder_1": { "id": "folder_1", "type": "folder", "name": "防御", "parentId": null },
      "content_1": { 
        "id": "content_1", "type": "content", "name": "titanium-wall", 
        "contentType": "block", "parentId": "folder_1",
        "hjsonSchema": { "health": 800, "size": 1, "requirements": [{"item": "titanium", "amount": 6}] },
        "javaBlocks": { /* Scratch VM Blocks JSON */ },
        "hasCustomLogic": false,
        "iconBase64": "iVBORw0KGgo..." 
      }
    }
  }
}
```

## 后端架构与编译引擎

### 目录构建器 (Directory Builder)

Node.js 后端接收到 `ModManifest` 后，**忽略前端的虚拟文件夹层级**，严格按照 Mindustry 规范在内存（或临时目录）中构建物理目录：

```text
temp_build_dir/
├── mod.json                 <-- 由 modMeta 生成
├── content/
│   ├── blocks/
│   │   ├── titanium-wall.hjson  <-- 由 hjsonSchema 转换 (使用 hjson-js 库)
│   │   └── icons/
│   │       └── titanium-wall.png <-- 由 iconBase64 解码
│   └── items/
└── src/
    └── com/mymod/
        ├── MyMod.java           <-- 由 globalLogic 生成
        └── content/blocks/
            └── TitaniumWall.java <-- 由 javaBlocks 转译生成 (仅当 hasCustomLogic=true)
```

### Java 代码转译引擎 (Java Transpiler)

这是后端（或前端转译后提交）的核心。遍历 `javaBlocks` (Scratch AST)，生成 Java 代码。

**关键规则**：生成的 Java 类名必须与 HJSON 的 `name` 首字母大写后完全一致。

```java
// 生成的 TitaniumWall.java 示例
package com.mymod.content.blocks;
import mindustry.world.blocks.defense.Wall;

public class TitaniumWall extends Wall {
    public TitaniumWall(String name) {
        super(name);
        // [构造函数积木转译区]
    }

    @Override
    public void updateTile() {
        super.updateTile();
        // [当方块更新 积木转译区]
        // 例如：if(this.health < this.maxHealth / 2) { ... }
    }
}
```

### Docker 沙箱编译流程

使用 `dockerode` 启动临时容器：

1.  **基础镜像**：`eclipse-temurin:17-jdk`（预装 Mindustry API jar 包，避免每次下载）。
2.  **执行命令**：
    ```bash
    # 1. 编译 Java
    javac -cp "/libs/mindustry.jar" -d /out/classes $(find /src -name "*.java")
    # 2. 打包 Jar (将 classes 和 content 目录合并)
    jar cf /output/mod.jar -C /out/classes . -C /src/content .
    ```
3.  **清理**：编译完成后，提取 `/output/mod.jar`，上传至 MinIO，销毁容器。

## 关键技术难点与解决方案

### 6.1 难点：HJSON 与 Java 的命名强一致性

**问题**：如果用户在 HJSON 中把方块名改为 `laser-drill`，但 Java 类名没改，Mindustry 会加载失败。

**解决**：在前端 UI 中，Content 的“内部名称 (Internal Name)”是**全局唯一且锁定**的标识符。HJSON 的 `name` 字段、生成的 Java 类名、资产树的节点名，全部由同一个 Redux 状态变量控制。修改名称时，触发全局重命名重构。

### 6.2 难点：Mindustry 复杂属性的表单化

**问题**：Mindustry 的 Block 有上百个属性，手写表单不现实。

**解决**：

1.  提取 Mindustry 源码中常用类的字段，编写 **JSON Schema**。
2.  使用 `react-jsonschema-form` 渲染。
3.  对于极复杂字段（如 `consumes`），开发**自定义 UI 组件**（如物品消耗卡片列表）替换默认输入框。

### 6.3 难点：积木上下文与 Java `this` 的映射

**问题**：新手不理解 Java 中的 `this` 指向。

**解决**：在 Turbowarp 扩展中，不直接暴露 `this`。而是提供语义化积木：

*   `[获取当前方块血量]` -> 转译为 `this.health`
*   `[获取所在格子 X 坐标]` -> 转译为 `this.tile.x`

转译器在生成 Java 方法时，自动处理这些上下文变量的注入。

## 部署架构

推荐使用 Docker Compose 进行一键部署：

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      - REDIS_URL=redis://redis:6379
      - DB_URL=postgresql://user:pass@postgres:5432/mindustry_scratch
      - MINIO_ENDPOINT=minio:9000
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # 允许后端调用宿主机的 Docker

  compiler-sandbox:
    image: mindustry-compiler:jdk17 # 预装 Mindustry API 的编译镜像
    # 不直接暴露端口，由后端通过 dockerode 动态创建临时容器

  redis:
    image: redis:alpine
  postgres:
    image: postgres:15
  minio:
    image: minio/minio
```