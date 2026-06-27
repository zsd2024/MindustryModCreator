# Mindustry-Scratch 在线图形化 Mod 编辑器

一个**零代码门槛、全在线运行**的 Mindustry Mod 开发平台。通过深度魔改 Turbowarp，将复杂的 Java 面向对象编程和 Mindustry 繁琐的目录结构，转化为直观的"拖拽积木"和"可视化表单"，让普通玩家也能轻松创作 Mod。

## 项目架构

采用**前后端分离 + 异步容器化编译**架构：

```
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

## 技术栈

- **前端**: React 18 + TypeScript + Turbowarp (魔改) + Redux Toolkit
- **后端**: NestJS + BullMQ + PostgreSQL + MinIO
- **编译**: Docker 沙箱 + Eclipse Temurin JDK 17
- **构建工具**: Bun (包管理 + 运行时)

## 开发环境设置

### 前置要求

- [Bun](https://bun.sh/) >= 1.0.0
- [Docker](https://www.docker.com/) (用于编译沙箱)
- [Node.js](https://nodejs.org/) >= 18.0.0 (可选，某些依赖可能需要)

### 安装依赖

```bash
bun install
```

### 开发模式

```bash
# 同时启动前端和后端开发服务器
bun run dev
```

### 构建项目

```bash
bun run build
```

### 运行测试

```bash
bun run test
```

## 项目结构

```
mindustry-mod-creator/
├── packages/
│   ├── frontend/          # 前端 React 应用
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   └── backend/           # 后端 NestJS 应用
│       ├── src/
│       ├── test/
│       └── package.json
├── docker/                # Docker 相关配置
│   ├── frontend/
│   ├── backend/
│   └── compiler/          # 编译沙箱镜像
├── docs/                  # 项目文档
└── package.json           # 根 package.json (workspaces)
```

## 核心特性

### 1. 内容驱动 (Content-Driven)
摒弃传统 IDE 的"文件树"概念，将编辑器核心重构为"游戏内容（方块/物品/单位）"的资产管理。

### 2. 渐进式复杂度 (Progressive Disclosure)
通过"HJSON 表单（基础配置）"与"Java 积木（高级逻辑）"的**智能双模式自动切换**，让新手从填表单开始，平滑过渡到写逻辑。

### 3. 安全隔离编译 (Sandboxed Compilation)
后端采用 Docker 容器化编译，确保代码执行绝对安全，且环境高度一致。

## 演进路线图

### Phase 1: 基础设施与最小闭环 (Weeks 1-3)
- 搭建 NestJS 后端、Redis、PostgreSQL、MinIO
- 实现 Docker 编译沙箱，跑通"提交 Java 字符串 -> 返回 .jar"的最小闭环
- Fork Turbowarp，跑通前端基础框架

### Phase 2: 内容区改造与 HJSON 表单 (Weeks 4-6)
- 将 Sprite 区改造为带文件夹的 Content 资产树
- 实现 Block 和 Item 的 JSON Schema 与可视化表单 UI
- 实现 HJSON 生成器，能够生成纯数据（无 Java 逻辑）的 `.jar`

### Phase 3: 智能双模式与 Java 转译 (Weeks 7-10)
- 开发 Mindustry 专属 Turbowarp 扩展（上下文感知积木）
- 实现 `Java Transpiler`，支持将积木转译为继承自 Mindustry 基类的 Java 文件
- 实现 HJSON 表单与 Java 积木区的**自动切换逻辑**

### Phase 4: 完善、优化与社区功能 (Weeks 11-14)
- 实现用户系统、项目云端保存 (`.msproj` 快照)
- 增加代码预览面板（让用户能看到生成的 Java 和 HJSON，满足极客需求）
- 优化前端性能，处理大型 Mod 的渲染卡顿
- 编写详细的用户文档和视频教程，发布 Beta 版

## 贡献指南

欢迎贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细流程。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。