// components/SettingsPanel.tsx
import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../src/i18n/LanguageContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 从 localStorage 加载 API Key
  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) {
      setApiKey(savedKey);
      setValidationStatus('success');
    }
  }, [isOpen]);

  // 验证 API Key
  const validateApiKey = async (key: string): Promise<boolean> => {
    if (!key || key.length < 20) {
      setErrorMessage('API Key 长度不足，请检查是否完整');
      return false;
    }

    setIsValidating(true);
    setValidationStatus('idle');

    try {
      // 通过实际调用API来验证 API Key 是否有效
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);

      if (response.ok) {
        setValidationStatus('success');
        setErrorMessage('');
        return true;
      } else {
        const error = await response.json();
        setValidationStatus('error');
        setErrorMessage(error.error?.message || 'API Key 验证失败，请检查是否正确');
        return false;
      }
    } catch (error: any) {
      setValidationStatus('error');
      setErrorMessage('网络错误，无法验证 API Key');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // 保存 API Key
  const handleSave = async () => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setValidationStatus('error');
      setErrorMessage('请输入 API Key');
      return;
    }

    const isValid = await validateApiKey(trimmedKey);

    if (isValid) {
      localStorage.setItem('GEMINI_API_KEY', trimmedKey);
      // 触发全局事件,通知其他组件 API Key 已更新
      window.dispatchEvent(new CustomEvent('apiKeyUpdated', { detail: { apiKey: trimmedKey } }));

      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  // 清除 API Key
  const handleClear = () => {
    setApiKey('');
    setValidationStatus('idle');
    setErrorMessage('');
    localStorage.removeItem('GEMINI_API_KEY');
    window.dispatchEvent(new CustomEvent('apiKeyUpdated', { detail: { apiKey: '' } }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 设置面板 */}
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-[#1a1a1d] to-[#0f0f10] rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

        {/* 装饰性背景 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-[120px]" />
        </div>

        {/* 内容 */}
        <div className="relative">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl">
                <Key size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">API 设置</h2>
                <p className="text-xs text-slate-400 mt-0.5">配置 Google Gemini API Key</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* 表单内容 */}
          <div className="px-8 py-6 space-y-6">

            {/* API Key 输入 */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Gemini API Key</span>
                <span className="text-xs text-slate-500 ml-2">必填</span>
              </label>

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationStatus('idle');
                    setErrorMessage('');
                  }}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all font-mono text-sm"
                />

                {/* 显示/隐藏按钮 */}
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                  type="button"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* 验证状态 */}
              {validationStatus === 'success' && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle size={16} />
                  <span>API Key 已验证</span>
                </div>
              )}

              {validationStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 帮助文本 */}
              <div className="text-xs text-slate-400 space-y-1">
                <p>• 访问 <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a> 获取免费 API Key</p>
                <p>• API Key 将安全地存储在您的浏览器本地,不会上传到任何服务器</p>
                <p>• 您的 API Key 仅用于调用 Gemini API 生成内容</p>
              </div>
            </div>

            {/* 功能说明 */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <h3 className="text-sm font-semibold text-white">支持的功能</h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span><strong className="text-slate-300">图像生成</strong> - 使用 Gemini 2.5 Flash Image 模型</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong className="text-slate-300">视频生成</strong> - 使用 Veo 3.1 Fast 模型 (支持5种生成策略)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-0.5">•</span>
                  <span><strong className="text-slate-300">音频生成</strong> - 使用 Gemini 2.5 Flash TTS 模型</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span><strong className="text-slate-300">剧本生成</strong> - AI 生成剧本大纲、分集、分镜</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span><strong className="text-slate-300">角色设计</strong> - 智能提取角色并生成详细档案</span>
                </li>
              </ul>
            </div>

          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between px-8 py-6 border-t border-white/5 bg-white/[0.02]">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              disabled={!apiKey}
            >
              清除
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isValidating || !apiKey.trim()}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    验证中...
                  </>
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
