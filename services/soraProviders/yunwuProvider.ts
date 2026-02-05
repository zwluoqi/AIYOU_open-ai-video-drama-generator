/**
 * 云雾 API (Yunwu) 适配器
 * 将云雾 API 封装为统一的提供商接口
 */

import {
  SoraProvider,
  SoraSubmitParams,
  SoraSubmitResult,
  SoraVideoResult,
  Sora2UserConfig,
  ProviderSpecificConfig,
  CallContext,
  SoraAPIError
} from './types';
import { logAPICall } from '../apiLogger';
import { getSoraModelName } from '../soraModelConfig';

export class YunwuProvider implements SoraProvider {
  readonly name = 'yunwu' as const;
  readonly displayName = '云雾 API';

  /**
   * 云雾 API 配置转换
   * - aspect_ratio -> orientation (16:9 -> landscape, 9:16 -> portrait)
   * - duration: string -> number
   * - hd: boolean -> size: 'small' | 'medium' | 'large'
   */
  transformConfig(userConfig: Sora2UserConfig): ProviderSpecificConfig {
    console.log('[YunwuProvider] 🔧 transformConfig 输入:', JSON.stringify(userConfig, null, 2));

    // 防御性检查：验证必需字段
    if (!userConfig) {
      throw new Error('userConfig 是 undefined 或 null');
    }

    if (!userConfig.aspect_ratio) {
      console.error('[YunwuProvider] ❌ 缺少 aspect_ratio 字段, userConfig:', userConfig);
      throw new Error('缺少必需的 aspect_ratio 字段');
    }

    if (userConfig.hd === undefined) {
      console.error('[YunwuProvider] ❌ 缺少 hd 字段, userConfig:', userConfig);
      throw new Error('缺少必需的 hd 字段');
    }

    if (!userConfig.duration) {
      console.error('[YunwuProvider] ❌ 缺少 duration 字段, userConfig:', userConfig);
      throw new Error('缺少必需的 duration 字段');
    }

    // 映射 aspect_ratio 到 orientation
    const orientation = userConfig.aspect_ratio === '16:9' ? 'landscape' : 'portrait';

    // 映射 hd 到 size
    // true -> large, false -> medium
    const size = userConfig.hd ? 'large' : 'medium';

    // duration 从字符串转换为数字
    const duration = parseInt(userConfig.duration);

    // 验证转换结果
    if (isNaN(duration)) {
      console.error('[YunwuProvider] ❌ duration 转换失败:', userConfig.duration);
      throw new Error(`duration "${userConfig.duration}" 无法转换为数字`);
    }

    const result = {
      orientation,
      duration,
      size,
      watermark: false,  // 云雾 API 默认无水印
    };

    console.log('[YunwuProvider] ✅ transformConfig 输出:', JSON.stringify(result, null, 2));

    return result;
  }

  /**
   * 提交任务到云雾 API
   */
  async submitTask(
    params: SoraSubmitParams,
    apiKey: string,
    context?: CallContext
  ): Promise<SoraSubmitResult> {
    console.log('[YunwuProvider] 📤 submitTask 开始, params:', {
      hasPrompt: !!params.prompt,
      promptLength: params.prompt?.length,
      hasConfig: !!params.config,
      configKeys: params.config ? Object.keys(params.config) : [],
      hasReferenceImage: !!params.referenceImageUrl,
      referenceImageLength: params.referenceImageUrl?.length,
    });

    // 防御性检查
    if (!params.config) {
      throw new Error('params.config 是 undefined');
    }

    const config = this.transformConfig(params.config);

    const requestBody = {
      prompt: params.prompt,
      model: getSoraModelName('yunwu', params.config.hd),
      images: params.referenceImageUrl ? [params.referenceImageUrl] : [],
      ...config,
    };

    console.log('[YunwuProvider] 📋 发送到后端的请求体:', JSON.stringify(requestBody, null, 2));

    return logAPICall(
      'yunwuSubmitTask',
      async () => {
        // 使用后端代理
        const apiUrl = 'http://localhost:3001/api/yunwu/create';
        console.log('[YunwuProvider] 🌐 发起请求到:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('[YunwuProvider] 📥 后端响应状态:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[YunwuProvider] ❌ 后端返回错误, response:', {
            status: response.status,
            statusText: response.statusText,
            errorText,
            headers: Object.fromEntries(response.headers.entries()),
          });
          throw new SoraAPIError(
            this.name,
            response.status,
            `提交任务失败: ${errorText}`,
            { errorText, requestBody }
          );
        }

        const result: any = await response.json();

        console.log(`[${this.displayName}] 📦 提交成功 - 完整响应:`, JSON.stringify(result, null, 2));
        console.log(`[${this.displayName}] 📝 提取的任务 ID:`, result.id, `(类型: ${typeof result.id})`);

        // 如果 result.id 不存在，尝试从其他字段获取
        const taskId = result.id || result.task_id || result.taskId || result.data?.id;

        console.log(`[${this.displayName}] ✅ 最终使用的 taskId:`, taskId, `(类型: ${typeof taskId})`);

        return {
          id: taskId,
          status: result.status || 'pending',
          progress: 0,
          createdAt: result.status_update_time || Date.now(),
          _rawResponse: result,  // 保存原始响应用于调试
        };
      },
      {
        orientation: config.orientation,
        duration: config.duration,
        size: config.size,
        hasReferenceImage: !!params.referenceImageUrl,
        promptLength: params.prompt.length,
        promptPreview: params.prompt.substring(0, 200) + (params.prompt.length > 200 ? '...' : ''),
      },
      { ...context, platform: this.displayName }
    );
  }

  /**
   * 查询任务状态
   */
  async checkStatus(
    taskId: string,
    apiKey: string,
    onProgress?: (progress: number) => void,
    context?: CallContext
  ): Promise<SoraVideoResult> {
    console.log(`[${this.displayName}] 🔍 查询开始 - 收到的 taskId:`, taskId, `(类型: ${typeof taskId}, 长度: ${taskId?.length})`);

    return logAPICall(
      'yunwuCheckStatus',
      async () => {
        // 使用后端代理
        const apiUrl = `http://localhost:3001/api/yunwu/query?id=${encodeURIComponent(taskId)}`;

        console.log(`[${this.displayName}] 📤 发送查询请求到:`, apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        console.log(`[${this.displayName}] 📥 查询响应状态:`, response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${this.displayName}] ❌ 查询失败 - 响应内容:`, errorText);
          throw new SoraAPIError(
            this.name,
            response.status,
            `查询任务失败: ${errorText}`,
            { errorText }
          );
        }

        const data: any = await response.json();

        console.log(`[${this.displayName}] 📦 查询成功 - 完整响应:`, JSON.stringify(data, null, 2));

        console.log(`[${this.displayName}] 📥 原始API响应:`, {
          taskId,
          fullResponse: data,
          hasId: !!data.id,
          hasDetail: !!data.detail
        });

        // 提取嵌套的 detail 对象
        const detail = data.detail || {};

        // ✅ 修正：云雾 API 的状态和进度在根级别，不是在 detail 对象中
        // data.status 可能的值: pending, processing, completed, succeeded, failed, error
        const apiStatus = data.status || detail.status;
        const progress = data.progress !== undefined ? data.progress : (detail.progress_pct || 0);

        // 视频URL可能在不同位置
        const generations = detail.generations || data.generations || [];
        const videoUrl = generations[0]?.url || data.video_url || data.url;

        console.log(`[${this.displayName}] ✅ 解析后的数据:`, {
          taskId,
          dataId: data.id,
          apiStatus,
          rootProgress: data.progress,
          detailProgress: detail.progress_pct,
          finalProgress: progress,
          hasVideoUrl: !!videoUrl,
          generationsCount: generations.length,
          videoUrl: videoUrl || 'none'
        });

        // 更新进度
        if (onProgress && typeof progress === 'number') {
          onProgress(progress);
        }

        // 状态映射：云雾的 API 状态映射到我们的状态
        const statusMap: Record<string, 'queued' | 'processing' | 'completed' | 'error'> = {
          'pending': 'queued',
          'processing': 'processing',
          'in_progress': 'processing',  // 云雾 API 使用 in_progress
          'completed': 'completed',
          'succeeded': 'completed',
          'failed': 'error',
          'error': 'error',
        };

        const mappedStatus = statusMap[apiStatus] || 'processing';

        // 检查是否失败
        if (mappedStatus === 'error') {
          return {
            taskId: data.id,
            status: 'error',
            progress,
            videoUrl: undefined,
            videoUrlWatermarked: undefined,
            duration: undefined,
            quality: 'unknown',
            isCompliant: false,
            violationReason: detail.failure_reason || data.error || '视频生成失败',
          };
        }

        return {
          taskId: data.id,
          status: mappedStatus,
          progress,
          videoUrl,
          videoUrlWatermarked: undefined,  // 云雾 API 没有单独的水印视频
          duration: detail.input?.duration?.toString() || data.seconds?.toString(),
          quality: 'standard',  // 云雾 API 没有 quality 字段，假设都合规
          isCompliant: true,
          _rawData: data,
        };
      },
      { taskId, hasProgressCallback: !!onProgress },
      { ...context, platform: this.displayName, logType: 'polling' }
    );
  }
}
