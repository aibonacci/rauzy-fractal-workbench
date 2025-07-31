import React, { useState } from 'react';
import { useI18n } from '../../i18n/context';

interface LanguageToggleProps {
  className?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage, t } = useI18n();
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleLanguage = () => {
    if (isAnimating) return; // 防止动画期间重复点击
    
    setIsAnimating(true);
    const newLanguage = language === 'en' ? 'zh' : 'en';
    
    // 延迟设置语言以配合动画
    setTimeout(() => {
      setLanguage(newLanguage);
      setTimeout(() => setIsAnimating(false), 150); // 动画完成后重置状态
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleLanguage();
    }
  };

  // Globe icon SVG with rotation animation
  const GlobeIcon = () => (
    <svg 
      className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
        isAnimating ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
      }`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" 
      />
    </svg>
  );

  return (
    <button
      onClick={toggleLanguage}
      onKeyDown={handleKeyDown}
      disabled={isAnimating}
      className={`
        group relative flex items-center gap-2 
        px-3 py-2 sm:px-4 sm:py-2.5
        bg-gray-700 hover:bg-gray-600 active:bg-gray-800
        text-white text-sm font-medium
        rounded-lg border border-gray-600 hover:border-gray-500
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
        hover:shadow-lg hover:shadow-gray-900/25
        transform hover:scale-105 active:scale-95
        disabled:opacity-75 disabled:cursor-not-allowed
        min-w-[4rem] sm:min-w-[5rem]
        ${className}
      `}
      aria-label={t('common.switchLanguage')}
      title={t('common.switchLanguage')}
    >
      {/* 背景动画效果 */}
      <div className={`
        absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${isAnimating ? 'opacity-100' : ''}
      `} />
      
      {/* 图标 */}
      <div className="relative z-10">
        <GlobeIcon />
      </div>
      
      {/* 语言代码 */}
      <span className={`
        relative z-10 uppercase font-mono tracking-wider text-xs sm:text-sm
        transition-all duration-300 ease-in-out
        ${isAnimating ? 'opacity-0 transform scale-75' : 'opacity-100 transform scale-100'}
      `}>
        {language}
      </span>
      
      {/* 切换指示器 */}
      <div className={`
        absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full
        transition-all duration-300 ease-in-out
        ${isAnimating ? 'opacity-100 scale-125' : 'opacity-0 scale-75'}
      `} />
      
      {/* 屏幕阅读器文本 */}
      <span className="sr-only">
        {t('common.currentLanguage', { lang: language === 'en' ? 'English' : '中文' })}
      </span>
    </button>
  );
};

export default LanguageToggle;