# 部署指南

## 环境要求

- Docker >= 20.10
- Docker Compose >= 2.0
- Node.js >= 18.0.0 (可选，用于本地开发)
- Bun >= 1.0.0 (可选，用于本地开发)

## 快速部署

### 1. 克隆项目

```bash
git clone https://github.com/your-username/mindustry-mod-creator.git
cd mindustry-mod-creator
```

### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```bash
# 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=pass
DB_NAME=mindustry_scratch

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379

# MinIO 配置
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=mindustry-mods

# Docker 配置
DOCKER_SOCKET=/var/run/docker.sock
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 访问服务

- TurboWarp 前端: http://localhost:8601 (dev server)
- 后端 API: http://localhost:3000
- API 文档: http://localhost:3000/api
- MinIO 控制台: http://localhost:9001

## 生产环境部署

### 1. 配置域名和 SSL

修改 `docker/frontend/nginx.conf`，配置域名和 SSL 证书：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... 其他配置
}
```

### 2. 配置环境变量

在生产环境中，建议使用以下配置：

```bash
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=your-db-host
DB_USERNAME=your-db-user
DB_PASSWORD=your-strong-password
DB_NAME=mindustry_scratch

# Redis 配置
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# MinIO 配置
MINIO_ENDPOINT=your-minio-host
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_BUCKET=mindustry-mods
```

### 3. 数据库迁移

首次部署时，需要运行数据库迁移：

```bash
docker-compose exec backend npm run migration:run
```

### 4. 备份策略

#### 数据库备份

```bash
# 备份 PostgreSQL
docker-compose exec postgres pg_dump -U user mindustry_scratch > backup.sql

# 恢复 PostgreSQL
docker-compose exec -T postgres psql -U user mindustry_scratch < backup.sql
```

#### MinIO 备份

```bash
# 备份 MinIO 数据
docker-compose exec minio mc mirror /data /backup
```

## 监控和日志

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 健康检查

```bash
# 检查后端健康状态
curl http://localhost:3000/api/v1/health

# 检查前端健康状态
curl http://localhost/health
```

## 扩展和优化

### 水平扩展

```bash
# 扩展后端服务
docker-compose up -d --scale backend=3

# 扩展编译沙箱
docker-compose up -d --scale compiler-sandbox=5
```

### 性能优化

1. **数据库优化**
   - 配置连接池
   - 添加索引
   - 定期清理过期数据

2. **Redis 优化**
   - 配置最大内存
   - 使用持久化
   - 配置集群

3. **MinIO 优化**
   - 配置生命周期策略
   - 使用 CDN
   - 配置压缩

## 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose ps postgres
   
   # 查看数据库日志
   docker-compose logs postgres
   ```

2. **Redis 连接失败**
   ```bash
   # 检查 Redis 状态
   docker-compose ps redis
   
   # 测试 Redis 连接
   docker-compose exec redis redis-cli ping
   ```

3. **Docker 权限问题**
   ```bash
   # 检查 Docker socket 权限
   ls -la /var/run/docker.sock
   
   # 添加用户到 docker 组
   sudo usermod -aG docker $USER
   ```

4. **编译沙箱失败**
   ```bash
   # 检查编译镜像
   docker images mindustry-compiler:jdk17
   
   # 手动构建编译镜像
   docker-compose build compiler-sandbox
   ```

### 重置环境

```bash
# 停止所有服务
docker-compose down

# 删除所有数据
docker-compose down -v

# 重新启动
docker-compose up -d
```

## 更新升级

### 更新代码

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build

# 重启服务
docker-compose up -d
```

### 数据库迁移

```bash
# 运行迁移
docker-compose exec backend npm run migration:run

# 回滚迁移
docker-compose exec backend npm run migration:revert
```