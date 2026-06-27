# API 文档

## 基础信息

- 基础路径: `/api/v1`
- 响应格式: JSON
- 认证方式: 无（开发阶段）

## 编译接口

### 提交编译任务

**POST** `/api/v1/compile`

提交 Mod 编译任务。

#### 请求体

```json
{
  "manifest": {
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
        "folder_1": {
          "id": "folder_1",
          "type": "folder",
          "name": "防御",
          "parentId": null
        },
        "content_1": {
          "id": "content_1",
          "type": "content",
          "name": "titanium-wall",
          "contentType": "block",
          "parentId": "folder_1",
          "hjsonSchema": {
            "health": 800,
            "size": 1,
            "requirements": [
              {
                "item": "titanium",
                "amount": 6
              }
            ]
          },
          "javaBlocks": {},
          "hasCustomLogic": false,
          "iconBase64": "iVBORw0KGgo..."
        }
      }
    }
  },
  "userId": "user123",
  "projectId": "project456",
  "priority": 0
}
```

#### 响应

```json
{
  "success": true,
  "jobId": "job_789",
  "message": "编译任务已提交，请稍后查询状态"
}
```

### 查询编译任务状态

**GET** `/api/v1/compile/status/:jobId`

查询编译任务状态。

#### 路径参数

- `jobId`: 任务 ID

#### 响应

```json
{
  "id": "job_789",
  "status": "completed",
  "progress": 100,
  "result": {
    "downloadUrl": "https://minio.example.com/mindustry-mods/my-awesome-mod.jar",
    "fileSize": 12345
  },
  "error": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:01:00.000Z"
}
```

## 项目接口

### 创建项目

**POST** `/api/v1/projects`

创建新项目。

#### 请求体

```json
{
  "name": "my-awesome-mod",
  "displayName": "我的牛逼Mod",
  "description": "A test mod.",
  "userId": "user123",
  "manifest": {
    // ... ModManifest 数据
  }
}
```

#### 响应

```json
{
  "id": "project_123",
  "name": "my-awesome-mod",
  "displayName": "我的牛逼Mod",
  "description": "A test mod.",
  "userId": "user123",
  "manifest": {
    // ... ModManifest 数据
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 获取项目列表

**GET** `/api/v1/projects`

获取项目列表。

#### 查询参数

- `userId`: 用户 ID（可选）

#### 响应

```json
[
  {
    "id": "project_123",
    "name": "my-awesome-mod",
    "displayName": "我的牛逼Mod",
    "description": "A test mod.",
    "userId": "user123",
    "manifest": {
      // ... ModManifest 数据
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 获取项目详情

**GET** `/api/v1/projects/:id`

获取项目详情。

#### 路径参数

- `id`: 项目 ID

#### 响应

```json
{
  "id": "project_123",
  "name": "my-awesome-mod",
  "displayName": "我的牛逼Mod",
  "description": "A test mod.",
  "userId": "user123",
  "manifest": {
    // ... ModManifest 数据
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 更新项目

**PUT** `/api/v1/projects/:id`

更新项目。

#### 路径参数

- `id`: 项目 ID

#### 请求体

```json
{
  "displayName": "我的牛逼Mod v2",
  "description": "A better test mod.",
  "manifest": {
    // ... 更新后的 ModManifest 数据
  }
}
```

#### 响应

```json
{
  "id": "project_123",
  "name": "my-awesome-mod",
  "displayName": "我的牛逼Mod v2",
  "description": "A better test mod.",
  "userId": "user123",
  "manifest": {
    // ... 更新后的 ModManifest 数据
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:01:00.000Z"
}
```

### 删除项目

**DELETE** `/api/v1/projects/:id`

删除项目。

#### 路径参数

- `id`: 项目 ID

#### 响应

204 No Content

## 任务接口

### 获取任务列表

**GET** `/api/v1/jobs`

获取任务列表。

#### 查询参数

- `status`: 任务状态过滤（可选）
- `userId`: 用户 ID（可选）

#### 响应

```json
[
  {
    "id": "job_789",
    "status": "completed",
    "progress": 100,
    "result": {
      "downloadUrl": "https://minio.example.com/mindustry-mods/my-awesome-mod.jar",
      "fileSize": 12345
    },
    "error": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:01:00.000Z"
  }
]
```

### 获取任务详情

**GET** `/api/v1/jobs/:id`

获取任务详情。

#### 路径参数

- `id`: 任务 ID

#### 响应

```json
{
  "id": "job_789",
  "status": "completed",
  "progress": 100,
  "result": {
    "downloadUrl": "https://minio.example.com/mindustry-mods/my-awesome-mod.jar",
    "fileSize": 12345
  },
  "error": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:01:00.000Z"
}
```

### 取消任务

**DELETE** `/api/v1/jobs/:id`

取消任务。

#### 路径参数

- `id`: 任务 ID

#### 响应

204 No Content

## 健康检查

### 服务状态

**GET** `/api/v1/health`

检查服务状态。

#### 响应

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "mindustry-mod-creator-backend",
  "version": "1.0.0"
}
```

## 错误响应

所有错误响应格式如下：

```json
{
  "statusCode": 400,
  "message": "错误信息",
  "error": "Bad Request"
}
```

### 常见错误码

- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误