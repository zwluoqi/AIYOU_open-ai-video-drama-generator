// components/WelcomeScreen.tsx
import React from 'react';
import { MousePointerClick } from 'lucide-react';
import { useLanguage } from '../src/i18n/LanguageContext';

interface WelcomeScreenProps {
  visible: boolean;
}

/**
 * 欢迎屏幕组件
 * 在画布为空时显示
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible }) => {
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] z-50 pointer-events-none ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
      }`}
    >
      {/* 标题 */}
      <div className="flex flex-col items-center justify-center mb-10 select-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="relative">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-300 to-zinc-600 drop-shadow-sm px-4 pb-2">
            {t.appName}
          </h1>
          <div className="absolute -inset-10 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-500/20 blur-[60px] opacity-20 pointer-events-none mix-blend-screen"></div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-zinc-600"></div>
          <span className="text-[11px] font-bold tracking-[0.6em] text-zinc-500 uppercase">
            {t.welcome}
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-zinc-600"></div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="flex items-center gap-2 mb-6 text-zinc-500 text-xs font-medium tracking-wide opacity-60">
        <div className="px-1.5 py-0.5 rounded-md bg-zinc-800/50 border border-zinc-700/50 text-[10px] flex items-center gap-1">
          <MousePointerClick size={10} />
          <span>{t.actions.doubleClick}</span>
        </div>
        <span>{t.actions.canvasHint}</span>
      </div>
    </div>
  );
};
