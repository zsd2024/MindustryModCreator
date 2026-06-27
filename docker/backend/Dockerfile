FROM node:18-alpine as build

WORKDIR /app

# 安装 bun
RUN npm install -g bun

# 复制 package.json 文件
COPY package.json bun.lockb* ./
COPY packages/backend/package.json ./packages/backend/

# 安装依赖
RUN bun install

# 复制源代码
COPY packages/backend/ ./packages/backend/

# 构建后端
RUN bun run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 安装生产依赖
COPY --from=build /app/packages/backend/package.json ./
RUN npm install --only=production

# 复制构建结果
COPY --from=build /app/packages/backend/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main.js"]