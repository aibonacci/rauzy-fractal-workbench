import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, I18nContextType, LANGUAGE_CONFIG } from './types';
import { en } from './locales/en';
import { zh } from './locales/zh';

// 创建国际化上下文
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 翻译文件映射
const translations = {
  en,
  zh
};

// 获取嵌套对象的值
const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// 参数插值函数
const interpolateParams = (text: string, params?: Record<string, string>): string => {
  if (!params) return text;

  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }, text);
};

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setCurrentLanguage] = useState<Language>(LANGUAGE_CONFIG.DEFAULT_LANGUAGE);

  // 初始化时从 localStorage 读取语言偏好
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem(LANGUAGE_CONFIG.STORAGE_KEY) as Language;
      if (savedLanguage && LANGUAGE_CONFIG.SUPPORTED_LANGUAGES.includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.warn('Failed to load language preference from localStorage:', error);
      // 使用默认语言，不中断应用
    }
  }, []);

  // 翻译函数
  const t = (key: string, params?: Record<string, string>): string => {
    try {
      const translation = getNestedValue(translations[language], key);
      if (!translation) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        return key; // 返回key作为fallback
      }
      return interpolateParams(translation, params);
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  };

  // 设置语言函数
  const setLanguage = (lang: Language) => {
    try {
      if (!LANGUAGE_CONFIG.SUPPORTED_LANGUAGES.includes(lang)) {
        console.warn(`Unsupported language: ${lang}, falling back to default`);
        lang = LANGUAGE_CONFIG.DEFAULT_LANGUAGE;
      }

      setCurrentLanguage(lang);
      localStorage.setItem(LANGUAGE_CONFIG.STORAGE_KEY, lang);
    } catch (error) {
      console.error('Failed to set language:', error);
      // 继续使用当前语言，不中断用户体验
    }
  };

  const contextValue: I18nContextType = {
    language,
    setLanguage,
    t
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// 自定义 Hook
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};