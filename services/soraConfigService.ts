/**
 * Sora 2 配置管理服务
 * 管理 Sora API Key、OSS 配置、存储路径等
 */

import { SoraStorageConfig, OSSConfig, SoraModel } from '../types';

const SORA_CONFIG_KEY = 'sora_storage_config';
const OSS_CONFIG_KEY = 'sora_oss_config';
const SORA_MODELS_KEY = 'sora_models';

// 默认 Sora 模型列表
export const DEFAULT_SORA_MODELS: SoraModel[] = [
  {
    id: 'sora-2-15s-yijia',
    name: 'sora-2-yijia (15秒竖屏)',
    duration: 15,
    aspectRatio: '9:16',
    resolution: '1080x1920',
    description: '15秒竖屏',
    price: 0.210,
    endpointType: 'openai-video',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  },
  {
    id: 'sora-2-pro-10s-large-yijia',
    name: 'sora-2-pro (10秒高清竖屏)',
    duration: 10,
    aspectRatio: '9:16',
    resolution: '1080x1920',
    description: 'sora2pro的10秒高清模式竖屏',
    price: 0.850,
    endpointType: 'openai',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  },
  {
    id: 'sora-2-pro-10s-large',
    name: 'sora-2-pro (10秒高清横屏)',
    duration: 10,
    aspectRatio: '16:9',
    resolution: '1920x1080',
    description: 'sora2pro的10秒高清模式横屏',
    price: 0.850,
    endpointType: 'openai',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  },
  {
    id: 'sora-2-15s',
    name: 'sora-2 (15秒横屏)',
    duration: 15,
    aspectRatio: '16:9',
    resolution: '1920x1080',
    description: '15秒横屏',
    price: 0.210,
    endpointType: 'openai-video',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  },
  {
    id: 'sora-2-pro-15s-yijia',
    name: 'sora-2-pro (15秒竖屏)',
    duration: 15,
    aspectRatio: '9:16',
    resolution: '1080x1920',
    description: 'sora2pro的15秒竖屏',
    price: 1.100,
    endpointType: 'openai',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  },
  {
    id: 'sora-2-10s-large-yijia',
    name: 'sora-2 (10秒高清竖屏)',
    duration: 10,
    aspectRatio: '9:16',
    resolution: '1080x1920',
    description: '10秒高清模式竖屏',
    price: 0.550,
    endpointType: 'openai-video',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  },
  {
    id: 'sora-2-pro-10s-yijia',
    name: 'sora-2-pro (10秒竖屏)',
    duration: 10,
    aspectRatio: '9:16',
    resolution: '1080x1920',
    description: 'sora2pro的10秒竖屏',
    price: 0.500,
    endpointType: 'openai',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  },
  {
    id: 'sora-2-pro-15s',
    name: 'sora-2-pro (15秒横屏)',
    duration: 15,
    aspectRatio: '16:9',
    resolution: '1920x1080',
    description: 'sora2pro的15秒横屏',
    price: 1.100,
    endpointType: 'openai',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  },
  {
    id: 'sora-2-10s-large',
    name: 'sora-2 (10秒高清横屏)',
    duration: 10,
    aspectRatio: '16:9',
    resolution: '1920x1080',
    description: '10秒高清模式横屏',
    price: 0.550,
    endpointType: 'openai-video',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  },
  {
    id: 'sora-2-pro-10s',
    name: 'sora-2-pro (10秒横屏)',
    duration: 10,
    aspectRatio: '16:9',
    resolution: '1920x1080',
    description: 'sora2pro的10秒横屏',
    price: 0.500,
    endpointType: 'openai',
    provider: 'sora-2',
    billingType: '按次计费',
    tags: ['视频']
  }
];

/**
 * 获取 Sora 存储配置
 */
export function getSoraStorageConfig(): SoraStorageConfig {
  const stored = localStorage.getItem(SORA_CONFIG_KEY);
  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse Sora storage config:', e);
    return {};
  }
}

/**
 * 保存 Sora 存储配置
 */
export function saveSoraStorageConfig(config: SoraStorageConfig): void {
  try {
    localStorage.setItem(SORA_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Sora storage config:', e);
  }
}

/**
 * 获取 OSS 配置
 */
export function getOSSConfig(): OSSConfig | null {
  const stored = localStorage.getItem(OSS_CONFIG_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse OSS config:', e);
    return null;
  }
}

/**
 * 保存 OSS 配置
 */
export function saveOSSConfig(config: OSSConfig): void {
  try {
    localStorage.setItem(OSS_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save OSS config:', e);
  }
}

/**
 * 获取 Sora API Key
 */
export function getSoraApiKey(): string | undefined {
  const config = getSoraStorageConfig();
  return config.apiKey;
}

/**
 * 保存 Sora API Key
 */
export function saveSoraApiKey(apiKey: string): void {
  const config = getSoraStorageConfig();
  config.apiKey = apiKey;
  saveSoraStorageConfig(config);
}

/**
 * 获取 Sora 模型列表
 */
export function getSoraModels(): SoraModel[] {
  const stored = localStorage.getItem(SORA_MODELS_KEY);
  if (!stored) {
    return DEFAULT_SORA_MODELS;
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse Sora models:', e);
    return DEFAULT_SORA_MODELS;
  }
}

/**
 * 根据 ID 获取模型信息
 */
export function getSoraModelById(modelId: string): SoraModel | undefined {
  const models = getSoraModels();
  return models.find(m => m.id === modelId);
}
