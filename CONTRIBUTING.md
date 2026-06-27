# 贡献指南

感谢您对 Mindustry-Scratch 在线图形化 Mod 编辑器项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 1. 报告 Bug

如果您发现了 Bug，请通过 GitHub Issues 报告，并包含以下信息：

- Bug 的详细描述
- 复现步骤
- 预期行为与实际行为
- 截图或错误日志
- 运行环境信息

### 2. 提交功能请求

如果您有好的想法，请通过 GitHub Issues 提交功能请求，并说明：

- 功能描述
- 使用场景
- 实现建议（可选）

### 3. 提交代码

#### 开发环境设置

1. Fork 本仓库
2. 克隆到本地：
   ```bash
   git clone https://github.com/your-username/mindustry-mod-creator.git
   cd mindustry-mod-creator
   ```
3. 安装依赖：
   ```bash
   bun install
   ```
4. 创建新分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 和 Prettier 配置
- 编写清晰的提交信息
- 为新功能添加测试
- 更新相关文档

#### 提交流程

1. 确保代码通过 lint 检查：
   ```bash
   bun run lint
   ```
2. 运行测试：
   ```bash
   bun run test
   ```
3. 提交更改：
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```
4. 推送到远程：
   ```bash
   git push origin feature/your-feature-name
   ```
5. 创建 Pull Request

#### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

### 4. 文档贡献

- 改进现有文档
- 翻译文档
- 编写教程和示例

## 开发指南

### 项目结构

```
mindustry-mod-creator/
├── packages/
│   ├── frontend/          # 前端 React 应用
│   └── backend/           # 后端 NestJS 应用
├── docker/                # Docker 相关配置
└── docs/                  # 项目文档
```

### 开发命令

```bash
# 启动开发服务器
bun run dev

# 构建项目
bun run build

# 运行测试
bun run test

# 代码检查
bun run lint

# 格式化代码
bun run format
```

### 环境变量

复制 `.env.example` 为 `.env` 并配置相应环境变量。

## 行为准则

- 尊重他人
- 保持专业
- 建设性讨论
- 包容不同观点

## 联系方式

如有任何问题，请通过以下方式联系我们：

- GitHub Issues
- 邮箱：zsd_2024@outlook.com

感谢您的贡献！