/**
 * 自定义视频平台提供商
 * 使用 /v1/chat/completions 格式（OpenAI 兼容接口）
 * 视频 URL 在 response 的 content 中返回
 */

import {
    VideoPlatformProvider,
    VideoPlatformType,
    VideoModelType,
    VideoGenerationRequest,
    VideoGenerationResult
} from './types';
import { logAPICall } from '../apiLogger';

/**
 * 自定义视频平台提供商实现
 */
export class CustomVideoPlatformProvider implements VideoPlatformProvider {
    readonly platformCode: VideoPlatformType = 'custom';
    readonly platformName = '自定义视频平台';
    readonly supportedModels: VideoModelType[] = ['custom'];

    /**
     * 获取用户配置的 Base URL
     */
    private getBaseUrl(): string {
        const url = localStorage.getItem('CUSTOM_VIDEO_BASE_URL');
        if (url && url.trim()) {
            return url.trim().replace(/\/+$/, '');
        }
        return '';
    }

    /**
     * 获取用户配置的 API Key
     */
    private getApiKey(): string | null {
        const key = localStorage.getItem('CUSTOM_VIDEO_API_KEY');
        if (key && key.trim()) {
            return key.trim();
        }
        return null;
    }

    /**
     * 从 /v1/models 接口动态获取模型名称
     * 返回第一个可用模型，结果缓存4分钟
     */
    private modelCache: { models: string[]; timestamp: number } | null = null;
    private readonly MODEL_CACHE_TTL = 4 * 60 * 1000; // 4分钟缓存

    async fetchModels(): Promise<string[]> {
        const baseUrl = this.getBaseUrl();
        if (!baseUrl) return [];

        // 检查缓存
        if (this.modelCache && Date.now() - this.modelCache.timestamp < this.MODEL_CACHE_TTL) {
            return this.modelCache.models;
        }

        const apiKey = this.getApiKey();
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

            const response = await fetch(`${baseUrl}/v1/models`, { method: 'GET', headers });
            if (!response.ok) {
                console.warn('[CustomVideoPlatform] /v1/models 请求失败:', response.status);
                return [];
            }

            const data = await response.json();
            // OpenAI 格式: { data: [{ id: "model-name", ... }] }
            const models: string[] = (data.data || []).map((m: any) => m.id).filter(Boolean);
            console.log('[CustomVideoPlatform] 从 /v1/models 获取到模型列表:', models);

            // 缓存结果
            this.modelCache = { models, timestamp: Date.now() };
            return models;
        } catch (e) {
            console.warn('[CustomVideoPlatform] 获取模型列表失败:', e);
            return [];
        }
    }

    /**
     * 获取用户配置的 / 默认模型名称
     * 优先用 localStorage 中手动配置的，否则用 /v1/models 返回的第一个
     */
    private getModelName(): string {
        const model = localStorage.getItem('CUSTOM_VIDEO_MODEL');
        if (model && model.trim()) {
            return model.trim();
        }
        // 如果缓存中有模型，用第一个
        if (this.modelCache && this.modelCache.models.length > 0) {
            return this.modelCache.models[0];
        }
        return '';
    }

    /**
     * 检查模型是否支持图生视频
     */
    supportsImageToVideo(_model: VideoModelType): boolean {
        return true;
    }

    /**
     * 检查模型是否支持某时长
     */
    supportsDuration(_model: VideoModelType, _duration: string): boolean {
        return true; // 自定义平台不限制时长
    }

    /**
     * 构建提示词内容（包含图片和参数）
     */
    private buildPromptContent(
        prompt: string,
        params: VideoGenerationRequest
    ): string {
        let content = prompt;

        // 将 UnifiedVideoConfig 整体 JSON 序列化后附加到提示词中
        if (params.config) {
            content += `\n\n视频参数: ${JSON.stringify(params.config)}`;
        }

        return content;
    }

    /**
     * 从 content 中提取视频 URL
     */
    private extractVideoUrl(content: string): string | null {
        console.log('[CustomVideoPlatform] 尝试从content提取视频URL, content预览:', content.substring(0, 500));

        // 方法1: 匹配 Markdown 链接语法 [text](url)
        const mdLinkMatch = content.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+\.(?:mp4|mov|avi|webm|mkv)[^)\s]*)\)/i);
        if (mdLinkMatch) {
            console.log('[CustomVideoPlatform] 从Markdown链接提取:', mdLinkMatch[1]);
            return mdLinkMatch[1];
        }

        // 方法2: 匹配包含视频文件扩展名的URL
        const videoUrlMatch = content.match(/https?:\/\/[^\s"'<>\])\}]+\.(?:mp4|mov|avi|webm|mkv)(?:[^\s"'<>\])\}]*)?/i);
        if (videoUrlMatch) {
            const cleanUrl = videoUrlMatch[0].replace(/[.,;:!?。，；：！？]+$/, '');
            console.log('[CustomVideoPlatform] 从视频扩展名URL提取:', cleanUrl);
            return cleanUrl;
        }

        // 方法3: 匹配通用URL（可能是不带视频扩展名的CDN链接）
        const genericUrlMatch = content.match(/https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s"'<>\])\}]*)/);
        if (genericUrlMatch) {
            const cleanUrl = genericUrlMatch[0].replace(/[.,;:!?。，；：！？]+$/, '');
            console.log('[CustomVideoPlatform] 从通用URL提取:', cleanUrl);
            return cleanUrl;
        }

        console.warn('[CustomVideoPlatform] 未能从content中提取到视频URL');
        return null;
    }

    /**
     * 提交视频生成任务
     * 使用 /v1/chat/completions 格式，同步返回结果
     */
    async submitTask(
        model: VideoModelType,
        params: VideoGenerationRequest,
        apiKey: string,
        context?: any,
        subModel?: string
    ): Promise<{ taskId: string }> {
        const baseUrl = this.getBaseUrl();
        if (!baseUrl) {
            throw new Error('请先配置自定义视频平台的 Base URL');
        }

        // 优先使用传入的 apiKey（来自平台API Key配置），否则使用 localStorage 中存储的
        const actualApiKey = apiKey || this.getApiKey();
        if (!actualApiKey) {
            throw new Error('请先配置自定义视频平台的 API Key');
        }

        // 先获取模型列表（填充缓存），以便 getModelName 可以使用
        await this.fetchModels();

        // 优先使用 subModel，然后手动配置的模型名，然后 /v1/models 返回的第一个
        const actualModel = subModel || this.getModelName() || model;

        return logAPICall(
            'customVideoSubmitTask',
            async () => {
                console.log(`[CustomVideoPlatform] 提交任务 - 模型: ${actualModel}, Base URL: ${baseUrl}`);

                // 构建 /v1/chat/completions 格式请求
                const messages: any[] = [];

                // 构建用户消息
                const userContent: any[] = [];

                // 文本提示词
                userContent.push({
                    type: 'text',
                    text: this.buildPromptContent(params.prompt, params)
                });

                // 处理参考图片
                let hasImage = false;
                let imageUrl: string | undefined;

                if (params.referenceImageUrl) {
                    hasImage = true;
                    const isBase64 = params.referenceImageUrl.startsWith('data:');
                    const isHttpUrl = params.referenceImageUrl.startsWith('http://') || params.referenceImageUrl.startsWith('https://');

                    if (isBase64) {
                        console.log('[CustomVideoPlatform] 参考图片为 base64 格式, 长度:', params.referenceImageUrl.length);
                        imageUrl = params.referenceImageUrl;
                    } else if (isHttpUrl) {
                        console.log('[CustomVideoPlatform] 参考图片为 URL 格式:', params.referenceImageUrl.substring(0, 100));
                        imageUrl = params.referenceImageUrl;
                    } else {
                        console.warn('[CustomVideoPlatform] 未知的图片格式，尝试作为URL使用');
                        imageUrl = params.referenceImageUrl;
                    }

                    // 添加到 OpenAI 多模态消息格式（兼容 vision 模型）
                    userContent.push({
                        type: 'image_url',
                        image_url: {
                            url: imageUrl
                        }
                    });
                }

                messages.push({
                    role: 'user',
                    content: userContent
                });

                // 构建请求体 - 仅使用标准 OpenAI chat/completions 格式
                const requestBody: any = {
                    model: actualModel,
                    messages,
                    stream: false
                };

                // 打印日志：图片引用情况
                if (hasImage && imageUrl) {
                    const isBase64 = imageUrl.startsWith('data:');
                    console.log(`[CustomVideoPlatform] ✅ 包含参考图片:`, {
                        format: isBase64 ? 'base64' : 'url',
                        length: imageUrl.length,
                        preview: isBase64 ? `${imageUrl.substring(0, 50)}...(共${imageUrl.length}字符)` : imageUrl
                    });
                } else {
                    console.log('[CustomVideoPlatform] ℹ️ 无参考图片');
                }

                console.log('[CustomVideoPlatform] 请求体:', JSON.stringify({
                    ...requestBody,
                    messages: requestBody.messages.map((m: any) => ({
                        ...m,
                        content: Array.isArray(m.content) ? m.content.map((c: any) => ({
                            ...c,
                            ...(c.type === 'image_url' ? { image_url: { url: (c.image_url.url || '').substring(0, 100) + '...' } } : {}),
                            ...(c.type === 'text' ? { text: (c.text || '').substring(0, 200) + '...' } : {})
                        })) : m.content
                    }))
                }, null, 2));

                const url = `${baseUrl}/v1/chat/completions`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${actualApiKey}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('[CustomVideoPlatform] API错误:', errorData);
                    throw new Error(
                        errorData.error?.message ||
                        errorData.message ||
                        `HTTP ${response.status}: ${response.statusText}`
                    );
                }

                const data = await response.json();
                console.log('[CustomVideoPlatform] API响应:', JSON.stringify(data, null, 2).substring(0, 1000));

                // 从 choices[0].message.content 提取视频 URL
                const content = data.choices?.[0]?.message?.content;
                if (!content) {
                    throw new Error('API 响应中没有找到 content 内容');
                }

                const videoUrl = this.extractVideoUrl(content);
                if (!videoUrl) {
                    throw new Error(`无法从 API 响应中提取视频 URL。\n\n响应内容: ${content.substring(0, 200)}`);
                }

                // 使用响应 id 作为 taskId，或者生成一个
                const taskId = data.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                console.log(`[CustomVideoPlatform] 视频URL提取成功:`, videoUrl);

                // 将视频URL存储到 sessionStorage 以便 checkStatus 时获取
                sessionStorage.setItem(`custom_video_${taskId}`, JSON.stringify({
                    videoUrl,
                    status: 'completed',
                    timestamp: Date.now()
                }));

                return { taskId };
            },
            {
                model: actualModel,
                prompt: params.prompt.substring(0, 500) + (params.prompt.length > 500 ? '...' : ''),
                options: {
                    aspectRatio: params.config.aspect_ratio,
                    duration: params.config.duration,
                    quality: params.config.quality,
                    hasReferenceImage: !!params.referenceImageUrl
                },
                inputImagesCount: params.referenceImageUrl ? 1 : 0
            },
            {
                nodeId: context?.nodeId,
                nodeType: context?.nodeType || 'STORYBOARD_VIDEO_GENERATOR',
                platform: this.platformName,
                logType: 'submission'
            }
        );
    }

    /**
     * 查询任务状态
     * 由于 /v1/chat/completions 是同步接口，任务在提交时已完成
     * 此方法从 sessionStorage 中获取缓存的结果
     */
    async checkStatus(
        _model: VideoModelType,
        taskId: string,
        _apiKey: string,
        context?: any
    ): Promise<VideoGenerationResult> {
        return logAPICall(
            'customVideoCheckStatus',
            async () => {
                // 从 sessionStorage 获取缓存的结果
                const cached = sessionStorage.getItem(`custom_video_${taskId}`);

                if (cached) {
                    const data = JSON.parse(cached);
                    console.log('[CustomVideoPlatform] 从缓存获取结果:', data.videoUrl);

                    return {
                        taskId,
                        status: 'completed' as const,
                        progress: 100,
                        videoUrl: data.videoUrl,
                        videoDuration: 0,
                        videoResolution: 'unknown'
                    };
                }

                // 如果没有缓存，返回错误
                return {
                    taskId,
                    status: 'error' as const,
                    progress: 0,
                    error: '未找到任务结果（缓存已过期）'
                };
            },
            {
                model: 'custom',
                options: { taskId }
            },
            {
                nodeId: context?.nodeId,
                nodeType: context?.nodeType || 'STORYBOARD_VIDEO_GENERATOR',
                platform: this.platformName,
                logType: 'polling'
            }
        );
    }
}

/**
 * 导出单例实例
 */
export const customVideoPlatform = new CustomVideoPlatformProvider();
