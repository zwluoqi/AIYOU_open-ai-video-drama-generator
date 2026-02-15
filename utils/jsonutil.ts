
export function safityParseJson(text): any {
    let raw: any = null;
    // 方法1: 直接解析
    try {
        raw = JSON.parse(text);
    } catch (e1) {
        console.warn('[analyzeDrama] Direct JSON parse failed, trying to extract...');

        // 方法2: 移除markdown代码块标记
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        try {
            raw = JSON.parse(text);
        } catch (e2) {
            console.warn('[analyzeDrama] After removing markdown failed, trying regex...');

            // 方法3: 使用正则表达式提取JSON对象
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    raw = JSON.parse(jsonMatch[0]);
                } catch (e3) {
                    console.error('[analyzeDrama] All JSON parsing methods failed');
                    console.error('[analyzeDrama] Response text preview:', text.substring(0, 500));
                    throw new Error(
                        `无法解析AI返回的JSON数据。\n` +
                        `错误: ${e3 instanceof Error ? e3.message : '未知错误'}\n\n` +
                        `💡 建议:\n` +
                        `1. 重新尝试分析\n` +
                        `2. 或切换到其他模型`
                    );
                }
            } else {
                throw new Error('AI返回的内容中未找到有效的JSON格式');
            }
        }
    }
    return raw;
}