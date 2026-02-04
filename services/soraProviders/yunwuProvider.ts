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
    // 映射 aspect_ratio 到 orientation
    const orientation = userConfig.aspect_ratio === '16:9' ? 'landscape' : 'portrait';

    // 映射 hd 到 size
    // true -> large, false -> medium
    const size = userConfig.hd ? 'large' : 'medium';

    // duration 从字符串转换为数字
    const duration = parseInt(userConfig.duration);

    return {
      orientation,
      duration,
      size,
      watermark: false,  // 云雾 API 默认无水印
    };
  }

  /**
   * 提交任务到云雾 API
   */
  async submitTask(
    params: SoraSubmitParams,
    apiKey: string,
    context?: CallContext
  ): Promise<SoraSubmitResult> {
    const config = this.transformConfig(params.config);

    const requestBody = {
      prompt: params.prompt,
      model: getSoraModelName('yunwu', params.config.hd),
      images: params.referenceImageUrl ? [params.referenceImageUrl] : [],
      ...config,
    };

    return logAPICall(
      'yunwuSubmitTask',
      async () => {
        // 使用后端代理
        const apiUrl = 'http://localhost:3001/api/yunwu/create';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new SoraAPIError(
            this.name,
            response.status,
            `提交任务失败: ${errorText}`,
            { errorText }
          );
        }

        const result: any = await response.json();

        console.log(`[${this.displayName}] 提交成功，任务 ID:`, result.id);

        return {
          id: result.id,
          status: result.status || 'pending',
          progress: 0,
          createdAt: result.status_update_time || Date.now(),
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
    return logAPICall(
      'yunwuCheckStatus',
      async () => {
        // 使用后端代理
        const apiUrl = `http://localhost:3001/api/yunwu/query?id=${encodeURIComponent(taskId)}`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new SoraAPIError(
            this.name,
            response.status,
            `查询任务失败: ${errorText}`,
            { errorText }
          );
        }

        const data: any = await response.json();

        console.log(`[${this.displayName}] 📥 原始API响应:`, {
          taskId,
          fullResponse: data,
          hasId: !!data.id,
          hasDetail: !!data.detail
        });

        // 提取嵌套的 detail 对象
        const detail = data.detail || {};

        // 提取进度（在 detail.progress_pct 中）
        const progress = detail.progress_pct || 0;

        // 提取视频 URL（在 detail.generations[0].url 中）
        const generations = detail.generations || [];
        const videoUrl = generations[0]?.url;

        console.log(`[${this.displayName}] ✅ 解析后的数据:`, {
          taskId,
          dataId: data.id,
          detailStatus: detail.status,
          progress,
          hasVideoUrl: !!videoUrl,
          generationsCount: generations.length,
          videoUrl: videoUrl || 'none'
        });

        // 更新进度
        if (onProgress) {
          onProgress(progress);
        }

        // 状态映射：云雾的 pending -> 我们的 queued
        const statusMap: Record<string, 'queued' | 'processing' | 'completed' | 'error'> = {
          'pending': 'queued',
          'processing': 'processing',
          'completed': 'completed',
          'succeeded': 'completed',
          'failed': 'error',
          'error': 'error',
        };

        const mappedStatus = statusMap[detail.status] || 'processing';

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
            violationReason: detail.failure_reason || '视频生成失败',
          };
        }

        return {
          taskId: data.id,
          status: mappedStatus,
          progress,
          videoUrl,
          videoUrlWatermarked: undefined,  // 云雾 API 没有单独的水印视频
          duration: detail.input?.duration?.toString(),
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
