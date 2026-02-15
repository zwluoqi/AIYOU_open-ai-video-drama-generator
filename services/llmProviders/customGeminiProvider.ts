/**
 * 自定义 Gemini API 提供商实现
 * 复用云雾 API 的代码逻辑，允许用户自定义 Base URL
 * 兼容 Gemini 原生格式
 */

import { LLMProvider, GenerateImageOptions, GenerateContentOptions } from './baseProvider';
import { LLMProviderType } from '../../types';
import { logAPICall } from '../apiLogger';

export class CustomGeminiProvider implements LLMProvider {
    /**
     * 获取用户配置的 Base URL
     */
    private getBaseUrl(): string {
        const url = localStorage.getItem('CUSTOM_GEMINI_BASE_URL');
        if (url && url.trim()) {
            // 去除末尾的斜杠
            return url.trim().replace(/\/+$/, '');
        }
        return 'https://generativelanguage.googleapis.com';
    }

    getType(): LLMProviderType {
        return 'customGemini';
    }

    getName(): string {
        return '自定义 Gemini API (Custom)';
    }

    /**
     * 获取 API Key
     */
    private getApiKey(): string | null {
        const userApiKey = localStorage.getItem('CUSTOM_GEMINI_API_KEY');
        if (userApiKey && userApiKey.trim()) {
            return userApiKey.trim();
        }
        return null;
    }

    /**
     * 获取客户端实例
     * 自定义 Gemini API 不支持 GoogleGenAI SDK，返回 null
     */
    getClient(): any {
        return null;
    }

    /**
     * 构建 API 请求 URL
     */
    private buildUrl(endpoint: string, apiKey: string): string {
        return `${this.getBaseUrl()}${endpoint}?key=${apiKey}`;
    }

    /**
     * 生成文本内容
     */
    async generateContent(
        prompt: string,
        model: string,
        options?: GenerateContentOptions
    ): Promise<string> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('CUSTOM_GEMINI_API_KEY_NOT_CONFIGURED');
        }

        const endpoint = `/v1beta/models/${model}:generateContent`;
        const url = this.buildUrl(endpoint, apiKey);

        const requestBody: any = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        };

        // 构建生成配置
        if (options?.responseMimeType || options?.systemInstruction) {
            requestBody.generationConfig = {};

            if (options.responseMimeType) {
                requestBody.generationConfig.responseMimeType = options.responseMimeType;
            }

            if (options.systemInstruction) {
                requestBody.systemInstruction = {
                    parts: [{ text: options.systemInstruction }]
                };
            }
        }

        console.log(`[CustomGeminiProvider] generateContent URL: ${url}`);
        console.log(`[CustomGeminiProvider] Request body:`, JSON.stringify(requestBody, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[CustomGeminiProvider] API Error:', error);
            throw new Error(error.error?.message || '自定义 Gemini API 内容生成失败');
        }

        const data = await response.json();
        console.log('[CustomGeminiProvider] Response received:', data);

        // 提取文本响应 - 可能返回多个parts，需要过滤掉thought部分
        const parts = data.candidates?.[0]?.content?.parts || [];

        // 过滤掉thought为true的部分，只保留实际内容
        const contentParts = parts.filter((part: any) => !part.thought);

        // 拼接所有非thought部分的文本
        const text = contentParts
            .map((part: any) => part.text || '')
            .filter((t: string) => t.trim())
            .join('\n\n');

        console.log('[CustomGeminiProvider] Extracted text:', text);
        return text;
    }

    /**
     * 生成图片（返回图片数组）
     */
    async generateImages(
        prompt: string,
        model: string,
        referenceImages?: string[],
        options?: GenerateImageOptions
    ): Promise<string[]> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('CUSTOM_GEMINI_API_KEY_NOT_CONFIGURED');
        }

        const endpoint = `/v1beta/models/${model}:generateContent`;
        const url = this.buildUrl(endpoint, apiKey);

        // 构建请求内容
        const parts: any[] = [{ text: prompt }];

        // 添加参考图片
        if (referenceImages && referenceImages.length > 0) {
            for (const imageBase64 of referenceImages) {
                parts.push({
                    inlineData: {
                        data: imageBase64.split(',')[1] || imageBase64,
                        mimeType: 'image/jpeg'
                    }
                });
            }
        }

        const requestBody: any = {
            contents: [
                {
                    role: 'user',
                    parts
                }
            ],
            generationConfig: {
                responseModalities: ['TEXT', 'IMAGE']
            }
        };

        // 添加宽高比和分辨率配置
        if (options?.aspectRatio || options?.resolution) {
            requestBody.generationConfig.imageConfig = {};

            if (options.aspectRatio) {
                requestBody.generationConfig.imageConfig.aspectRatio = options.aspectRatio;
            }

            if (options.resolution) {
                requestBody.generationConfig.imageConfig.imageSize = options.resolution;
            }
        }

        if (options?.count) {
            requestBody.generationConfig.numberOfImages = options.count;
        }

        // 使用 logAPICall 记录API调用
        return logAPICall(
            'customGeminiGenerateImages',
            async () => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || '自定义 Gemini API 图片生成失败');
                }

                const data = await response.json();

                // 提取图片数据（支持多张图片）
                const images: string[] = [];
                if (data.candidates && data.candidates[0]) {
                    const parts = data.candidates[0].content?.parts || [];
                    console.log('[CustomGeminiProvider] 响应parts数量:', parts.length,
                        'parts类型:', parts.map((p: any) => ({
                            hasInlineData: !!p.inlineData,
                            hasText: !!p.text,
                            textPreview: p.text ? p.text.substring(0, 200) : undefined,
                            inlineDataMime: p.inlineData?.mimeType
                        }))
                    );
                    for (const part of parts) {
                        if (part.inlineData && part.inlineData.data) {
                            const mimeType = part.inlineData.mimeType || 'image/png';
                            images.push(`data:${mimeType};base64,${part.inlineData.data}`);
                        }
                        // 即梦URL格式形式，从text中提取图片url
                        if (part.text) {
                            console.log('[CustomGeminiProvider] 检测到text部分，尝试提取图片URL:', part.text.substring(0, 500));

                            // 先尝试匹配 Markdown 图片语法 ![alt](url)
                            const mdImgMatch = part.text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
                            if (mdImgMatch) {
                                console.log('[CustomGeminiProvider] 从Markdown图片语法提取URL:', mdImgMatch[1]);
                                images.push(mdImgMatch[1]);
                            } else {
                                // 匹配常见图片格式URL，排除末尾的标点和括号
                                const urlMatch = part.text.match(/https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s"'<>\])\}]*)/);
                                if (urlMatch) {
                                    // 清理 URL 末尾可能的非URL字符
                                    let cleanUrl = urlMatch[0].replace(/[.,;:!?。，；：！？]+$/, '');
                                    console.log('[CustomGeminiProvider] 提取到图片URL:', cleanUrl);
                                    images.push(cleanUrl);
                                }
                            }
                        }
                    }
                }

                if (images.length === 0) {
                    throw new Error('No images generated');
                }

                console.log('[CustomGeminiProvider] 最终提取到图片数量:', images.length,
                    '图片类型:', images.map(img => img.startsWith('data:') ? 'base64' : 'url'),
                    'URL预览:', images.map(img => img.startsWith('data:') ? img.substring(0, 50) + '...' : img)
                );

                return images;
            },
            {
                model,
                prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
                enhancedPrompt: prompt,
                inputImagesCount: referenceImages?.length || 0,
                generationConfig: {
                    aspectRatio: options?.aspectRatio,
                    resolution: options?.resolution,
                    count: options?.count
                }
            },
            { platform: '自定义 Gemini API', logType: 'submission' }
        );
    }

    /**
     * 验证 API Key
     */
    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.getBaseUrl()}/v1beta/models?key=${apiKey}`
            );
            return response.ok;
        } catch (error) {
            console.error('Failed to validate Custom Gemini API key:', error);
            return false;
        }
    }
}
