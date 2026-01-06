# AIYOUSTUDIO 节点系统标准化实施方案

> **补充文档**: 技术实施细节与最佳实践
> **版本**: v1.0
> **相关文档**: COMMERCIALIZATION_PLAN.md

---

## 📋 目录

1. [节点标准化接口](#1-节点标准化接口)
2. [节点验证器实现](#2-节点验证器实现)
3. [后端 API 实现示例](#3-后端-api-实现示例)
4. [前端集成方案](#4-前端集成方案)
5. [性能优化建议](#5-性能优化建议)

---

## 1. 节点标准化接口

### 1.1 标准节点定义

```typescript
// types/node-standard.ts

/**
 * 标准节点接口 - 所有节点必须实现此接口
 */
export interface StandardNode {
  id: string;
  type: NodeType;
  version: string; // 节点版本,用于兼容性管理

  // 位置与样式
  position: { x: number; y: number };
  size?: { width: number; height: number };

  // 核心数据
  config: NodeConfig;
  state: NodeState;

  // 输入输出
  inputs: NodeInput[];
  outputs: NodeOutput[];

  // 元数据
  metadata: NodeMetadata;
}

/**
 * 节点配置 - 用户可编辑的参数
 */
export interface NodeConfig {
  // 基础配置
  title?: string;
  description?: string;

  // 模型配置
  model?: string; // AI 模型名称
  parameters?: Record<string, any>; // 模型参数

  // 生成配置
  prompt?: string;
  aspectRatio?: string;
  resolution?: string;
  count?: number;

  // 策略配置 (仅 VIDEO_GENERATOR)
  generationMode?: VideoGenerationMode;

  // 自定义配置
  custom?: Record<string, any>;
}

/**
 * 节点状态 - 运行时状态
 */
export interface NodeState {
  status: NodeStatus;
  progress?: number; // 0-100
  error?: string;
  startTime?: number;
  endTime?: number;

  // 生成结果
  outputs?: NodeOutputData;

  // 消耗信息
  creditsConsumed?: number;
  processingTime?: number;
}

/**
 * 节点输入定义
 */
export interface NodeInput {
  id: string;
  name: string;
  dataType: DataType;
  required: boolean;
  multiple: boolean; // 支持多输入
  maxConnections?: number;

  // 当前连接
  connectedFrom?: string[]; // 连接的节点 ID

  // 验证规则
  validator?: (data: any) => ValidationResult;
}

/**
 * 节点输出定义
 */
export interface NodeOutput {
  id: string;
  name: string;
  dataType: DataType;

  // 当前数据
  data?: any;
  metadata?: Record<string, any>;
}

/**
 * 节点元数据
 */
export interface NodeMetadata {
  createdAt: number;
  updatedAt: number;
  executionCount?: number;

  // 用户信息 (后端填充)
  userId?: string;
  workflowId?: string;

  // 性能指标
  avgProcessingTime?: number;
  successRate?: number;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}
```

---

### 1.2 节点工厂模式

```typescript
// services/node-factory.ts

/**
 * 节点工厂 - 创建标准化节点实例
 */
export class NodeFactory {

  /**
   * 创建节点实例
   */
  static createNode(
    type: NodeType,
    position: { x: number; y: number },
    initialConfig?: Partial<NodeConfig>
  ): StandardNode {

    const template = NODE_TEMPLATES[type];
    if (!template) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      version: '1.0.0',
      position,

      config: {
        ...template.defaultConfig,
        ...initialConfig
      },

      state: {
        status: NodeStatus.IDLE,
        progress: 0
      },

      inputs: template.inputs.map(input => ({
        ...input,
        id: `${input.name}-${Date.now()}`,
        connectedFrom: []
      })),

      outputs: template.outputs.map(output => ({
        ...output,
        id: `${output.name}-${Date.now()}`
      })),

      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        executionCount: 0
      }
    };
  }

  /**
   * 验证节点连接
   */
  static validateConnection(
    fromNode: StandardNode,
    fromOutputId: string,
    toNode: StandardNode,
    toInputId: string
  ): ValidationResult {

    const fromOutput = fromNode.outputs.find(o => o.id === fromOutputId);
    const toInput = toNode.inputs.find(i => i.id === toInputId);

    if (!fromOutput || !toInput) {
      return {
        valid: false,
        errors: ['Invalid output or input ID']
      };
    }

    // 1. 检查数据类型兼容性
    if (!this.isDataTypeCompatible(fromOutput.dataType, toInput.dataType)) {
      return {
        valid: false,
        errors: [`Data type mismatch: ${fromOutput.dataType} → ${toInput.dataType}`]
      };
    }

    // 2. 检查连接数量限制
    if (toInput.maxConnections &&
        toInput.connectedFrom &&
        toInput.connectedFrom.length >= toInput.maxConnections) {
      return {
        valid: false,
        errors: [`Input ${toInput.name} has reached max connections (${toInput.maxConnections})`]
      };
    }

    // 3. 检查依赖关系
    const dependencyRule = NODE_DEPENDENCY_RULES[fromNode.type];
    if (!dependencyRule.allowedOutputs.includes(toNode.type)) {
      return {
        valid: false,
        errors: [`${fromNode.type} cannot connect to ${toNode.type}`]
      };
    }

    // 4. 检查循环依赖
    if (this.hasCircularDependency(fromNode.id, toNode.id)) {
      return {
        valid: false,
        errors: ['Circular dependency detected']
      };
    }

    return { valid: true };
  }

  /**
   * 数据类型兼容性检查
   */
  private static isDataTypeCompatible(from: DataType, to: DataType): boolean {
    // 完全匹配
    if (from === to) return true;

    // 兼容规则
    const compatibilityMap: Record<DataType, DataType[]> = {
      [DataType.TEXT]: [DataType.TEXT, DataType.JSON],
      [DataType.IMAGE]: [DataType.IMAGE],
      [DataType.VIDEO]: [DataType.VIDEO, DataType.IMAGE], // 视频可转为图像
      [DataType.AUDIO]: [DataType.AUDIO],
      [DataType.JSON]: [DataType.JSON, DataType.TEXT],
      [DataType.METADATA]: [DataType.METADATA, DataType.JSON]
    };

    return compatibilityMap[from]?.includes(to) || false;
  }

  /**
   * 检测循环依赖 (后续实现需要访问全局节点图)
   */
  private static hasCircularDependency(
    fromId: string,
    toId: string
  ): boolean {
    // 简化版实现,实际需要 DFS 遍历
    // 这里需要注入 Graph Service
    return false; // TODO: 实现完整的循环检测
  }
}
```

---

### 1.3 节点模板定义

```typescript
// config/node-templates.ts

/**
 * 节点模板配置
 */
export const NODE_TEMPLATES: Record<NodeType, NodeTemplate> = {

  PROMPT_INPUT: {
    displayName: { zh: '创意描述', en: 'Prompt Input' },
    description: { zh: '文本输入节点', en: 'Text input node' },
    category: 'INPUT',
    icon: 'Type',
    color: '#6366f1',

    defaultConfig: {
      prompt: '',
      model: 'gemini-3-pro-preview'
    },

    inputs: [], // 无输入

    outputs: [
      {
        name: 'text',
        dataType: DataType.TEXT
      }
    ],

    pricing: {
      base: 0, // 免费
      formula: () => 0
    }
  },

  IMAGE_GENERATOR: {
    displayName: { zh: '文字生图', en: 'Text to Image' },
    description: { zh: 'Gemini 图像生成', en: 'Generate images from text' },
    category: 'GENERATION',
    icon: 'ImageIcon',
    color: '#10b981',

    defaultConfig: {
      model: 'gemini-2.5-flash-image',
      aspectRatio: '16:9',
      count: 1
    },

    inputs: [
      {
        name: 'prompt',
        dataType: DataType.TEXT,
        required: true,
        multiple: false
      },
      {
        name: 'referenceImages',
        dataType: DataType.IMAGE,
        required: false,
        multiple: true,
        maxConnections: 4
      }
    ],

    outputs: [
      {
        name: 'images',
        dataType: DataType.IMAGE
      }
    ],

    pricing: {
      base: 10,
      formula: (config: NodeConfig) => {
        let cost = 10 * (config.count || 1);
        if (config.resolution === '4k') cost += 5;
        return cost;
      }
    }
  },

  VIDEO_GENERATOR: {
    displayName: { zh: '文生视频', en: 'Text to Video' },
    description: { zh: 'Veo 视频生成', en: 'Generate videos from text' },
    category: 'GENERATION',
    icon: 'Film',
    color: '#8b5cf6',

    defaultConfig: {
      model: 'veo-3.1-fast-generate-preview',
      aspectRatio: '16:9',
      generationMode: 'DEFAULT',
      count: 1
    },

    inputs: [
      {
        name: 'prompt',
        dataType: DataType.TEXT,
        required: true,
        multiple: false
      },
      {
        name: 'inputImage',
        dataType: DataType.IMAGE,
        required: false,
        multiple: false
      },
      {
        name: 'inputVideo',
        dataType: DataType.VIDEO,
        required: false,
        multiple: false
      }
    ],

    outputs: [
      {
        name: 'video',
        dataType: DataType.VIDEO
      },
      {
        name: 'metadata',
        dataType: DataType.METADATA
      }
    ],

    pricing: {
      base: 50,
      formula: (config: NodeConfig) => {
        const mode = config.generationMode || 'DEFAULT';
        const duration = 5; // 默认5秒

        const modeMultiplier = {
          'DEFAULT': 1,
          'CONTINUE': 1.6,
          'CUT': 2,
          'FIRST_LAST_FRAME': 2.4,
          'CHARACTER_REF': 1.8
        }[mode] || 1;

        const resolutionMultiplier = config.resolution === '4k' ? 2 : 1;

        return Math.ceil(50 * modeMultiplier * resolutionMultiplier);
      }
    }
  },

  // ... 其他节点模板定义
  // CHARACTER_NODE, STORYBOARD_GENERATOR, etc.
};

/**
 * 节点模板接口
 */
interface NodeTemplate {
  displayName: { zh: string; en: string };
  description: { zh: string; en: string };
  category: NodeCategory;
  icon: string;
  color: string;

  defaultConfig: Partial<NodeConfig>;
  inputs: Omit<NodeInput, 'id' | 'connectedFrom'>[];
  outputs: Omit<NodeOutput, 'id' | 'data'>[];

  pricing: {
    base: number;
    formula: (config: NodeConfig) => number;
  };
}

enum NodeCategory {
  INPUT = 'INPUT',
  GENERATION = 'GENERATION',
  EDITING = 'EDITING',
  ANALYSIS = 'ANALYSIS',
  SCRIPT = 'SCRIPT',
  OUTPUT = 'OUTPUT'
}
```

---

## 2. 节点验证器实现

### 2.1 输入数据验证

```typescript
// validators/node-validators.ts

/**
 * 节点输入验证器工厂
 */
export class NodeValidatorFactory {

  /**
   * 创建验证器
   */
  static createValidator(nodeType: NodeType): NodeValidator {
    const validators: Record<NodeType, NodeValidator> = {
      PROMPT_INPUT: new PromptInputValidator(),
      IMAGE_GENERATOR: new ImageGeneratorValidator(),
      VIDEO_GENERATOR: new VideoGeneratorValidator(),
      AUDIO_GENERATOR: new AudioGeneratorValidator(),
      VIDEO_ANALYZER: new VideoAnalyzerValidator(),
      IMAGE_EDITOR: new ImageEditorValidator(),
      SCRIPT_PLANNER: new ScriptPlannerValidator(),
      SCRIPT_EPISODE: new ScriptEpisodeValidator(),
      STORYBOARD_GENERATOR: new StoryboardGeneratorValidator(),
      CHARACTER_NODE: new CharacterNodeValidator()
    };

    return validators[nodeType];
  }
}

/**
 * 抽象验证器基类
 */
abstract class NodeValidator {
  abstract validate(node: StandardNode): ValidationResult;

  /**
   * 通用验证逻辑
   */
  protected baseValidate(node: StandardNode): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 检查必需输入
    for (const input of node.inputs) {
      if (input.required && (!input.connectedFrom || input.connectedFrom.length === 0)) {
        errors.push(`Required input '${input.name}' is not connected`);
      }
    }

    // 2. 检查配置完整性
    if (!node.config.model) {
      warnings.push('No model specified, will use default');
    }

    // 3. 检查积分余额 (需要用户信息)
    // 这部分在后端执行

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * 图像生成器验证器
 */
class ImageGeneratorValidator extends NodeValidator {
  validate(node: StandardNode): ValidationResult {
    const result = this.baseValidate(node);

    // 特定验证
    if (node.config.count && (node.config.count < 1 || node.config.count > 4)) {
      result.errors?.push('Image count must be between 1 and 4');
      result.valid = false;
    }

    if (node.config.aspectRatio &&
        !['1:1', '16:9', '9:16', '4:3', '3:4'].includes(node.config.aspectRatio)) {
      result.errors?.push(`Invalid aspect ratio: ${node.config.aspectRatio}`);
      result.valid = false;
    }

    // 检查 prompt
    const promptInput = node.inputs.find(i => i.name === 'prompt');
    if (promptInput?.connectedFrom?.length === 0 && !node.config.prompt) {
      result.errors?.push('Either connect a prompt input or provide a text prompt');
      result.valid = false;
    }

    return result;
  }
}

/**
 * 视频生成器验证器
 */
class VideoGeneratorValidator extends NodeValidator {
  validate(node: StandardNode): ValidationResult {
    const result = this.baseValidate(node);

    const mode = node.config.generationMode;

    // 根据模式验证输入
    if (mode === 'CONTINUE') {
      const videoInput = node.inputs.find(i => i.name === 'inputVideo');
      if (!videoInput || !videoInput.connectedFrom || videoInput.connectedFrom.length === 0) {
        result.errors?.push('CONTINUE mode requires a video input');
        result.valid = false;
      }
    }

    if (mode === 'FIRST_LAST_FRAME') {
      const imageInput = node.inputs.find(i => i.name === 'inputImage');
      if (!imageInput || !imageInput.connectedFrom || imageInput.connectedFrom.length < 2) {
        result.errors?.push('FIRST_LAST_FRAME mode requires at least 2 image inputs');
        result.valid = false;
      }
    }

    if (mode === 'CHARACTER_REF') {
      const imageInput = node.inputs.find(i => i.name === 'inputImage');
      const videoInput = node.inputs.find(i => i.name === 'inputVideo');

      if ((!imageInput || imageInput.connectedFrom?.length === 0) &&
          (!videoInput || videoInput.connectedFrom?.length === 0)) {
        result.errors?.push('CHARACTER_REF mode requires either image or video input');
        result.valid = false;
      }
    }

    return result;
  }
}

// ... 其他验证器实现
```

---

## 3. 后端 API 实现示例

### 3.1 生成服务 (NestJS)

```typescript
// backend/src/generation/generation.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class GenerationService {

  constructor(
    @InjectRepository(Generation)
    private generationRepo: Repository<Generation>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectQueue('generation')
    private generationQueue: Queue
  ) {}

  /**
   * 执行节点生成
   */
  async executeNode(
    userId: string,
    node: StandardNode,
    workflowId?: string
  ): Promise<{ jobId: string; estimatedTime: number }> {

    // 1. 验证节点
    const validator = NodeValidatorFactory.createValidator(node.type);
    const validation = validator.validate(node);

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Node validation failed',
        errors: validation.errors
      });
    }

    // 2. 计算所需积分
    const template = NODE_TEMPLATES[node.type];
    const requiredCredits = template.pricing.formula(node.config);

    // 3. 检查用户余额
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user.credits < requiredCredits) {
      throw new InsufficientCreditsException({
        required: requiredCredits,
        balance: user.credits
      });
    }

    // 4. 预扣积分 (使用乐观锁防止并发问题)
    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ credits: () => `credits - ${requiredCredits}` })
      .where('id = :userId', { userId })
      .andWhere('credits >= :requiredCredits', { requiredCredits })
      .execute();

    if (updateResult.affected === 0) {
      throw new InsufficientCreditsException({
        required: requiredCredits,
        balance: user.credits
      });
    }

    // 5. 创建生成记录
    const generation = await this.generationRepo.save({
      userId,
      workflowId,
      nodeType: node.type,
      nodeId: node.id,
      inputPrompt: node.config.prompt,
      model: node.config.model,
      creditsConsumed: requiredCredits,
      status: 'PENDING',
      metadata: {
        nodeConfig: node.config,
        nodeVersion: node.version
      }
    });

    // 6. 记录积分交易
    await this.creditTransactionRepo.save({
      userId,
      transactionType: 'CONSUME',
      amount: -requiredCredits,
      balanceAfter: user.credits - requiredCredits,
      generationId: generation.id,
      description: `Generate ${node.type}`
    });

    // 7. 添加到任务队列
    const priority = this.getPriority(user.subscriptionTier);
    const job = await this.generationQueue.add(
      'generate',
      {
        generationId: generation.id,
        userId,
        node,
        workflowId
      },
      {
        priority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    );

    // 8. 估算处理时间
    const estimatedTime = this.estimateProcessingTime(node.type, user.subscriptionTier);

    return {
      jobId: generation.id,
      estimatedTime
    };
  }

  /**
   * 获取优先级
   */
  private getPriority(tier: string): number {
    const priorities = {
      'FREE': 10,
      'BASIC': 5,
      'PRO': 2,
      'ENTERPRISE': 1
    };
    return priorities[tier] || 10;
  }

  /**
   * 估算处理时间 (秒)
   */
  private estimateProcessingTime(nodeType: NodeType, tier: string): number {
    const baseTimes = {
      PROMPT_INPUT: 0,
      IMAGE_GENERATOR: 15,
      VIDEO_GENERATOR: 60,
      AUDIO_GENERATOR: 10,
      VIDEO_ANALYZER: 20,
      IMAGE_EDITOR: 12,
      SCRIPT_PLANNER: 30,
      SCRIPT_EPISODE: 25,
      STORYBOARD_GENERATOR: 40,
      CHARACTER_NODE: 35
    };

    const baseTime = baseTimes[nodeType] || 30;

    // 会员有加速
    const speedMultiplier = tier === 'PRO' || tier === 'ENTERPRISE' ? 0.7 : 1;

    return Math.ceil(baseTime * speedMultiplier);
  }

  /**
   * 查询生成状态
   */
  async getGenerationStatus(generationId: string): Promise<GenerationStatusDto> {
    const generation = await this.generationRepo.findOne({
      where: { id: generationId }
    });

    if (!generation) {
      throw new NotFoundException('Generation not found');
    }

    // 如果是处理中,从队列获取进度
    if (generation.status === 'PROCESSING') {
      const job = await this.generationQueue.getJob(generationId);
      if (job) {
        return {
          id: generation.id,
          status: generation.status,
          progress: await job.progress(),
          estimatedTimeRemaining: await this.estimateTimeRemaining(job)
        };
      }
    }

    return {
      id: generation.id,
      status: generation.status,
      progress: generation.status === 'SUCCESS' ? 100 : 0,
      outputUrl: generation.outputUrl,
      error: generation.errorMessage
    };
  }
}
```

---

### 3.2 Worker 实现 (BullMQ)

```typescript
// backend/src/workers/generation.worker.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('generation')
export class GenerationWorker extends WorkerHost {

  async process(job: Job<GenerationJobData>): Promise<GenerationResult> {
    const { generationId, userId, node, workflowId } = job.data;

    try {
      // 更新状态为处理中
      await this.updateGenerationStatus(generationId, 'PROCESSING');

      // 根据节点类型调用不同的处理器
      const processor = this.getProcessor(node.type);
      const result = await processor.process(node, (progress) => {
        job.updateProgress(progress);
      });

      // 保存结果
      await this.saveGenerationResult(generationId, result);

      // 通知用户 (WebSocket)
      await this.notifyUser(userId, {
        type: 'GENERATION_SUCCESS',
        generationId,
        result
      });

      return result;

    } catch (error) {
      // 失败处理
      await this.handleGenerationFailure(generationId, error);
      throw error;
    }
  }

  /**
   * 获取处理器
   */
  private getProcessor(nodeType: NodeType): NodeProcessor {
    const processors = {
      IMAGE_GENERATOR: new ImageGeneratorProcessor(this.geminiService),
      VIDEO_GENERATOR: new VideoGeneratorProcessor(this.veoService),
      AUDIO_GENERATOR: new AudioGeneratorProcessor(this.ttsService),
      // ... 其他处理器
    };

    return processors[nodeType];
  }

  /**
   * 处理失败,退款
   */
  private async handleGenerationFailure(
    generationId: string,
    error: Error
  ): Promise<void> {
    const generation = await this.generationRepo.findOne({
      where: { id: generationId }
    });

    // 更新状态
    await this.generationRepo.update(
      { id: generationId },
      {
        status: 'FAILED',
        errorMessage: error.message,
        completedAt: new Date()
      }
    );

    // 退款
    await this.userRepo.increment(
      { id: generation.userId },
      'credits',
      generation.creditsConsumed
    );

    // 记录退款交易
    await this.creditTransactionRepo.save({
      userId: generation.userId,
      transactionType: 'REFUND',
      amount: generation.creditsConsumed,
      generationId,
      description: `Generation failed: ${error.message}`
    });

    // 通知用户
    await this.notifyUser(generation.userId, {
      type: 'GENERATION_FAILED',
      generationId,
      error: error.message,
      refundedCredits: generation.creditsConsumed
    });
  }
}

/**
 * 节点处理器接口
 */
interface NodeProcessor {
  process(
    node: StandardNode,
    onProgress: (progress: number) => void
  ): Promise<GenerationResult>;
}

/**
 * 图像生成处理器
 */
class ImageGeneratorProcessor implements NodeProcessor {

  constructor(private geminiService: GeminiService) {}

  async process(
    node: StandardNode,
    onProgress: (progress: number) => void
  ): Promise<GenerationResult> {

    onProgress(10); // 准备中

    // 1. 获取输入数据
    const prompt = await this.getPromptInput(node);
    const referenceImages = await this.getReferenceImages(node);

    onProgress(30); // 输入准备完成

    // 2. 调用 Gemini API
    const images = await this.geminiService.generateImages({
      prompt,
      model: node.config.model,
      referenceImages,
      aspectRatio: node.config.aspectRatio,
      count: node.config.count || 1
    });

    onProgress(70); // 生成完成

    // 3. 上传到 OSS
    const urls = await Promise.all(
      images.map(img => this.ossService.uploadImage(img))
    );

    onProgress(100); // 完成

    return {
      outputType: 'IMAGE',
      outputUrls: urls,
      metadata: {
        count: urls.length,
        aspectRatio: node.config.aspectRatio
      }
    };
  }

  private async getPromptInput(node: StandardNode): Promise<string> {
    const promptInput = node.inputs.find(i => i.name === 'prompt');
    if (promptInput?.connectedFrom && promptInput.connectedFrom.length > 0) {
      // 从上游节点获取
      const upstreamNodeId = promptInput.connectedFrom[0];
      const upstreamOutput = await this.getNodeOutput(upstreamNodeId);
      return upstreamOutput.text;
    }
    return node.config.prompt || '';
  }

  private async getReferenceImages(node: StandardNode): Promise<string[]> {
    const imageInput = node.inputs.find(i => i.name === 'referenceImages');
    if (!imageInput?.connectedFrom) return [];

    const images = await Promise.all(
      imageInput.connectedFrom.map(id => this.getNodeOutputImage(id))
    );

    return images.filter(Boolean);
  }
}
```

---

## 4. 前端集成方案

### 4.1 重构后的节点管理 Hook

```typescript
// hooks/useNodeGraph.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface NodeGraphState {
  nodes: StandardNode[];
  connections: Connection[];
  selectedNodeIds: string[];

  // 操作
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<StandardNode>) => void;

  connectNodes: (fromId: string, toId: string) => void;
  disconnectNodes: (fromId: string, toId: string) => void;

  executeNode: (id: string) => Promise<void>;

  // 选择
  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
}

export const useNodeGraph = create<NodeGraphState>()(
  immer((set, get) => ({
    nodes: [],
    connections: [],
    selectedNodeIds: [],

    addNode: (type, position) => {
      set(state => {
        const newNode = NodeFactory.createNode(type, position);
        state.nodes.push(newNode);
      });
    },

    deleteNode: (id) => {
      set(state => {
        // 删除节点
        state.nodes = state.nodes.filter(n => n.id !== id);

        // 删除相关连接
        state.connections = state.connections.filter(
          c => c.from !== id && c.to !== id
        );

        // 更新其他节点的输入
        state.nodes.forEach(node => {
          node.inputs.forEach(input => {
            if (input.connectedFrom) {
              input.connectedFrom = input.connectedFrom.filter(i => i !== id);
            }
          });
        });
      });
    },

    connectNodes: (fromId, toId) => {
      set(state => {
        const fromNode = state.nodes.find(n => n.id === fromId);
        const toNode = state.nodes.find(n => n.id === toId);

        if (!fromNode || !toNode) return;

        // 验证连接
        const validation = NodeFactory.validateConnection(
          fromNode,
          fromNode.outputs[0].id,
          toNode,
          toNode.inputs[0].id
        );

        if (!validation.valid) {
          toast.error(validation.errors?.[0] || 'Cannot connect nodes');
          return;
        }

        // 添加连接
        state.connections.push({ from: fromId, to: toId });

        // 更新目标节点的输入
        toNode.inputs[0].connectedFrom?.push(fromId);
      });
    },

    executeNode: async (id) => {
      const node = get().nodes.find(n => n.id === id);
      if (!node) return;

      try {
        // 更新状态为处理中
        set(state => {
          const n = state.nodes.find(n => n.id === id);
          if (n) n.state.status = NodeStatus.WORKING;
        });

        // 调用后端 API
        const response = await api.post('/generation/execute', {
          node,
          workflowId: get().workflowId
        });

        const { jobId, estimatedTime } = response.data;

        // 轮询状态
        const checkStatus = async () => {
          const status = await api.get(`/generation/status/${jobId}`);

          set(state => {
            const n = state.nodes.find(n => n.id === id);
            if (!n) return;

            n.state.progress = status.data.progress;

            if (status.data.status === 'SUCCESS') {
              n.state.status = NodeStatus.SUCCESS;
              n.outputs[0].data = status.data.outputUrl;
            } else if (status.data.status === 'FAILED') {
              n.state.status = NodeStatus.ERROR;
              n.state.error = status.data.error;
            } else {
              // 继续轮询
              setTimeout(checkStatus, 2000);
            }
          });
        };

        checkStatus();

      } catch (error: any) {
        set(state => {
          const n = state.nodes.find(n => n.id === id);
          if (n) {
            n.state.status = NodeStatus.ERROR;
            n.state.error = error.message;
          }
        });
      }
    }
  }))
);
```

---

### 4.2 实时通信 (WebSocket)

```typescript
// services/websocket.service.ts

import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;

  connect(userId: string, token: string) {
    this.socket = io(process.env.VITE_WS_URL, {
      auth: { token },
      query: { userId }
    });

    // 监听生成完成事件
    this.socket.on('generation:complete', (data) => {
      const { generationId, nodeId, result } = data;

      // 更新节点状态
      useNodeGraph.getState().updateNode(nodeId, {
        state: {
          status: NodeStatus.SUCCESS,
          progress: 100
        },
        outputs: [{
          id: 'output',
          name: 'result',
          dataType: DataType.IMAGE,
          data: result.outputUrls[0]
        }]
      });

      // 显示通知
      toast.success('生成完成!');
    });

    // 监听进度更新
    this.socket.on('generation:progress', (data) => {
      const { nodeId, progress } = data;

      useNodeGraph.getState().updateNode(nodeId, {
        state: { progress }
      });
    });

    // 监听错误
    this.socket.on('generation:error', (data) => {
      const { nodeId, error } = data;

      useNodeGraph.getState().updateNode(nodeId, {
        state: {
          status: NodeStatus.ERROR,
          error: error.message
        }
      });

      toast.error(`生成失败: ${error.message}`);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const wsService = new WebSocketService();
```

---

## 5. 性能优化建议

### 5.1 前端优化

#### **虚拟化渲染 (大型画布)**

```typescript
// components/VirtualizedCanvas.tsx

import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualizedCanvas = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { nodes } = useNodeGraph();

  // 只渲染可见区域的节点
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // 节点平均高度
    overscan: 5 // 预加载5个节点
  });

  return (
    <div ref={parentRef} className="canvas-container">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const node = nodes[virtualItem.index];
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <Node node={node} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

### 5.2 后端优化

#### **Redis 缓存策略**

```typescript
// 缓存常用数据
const cacheKeys = {
  user: (id: string) => `user:${id}`,
  workflow: (id: string) => `workflow:${id}`,
  generation: (id: string) => `generation:${id}`,
  nodeTemplate: (type: string) => `template:${type}`
};

// 示例: 缓存用户信息
async getUserWithCache(userId: string): Promise<User> {
  const cacheKey = cacheKeys.user(userId);

  // 尝试从缓存获取
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 从数据库查询
  const user = await this.userRepo.findOne({ where: { id: userId } });

  // 写入缓存 (TTL: 1小时)
  await this.redis.setex(cacheKey, 3600, JSON.stringify(user));

  return user;
}
```

---

**文档结束**

本文档提供了节点系统标准化的详细实施方案,配合 `COMMERCIALIZATION_PLAN.md` 使用,可完整指导平台的商业化开发。

