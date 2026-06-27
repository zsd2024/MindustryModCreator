FROM node:18-alpine as build

WORKDIR /app

# 安装 bun
RUN npm install -g bun

# 复制 package.json 文件
COPY package.json bun.lockb* ./
COPY packages/frontend/package.json ./packages/frontend/

# 安装依赖
RUN bun install

# 复制源代码
COPY packages/frontend/ ./packages/frontend/

# 构建前端
RUN bun run build

# 生产阶段
FROM nginx:alpine

# 复制构建结果
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]