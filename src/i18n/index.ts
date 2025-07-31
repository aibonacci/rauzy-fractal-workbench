// 导出所有国际化相关的类型和组件
export type { Language, Translations, I18nContextType, ExternalLinkConfig, IconSize } from './types';
export { LANGUAGE_CONFIG, EXTERNAL_LINKS, ICON_SIZES, UI_CONFIG } from './types';
export { I18nProvider, useI18n } from './context';
export { en } from './locales/en';
export { zh } from './locales/zh';