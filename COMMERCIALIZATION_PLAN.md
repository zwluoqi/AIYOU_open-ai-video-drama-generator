# AIYOUSTUDIO 商业化全面规划文档

> **版本**: v1.0
> **日期**: 2026-01-06
> **目标**: 构建支持数万用户的商业化 AI 创作平台

---

## 📊 目录

1. [当前系统分析](#1-当前系统分析)
2. [节点系统标准化](#2-节点系统标准化)
3. [数据模型设计](#3-数据模型设计)
4. [技术架构规划](#4-技术架构规划)
5. [积分消耗系统](#5-积分消耗系统)
6. [用户账号体系](#6-用户账号体系)
7. [商业化策略](#7-商业化策略)
8. [实施路线图](#8-实施路线图)

---

## 1. 当前系统分析

### 1.1 核心功能盘点

#### **前端架构**
- **框架**: React 19 + TypeScript + Vite
- **状态管理**: React Hooks (本地状态)
- **数据持久化**: LocalStorage (客户端)
- **国际化**: 自定义 i18n 系统 (中英文)

#### **节点类型** (10种)
| 节点类型 | 代码名称 | 主要功能 | 当前 API |
|---------|---------|---------|----------|
| 创意描述 | PROMPT_INPUT | 文本输入节点 | - |
| 文字生图 | IMAGE_GENERATOR | Gemini 图像生成 | gemini-2.5-flash-image |
| 文生视频 | VIDEO_GENERATOR | Veo 视频生成 | veo-3.1-fast-generate |
| 灵感音乐 | AUDIO_GENERATOR | TTS 音频生成 | gemini-2.5-flash-preview-tts |
| 视频分析 | VIDEO_ANALYZER | 视频内容分析 | gemini-3-pro-preview |
| 图像编辑 | IMAGE_EDITOR | 图像修改 | gemini-2.5-flash-image |
| 剧本大纲 | SCRIPT_PLANNER | 故事大纲生成 | gemini-2.5-flash |
| 剧本分集 | SCRIPT_EPISODE | 分集剧本生成 | gemini-2.5-flash |
| 分镜生成 | STORYBOARD_GENERATOR | 电影分镜设计 | gemini-3-pro-preview |
| 角色设计 | CHARACTER_NODE | 角色档案生成 | gemini-3-pro-preview |

#### **视频生成策略** (5种)
1. **DEFAULT**: 标准文生视频/图生视频
2. **CONTINUE**: 剧情延展 (基于最后一帧)
3. **CUT**: 局部分镜 (放大重拍)
4. **FIRST_LAST_FRAME**: 首尾插帧
5. **CHARACTER_REF**: 角色迁移

---

### 1.2 当前架构问题

#### ❌ **致命问题**
1. **无后端**: 所有数据存储在 LocalStorage,无法多设备同步
2. **API 密钥暴露**: 客户端直接调用 Gemini API,密钥泄露风险
3. **无用户系统**: 无法识别用户身份,无法计费
4. **无并发控制**: 无法防止恶意刷量
5. **无内容审核**: 生成内容无过滤机制

#### ⚠️ **扩展性问题**
1. **单体前端**: 所有逻辑在 App.tsx (1636行),难以维护
2. **无状态管理库**: 复杂状态用 useState,性能瓶颈
3. **无错误边界**: 节点崩溃会影响整个画布
4. **无 WebSocket**: 实时协作功能缺失

---

## 2. 节点系统标准化

### 2.1 节点输入输出标准化

#### **节点 I/O 类型定义**

```typescript
// 标准输入输出接口
interface NodeIO {
  type: IOType;
  dataType: DataType;
  required: boolean;
  multiple: boolean; // 是否支持多输入
  validator?: (data: any) => boolean;
}

enum IOType {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT'
}

enum DataType {
  TEXT = 'TEXT',           // 纯文本
  IMAGE = 'IMAGE',         // Base64 图像
  VIDEO = 'VIDEO',         // 视频 URI
  AUDIO = 'AUDIO',         // 音频 URI
  JSON = 'JSON',           // 结构化数据
  METADATA = 'METADATA'    // 元数据 (如视频对象)
}
```

---

### 2.2 节点依赖关系图 (DAG)

#### **完整节点依赖矩阵**

| 节点 (行) → 可连接到 (列) | PROMPT | IMAGE_GEN | VIDEO_GEN | AUDIO_GEN | VIDEO_ANALYZER | IMAGE_EDITOR | SCRIPT_PLANNER | SCRIPT_EPISODE | STORYBOARD | CHARACTER |
|---------------------------|--------|-----------|-----------|-----------|----------------|--------------|----------------|----------------|------------|-----------|
| **PROMPT_INPUT**          | ❌     | ✅        | ✅        | ✅        | ❌             | ❌           | ✅             | ❌             | ❌         | ❌        |
| **IMAGE_GENERATOR**       | ❌     | ✅        | ✅        | ❌        | ❌             | ✅           | ❌             | ❌             | ❌         | ❌        |
| **VIDEO_GENERATOR**       | ❌     | ❌        | ✅        | ❌        | ✅             | ❌           | ❌             | ❌             | ❌         | ❌        |
| **AUDIO_GENERATOR**       | ❌     | ❌        | ❌        | ❌        | ❌             | ❌           | ❌             | ❌             | ❌         | ❌        |
| **VIDEO_ANALYZER**        | ❌     | ❌        | ✅        | ❌        | ❌             | ❌           | ✅             | ❌             | ❌         | ❌        |
| **IMAGE_EDITOR**          | ❌     | ✅        | ✅        | ❌        | ❌             | ✅           | ❌             | ❌             | ❌         | ❌        |
| **SCRIPT_PLANNER**        | ❌     | ❌        | ❌        | ❌        | ❌             | ❌           | ❌             | ✅             | ❌         | ✅        |
| **SCRIPT_EPISODE**        | ❌     | ✅        | ❌        | ❌        | ❌             | ❌           | ❌             | ❌             | ✅         | ✅        |
| **STORYBOARD_GENERATOR**  | ❌     | ✅        | ✅        | ❌        | ❌             | ❌           | ❌             | ❌             | ❌         | ❌        |
| **CHARACTER_NODE**        | ❌     | ✅        | ✅        | ❌        | ❌             | ❌           | ❌             | ❌             | ❌         | ❌        |

#### **依赖规则详解**

```typescript
const NODE_DEPENDENCY_RULES: Record<NodeType, {
  allowedInputs: NodeType[];
  allowedOutputs: NodeType[];
  inputConstraints: {
    minInputs: number;
    maxInputs: number;
    requiredTypes?: DataType[];
  };
}> = {
  PROMPT_INPUT: {
    allowedInputs: [], // 无前置依赖
    allowedOutputs: [
      'IMAGE_GENERATOR',
      'VIDEO_GENERATOR',
      'AUDIO_GENERATOR',
      'SCRIPT_PLANNER'
    ],
    inputConstraints: { minInputs: 0, maxInputs: 0 }
  },

  IMAGE_GENERATOR: {
    allowedInputs: ['PROMPT_INPUT', 'IMAGE_GENERATOR', 'IMAGE_EDITOR'],
    allowedOutputs: ['IMAGE_GENERATOR', 'VIDEO_GENERATOR', 'IMAGE_EDITOR'],
    inputConstraints: {
      minInputs: 0,
      maxInputs: 4, // 支持多图参考
      requiredTypes: [DataType.TEXT, DataType.IMAGE]
    }
  },

  VIDEO_GENERATOR: {
    allowedInputs: [
      'PROMPT_INPUT',
      'IMAGE_GENERATOR',
      'VIDEO_GENERATOR',
      'IMAGE_EDITOR',
      'STORYBOARD_GENERATOR',
      'CHARACTER_NODE'
    ],
    allowedOutputs: ['VIDEO_GENERATOR', 'VIDEO_ANALYZER'],
    inputConstraints: {
      minInputs: 0,
      maxInputs: 2, // 文本+图像 或 文本+视频
      requiredTypes: [DataType.TEXT]
    }
  },

  AUDIO_GENERATOR: {
    allowedInputs: ['PROMPT_INPUT'],
    allowedOutputs: [], // 音频是终点节点
    inputConstraints: {
      minInputs: 1,
      maxInputs: 1,
      requiredTypes: [DataType.TEXT]
    }
  },

  VIDEO_ANALYZER: {
    allowedInputs: ['VIDEO_GENERATOR'],
    allowedOutputs: ['VIDEO_GENERATOR', 'SCRIPT_PLANNER'],
    inputConstraints: {
      minInputs: 1,
      maxInputs: 1,
      requiredTypes: [DataType.VIDEO]
    }
  },

  IMAGE_EDITOR: {
    allowedInputs: ['IMAGE_GENERATOR'],
    allowedOutputs: ['IMAGE_GENERATOR', 'VIDEO_GENERATOR', 'IMAGE_EDITOR'],
    inputConstraints: {
      minInputs: 1,
      maxInputs: 1,
      requiredTypes: [DataType.IMAGE, DataType.TEXT]
    }
  },

  SCRIPT_PLANNER: {
    allowedInputs: ['PROMPT_INPUT', 'VIDEO_ANALYZER'],
    allowedOutputs: ['SCRIPT_EPISODE', 'CHARACTER_NODE'],
    inputConstraints: {
      minInputs: 0,
      maxInputs: 2,
      requiredTypes: [DataType.TEXT]
    }
  },

  SCRIPT_EPISODE: {
    allowedInputs: ['SCRIPT_PLANNER'],
    allowedOutputs: ['STORYBOARD_GENERATOR', 'CHARACTER_NODE', 'IMAGE_GENERATOR'],
    inputConstraints: {
      minInputs: 1,
      maxInputs: 1,
      requiredTypes: [DataType.JSON] // 需要完整大纲
    }
  },

  STORYBOARD_GENERATOR: {
    allowedInputs: ['SCRIPT_EPISODE', 'PROMPT_INPUT'],
    allowedOutputs: ['IMAGE_GENERATOR', 'VIDEO_GENERATOR'],
    inputConstraints: {
      minInputs: 1,
      maxInputs: 1,
      requiredTypes: [DataType.TEXT]
    }
  },

  CHARACTER_NODE: {
    allowedInputs: ['SCRIPT_PLANNER', 'SCRIPT_EPISODE'],
    allowedOutputs: ['IMAGE_GENERATOR', 'VIDEO_GENERATOR'],
    inputConstraints: {
      minInputs: 1,
      maxInputs: 1,
      requiredTypes: [DataType.TEXT, DataType.JSON]
    }
  }
};
```

---

### 2.3 节点连接验证逻辑

```typescript
// 连接前验证
function validateConnection(
  fromNode: AppNode,
  toNode: AppNode,
  existingConnections: Connection[]
): { valid: boolean; error?: string } {

  // 1. 检查是否允许连接
  const rules = NODE_DEPENDENCY_RULES[fromNode.type];
  if (!rules.allowedOutputs.includes(toNode.type)) {
    return {
      valid: false,
      error: `${fromNode.type} 不能连接到 ${toNode.type}`
    };
  }

  // 2. 检查输入数量限制
  const targetRules = NODE_DEPENDENCY_RULES[toNode.type];
  const currentInputCount = existingConnections.filter(
    c => c.to === toNode.id
  ).length;

  if (currentInputCount >= targetRules.inputConstraints.maxInputs) {
    return {
      valid: false,
      error: `${toNode.type} 最多只能接收 ${targetRules.inputConstraints.maxInputs} 个输入`
    };
  }

  // 3. 检查循环依赖 (防止无限循环)
  if (hasCircularDependency(fromNode.id, toNode.id, existingConnections)) {
    return {
      valid: false,
      error: '检测到循环依赖,无法连接'
    };
  }

  // 4. 检查数据类型兼容性
  const fromOutput = getNodeOutputType(fromNode);
  const requiredTypes = targetRules.inputConstraints.requiredTypes || [];

  if (requiredTypes.length > 0 && !requiredTypes.includes(fromOutput)) {
    return {
      valid: false,
      error: `数据类型不匹配: ${fromOutput} → ${requiredTypes.join('|')}`
    };
  }

  return { valid: true };
}

// 检测循环依赖 (DAG 验证)
function hasCircularDependency(
  fromId: string,
  toId: string,
  connections: Connection[]
): boolean {
  const visited = new Set<string>();

  function dfs(currentId: string): boolean {
    if (currentId === fromId) return true;
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    const outgoing = connections.filter(c => c.from === currentId);
    return outgoing.some(c => dfs(c.to));
  }

  return dfs(toId);
}
```

---

## 3. 数据模型设计

### 3.1 用户表 (Users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- 账户信息
  credits INTEGER DEFAULT 1000, -- 积分余额
  subscription_tier VARCHAR(20) DEFAULT 'FREE', -- FREE | BASIC | PRO | ENTERPRISE
  subscription_expires_at TIMESTAMP,

  -- 统计
  total_nodes_created INTEGER DEFAULT 0,
  total_images_generated INTEGER DEFAULT 0,
  total_videos_generated INTEGER DEFAULT 0,
  total_audio_generated INTEGER DEFAULT 0,

  -- 元数据
  avatar_url TEXT,
  language VARCHAR(5) DEFAULT 'zh', -- zh | en
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,

  -- 索引
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_subscription (subscription_tier, subscription_expires_at)
);
```

---

### 3.2 工作流表 (Workflows)

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 基本信息
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE,

  -- 工作流数据 (JSON)
  nodes JSONB NOT NULL, -- AppNode[]
  connections JSONB NOT NULL, -- Connection[]
  groups JSONB, -- Group[]

  -- 统计
  fork_count INTEGER DEFAULT 0, -- 被复制次数
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,

  -- 标签
  tags TEXT[], -- ['剧本', '分镜', 'AI视频']
  category VARCHAR(50), -- 'VIDEO' | 'IMAGE' | 'SCRIPT' | 'MIXED'

  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_executed_at TIMESTAMP,

  -- 索引
  INDEX idx_user_id (user_id),
  INDEX idx_public (is_public, created_at),
  INDEX idx_template (is_template),
  INDEX idx_tags USING GIN (tags)
);
```

---

### 3.3 生成记录表 (Generations)

```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,

  -- 节点信息
  node_type VARCHAR(50) NOT NULL, -- NodeType enum
  node_id VARCHAR(100), -- 前端节点 ID (可选)

  -- 生成参数
  input_prompt TEXT,
  input_images JSONB, -- 输入图像 URLs
  input_videos JSONB, -- 输入视频 URLs
  generation_mode VARCHAR(50), -- DEFAULT | CONTINUE | CUT 等

  -- 生成结果
  output_type VARCHAR(20) NOT NULL, -- IMAGE | VIDEO | AUDIO | TEXT
  output_url TEXT, -- 生成的资源 URL
  output_metadata JSONB, -- 额外元数据 (分辨率、时长等)

  -- 模型信息
  model_name VARCHAR(100), -- gemini-2.5-flash-image
  model_version VARCHAR(50),

  -- 成本与状态
  credits_consumed INTEGER NOT NULL, -- 消耗积分
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING | PROCESSING | SUCCESS | FAILED
  error_message TEXT,

  -- 性能指标
  processing_time_ms INTEGER, -- 处理耗时
  retry_count INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- 索引
  INDEX idx_user_id (user_id, created_at DESC),
  INDEX idx_status (status),
  INDEX idx_node_type (node_type),
  INDEX idx_workflow_id (workflow_id)
);
```

---

### 3.4 资产库表 (Assets)

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,

  -- 资产信息
  asset_type VARCHAR(20) NOT NULL, -- IMAGE | VIDEO | AUDIO | CHARACTER
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL, -- 存储URL (OSS/S3)
  thumbnail_url TEXT,

  -- 文件元数据
  file_size BIGINT, -- 字节
  mime_type VARCHAR(100),
  duration INTEGER, -- 音视频时长 (秒)
  resolution VARCHAR(20), -- 1920x1080

  -- 角色专用字段
  character_data JSONB, -- CharacterProfile

  -- 分类与标签
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  folder_id UUID REFERENCES asset_folders(id) ON DELETE SET NULL,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 索引
  INDEX idx_user_id (user_id, created_at DESC),
  INDEX idx_asset_type (asset_type),
  INDEX idx_tags USING GIN (tags),
  INDEX idx_favorite (user_id, is_favorite)
);
```

---

### 3.5 积分交易记录表 (Credit_Transactions)

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 交易类型
  transaction_type VARCHAR(20) NOT NULL, -- PURCHASE | CONSUME | REFUND | REWARD

  -- 金额
  amount INTEGER NOT NULL, -- 正数为增加,负数为消耗
  balance_after INTEGER NOT NULL, -- 交易后余额

  -- 关联信息
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  payment_id VARCHAR(100), -- 支付平台订单号

  -- 描述
  description TEXT,
  metadata JSONB, -- 额外信息

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),

  -- 索引
  INDEX idx_user_id (user_id, created_at DESC),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_payment_id (payment_id)
);
```

---

### 3.6 订阅套餐表 (Subscription_Plans)

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 套餐信息
  tier VARCHAR(20) UNIQUE NOT NULL, -- FREE | BASIC | PRO | ENTERPRISE
  name_zh VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,

  -- 定价
  monthly_price DECIMAL(10, 2) NOT NULL, -- 月费 (CNY)
  yearly_price DECIMAL(10, 2), -- 年费 (优惠价)

  -- 权益
  monthly_credits INTEGER NOT NULL, -- 每月赠送积分
  max_concurrent_jobs INTEGER DEFAULT 3, -- 最大并发任务数
  max_storage_gb INTEGER DEFAULT 10, -- 存储空间 (GB)
  priority_queue BOOLEAN DEFAULT FALSE, -- 优先队列

  -- 功能开关
  features JSONB, -- {"advanced_models": true, "api_access": true}

  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 预置套餐数据
INSERT INTO subscription_plans (tier, name_zh, name_en, monthly_price, yearly_price, monthly_credits, max_concurrent_jobs, max_storage_gb, features) VALUES
('FREE', '免费版', 'Free', 0, 0, 1000, 1, 5, '{"api_access": false}'),
('BASIC', '基础版', 'Basic', 29, 290, 5000, 3, 50, '{"api_access": false}'),
('PRO', '专业版', 'Pro', 99, 990, 20000, 10, 200, '{"api_access": true, "advanced_models": true}'),
('ENTERPRISE', '企业版', 'Enterprise', 999, 9990, 200000, 50, 2000, '{"api_access": true, "custom_models": true, "dedicated_support": true}');
```

---

## 4. 技术架构规划

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                               │
│  Web浏览器 (React) | 移动端 (React Native) | API客户端       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      CDN / 负载均衡 (Cloudflare)              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Kong / Nginx)                │
│  ├─ 认证鉴权 (JWT)                                           │
│  ├─ 限流熔断 (Rate Limiting)                                 │
│  ├─ API 版本管理                                             │
│  └─ 请求日志                                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
     ┌───────────┼───────────┬───────────┐
     ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 用户服务 │ │工作流服务│ │生成服务 │ │支付服务 │
│ (Auth)  │ │(Workflow)│ │ (Gen)  │ │(Payment)│
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │
     └───────────┼───────────┴───────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     消息队列 (Redis / RabbitMQ)               │
│  ├─ 生成任务队列 (FIFO)                                       │
│  ├─ 优先级队列 (会员优先)                                     │
│  └─ 回调通知队列 (WebSocket)                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Worker 集群 (K8s)                       │
│  ├─ Image Worker (调用 Gemini Image API)                     │
│  ├─ Video Worker (调用 Veo API)                              │
│  ├─ Audio Worker (调用 TTS API)                              │
│  └─ Script Worker (调用 Gemini Text API)                     │
└────────────────┬────────────────────────────────────────────┘
                 │
     ┌───────────┼───────────┬───────────┐
     ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│PostgreSQL│ │  Redis  │ │   OSS   │ │Gemini API│
│ (主库)   │ │ (缓存)  │ │(文件存储)│ │(Google) │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

### 4.2 技术栈选型

#### **后端技术栈 (推荐)**

| 层级 | 技术选型 | 理由 |
|-----|---------|------|
| **开发语言** | Node.js (TypeScript) | 与前端共享代码,开发效率高 |
| **Web 框架** | NestJS | 企业级架构,依赖注入,模块化 |
| **数据库** | PostgreSQL 14+ | 强大的 JSONB 支持,适合复杂查询 |
| **缓存** | Redis 7+ | 高性能缓存,支持发布订阅 |
| **消息队列** | BullMQ (基于 Redis) | 轻量级,支持优先级队列 |
| **文件存储** | 阿里云 OSS / AWS S3 | 成本低,CDN 加速 |
| **实时通信** | Socket.IO | WebSocket 支持,断线重连 |
| **认证** | JWT + Passport.js | 无状态认证,易扩展 |
| **API 文档** | Swagger (OpenAPI) | 自动生成文档 |
| **监控** | Prometheus + Grafana | 开源,强大的指标系统 |
| **日志** | Winston + ELK | 结构化日志,便于检索 |
| **容器化** | Docker + Kubernetes | 自动扩缩容,高可用 |

#### **前端优化**

| 优化项 | 方案 |
|-------|------|
| **状态管理** | Zustand (轻量) 或 Redux Toolkit |
| **请求库** | Axios + SWR (缓存) |
| **组件库** | Radix UI + Tailwind CSS |
| **构建优化** | Vite + Code Splitting |
| **错误监控** | Sentry |
| **性能监控** | Vercel Analytics |

---

### 4.3 核心 API 设计

#### **RESTful API 结构**

```typescript
// 用户认证
POST   /api/v1/auth/register          # 注册
POST   /api/v1/auth/login             # 登录
POST   /api/v1/auth/logout            # 登出
POST   /api/v1/auth/refresh           # 刷新 Token
GET    /api/v1/auth/me                # 获取当前用户信息

// 工作流管理
GET    /api/v1/workflows              # 获取工作流列表
POST   /api/v1/workflows              # 创建工作流
GET    /api/v1/workflows/:id          # 获取工作流详情
PUT    /api/v1/workflows/:id          # 更新工作流
DELETE /api/v1/workflows/:id          # 删除工作流
POST   /api/v1/workflows/:id/fork     # 复制工作流
POST   /api/v1/workflows/:id/execute  # 执行工作流

// 节点生成
POST   /api/v1/generate/image         # 生成图像
POST   /api/v1/generate/video         # 生成视频
POST   /api/v1/generate/audio         # 生成音频
POST   /api/v1/generate/script        # 生成剧本
POST   /api/v1/generate/character     # 生成角色
GET    /api/v1/generate/status/:jobId # 查询生成状态

// 资产管理
GET    /api/v1/assets                 # 获取资产列表
POST   /api/v1/assets                 # 上传资产
DELETE /api/v1/assets/:id             # 删除资产
GET    /api/v1/assets/:id/download    # 下载资产

// 积分系统
GET    /api/v1/credits/balance        # 查询余额
GET    /api/v1/credits/transactions   # 交易记录
POST   /api/v1/credits/purchase       # 购买积分

// 订阅管理
GET    /api/v1/subscriptions/plans    # 获取套餐列表
POST   /api/v1/subscriptions/subscribe # 订阅套餐
POST   /api/v1/subscriptions/cancel   # 取消订阅
```

---

## 5. 积分消耗系统

### 5.1 积分消耗定价表

| 节点类型 | 基础消耗 | 高级选项 | 定价逻辑 |
|---------|---------|---------|---------|
| **PROMPT_INPUT** | 0 | - | 免费 |
| **IMAGE_GENERATOR** | 10 | +5 (高分辨率) | 1张图 = 10积分 |
| **VIDEO_GENERATOR** | 50-200 | +50 (4K), +30 (长视频) | 根据时长和分辨率 |
| **AUDIO_GENERATOR** | 5 | - | 每秒 0.5 积分 |
| **VIDEO_ANALYZER** | 20 | - | 固定 20 积分 |
| **IMAGE_EDITOR** | 15 | - | 1次编辑 = 15积分 |
| **SCRIPT_PLANNER** | 30 | - | 固定 30 积分 |
| **SCRIPT_EPISODE** | 20 | - | 每集 20 积分 |
| **STORYBOARD_GENERATOR** | 50 | - | 固定 50 积分 |
| **CHARACTER_NODE** | 40 | +10 (3视图) | 每个角色 40 积分 |

#### **视频生成策略消耗**

```typescript
const VIDEO_PRICING = {
  DEFAULT: (duration: number, resolution: string) => {
    const basePrice = 50;
    const durationMultiplier = Math.ceil(duration / 5); // 每5秒
    const resolutionMultiplier = resolution === '4k' ? 2 : 1;
    return basePrice * durationMultiplier * resolutionMultiplier;
  },
  CONTINUE: (duration: number) => 80 + duration * 2, // 续写更贵
  CUT: (duration: number) => 100 + duration * 3, // 放大重拍最贵
  FIRST_LAST_FRAME: (duration: number) => 120, // 插帧固定价
  CHARACTER_REF: (duration: number) => 90 + duration * 2
};
```

---

### 5.2 积分扣除流程

```typescript
// 后端服务: GenerationService

async function executeNodeGeneration(
  userId: string,
  nodeType: NodeType,
  params: GenerationParams
): Promise<GenerationResult> {

  // 1. 计算所需积分
  const requiredCredits = calculateCredits(nodeType, params);

  // 2. 检查余额
  const user = await User.findById(userId);
  if (user.credits < requiredCredits) {
    throw new InsufficientCreditsError(
      `需要 ${requiredCredits} 积分,当前余额 ${user.credits}`
    );
  }

  // 3. 预扣积分 (乐观锁)
  await User.updateOne(
    { id: userId, credits: { $gte: requiredCredits } },
    { $inc: { credits: -requiredCredits } }
  );

  // 4. 创建生成记录
  const generation = await Generation.create({
    userId,
    nodeType,
    creditsConsumed: requiredCredits,
    status: 'PENDING',
    params
  });

  // 5. 记录交易
  await CreditTransaction.create({
    userId,
    transactionType: 'CONSUME',
    amount: -requiredCredits,
    balanceAfter: user.credits - requiredCredits,
    generationId: generation.id,
    description: `生成 ${nodeType}`
  });

  // 6. 提交到任务队列
  await generationQueue.add({
    generationId: generation.id,
    userId,
    nodeType,
    params
  }, {
    priority: user.subscriptionTier === 'PRO' ? 1 : 5 // 会员优先
  });

  return { jobId: generation.id };
}
```

---

### 5.3 失败退款机制

```typescript
async function handleGenerationFailure(
  generationId: string,
  error: Error
): Promise<void> {

  const generation = await Generation.findById(generationId);

  // 更新状态
  await Generation.updateOne(
    { id: generationId },
    {
      status: 'FAILED',
      errorMessage: error.message,
      completedAt: new Date()
    }
  );

  // 退款
  await User.updateOne(
    { id: generation.userId },
    { $inc: { credits: generation.creditsConsumed } }
  );

  // 记录退款交易
  await CreditTransaction.create({
    userId: generation.userId,
    transactionType: 'REFUND',
    amount: generation.creditsConsumed,
    generationId,
    description: `生成失败退款: ${error.message}`
  });

  // 发送通知
  await notifyUser(generation.userId, {
    type: 'GENERATION_FAILED',
    message: '生成失败,积分已退回',
    credits: generation.creditsConsumed
  });
}
```

---

## 6. 用户账号体系

### 6.1 认证流程

```typescript
// 注册
POST /api/v1/auth/register
Request:
{
  "email": "user@example.com",
  "username": "creator123",
  "password": "SecurePass123!"
}
Response:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "creator123",
    "credits": 1000,
    "subscriptionTier": "FREE"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}

// 登录
POST /api/v1/auth/login
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
Response:
{
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### 6.2 权限分级

| 功能 | FREE | BASIC | PRO | ENTERPRISE |
|------|------|-------|-----|------------|
| 每月积分 | 1000 | 5000 | 20000 | 200000 |
| 并发任务 | 1 | 3 | 10 | 50 |
| 存储空间 | 5GB | 50GB | 200GB | 2TB |
| 视频导出水印 | ✅ | ❌ | ❌ | ❌ |
| 高级模型 | ❌ | ❌ | ✅ | ✅ |
| API 访问 | ❌ | ❌ | ✅ | ✅ |
| 优先队列 | ❌ | ❌ | ✅ | ✅ |
| 技术支持 | 社区 | 邮件 | 1v1 | 专属 |

---

## 7. 商业化策略

### 7.1 变现模式

#### **核心收入来源**

1. **订阅会员** (60%)
   - 月费/年费订阅
   - 不同等级套餐

2. **积分充值** (25%)
   - 单次购买积分包
   - 定价: 1元 = 100积分
   - 套餐:
     - ¥9.9 = 1000积分
     - ¥29 = 3500积分
     - ¥99 = 15000积分
     - ¥299 = 50000积分

3. **企业定制** (10%)
   - API 接入
   - 私有化部署
   - 定制模型训练

4. **模板市场** (5%)
   - 用户可售卖工作流模板
   - 平台抽成 30%

---

### 7.2 增长策略

#### **用户获取**

1. **免费试用**
   - 注册送 1000 积分
   - 新用户首单 5 折

2. **推荐奖励**
   - 邀请好友注册,双方各得 500 积分
   - 好友订阅,推荐人得 10% 返现

3. **内容营销**
   - 优秀作品展示
   - 创作者分成计划

4. **社交传播**
   - 生成内容带水印(免费用户)
   - 一键分享到社交媒体

---

### 7.3 竞争优势

| 竞品 | AIYOUSTUDIO | Runway | Midjourney |
|------|-------------|--------|------------|
| **节点工作流** | ✅ 可视化 DAG | ❌ | ❌ |
| **剧本到视频** | ✅ 全流程 | ⚠️ 部分 | ❌ |
| **多模态生成** | ✅ 图/视频/音频 | ✅ | ⚠️ 仅图像 |
| **中文支持** | ✅ 原生 | ⚠️ 有限 | ⚠️ 有限 |
| **定价** | ¥29-999/月 | $12-76/月 | $10-60/月 |
| **API 开放** | ✅ PRO+ | ✅ | ❌ |

---

## 8. 实施路线图

### Phase 1: 基础架构 (2-3个月)

#### **Week 1-4: 后端开发**
- [ ] 搭建 NestJS 项目框架
- [ ] 实现用户认证系统 (JWT)
- [ ] 设计并实现数据库表结构
- [ ] 实现 RESTful API (用户/工作流/生成)
- [ ] 集成 Redis 缓存层

#### **Week 5-8: 前后端对接**
- [ ] 前端状态管理重构 (Zustand)
- [ ] API 调用层封装
- [ ] 实现节点依赖验证逻辑
- [ ] WebSocket 实时通知系统
- [ ] 错误处理和监控 (Sentry)

#### **Week 9-12: 积分与支付**
- [ ] 积分消耗系统
- [ ] 支付集成 (微信/支付宝)
- [ ] 订阅管理系统
- [ ] 发票开具功能

---

### Phase 2: 核心优化 (1-2个月)

#### **Week 13-16: 性能优化**
- [ ] AI Worker 集群搭建 (Kubernetes)
- [ ] 任务队列优化 (BullMQ + Redis)
- [ ] 文件存储迁移到 OSS
- [ ] CDN 加速配置
- [ ] 数据库读写分离

#### **Week 17-20: 功能增强**
- [ ] 模板市场上线
- [ ] 资产库管理系统
- [ ] 批量导出功能
- [ ] 协作功能 (多人编辑)

---

### Phase 3: 商业化上线 (1个月)

#### **Week 21-24: 运营准备**
- [ ] 内容审核系统
- [ ] 用户行为分析 (Google Analytics)
- [ ] 客服系统 (工单/在线)
- [ ] 帮助文档和教程
- [ ] Beta 测试 (100 用户)

#### **Week 25-26: 正式发布**
- [ ] 官网上线
- [ ] 社交媒体宣传
- [ ] KOL 合作推广
- [ ] 监控告警系统完善

---

### Phase 4: 持续迭代 (长期)

- 移动端 App (React Native)
- 插件生态 (自定义节点)
- AI 模型微调服务
- 国际化扩展 (日韩/东南亚)

---

## 附录

### A. 关键风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| **API 成本失控** | 中 | 高 | 严格限流,积分预付费 |
| **生成内容违规** | 高 | 高 | 接入内容审核 API |
| **并发峰值** | 中 | 中 | 弹性扩容,优先级队列 |
| **数据泄露** | 低 | 高 | 加密存储,定期渗透测试 |
| **竞品压力** | 高 | 中 | 差异化功能,社区运营 |

---

### B. 成本估算 (月度)

| 项目 | 费用 (¥) | 说明 |
|------|----------|------|
| **服务器** | 5,000 | 4核8G * 5台 |
| **数据库** | 2,000 | RDS PostgreSQL |
| **OSS 存储** | 3,000 | 1TB存储 + 流量 |
| **Gemini API** | 10,000 | 按调用量 |
| **CDN** | 1,500 | 流量费 |
| **监控告警** | 500 | Sentry + Grafana |
| **合计** | 22,000 | 约 $3,000/月 |

---

### C. 盈利预测 (首年)

| 月份 | 注册用户 | 付费用户 | 月收入 (¥) | 成本 (¥) | 利润 (¥) |
|------|---------|---------|-----------|---------|---------|
| M1-3 | 500 | 50 | 5,000 | 22,000 | -17,000 |
| M4-6 | 2,000 | 200 | 30,000 | 25,000 | 5,000 |
| M7-9 | 5,000 | 600 | 90,000 | 30,000 | 60,000 |
| M10-12 | 10,000 | 1,500 | 220,000 | 40,000 | 180,000 |
| **总计** | - | - | 345,000 | 117,000 | **228,000** |

---

**文档作者**: AI Architect
**审核日期**: 2026-01-06
**下次更新**: 根据实施进度动态调整

---

